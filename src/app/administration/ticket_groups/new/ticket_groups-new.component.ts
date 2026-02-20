import { Component, inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { TicketGroupService } from '../ticket_groups.service';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';
import { EventService } from '../../events/events.service';
import { Event } from '../../events/events.types';

@Component({
    selector: 'app-ticket_groups-new',
    templateUrl: './ticket_groups-new.component.html',
    styleUrls: ['./ticket_groups-new.component.scss'],
    standalone: false
})
export class TicketGroupsNewComponent implements OnInit{
  readonly #router = inject(Router);
  readonly #ticket_groupService = inject(TicketGroupService);
  readonly #eventService = inject(EventService);
  readonly #toastr = inject(ToastrService);

  public form = new FormGroup({
    name: new FormControl('', Validators.required),
    capacity: new FormControl(0, Validators.required),
    eventId: new FormControl(1, Validators.required)
  });
  protected readonly eventsResource = this.#eventService.events;

  ngOnInit(): void {
    this.eventsResource.reload();
  }

  public newTicketGroup() {
    this.#ticket_groupService.create({
      name: this.form.value.name || '',
      capacity: this.form.value.capacity || 0,
      event_id: this.form.value.eventId || 0
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

  protected events(): Array<Event> {
    return this.eventsResource.value();
  }
}
