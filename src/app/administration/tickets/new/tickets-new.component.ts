import type { OnInit } from "@angular/core";
import { Component, inject } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { Router } from "@angular/router";

import { ToastrService } from "ngx-toastr";

import { TicketGroupService } from "../../ticket_groups/ticket_groups.service";
import type { TicketGroup } from "../../ticket_groups/ticket_groups.types";
import { TicketService } from "../tickets.service";
import { TicketStatusEnum } from "../tickets.types";

@Component({
  selector: "app-tickets-new",
  templateUrl: "./tickets-new.component.html",
  styleUrls: ["./tickets-new.component.scss"],
  standalone: false,
})
export class TicketsNewComponent implements OnInit {
  private router = inject(Router);
  private ticketService = inject(TicketService);
  private ticketgroupService = inject(TicketGroupService);
  private toastr = inject(ToastrService);

  public form = new FormGroup({
    firstname: new FormControl("", Validators.required),
    lastname: new FormControl("", Validators.required),
    email: new FormControl("", Validators.required),
    description: new FormControl(""),
    status: new FormControl(TicketStatusEnum.new, Validators.required),
    groupId: new FormControl(0, Validators.required),
  });
  public groups: TicketGroup[] = [];

  ngOnInit(): void {
    this.ticketgroupService.get().subscribe({
      next: ticket_groups => {
        this.groups = ticket_groups;
      },
    });
  }

  public newTicket(): void {
    this.ticketService
      .create({
        firstname: this.form.value.firstname || "",
        lastname: this.form.value.lastname || "",
        email: this.form.value.email || "",
        description: this.form.value.description || "",
        status: this.form.value.status || TicketStatusEnum.new,
        group_id: this.form.value.groupId || 0,
      })
      .subscribe({
        next: ticket => {
          this.toastr.info(
            "Successfully created.",
            `Ticket for '${ticket.email}'`,
            {
              progressBar: true,
            }
          );
          this.router.navigate(["/tickets/list"]);
        },
        error: err => {
          console.error(err);
          this.toastr.error(`NOT CREATED! Error: ${err.message}`, "Ticket", {
            progressBar: true,
          });
        },
      });
  }
}
