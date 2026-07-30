import { Component, effect, inject, input } from "@angular/core";
import { faCoins, faPlus, faTicket, faTicketAlt, faTimes } from '@fortawesome/free-solid-svg-icons';
import { ToastrService } from "ngx-toastr";
import { EventService } from "../../events/events.service";
import { LoggingService } from "src/app/services/logging.service";
import { RouterLink } from "@angular/router";
import { FaIconComponent } from "@fortawesome/angular-fontawesome";

@Component({
    selector: 'app-dashboard-event-overview',
    templateUrl: './dashboard-event-overview.component.html',
    styleUrls: ['./dashboard-event-overview.component.scss'],
    imports: [RouterLink, FaIconComponent],
})
export class DashboardEventOverviewComponent {
    readonly #eventService = inject(EventService);
    readonly #toastr = inject(ToastrService);
    readonly #logging = inject(LoggingService)

    readonly event_id = input.required<string>();
    protected readonly event = this.#eventService.eventByIdResource(() => this.event_id());
    protected readonly eventCapacitySummary = this.#eventService.eventCapacitySummaryByIdResource(() => this.event_id());
    #eventErrorShown = false;
    #summaryErrorShown = false;

    // icons
    protected readonly paidTicketsIcon = faCoins;
    protected readonly reservedTicketsIcon = faTicket;
    protected readonly totalTicketsIcon = faTicketAlt;
    protected readonly freeTicketsIcon = faPlus;
    protected readonly cancelledTicketsIcon = faTimes;
    constructor() {
        effect(() => {
            const eventErr = this.event.error();
            if (!eventErr || this.#eventErrorShown) {
                return;
            }
            this.#eventErrorShown = true;

            const msg = eventErr instanceof Error ? eventErr.message : String(eventErr);
            this.#logging.error(
                "dashboardEventLoad",
                `Cannot load event for event with ID: ${this.event_id()}`,
            );
            this.#toastr.error(
                msg,
                'Cannot load event',
                {
                    progressBar: true,
                }
            );
        });

        effect(() => {
            const summaryErr = this.eventCapacitySummary.error();
            if (!summaryErr || this.#summaryErrorShown) {
                return;
            }
            this.#summaryErrorShown = true;

            const msg = summaryErr instanceof Error ? summaryErr.message : String(summaryErr);
            this.#logging.error(
                "dashboardEventLoad",
                `Cannot load event capacity summary for ${this.event.value()?.name}`,
            );
            this.#toastr.error(
                msg,
                'Cannot load event capacity summary',
                {
                    progressBar: true,
                }
            );
        });
    }

    protected eventErrorText() {
        const eventErr = this.event.error();
        if (eventErr) {
            return eventErr instanceof Error ? eventErr.message : String(eventErr);
        }

        const summaryErr = this.eventCapacitySummary.error();
        if (!summaryErr) {
            return '';
        }
        return summaryErr instanceof Error ? summaryErr.message : String(summaryErr);
    }
}
