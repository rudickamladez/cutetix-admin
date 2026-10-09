import { Component, DestroyRef, OnInit, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { MenuItem } from './menu-items';
import { MenuBuilder } from './menu-builder';
import { AuthService } from 'src/app/services/auth.service';
import { faBars, faChartLine, faSignOutAlt, faTimes, faUser } from '@fortawesome/free-solid-svg-icons';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { StorageService } from 'src/app/services/storage.service';
import { StorageKeys } from 'src/app/tokens/storage.tokens';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { NavBarItemComponent } from '../nav-bar-item/nav-bar-item.component';
import { NavBarSubitemComponent } from '../nav-bar-subitem/nav-bar-subitem.component';
import { EventService } from '../../events/events.service';
import { EventPermissionsService } from 'src/app/services/event-permissions.service';
import { AsyncPipe } from '@angular/common';

@Component({
    selector: 'app-nav-bar',
    templateUrl: './nav-bar.component.html',
    styleUrls: ['./nav-bar.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [FaIconComponent, NavBarItemComponent, NavBarSubitemComponent, AsyncPipe]
})
export class NavBarComponent implements OnInit {
    readonly #authService = inject(AuthService);
    readonly #router = inject(Router);
    readonly #storageService = inject(StorageService);
    readonly #eventService = inject(EventService);
    readonly #eventPermissions = inject(EventPermissionsService);
    readonly #destroyRef = inject(DestroyRef);

    dashboardItem = new MenuItem('Dashboard', 'dashboard', faChartLine);
    userProfileItem = new MenuItem('My profile', 'profile', faUser);
    logoutItem =  new MenuItem('Log out', '', faSignOutAlt, () => this.#authService.logout());
    builder = new MenuBuilder()
    readonly availableItems = signal<MenuItem[]>([]);
    protected readonly currentEvent = this.#eventService.currentEvent;
    
    readonly #menuOpen = signal<boolean>(false);
    protected readonly menuOpen = this.#menuOpen.asReadonly();

    // icons
    protected readonly menuClosedIcon = faBars;
    protected readonly menuOpenIcon = faTimes;

    ngOnInit(): void {
        this.#menuOpen.update(m => history.state.navBarVisible ?? m);
        this.#rebuildMenu(this.#router.url);

        this.#router.events.pipe(
            filter((event): event is NavigationEnd => event instanceof NavigationEnd),
            takeUntilDestroyed(this.#destroyRef),
        ).subscribe(event => {
            this.#rebuildMenu(event.urlAfterRedirects);
        });

        this.#storageService.storageEvent$(StorageKeys.ADMIN_MODE).pipe(
            takeUntilDestroyed(this.#destroyRef),
        ).subscribe(() => {
            this.#rebuildMenu(this.#router.url);
        });
    }

    protected get eventBase(): string {
        return this.#router.url.startsWith('/events/') ? '/events' : '/my-events';
    }

    protected isEventDetailsActive(eventId: string | number): boolean {
        const path = this.#router.url.split('?')[0];
        return path === `${this.eventBase}/detail/${eventId}` || path === `${this.eventBase}/edit/${eventId}`;
    }

    protected isEventSection(item: MenuItem): boolean {
        return item.link === this.eventBase.slice(1);
    }

    protected isEventContextMenuOpen(item: MenuItem): boolean {
        return !!this.currentEvent() && this.isEventSection(item) && this.isEventTicketGroupsRoute();
    }

    private isEventTicketGroupsRoute(): boolean {
        return /^\/(?:events|my-events)\/[^/?]+\/ticket-groups(?:\/|$)/.test(this.#router.url);
    }

    protected canSeeTickets(eventId: string | number) {
        return this.#eventPermissions.canForEvent(eventId, 'tickets:read');
    }

    protected canSeeTicketGroups(eventId: string | number) {
        return this.#eventPermissions.canForEvent(eventId, 'ticket_groups:read');
    }

    toggle(): void {
        this.#menuOpen.update(m => !m);
    }

    hide(): void {
        this.#menuOpen.set(false);
    }

    #rebuildMenu(currentUrl: string): void {
        const availableItems = this.builder.build(currentUrl);
        availableItems.unshift(this.dashboardItem);
        availableItems.push(
            this.userProfileItem,
            this.logoutItem
        );
        this.availableItems.set(availableItems);
    }
}
