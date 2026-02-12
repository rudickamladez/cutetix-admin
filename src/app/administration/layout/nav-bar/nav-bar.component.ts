import { Component, OnInit, inject } from '@angular/core';
import { MenuItem } from './menu-items';
import { MenuBuilder } from './menu-builder';
import { AuthService } from 'src/app/services/auth.service';
import { faBars, faChartLine, faSignOutAlt, faTimes, faUser } from '@fortawesome/free-solid-svg-icons';

@Component({
    selector: 'app-nav-bar',
    templateUrl: './nav-bar.component.html',
    styleUrls: ['./nav-bar.component.scss'],
    standalone: false
})
export class NavBarComponent implements OnInit {
    private authService = inject(AuthService);

    dashboardItem = new MenuItem('Dashboard', 'dashboard', faChartLine);
    userProfileItem = new MenuItem('My profile', 'profile', faUser);
    logoutItem =  new MenuItem('Log out', '', faSignOutAlt, () => this.logout());
    builder = new MenuBuilder()
    availableItems: MenuItem[] = [];
    menuOpen = false;

    // icons
    protected readonly menuClosedIcon = faBars;
    protected readonly menuOpenIcon = faTimes;

    ngOnInit(): void {
        this.menuOpen = history.state.navBarVisible ?? false;
        this.availableItems = this.builder.build()
        this.availableItems.unshift(this.dashboardItem);
        this.availableItems.push(
            this.userProfileItem,
            this.logoutItem
        );
    }

    toggle(): void {
        this.menuOpen = !this.menuOpen;
    }

    hide(): void {
        this.menuOpen = false;
    }

    logout(): void {
        this.authService.logout();
    }
}