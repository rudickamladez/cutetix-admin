import { Component, computed, booleanAttribute, inject, input, OnDestroy, OnInit } from "@angular/core";
import { AuthService } from "src/app/services/auth.service";
import { UsersService } from "src/app/services/users.service";

@Component({
  selector: 'app-user-info',
  templateUrl: './user-info.component.html',
  styleUrls: ['./user-info.component.scss'],
  standalone: false,
})
export class UserInfoComponent implements OnInit, OnDestroy {
  protected readonly authService = inject(AuthService);
  protected readonly usersService = inject(UsersService);

  readonly show_favorite_events = input(true, {
    transform: booleanAttribute,
  });

  protected time_to_access_token_expire = "";
  protected time_to_refresh_token_expire = "";
  #refreshingInterval?: number;


  ngOnInit(): void {
    this.#refreshingInterval = window.setInterval(() => { this.#updateCountdown(); }, 1_000)
  }

  ngOnDestroy(): void {
    if (this.#refreshingInterval) {
      window.clearInterval(this.#refreshingInterval);
      this.#refreshingInterval = undefined;
    }
  }

  #updateCountdown() {
    const at_exp = this.authService.getDecodedAccessToken()?.exp as number | undefined;
    const rt_exp = this.authService.getDecodedRefreshToken()?.exp as number | undefined;
    if (!at_exp) {
      this.time_to_access_token_expire = 'exp is not defined';
      return;
    }
    if (!rt_exp) {
      this.time_to_refresh_token_expire = 'exp is not defined';
      return;
    }

    const now = Math.floor(Date.now() / 1000);
    const at_diff = at_exp - now;
    const rt_diff = rt_exp - now;

    if (at_diff <= 0) {
      this.time_to_access_token_expire = 'EXPIRED';
      return;
    }

    if (rt_diff <= 0) {
      this.time_to_refresh_token_expire = 'EXPIRED';
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

    const pad = (n: number) => n.toString().padStart(2, '0');

    if (d > 0) return `${d} d ${h}:${pad(m)}:${pad(s)}`;
    if (h > 0) return `${h}:${pad(m)}:${pad(s)}`;
    return `${m}:${pad(s)}`;
  }

  protected get_access_token_expiration() {
    const exp = this.authService.getDecodedAccessToken()?.exp;
    if (!exp) return undefined;
    return exp * 1000;
  }

  protected refresh_token_expire() {
    const exp = this.authService.getDecodedRefreshToken()?.exp;
    if (!exp) return undefined;

    return exp * 1000;
  }

  protected readonly show_user_dependended_info = computed<boolean>(() => {
    if (!this.usersService.user.value()) { return false };
    if (!this.show_favorite_events()) { return false };
    return true;
  });
}
