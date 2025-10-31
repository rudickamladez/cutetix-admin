import type { OnInit } from "@angular/core";
import { Component, inject } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";

import { ToastrService } from "ngx-toastr";

import { EventService } from "../../events/events.service";
import type { Event } from "../../events/events.types";
import { TicketGroupService } from "../ticket_groups.service";

@Component({
  selector: "app-ticket-groups-edit",
  templateUrl: "./events-edit.component.html",
  styleUrls: ["./events-edit.component.scss"],
  standalone: false,
})
export class TicketGroupsEditComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private ticket_groupService = inject(TicketGroupService);
  private eventService = inject(EventService);
  private toastr = inject(ToastrService);

  public id: string | null;
  public form = new FormGroup({
    name: new FormControl("", Validators.required),
    capacity: new FormControl(0, Validators.required),
    eventId: new FormControl(0, Validators.required),
  });
  public showDetail: boolean = false;
  public events: Event[] = [];

  constructor() {
    // Check detail view
    if (this.router.url.includes("detail")) {
      this.showDetail = true;
      this.form.get("name")?.disable();
      this.form.get("capacity")?.disable();
      // this.form.get('sumbit')?.disable();
    }

    // Get ID from query
    this.id = this.route.snapshot.paramMap.get("id");
    // eslint-disable-next-line eqeqeq
    if (this.id == null) {
      this.form.get("name")?.disable();
      this.form.get("capacity")?.disable();
      this.toastr.error("Cannot load", "Ticket group", {
        progressBar: true,
      });
      return;
    }

    // Load ticket_group object from database
    this.ticket_groupService.getById(this.id).subscribe({
      // Success
      next: ticket_group => {
        this.toastr.info("Loaded successfully.", "Ticket group", {
          progressBar: true,
        });
        this.form.setValue({
          name: ticket_group.name,
          capacity: ticket_group.capacity,
          eventId: ticket_group.event_id,
        });
      },
      // Error
      error: err => {
        this.form.get("name")?.disable();
        this.form.get("capacity")?.disable();
        this.form.get("eventId")?.disable();
        this.toastr.error(err.message, "Cannot load ticket group", {
          progressBar: true,
        });
        return;
      },
    });
  }

  ngOnInit(): void {
    this.eventService.get().subscribe({
      next: events => {
        this.events = events;
      },
    });
  }

  public editTicketGroup(): void {
    this.ticket_groupService
      .update(this.id || "", {
        name: this.form.value.name || "",
        capacity: this.form.value.capacity || 0,
        event_id: this.form.value.eventId || 0,
      })
      .subscribe({
        next: ticket_group => {
          this.toastr.info(
            "Successfully edited.",
            `TicketGroup called '${ticket_group.name}'`,
            {
              progressBar: true,
            }
          );
          this.router.navigate(["/ticket_groups/list"]);
        },
        error: err => {
          this.toastr.error(
            `NOT EDITED! Error: ${err.message}`,
            "TicketGroup",
            {
              progressBar: true,
            }
          );
        },
      });
  }
}
