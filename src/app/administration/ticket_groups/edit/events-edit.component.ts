import { Component, effect, inject, signal } from '@angular/core';
import { FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { TicketGroupService } from '../ticket_groups.service';
import { ToastrService } from 'ngx-toastr';
import { ActivatedRoute, Router } from '@angular/router';
import { EventService } from '../../events/events.service';
import { Event } from '../../events/events.types';

@Component({
    selector: 'app-ticket_groups-edit',
    templateUrl: './events-edit.component.html',
    styleUrls: ['./events-edit.component.scss'],
    imports: [ReactiveFormsModule]
})
export class TicketGroupsEditComponent {
  readonly #router = inject(Router);
  readonly #route = inject(ActivatedRoute);
  readonly #ticket_groupService = inject(TicketGroupService);
  readonly #eventService = inject(EventService);
  readonly #toastr = inject(ToastrService);
  readonly #id = signal<string | null>(this.#route.snapshot.paramMap.get('id'));
  readonly #ticketGroupResource = this.#ticket_groupService.ticketGroupByIdResource(() => this.#id());
  #loadErrorShown = false;
  #loadSuccessShown = false;

  public readonly id = this.#id();
  public form = new FormGroup({
    name: new FormControl('', Validators.required),
    capacity: new FormControl(0, Validators.required),
    eventId: new FormControl(0, Validators.required),
  });
  public showDetail: boolean = false;
  protected readonly eventsResource = this.#eventService.events;
  protected readonly ticketGroup = this.#ticketGroupResource;

  constructor() {
    // Check detail view
    if (this.#router.url.includes('detail')) {
      this.showDetail = true;
      this.form.get('name')?.disable();
      this.form.get('capacity')?.disable();
      // this.form.get('sumbit')?.disable();
    }

    if (this.id == null) {
      this.form.get('name')?.disable();
      this.form.get('capacity')?.disable();
      this.form.get('eventId')?.disable();
      this.#toastr.error(
        'Cannot load',
        'Ticket group',
        {
          progressBar: true,
        }
      );
      return;
    }

    effect(() => {
      const ticket_group = this.#ticketGroupResource.value();
      if (!ticket_group) {
        return;
      }
      if (!this.#loadSuccessShown) {
        this.#loadSuccessShown = true;
        this.#toastr.info(
          'Loaded successfully.',
          'Ticket group',
          {
            progressBar: true
          }
        );
      }
      this.form.setValue({
        name: ticket_group.name,
        capacity: ticket_group.capacity,
        eventId: ticket_group.event_id,
      });
    });

    effect(() => {
      const err = this.#ticketGroupResource.error();
      if (!err || this.#loadErrorShown) {
        return;
      }
      this.#loadErrorShown = true;
      this.form.get('name')?.disable();
      this.form.get('capacity')?.disable();
      this.form.get('eventId')?.disable();
      const msg = err instanceof Error ? err.message : String(err);
      this.#toastr.error(
        msg,
        'Cannot load ticket group',
        {
          progressBar: true,
        }
      );
      return;
    });
  }

  public editTicketGroup() {
    const id = this.#id();
    if (!id) {
      return;
    }
    this.#ticket_groupService.update(
      id,
      {
        name: this.form.value.name || '',
        capacity: this.form.value.capacity || 0,
        event_id: this.form.value.eventId || 0
      }
    ).subscribe({
      next: (ticket_group) => {
        this.#toastr.info(
          'Successfully edited.',
          `TicketGroup called '${ticket_group.name}'`,
          {
            progressBar: true
          }
        );
        this.#router.navigate(['/ticket_groups/list']);
      },
      error: (err) => {
        this.#toastr.error(
          `NOT EDITED! Error: ${err.message}`,
          'TicketGroup',
          {
            progressBar: true
          }
        )
      }
    })
  }

  protected events(): Array<Event> {
    return this.eventsResource.value();
  }

  protected ticketGroupLoadErrorText(): string {
    const err = this.ticketGroup.error();
    if (!err) {
      return '';
    }
    if (err instanceof Error) {
      return err.message;
    }
    return String(err);
  }
}
