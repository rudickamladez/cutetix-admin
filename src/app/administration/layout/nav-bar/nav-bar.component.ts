import type { OnInit } from "@angular/core";
import { Component } from "@angular/core";

import { faBars, faChartLine, faSignOutAlt, faTimes, faUser } from "@fortawesome/free-solid-svg-icons";
import type { AuthService } from "src/app/services/auth.service";

import { MenuBuilder } from "./menu-builder";
import { MenuItem } from "./menu-items";

@Component({
  selector: "app-nav-bar",
  templateUrl: "./nav-bar.component.html",
  styleUrls: ["./nav-bar.component.scss"],
  standalone: false,
})
export class NavBarComponent implements OnInit {
  dashboardItem = new MenuItem("Dashboard", "dashboard", faChartLine);
  userProfileItem = new MenuItem("My profile", "profile", faUser);
  logoutItem = new MenuItem("Log out", "", faSignOutAlt, () => this.logout());
  builder = new MenuBuilder();
  availableItems: MenuItem[] = [];
  menuOpen = false;

  // icons
  menuClosedIcon = faBars;
  menuOpenIcon = faTimes;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.menuOpen = history.state.navBarVisible ?? false;
    this.availableItems = this.builder.build();
    this.availableItems.unshift(this.dashboardItem);
    this.availableItems.push(this.userProfileItem, this.logoutItem);
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
