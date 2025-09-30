import { Component, OnInit } from '@angular/core';
import { MenuItem } from './menu-items';
import { MenuBuilder } from './menu-builder';
import { AuthService } from 'src/app/services/auth.service';

@Component({
    selector: 'app-nav-bar',
    templateUrl: './nav-bar.component.html',
    styleUrls: ['./nav-bar.component.scss'],
    standalone: false
})
export class NavBarComponent implements OnInit {
    dashboardItem = new MenuItem('Dashboard', 'dashboard', 'fa-chart-line');
    userProfileItem = new MenuItem('My profile', 'profile', 'fa-user');
    logoutItem =  new MenuItem('Log out', '', 'fa-sign-out-alt', () => this.logout());
    builder = new MenuBuilder()
    availableItems: MenuItem[] = [];
    visible = false;

    constructor(
        private authService: AuthService,
    ) { }

    ngOnInit(): void {
        this.visible = history.state.navBarVisible ?? false;
        this.availableItems = this.builder.build()
        this.availableItems.unshift(this.dashboardItem);
        this.availableItems.push(
            this.userProfileItem,
            this.logoutItem
        );
    }

    toggle(): void {
        this.visible = !this.visible;
    }

    hide(): void {
        this.visible = false;
    }

    logout(): void {
        this.authService.logout();
    }
}