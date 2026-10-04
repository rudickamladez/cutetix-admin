import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { TicketGroupService } from '../ticket_groups.service';
import { SnackbarToastrService } from '../../../services/snackbar-toastr.service';
import { Router } from '@angular/router';
import { EventService } from '../../events/events.service';
import { Event } from '../../events/events.types';
import { EventPermissionsService } from 'src/app/services/event-permissions.service';
import { Observable, of, take } from 'rxjs';

@Component({
    selector: 'app-ticket_groups-new',
    templateUrl: './ticket_groups-new.component.html',
    styleUrls: ['./ticket_groups-new.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class TicketGroupsNewComponent {
  readonly #router = inject(Router);
  readonly #ticket_groupService = inject(TicketGroupService);
  readonly #eventService = inject(EventService);
  readonly #toastr = inject(SnackbarToastrService);
  readonly #eventPermissions = inject(EventPermissionsService);
  readonly #editPermissions = new Map<string, Observable<boolean>>();
  readonly #denied = of(false);

  public form = new FormGroup({
    name: new FormControl('', Validators.required),
    capacity: new FormControl(0, Validators.required),
    eventId: new FormControl<string | null>(null, Validators.required)
  });
  protected readonly eventsResource = this.#eventService.events;

  public newTicketGroup() {
    const eventId = this.form.controls.eventId.value;
    if (!eventId) {
      return;
    }

    this.#eventPermissions.canForEvent(eventId, 'ticket_groups:edit').pipe(
      take(1)
    ).subscribe(canCreate => {
      if (!canCreate) {
        this.#toastr.error(
          'You cannot create a ticket group for this event.',
          'TicketGroup'
        );
        return;
      }
      this.#createTicketGroup(eventId);
    });
  }

  #createTicketGroup(eventId: string): void {
    this.#ticket_groupService.create({
      name: this.form.value.name || '',
      capacity: this.form.value.capacity || 0,
      event_id: Number(eventId)
    }).subscribe({
      next: (ticket_group) => {
        this.#toastr.info(
          'Successfully created.',
          `TicketGroup called '${ticket_group.name}'`,
          {
            progressBar: true
          }
        );
        this.#router.navigate(['/ticket_groups/list']);
      },
      error: (err) => {
        this.#toastr.error(
          `NOT CREATED! Error: ${err.message}`,
          'TicketGroup',
          {
            progressBar: true
          }
        )
      }
    })
  }

  protected canEditEvent(eventId: string | null | undefined): Observable<boolean> {
    if (!eventId) {
      return this.#denied;
    }
    const cachedPermission = this.#editPermissions.get(eventId);
    if (cachedPermission) {
      return cachedPermission;
    }

    const permission = this.#eventPermissions.canForEvent(eventId, 'ticket_groups:edit');
    this.#editPermissions.set(eventId, permission);
    return permission;
  }

  protected events(): Array<Event> {
    return this.eventsResource.value();
  }
}
