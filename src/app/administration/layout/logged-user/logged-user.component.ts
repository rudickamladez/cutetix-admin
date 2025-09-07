import { DOCUMENT } from '@angular/common';
import { Component, inject, Inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-logged-user',
  templateUrl: './logged-user.component.html',
  styleUrls: ['./logged-user.component.scss']
})
export class LoggedUserComponent {
  readonly #auth = inject(AuthService);
  readonly #router = inject(Router);
  formatedRoles = 'All';

  constructor(
    @Inject(DOCUMENT) private document: Document
  ) { }

  get username() {
    return 'undefined';
  }

  get name() {
    return 'undefined';
  }

  get email() {
    return 'undefined';
  }

  get email_verified() {
    return 'undefined';
  }

  logout() {
    this.#auth.logout();
    this.#router.navigate(['/home']);
  }

  public toggleTheme() {
    this.document.body.classList.toggle('light');
    this.document.body.classList.toggle('alt-font');
  }

}