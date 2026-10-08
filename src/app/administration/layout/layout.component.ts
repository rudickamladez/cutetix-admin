import { Component, ChangeDetectionStrategy, effect, inject } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { UsersService } from '../../services/users.service';
import { EventService } from '../events/events.service';

@Component({
    selector: 'app-administration-layout',
    templateUrl: './layout.component.html',
    styleUrls: ['./layout.component.scss'],
    providers: [UsersService],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class AdministrationLayoutComponent {
    readonly #router = inject(Router);
    readonly #eventService = inject(EventService);
    readonly #eventResource = this.#eventService.activeEventResource;

    constructor() {
        effect(() => {
            const eventId = this.#eventService.activeEventId();
            const event = this.#eventResource.value();

            if (!eventId || this.#eventResource.error()) {
                this.#eventService.setCurrentEvent(undefined);
            } else if (event && String(event.id) === eventId) {
                this.#eventService.setCurrentEvent(event);
            } else {
                this.#eventService.setCurrentEvent(undefined);
            }
        });

        this.#syncCurrentEvent();
        this.#router.events.pipe(
            filter((event): event is NavigationEnd => event instanceof NavigationEnd),
            takeUntilDestroyed(),
        ).subscribe(() => this.#syncCurrentEvent());
    }

    #syncCurrentEvent(): void {
        const routes: Array<{ path: string; paramMap: { get(name: string): string | null } }> = [];
        let route = this.#router.routerState.snapshot.root;
        while (route) {
            routes.push({ path: route.routeConfig?.path ?? '', paramMap: route.paramMap });
            const child = route.children[0];
            if (!child) break;
            route = child;
        }

        const inEventSection = routes.some(({ path }) => path === 'events' || path === 'my-events');
        let eventId: string | null = null;

        if (inEventSection) {
            const ticketRoute = routes.find(({ path }) => path === ':event-id/tickets');
            const eventFormRoute = routes.find(({ path }) => path === 'edit/:id' || path === 'detail/:id');
            eventId = ticketRoute?.paramMap.get('event-id') ?? eventFormRoute?.paramMap.get('id') ?? null;
        }

        if (eventId !== this.#eventService.activeEventId()) {
            this.#eventService.setCurrentEvent(undefined);
            this.#eventService.setActiveEventId(eventId);
        }
    }
}
