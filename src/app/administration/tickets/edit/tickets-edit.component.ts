import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, of, take } from 'rxjs';
import { EventPermissionsService } from 'src/app/services/event-permissions.service';
import { SnackbarToastrService } from 'src/app/services/snackbar-toastr.service';
import { TicketGroupService } from '../../ticket_groups/ticket_groups.service';
import { TicketGroup } from '../../ticket_groups/ticket_groups.types';
import { TicketService } from '../../../services/tickets.service';
import { TicketStatusEnum, TicketUpdate } from '../tickets.types';

@Component({
  selector: 'app-tickets-edit',
  templateUrl: './tickets-edit.component.html',
  styleUrls: ['./tickets-edit.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false
})
export class TicketsEditComponent {
  readonly #router = inject(Router);
  readonly #route = inject(ActivatedRoute);
  readonly #ticketService = inject(TicketService);
  readonly #ticketGroupService = inject(TicketGroupService);
  readonly #eventPermissions = inject(EventPermissionsService);
  readonly #toastr = inject(SnackbarToastrService);
  readonly #id = signal<string | null>(this.#route.snapshot.paramMap.get('id'));
  readonly #ticketResource = this.#ticketService.ticketByIdResource(() => this.#id());
  readonly #editPermissions = new Map<string, Observable<boolean>>();
  readonly #denied = of(false);

  readonly form = new FormGroup({
    firstname: new FormControl('', Validators.required),
    lastname: new FormControl('', Validators.required),
    email: new FormControl('', Validators.required),
    description: new FormControl(''),
    status: new FormControl(TicketStatusEnum.new, Validators.required),
    groupId: new FormControl<string | null>(null, Validators.required),
  });
  protected readonly ticket = this.#ticketResource;
  protected readonly groupsResource = this.#ticketGroupService.ticketGroups;

  constructor() {
    effect(() => {
      const ticket = this.#ticketResource.value();
      if (!ticket) {
        return;
      }
      this.form.setValue({
        firstname: ticket.firstname,
        lastname: ticket.lastname,
        email: ticket.email,
        description: ticket.description ?? '',
        status: ticket.status ?? TicketStatusEnum.new,
        groupId: ticket.group_id.toString(),
      });
    });
  }

  public editTicket(): void {
    const ticketId = this.#id();
    const group = this.#selectedGroup();
    if (!ticketId || !group?.id) {
      return;
    }

    this.#eventPermissions.canForEvent(group.event_id, 'tickets:edit').pipe(
      take(1)
    ).subscribe(canEdit => {
      if (!canEdit) {
        this.#toastr.error(
          'You cannot move this ticket to the selected ticket group.',
          'Ticket'
        );
        return;
      }
      this.#updateTicket(ticketId, group.id!);
    });
  }

  #updateTicket(ticketId: string, groupId: string): void {
    const ticket: TicketUpdate = {
      firstname: this.form.value.firstname || '',
      lastname: this.form.value.lastname || '',
      email: this.form.value.email || '',
      description: this.form.value.description || '',
      status: this.form.value.status ?? TicketStatusEnum.new,
      group_id: Number(groupId),
    };
    this.#ticketService.update(ticketId, ticket).subscribe({
      next: () => this.#router.navigate(['/tickets/list']),
      error: err => this.#toastr.error(`NOT EDITED! Error: ${err.error?.detail ?? err.message}`, 'Ticket'),
    });
  }

  protected groups(): TicketGroup[] {
    return this.groupsResource.value();
  }

  protected canEditGroup(eventId: number): Observable<boolean> {
    const cacheKey = eventId.toString();
    const cachedPermission = this.#editPermissions.get(cacheKey);
    if (cachedPermission) {
      return cachedPermission;
    }

    const permission = this.#eventPermissions.canForEvent(eventId, 'tickets:edit');
    this.#editPermissions.set(cacheKey, permission);
    return permission;
  }

  protected canEditSelectedGroup(): Observable<boolean> {
    const group = this.#selectedGroup();
    return group ? this.canEditGroup(group.event_id) : this.#denied;
  }

  #selectedGroup(): TicketGroup | undefined {
    const selectedGroupId = this.form.controls.groupId.value;
    return this.groups().find(group => group.id === selectedGroupId);
  }
}
