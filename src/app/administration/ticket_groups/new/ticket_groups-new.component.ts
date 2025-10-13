import type { OnInit } from "@angular/core";
import { Component } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import type { Router } from "@angular/router";

import type { ToastrService } from "ngx-toastr";

import type { EventService } from "../../events/events.service";
import type { Event } from "../../events/events.types";
import type { TicketGroupService } from "../ticket_groups.service";

@Component({
  selector: "app-ticket_groups-new",
  templateUrl: "./ticket_groups-new.component.html",
  styleUrls: ["./ticket_groups-new.component.scss"],
  standalone: false,
})
export class TicketGroupsNewComponent implements OnInit {
  public form = new FormGroup({
    name: new FormControl("", Validators.required),
    capacity: new FormControl(0, Validators.required),
    eventId: new FormControl(1, Validators.required),
  });
  public events: Event[] = [];

  constructor(
    private router: Router,
    private ticket_groupService: TicketGroupService,
    private eventService: EventService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.eventService.get().subscribe({
      next: events => {
        this.events = events;
      },
    });
  }

  public newTicketGroup() {
    this.ticket_groupService
      .create({
        name: this.form.value.name || "",
        capacity: this.form.value.capacity || 0,
        event_id: this.form.value.eventId || 0,
      })
      .subscribe({
        next: ticket_group => {
          this.toastr.info("Successfully created.", `TicketGroup called '${ticket_group.name}'`, {
            progressBar: true,
          });
          this.router.navigate(["/ticket_groups/list"]);
        },
        error: err => {
          this.toastr.error(`NOT CREATED! Error: ${err.message}`, "TicketGroup", {
            progressBar: true,
          });
        },
      });
  }
}
