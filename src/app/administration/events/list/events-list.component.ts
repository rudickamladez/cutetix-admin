import type { OnInit } from "@angular/core";
import { Component, inject } from "@angular/core";
import { Router } from "@angular/router";

import { faPen, faTrash } from "@fortawesome/free-solid-svg-icons";
import { ToastrService } from "ngx-toastr";

import { EventService } from "../events.service";
import type { Event } from "../events.types";

@Component({
  selector: "app-events-list",
  templateUrl: "./events-list.component.html",
  styleUrls: ["./events-list.component.scss"],
  standalone: false,
})
export class EventsListComponent implements OnInit {
  public faPen = faPen;
  public faTrash = faTrash;
  public events: Event[] = [];
  public loadingState = 1;
  public errorLoading = {
    enabled: false,
    text: "",
  };

  readonly #eventsService = inject(EventService);
  readonly #router = inject(Router);
  readonly #toastr = inject(ToastrService);

  constructor() {}

  ngOnInit(): void {
    this.#eventsService.get().subscribe({
      next: events => {
        this.events = events;
        this.loadingState--;
      },
      error: err => {
        console.error(err);
        this.errorLoading.enabled = true;
        this.errorLoading.text = err.message;
        this.loadingState--;
      },
    });

    this.#eventsService.deleteAsObservable().subscribe(event => {
      this.events.splice(this.events.indexOf(event), 1);
    });
  }

  public edit(event: Event): void {
    this.#router.navigate(["/events/edit/" + event.id]);
  }

  public delete(event: Event): void {
    if (!event.id) {
      this.#toastr.error(
        `<div><b>Event DIDN'T deleted!</b><br/>Can't delete! Didn't receive event id.</div>`,
        "",
        {
          enableHtml: true,
          progressBar: true,
        }
      );
      return;
    }
    // this.eventsService.delete(event.id).subscribe(
    //   (event) => {
    //     if (!event) {
    //       this.toastr.error(
    //         `<div><b>Event DIDN'T deleted!</b></div>`,
    //         '',
    //         {
    //           enableHtml: true,
    //           progressBar: true,
    //         }
    //       );
    //       return
    //     }
    //     this.events.splice(this.events.indexOf(event), 1);
    //     this.toastr.info(
    //       `<b>Event "${event.name}" deleted</b>`,
    //       '',
    //       {
    //         enableHtml: true,
    //         progressBar: true
    //       }
    //     );
    //   }
    // )
  }
}
