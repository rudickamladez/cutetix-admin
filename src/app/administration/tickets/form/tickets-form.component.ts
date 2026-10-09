import { ChangeDetectionStrategy, Component, effect, inject, input, signal } from '@angular/core';
import { disabled, email, form, required, submit } from '@angular/forms/signals';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, firstValueFrom, of } from 'rxjs';
import { EventPermissionsService } from 'src/app/services/event-permissions.service';
import { SnackbarToastrService } from '../../../services/snackbar-toastr.service';
import { TicketService } from '../../../services/tickets.service';
import { TicketGroupService } from '../../ticket_groups/ticket_groups.service';
import { TicketGroup } from '../../ticket_groups/ticket_groups.types';
import { TicketStatusEnum, TicketUpdate } from '../tickets.types';

@Component({
  selector: 'app-tickets-form',
  templateUrl: './tickets-form.component.html',
  styleUrls: ['./tickets-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false
})
export class TicketsFormComponent {
  readonly #router = inject(Router);
  readonly #route = inject(ActivatedRoute);
  readonly #ticketService = inject(TicketService);
  readonly #ticketGroupService = inject(TicketGroupService);
  readonly #eventPermissions = inject(EventPermissionsService);
  readonly #toastr = inject(SnackbarToastrService);
  readonly #editPermissions = new Map<string, Observable<boolean>>();
  readonly #denied = of(false);

  readonly mode = input.required<'new' | 'edit' | 'detail'>();
  readonly ticketId = input<string | null>(null, { alias: 'ticket-id' });
  protected readonly eventId = this.#route.snapshot.paramMap.get('event-id')
    ?? this.#route.parent?.snapshot.paramMap.get('event-id')
    ?? null;
  protected readonly isGlobal = this.eventId === null;
  protected readonly ticket = this.#ticketService.ticketByIdResource(() => this.ticketId());
  protected readonly groupsResource = this.#ticketGroupService.ticketGroups;
  protected readonly model = signal({
    firstname: '',
    lastname: '',
    email: '',
    description: '',
    status: String(TicketStatusEnum.new),
    groupId: '',
  });
  protected readonly ticketForm = form(this.model, path => {
    required(path.firstname);
    required(path.lastname);
    required(path.email);
    email(path.email);
    required(path.status);
    required(path.groupId);
    disabled(path, { when: () => this.mode() === 'detail' });
  });

  constructor() {
    effect(() => {
      const ticket = this.ticket.value();
      if (!ticket || String(ticket.id) !== this.ticketId()) {
        return;
      }
      this.model.set({
        firstname: ticket.firstname,
        lastname: ticket.lastname,
        email: ticket.email,
        description: ticket.description ?? '',
        status: String(ticket.status ?? TicketStatusEnum.new),
        groupId: String(ticket.group_id),
      });
    });
  }

  protected saveTicket(event: Event): void {
    event.preventDefault();
    if (this.mode() === 'detail') {
      return;
    }
    submit(this.ticketForm, async () => {
      const group = this.#selectedGroup();
      if (!group?.id) {
        return;
      }
      const canEdit = await firstValueFrom(
        this.#eventPermissions.canForEvent(group.event_id, 'tickets:edit')
      );
      if (!canEdit) {
        this.#toastr.error(
          this.mode() === 'new'
            ? 'You cannot create a ticket for this ticket group.'
            : 'You cannot move this ticket to the selected ticket group.',
          'Ticket'
        );
        return;
      }
      if (this.mode() === 'new') {
        await this.#createTicket(group.id);
      } else if (this.ticketId()) {
        await this.#updateTicket(this.ticketId()!, group.id, group.event_id);
      }
    });
  }

  async #createTicket(groupId: string): Promise<void> {
    const model = this.model();
    try {
      const ticket = await firstValueFrom(this.#ticketService.create({
        firstname: model.firstname,
        lastname: model.lastname,
        email: model.email,
        description: model.description,
        status: Number(model.status) as TicketStatusEnum,
        group_id: Number(groupId),
      }));
      this.#toastr.info('Successfully created.', `Ticket for '${ticket.email}'`, { progressBar: true });
      this.#navigateToList(this.eventId ? Number(this.eventId) : undefined);
    } catch (err) {
      this.#toastr.error(
        `NOT CREATED! Error: ${this.#errorMessage(err)}`,
        'Ticket',
        { progressBar: true }
      );
    }
  }

  async #updateTicket(ticketId: string, groupId: string, eventId: number): Promise<void> {
    const model = this.model();
    const ticket: TicketUpdate = {
      firstname: model.firstname,
      lastname: model.lastname,
      email: model.email,
      description: model.description,
      status: Number(model.status) as TicketStatusEnum,
      group_id: Number(groupId),
    };
    try {
      await firstValueFrom(this.#ticketService.update(ticketId, ticket));
      this.#navigateToList(eventId);
    } catch (err) {
      this.#toastr.error(`NOT EDITED! Error: ${this.#errorMessage(err)}`, 'Ticket');
    }
  }

  #navigateToList(eventId?: number): void {
    this.#router.navigate(this.isGlobal || eventId === undefined
      ? ['/tickets/list']
      : ['/my-events', String(eventId), 'tickets', 'list']);
  }

  protected groups(): TicketGroup[] {
    return this.groupsResource.value();
  }

  protected canEditGroup(eventId: number): Observable<boolean> {
    const key = eventId.toString();
    const cachedPermission = this.#editPermissions.get(key);
    if (cachedPermission) {
      return cachedPermission;
    }
    const permission = this.#eventPermissions.canForEvent(eventId, 'tickets:edit');
    this.#editPermissions.set(key, permission);
    return permission;
  }

  protected canEditSelectedGroup(): Observable<boolean> {
    const group = this.#selectedGroup();
    return group ? this.canEditGroup(group.event_id) : this.#denied;
  }

  protected groupDisplay(): string {
    const group = this.#selectedGroup() ?? this.ticket.value()?.group;
    return group ? `${group.event?.name ?? ''} - ${group.name}` : 'No group';
  }

  #selectedGroup(): TicketGroup | undefined {
    const selectedGroupId = this.model().groupId;
    return this.groups().find(group => String(group.id) === selectedGroupId);
  }

  protected loadErrorText(): string {
    const error = this.groupsResource.error();
    if (!error) {
      return '';
    }
    return error instanceof Error ? error.message : String(error);
  }

  protected ticketLoadErrorText(): string {
    const error = this.ticket.error();
    if (!error) {
      return '';
    }
    return error instanceof Error ? error.message : String(error);
  }

  #errorMessage(error: unknown): string {
    if (typeof error === 'object' && error !== null && 'error' in error) {
      const httpError = error as { error?: { detail?: string }; message?: string };
      return httpError.error?.detail ?? httpError.message ?? String(error);
    }
    return error instanceof Error ? error.message : String(error);
  }
}
