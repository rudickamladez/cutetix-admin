import type { OnDestroy } from "@angular/core";
import { Component, inject } from "@angular/core";

import { AuthService } from "src/app/services/auth.service";

@Component({
  selector: "app-user-info",
  templateUrl: "./user-info.component.html",
  styleUrls: ["./user-info.component.scss"],
  standalone: false,
})
export class UserInfoComponent implements OnDestroy {
  readonly #auth = inject(AuthService);
  time_to_access_token_expire: string = "";
  time_to_refresh_token_expire: string = "";
  #refreshingInterval: number | null = null;

  constructor() {
    this.#refreshingInterval = window.setInterval(() => {
      this.#updateCountdown();
    }, 1_000);
  }

  ngOnDestroy(): void {
    if (this.#refreshingInterval) {
      clearInterval(this.#refreshingInterval);
    }
  }

  #updateCountdown(): void {
    const at_exp = this.#auth.getDecodedAccessToken()?.exp;
    const rt_exp = this.#auth.getDecodedRefreshToken()?.exp;
    if (!at_exp) {
      this.time_to_access_token_expire = "exp is not defined";
      return;
    }
    if (!rt_exp) {
      this.time_to_refresh_token_expire = "exp is not defined";
      return;
    }

    const now = Math.floor(Date.now() / 1000);
    const at_diff = at_exp - now;
    const rt_diff = rt_exp - now;

    if (at_diff <= 0) {
      this.time_to_access_token_expire = "EXPIRED";
      return;
    }

    if (rt_diff <= 0) {
      this.time_to_refresh_token_expire = "EXPIRED";
      return;
    }

    this.time_to_access_token_expire = this.#formatCountdown(at_diff);
    this.time_to_refresh_token_expire = this.#formatCountdown(rt_diff);
  }

  #formatCountdown(totalSeconds: number): string {
    const s = totalSeconds % 60;
    const mTotal = (totalSeconds - s) / 60;
    const m = mTotal % 60;
    const hTotal = (mTotal - m) / 60;
    const h = hTotal % 24;
    const d = (hTotal - h) / 24;

    const pad = (n: number): string => n.toString().padStart(2, "0");

    if (d > 0) {
      return `${d} d ${h}:${pad(m)}:${pad(s)}`;
    }
    if (h > 0) {
      return `${h}:${pad(m)}:${pad(s)}`;
    }
    return `${m}:${pad(s)}`;
  }

  get username(): string {
    return this.#auth.getDecodedAccessToken()?.sub || "undefined";
  }

  get scopes(): string {
    const scope = Object(this.#auth.getDecodedAccessToken())?.scope as
      | string
      | undefined;

    const ss =
      (scope ?? "")
        .toString()
        .split(",")
        .map(s => s.trim())
        .filter(Boolean)
        .join(", ") || "undefined";

    return ss;
  }

  get access_token_expire(): string {
    const exp = this.#auth.getDecodedAccessToken()?.exp;
    if (!exp) {
      return "undefined";
    }

    const userLocale = navigator.languages[0] || navigator.language || "cs-CZ";
    return new Intl.DateTimeFormat(userLocale, {
      dateStyle: "short",
      timeStyle: "medium",
    }).format(new Date(exp * 1000));
  }

  get refresh_token_expire(): string {
    const exp = this.#auth.getDecodedRefreshToken()?.exp;
    if (!exp) {
      return "undefined";
    }

    const userLocale = navigator.languages[0] || navigator.language || "cs-CZ";
    return new Intl.DateTimeFormat(userLocale, {
      dateStyle: "short",
      timeStyle: "medium",
    }).format(new Date(exp * 1000));
  }
}
