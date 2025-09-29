import { Component, inject, Input, OnInit } from "@angular/core";
import { faCoins, faPlus, faTicket, faTicketAlt, faTimes } from '@fortawesome/free-solid-svg-icons';
import { ToastrService } from "ngx-toastr";
import { EventService } from "../../events/events.service";
import { Event, EventCapacitySummary } from "../../events/events.types";

@Component({
    selector: 'app-dashboard-event-overview',
    templateUrl: './component.html',
    styleUrls: ['./component.scss'],
    standalone: false,
})
export class DashboardEventOverviewComponent implements OnInit {
    readonly #eventService = inject(EventService);
    readonly #toastr = inject(ToastrService);

    event?: Event;
    eventCapacitySummary?: EventCapacitySummary;

    // icons
    paidTicketsIcon = faCoins;
    reservedTicketsIcon = faTicket;
    totalTicketsIcon = faTicketAlt;
    freeTicketsIcon = faPlus;
    cancelledTicketsIcon = faTimes;

    @Input() event_id?: string;

    constructor(
    ) { }

    ngOnInit(): void {
        this.#eventService.getById(this.event_id!).subscribe({
            // success
            next: (event_from_api) => {
                this.event = event_from_api;

                // continue only when event exists
                this.#eventService.capacitySummaryById(this.event_id!).subscribe({
                    // success
                    next: (eventCapacitySum) => {
                        this.eventCapacitySummary = eventCapacitySum;
                        this.#toastr.info(
                            'Loaded successfully',
                            'Capacity summary for ' + this.event?.name,
                            {
                                progressBar: true,
                            }
                        );
                    },
                    // error
                    error: (err) => {
                        this.#toastr.error(
                            err.message,
                            'Cannot load event capacity summary',
                            {
                                progressBar: true,
                            }
                        );
                        return
                    }
                })
            },
            // error
            error: (err) => {
                this.#toastr.error(
                    err.message,
                    'Cannot load event',
                    {
                        progressBar: true,
                    }
                );
                return
            }
        })
    }

    get freeTickets() {
        if (!this.event_id || !this.event) {
            return 0;
        }
        return this.eventCapacitySummary?.free;
    }

    get reservedTickets() {
        if (!this.event_id || !this.event) {
            return 0;
        }
        return this.eventCapacitySummary?.reserved;
    }

    get cancelledTickets() {
        if (!this.event_id || !this.event) {
            return 0;
        }
        return this.eventCapacitySummary?.cancelled
    }

    get totalTickets() {
        if (!this.event_id || !this.event) {
            return 0;
        }
        return this.eventCapacitySummary?.total
    }

    get paidTickets() {
        if (!this.event_id || !this.event) {
            return 0;
        }
        return this.eventCapacitySummary?.paid
    }
}