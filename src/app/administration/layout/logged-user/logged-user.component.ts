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
  time_to_access_token_expire: string = "";
  formatedRoles = 'All';
  #refreshingInterval: number | null = null;

  constructor(
    @Inject(DOCUMENT) private document: Document
  ) {
    this.#refreshingInterval = window.setInterval(() => { this.#updateCountdown(); }, 1_000)
  }

  ngOnDestroy(): void {
    if (this.#refreshingInterval) clearInterval(this.#refreshingInterval);
  }

  #updateCountdown() {
    const exp = this.#auth.getDecodedAccessToken()?.exp as number | undefined;
    if (!exp) {
      this.time_to_access_token_expire = 'exp is not defined';
      return;
    }

    const now = Math.floor(Date.now() / 1000);
    const diff = exp - now;

    if (diff <= 0) {
      this.time_to_access_token_expire = 'EXPIRED';
      return;
    }

    this.time_to_access_token_expire = this.#formatCountdown(diff);
  }

  #formatCountdown(totalSeconds: number): string {
    const s = totalSeconds % 60;
    const mTotal = (totalSeconds - s) / 60;
    const m = mTotal % 60;
    const hTotal = (mTotal - m) / 60;
    const h = hTotal % 24;
    const d = (hTotal - h) / 24;

    const pad = (n: number) => n.toString().padStart(2, '0');

    if (d > 0) return `${d} d ${h}:${pad(m)}:${pad(s)}`;
    if (h > 0) return `${h}:${pad(m)}:${pad(s)}`;
    return `${m}:${pad(s)}`;
  }

  get username(): string {
    return this.#auth.getDecodedAccessToken()?.sub || "undefined";
  }

  get access_token_expire() {
    const exp = this.#auth.getDecodedAccessToken()?.exp;
    if (!exp) return 'undefined';

    const userLocale = navigator.languages?.[0] || navigator.language || 'cs-CZ';
    return new Intl.DateTimeFormat(
      userLocale,
      {
        dateStyle: 'short',
        timeStyle: 'medium'
      }
    ).format(new Date(exp * 1000));
  }

  logout() {
    this.#auth.logout();
  }

  public toggleTheme() {
    this.document.body.classList.toggle('light');
    this.document.body.classList.toggle('alt-font');
  }

}