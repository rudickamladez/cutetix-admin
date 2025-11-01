import type { OnInit } from "@angular/core";
import { Component, inject, Input } from "@angular/core";

import {
  faCoins,
  faPlus,
  faTicket,
  faTicketAlt,
  faTimes,
} from "@fortawesome/free-solid-svg-icons";
import { ToastrService } from "ngx-toastr";
import { LoggingService } from "src/app/services/logging.service";

import { EventService } from "../../events/events.service";
import type { Event, EventCapacitySummary } from "../../events/events.types";

@Component({
  selector: "app-dashboard-event-overview",
  templateUrl: "./dashboard-event-overview.component.html",
  styleUrls: ["./dashboard-event-overview.component.scss"],
  standalone: false,
})
export class DashboardEventOverviewComponent implements OnInit {
  readonly #eventService = inject(EventService);
  readonly #toastr = inject(ToastrService);
  readonly #logging = inject(LoggingService);

  event?: Event;
  eventCapacitySummary?: EventCapacitySummary;

  // icons
  paidTicketsIcon = faCoins;
  reservedTicketsIcon = faTicket;
  totalTicketsIcon = faTicketAlt;
  freeTicketsIcon = faPlus;
  cancelledTicketsIcon = faTimes;

  @Input() event_id?: string;

  constructor() {}

  ngOnInit(): void {
    this.#eventService.getById(this.event_id!).subscribe({
      // success
      next: event_from_api => {
        this.event = event_from_api;

        // continue only when event exists
        this.#eventService.capacitySummaryById(this.event_id!).subscribe({
          // success
          next: eventCapacitySum => {
            this.eventCapacitySummary = eventCapacitySum;
            this.#logging.log(
              "dashboardEventLoad",
              `Loaded successfully capacity summary for ${this.event?.name}`
            );
          },
          // error
          error: err => {
            this.#logging.error(
              "dashboardEventLoad",
              `Cannot load event capacity summary for ${this.event?.name}`
            );
            this.#toastr.error(
              err.message,
              "Cannot load event capacity summary",
              {
                progressBar: true,
              }
            );
            return;
          },
        });
      },
      // error
      error: err => {
        this.#logging.error(
          "dashboardEventLoad",
          `Cannot load event capacity summary for event with ID: ${this.event_id}`
        );
        this.#toastr.error(err.message, "Cannot load event", {
          progressBar: true,
        });
        return;
      },
    });
  }

  get freeTickets(): number | undefined {
    if (!this.event_id || !this.event) {
      return 0;
    }
    return this.eventCapacitySummary?.free;
  }

  get reservedTickets(): number | undefined {
    if (!this.event_id || !this.event) {
      return 0;
    }
    return this.eventCapacitySummary?.reserved;
  }

  get cancelledTickets(): number | undefined {
    if (!this.event_id || !this.event) {
      return 0;
    }
    return this.eventCapacitySummary?.cancelled;
  }

  get totalTickets(): number | undefined {
    if (!this.event_id || !this.event) {
      return 0;
    }
    return this.eventCapacitySummary?.total;
  }

  get paidTickets(): number | undefined {
    if (!this.event_id || !this.event) {
      return 0;
    }
    return this.eventCapacitySummary?.paid;
  }
}
