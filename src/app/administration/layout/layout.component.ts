import { Component, ChangeDetectionStrategy, DestroyRef, effect, inject } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { UsersService } from '../../services/users.service';
import { EventService } from '../events/events.service';
import { NavBarComponent } from './nav-bar/nav-bar.component';
import { CurrentEventComponent } from './current-event/current-event.component';
import { LoggedUserComponent } from './logged-user/logged-user.component';
import { CopyrightComponent } from '../../components/copyright/copyright.component';

@Component({
    selector: 'app-administration-layout',
    templateUrl: './layout.component.html',
    styleUrls: ['./layout.component.scss'],
    providers: [UsersService],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [NavBarComponent, CurrentEventComponent, LoggedUserComponent, RouterOutlet, CopyrightComponent]
})
export class AdministrationLayoutComponent {
    readonly #router = inject(Router);
    readonly #eventService = inject(EventService);
    readonly #destroyRef = inject(DestroyRef);
    readonly #eventResource = this.#eventService.activeEventResource;

    constructor() {
        this.#destroyRef.onDestroy(() => {
            this.#eventService.setActiveEventId(null);
            this.#eventService.setCurrentEvent(undefined);
        });

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
            const ticketGroupsRoute = routes.find(({ path }) => path === ':event-id/ticket-groups');
            const eventFormRoute = routes.find(({ path }) => path === 'edit/:event-id' || path === 'detail/:event-id');
            eventId = ticketRoute?.paramMap.get('event-id')
                ?? ticketGroupsRoute?.paramMap.get('event-id')
                ?? eventFormRoute?.paramMap.get('event-id')
                ?? null;
        }

        if (eventId !== this.#eventService.activeEventId()) {
            this.#eventService.setCurrentEvent(undefined);
            this.#eventService.setActiveEventId(eventId);
        }
    }
}
