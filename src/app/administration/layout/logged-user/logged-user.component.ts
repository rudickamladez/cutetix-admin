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

  constructor(
    @Inject(DOCUMENT) private document: Document
  ) {
  }

  get username(): string {
    return this.#auth.getDecodedAccessToken()?.sub || "undefined";
  }

  logout() {
    this.#auth.logout();
  }

  public toggleTheme() {
    this.document.body.classList.toggle('light');
    this.document.body.classList.toggle('alt-font');
  }

}