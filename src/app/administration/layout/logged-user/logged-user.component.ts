import { Component, inject, Inject, DOCUMENT } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-logged-user',
  templateUrl: './logged-user.component.html',
  styleUrls: ['./logged-user.component.scss'],
  standalone: false
})
export class LoggedUserComponent {
  readonly #auth = inject(AuthService);

  constructor(
    @Inject(DOCUMENT) private document: Document,
    private readonly router: Router,
  ) {
  }

  get username(): string {
    return this.#auth.getDecodedAccessToken()?.sub || "undefined";
  }

  openProfile() {
    this.router.navigate(['/profile']);
  }

  logout() {
    this.#auth.logout();
  }

  toggleTheme() {
    this.document.body.classList.toggle('light');
    this.document.body.classList.toggle('alt-font');
  }

}