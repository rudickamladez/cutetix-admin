import { Component, inject, Input, OnDestroy, OnInit } from "@angular/core";
import { AuthService } from "src/app/services/auth.service";

@Component({
    selector: 'app-user-info',
    templateUrl: './component.html',
    styleUrls: ['./component.scss'],
    standalone: false,
})
export class UserInfoComponent implements OnInit, OnDestroy {
    readonly #auth = inject(AuthService);
    time_to_access_token_expire: Date = new Date();
    time_to_refresh_token_expire: Date = new Date();
    #refreshingInterval: number | null = null;
    @Input() date_format: string = 'medium';
    
    ngOnInit(): void {
        this.#refreshingInterval = window.setInterval(() => { this.#updateCountdown(); }, 1_000);
        this.#updateCountdown();
    }

    ngOnDestroy(): void {
        if (this.#refreshingInterval) clearInterval(this.#refreshingInterval);
    }

    #updateCountdown() {
        const at_exp = this.#auth.getDecodedAccessToken()?.exp as number | undefined;
        const rt_exp = this.#auth.getDecodedRefreshToken()?.exp as number | undefined;
        if (!at_exp) {
            this.time_to_access_token_expire = new Date();
            return;
        }
        if (!rt_exp) {
            this.time_to_refresh_token_expire = new Date();
            return;
        }

        const now = Date.now();
        const at_diff = (at_exp * 1_000) - now;
        const rt_diff = (rt_exp * 1_000) - now;

        if (at_diff <= 0) {
            this.time_to_access_token_expire = new Date();
            return;
        }

        if (rt_diff <= 0) {
            this.time_to_refresh_token_expire = new Date();
            return;
        }

        this.time_to_access_token_expire = new Date(at_diff);
        this.time_to_refresh_token_expire = new Date(rt_diff);
        console.log(this.time_to_refresh_token_expire, rt_exp, rt_diff);
    }

    get username(): string {
        return this.#auth.getDecodedAccessToken()?.sub || "undefined";
    }

    get scopes(): string {
        const scope = Object(this.#auth.getDecodedAccessToken())?.scope as string | undefined;

        const ss = (scope ?? '')
            .toString()
            .split(',')
            .map(s => s.trim())
            .filter(Boolean)
            .join(', ') || 'undefined';

        return ss;

    }

    get access_token_expire() {
        const exp = this.#auth.getDecodedAccessToken()?.exp;
        if (!exp) return 'undefined';
        return new Date(exp * 1000);
    }

    get refresh_token_expire() {
        const exp = this.#auth.getDecodedRefreshToken()?.exp;
        if (!exp) return 'undefined';
        return new Date(exp * 1000);
    }
}