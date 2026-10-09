import { Component, ChangeDetectionStrategy, effect, inject, input, signal } from '@angular/core';
import { disabled, form, required, submit, FormField } from '@angular/forms/signals';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, firstValueFrom, of } from 'rxjs';
import { EventPermissionsService } from 'src/app/services/event-permissions.service';
import { Event as EventItem } from '../../events/events.types';
import { EventService } from '../../events/events.service';
import { SnackbarToastrService } from '../../../services/snackbar-toastr.service';
import { TicketGroupService } from '../ticket_groups.service';
import { LoadingComponent } from '../../loading/loading.component';
import { AsyncPipe } from '@angular/common';

@Component({
    selector: 'app-ticket-groups-form',
    templateUrl: './ticket_groups-form.component.html',
    styleUrls: ['./ticket_groups-form.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [LoadingComponent, FormField, AsyncPipe]
})
export class TicketGroupsFormComponent {
  readonly #router = inject(Router);
  readonly #route = inject(ActivatedRoute);
  readonly #ticketGroupService = inject(TicketGroupService);
  readonly #eventService = inject(EventService);
  readonly #toastr = inject(SnackbarToastrService);
  readonly #eventPermissions = inject(EventPermissionsService);
  readonly #editPermissions = new Map<string, Observable<boolean>>();
  readonly #denied = of(false);
  #loadErrorShown = false;
  #loadSuccessShown = false;
  #missingIdShown = false;

  readonly mode = input.required<'new' | 'edit' | 'detail'>();
  readonly ticketGroupId = input<string | null>(null, { alias: 'ticket-group-id' });
  protected readonly eventsResource = this.#eventService.events;
  protected readonly ticketGroup = this.#ticketGroupService.ticketGroupByIdResource(() => this.ticketGroupId());
  protected readonly model = signal({ name: '', capacity: 0, eventId: '' });
  protected readonly ticketGroupForm = form(this.model, path => {
    required(path.name);
    required(path.capacity);
    required(path.eventId);
    disabled(path, { when: () => this.mode() === 'detail' || (this.mode() !== 'new' && !!this.ticketGroup.error()) });
  });

  constructor() {
    effect(() => {
      if (this.mode() === 'new') {
        return;
      }
      if (!this.ticketGroupId()) {
        if (!this.#missingIdShown) {
          this.#missingIdShown = true;
          this.#toastr.error('Cannot load', 'Ticket group', { progressBar: true });
        }
        return;
      }
      const ticketGroup = this.ticketGroup.value();
      if (ticketGroup && String(ticketGroup.id) === this.ticketGroupId()) {
        this.model.set({
          name: ticketGroup.name,
          capacity: ticketGroup.capacity,
          eventId: String(ticketGroup.event_id),
        });
        if (!this.#loadSuccessShown) {
          this.#loadSuccessShown = true;
          this.#toastr.info('Loaded successfully.', 'Ticket group', { progressBar: true });
        }
      }

      const error = this.ticketGroup.error();
      if (error && !this.#loadErrorShown) {
        this.#loadErrorShown = true;
        const message = error instanceof Error ? error.message : String(error);
        this.#toastr.error(message, 'Cannot load ticket group', { progressBar: true });
      }
    });

  }

  protected saveTicketGroup(event: Event): void {
    event.preventDefault();
    if (this.mode() === 'detail') {
      return;
    }
    submit(this.ticketGroupForm, async () => {
      const eventId = this.model().eventId;
      const canEdit = await firstValueFrom(
        this.#eventPermissions.canForEvent(eventId, 'ticket_groups:edit')
      );
      if (!canEdit) {
        this.#toastr.error(
          this.mode() === 'new'
            ? 'You cannot create a ticket group for this event.'
            : 'You cannot move this ticket group to the selected event.',
          'TicketGroup'
        );
        return;
      }
      if (this.mode() === 'new') {
        await this.#createTicketGroup(eventId);
      } else if (this.ticketGroupId()) {
        await this.#updateTicketGroup(this.ticketGroupId()!, Number(eventId));
      }
    });
  }

  async #createTicketGroup(eventId: string): Promise<void> {
    const model = this.model();
    try {
      const ticketGroup = await firstValueFrom(this.#ticketGroupService.create({
        name: model.name,
        capacity: model.capacity,
        event_id: Number(eventId)
      }));
      this.#toastr.info('Successfully created.', `TicketGroup called '${ticketGroup.name}'`, { progressBar: true });
      await this.#router.navigate(this.#ticketGroupListUrl());
    } catch (error) {
      this.#toastr.error(`NOT CREATED! Error: ${this.#errorMessage(error)}`, 'TicketGroup', { progressBar: true });
    }
  }

  async #updateTicketGroup(id: string, eventId: number): Promise<void> {
    const model = this.model();
    try {
      const ticketGroup = await firstValueFrom(this.#ticketGroupService.update(id, {
        name: model.name,
        capacity: model.capacity,
        event_id: eventId
      }));
      this.#toastr.info('Successfully edited.', `TicketGroup called '${ticketGroup.name}'`, { progressBar: true });
      await this.#router.navigate(this.#ticketGroupListUrl());
    } catch (error) {
      this.#toastr.error(`NOT EDITED! Error: ${this.#errorMessage(error)}`, 'TicketGroup', { progressBar: true });
    }
  }

  protected canEditEvent(eventId: string | number | null | undefined): Observable<boolean> {
    if (eventId === null || eventId === undefined || eventId === '') {
      return this.#denied;
    }
    const key = eventId.toString();
    const cachedPermission = this.#editPermissions.get(key);
    if (cachedPermission) {
      return cachedPermission;
    }
    const permission = this.#eventPermissions.canForEvent(eventId, 'ticket_groups:edit');
    this.#editPermissions.set(key, permission);
    return permission;
  }

  protected events(): EventItem[] {
    return this.eventsResource.value();
  }

  #ticketGroupListUrl(): string[] {
    const eventId = this.#route.pathFromRoot
      .map(route => route.snapshot.paramMap.get('event-id'))
      .find(value => value !== null);
    if (!eventId) {
      return ['/ticket_groups/list'];
    }
    const eventBase = this.#router.url.startsWith('/events/') ? '/events' : '/my-events';
    return [eventBase, eventId, 'ticket-groups', 'list'];
  }

  protected ticketGroupLoadErrorText(): string {
    const error = this.ticketGroup.error();
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
