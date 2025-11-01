import { Component, DOCUMENT, inject } from "@angular/core";
import { Router } from "@angular/router";

import {
  faRepeat,
  faSignOutAlt,
  faUser,
} from "@fortawesome/free-solid-svg-icons";
import { AuthService } from "src/app/services/auth.service";

@Component({
  selector: "app-logged-user",
  templateUrl: "./logged-user.component.html",
  styleUrls: ["./logged-user.component.scss"],
  standalone: false,
})
export class LoggedUserComponent {
  private document = inject<Document>(DOCUMENT);
  private readonly router = inject(Router);

  readonly #auth = inject(AuthService);

  // icons
  userIcon = faUser;
  switchThemeIcon = faRepeat;
  logoutIcon = faSignOutAlt;
  myProfileIcon = faUser;

  get username(): string {
    return this.#auth.getDecodedAccessToken()?.sub || "undefined";
  }

  openProfile(): void {
    this.router.navigate(["/profile"]);
  }

  logout(): void {
    this.#auth.logout();
  }

  toggleTheme(): void {
    this.document.body.classList.toggle("light");
    this.document.body.classList.toggle("alt-font");
  }
}
