import type { OnInit } from "@angular/core";
import { Component, inject } from "@angular/core";
import { Router } from "@angular/router";

import { faPen, faTrash } from "@fortawesome/free-solid-svg-icons";
import { ToastrService } from "ngx-toastr";

import { TicketGroupService } from "../ticket_groups.service";
import type { TicketGroup } from "../ticket_groups.types";

@Component({
  selector: "app-ticket-groups-list",
  templateUrl: "./ticket_groups-list.component.html",
  styleUrls: ["./ticket_groups-list.component.scss"],
  standalone: false,
})
export class TicketGroupsListComponent implements OnInit {
  private readonly ticket_groupService = inject(TicketGroupService);
  private readonly toastr = inject(ToastrService);
  private readonly router = inject(Router);

  public faPen = faPen;
  public faTrash = faTrash;
  public ticket_groups: TicketGroup[] = [];
  public loadingState = 1;
  public errorLoading = {
    enabled: false,
    text: "",
  };

  ngOnInit(): void {
    this.ticket_groupService.get().subscribe({
      next: ticket_groups => {
        this.ticket_groups = ticket_groups;
        this.loadingState--;
      },
      error: err => {
        console.error(err);
        this.errorLoading.enabled = true;
        this.errorLoading.text = err.message;
        this.loadingState--;
      },
    });

    this.ticket_groupService.deleteAsObservable().subscribe(ticket_group => {
      this.ticket_groups.splice(this.ticket_groups.indexOf(ticket_group), 1);
    });
  }

  public edit(ticket_group: TicketGroup): void {
    this.router.navigate(["/ticket_groups/edit/" + ticket_group.id]);
  }

  public delete(ticket_group: TicketGroup): void {
    if (!ticket_group.id) {
      this.toastr.error(
        `<div><b>Ticket group DIDN'T deleted!</b><br/>Can't delete! Didn't receive ticket_group id.</div>`,
        "",
        {
          enableHtml: true,
          progressBar: true,
        }
      );
      return;
    }
    this.ticket_groupService.delete(ticket_group.id).subscribe(ticket_group => {
      if (!ticket_group) {
        this.toastr.error(
          `<div><b>Ticket group DIDN'T deleted!</b></div>`,
          "",
          {
            enableHtml: true,
            progressBar: true,
          }
        );
        return;
      }
      this.ticket_groups.splice(this.ticket_groups.indexOf(ticket_group), 1);
      this.toastr.info(
        `<b>Ticket group "${ticket_group.name}" deleted</b>`,
        "",
        {
          enableHtml: true,
          progressBar: true,
        }
      );
    });
  }
}
