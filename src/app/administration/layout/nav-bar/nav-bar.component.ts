import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { MenuItem } from './menu-items';
import { MenuBuilder } from './menu-builder';
import { AuthService } from 'src/app/services/auth.service';
import { faBars, faChartLine, faSignOutAlt, faTimes, faUser } from '@fortawesome/free-solid-svg-icons';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { StorageService } from 'src/app/services/storage.service';
import { StorageKeys } from 'src/app/tokens/storage.tokens';

@Component({
    selector: 'app-nav-bar',
    templateUrl: './nav-bar.component.html',
    styleUrls: ['./nav-bar.component.scss'],
    standalone: false
})
export class NavBarComponent implements OnInit {
    readonly #authService = inject(AuthService);
    readonly #router = inject(Router);
    readonly #storageService = inject(StorageService);
    readonly #destroyRef = inject(DestroyRef);

    dashboardItem = new MenuItem('Dashboard', 'dashboard', faChartLine);
    userProfileItem = new MenuItem('My profile', 'profile', faUser);
    logoutItem =  new MenuItem('Log out', '', faSignOutAlt, () => this.logout());
    builder = new MenuBuilder()
    availableItems: MenuItem[] = [];
    
    readonly #menuOpen = signal<boolean>(false);
    protected readonly menuOpen = this.#menuOpen.asReadonly();

    // icons
    protected readonly menuClosedIcon = faBars;
    protected readonly menuOpenIcon = faTimes;

    ngOnInit(): void {
        this.#menuOpen.set(history.state.navBarVisible ?? false);
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

    toggle(): void {
        this.#menuOpen.set(!this.#menuOpen());
    }

    hide(): void {
        this.#menuOpen.set(false);
    }

    logout(): void {
        this.#authService.logout();
        this.#router.navigate(['/login']);
    }

    #rebuildMenu(currentUrl: string): void {
        this.availableItems = this.builder.build(currentUrl);
        this.availableItems.unshift(this.dashboardItem);
        this.availableItems.push(
            this.userProfileItem,
            this.logoutItem
        );
    }
}
