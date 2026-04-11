import { Injectable, type OnDestroy, effect, inject, signal } from "@angular/core";
import { HttpClient, type HttpErrorResponse } from "@angular/common/http";

import { jwtDecode } from "jwt-decode";
import { timeout, type Subscription } from "rxjs";
// import { Socket } from "ngx-socket-io";
import { ToastrService } from "ngx-toastr";

import { StorageService } from "./storage.service";
import { StorageKeys } from "../tokens/storage.tokens";
import { LoggingService } from "./logging.service";
import { LockNames } from "../tokens/lock.tokens";
import { VisibilityService } from "./visibility.service";
import { environment } from "src/environments/environment";
import { UserRegister } from "../types/auth.types";
// import { NgxIndexedDBService } from "ngx-indexed-db";

type TokensFromApi = {
    refresh_token: string,
    access_token: string,
}

@Injectable({
    providedIn: "root"
})
export class AuthService implements OnDestroy {
    readonly #http = inject(HttpClient);
    readonly #toastr = inject(ToastrService);
    // readonly #socket = inject(Socket);
    readonly #logging = inject(LoggingService);
    readonly #storageService = inject(StorageService);
    readonly #visibilityService = inject(VisibilityService);
    // readonly #idbService = inject(NgxIndexedDBService, { optional: true });

    readonly #canGoToPrivate = signal(false);
    readonly canGoToPrivate = this.#canGoToPrivate.asReadonly();

    #canRefreshToken = false;
    #isRefreshingToken = false;

    #lockAbortController = new AbortController();

    #refreshingTimer: ReturnType<typeof setTimeout> | null = null;
    #loginSub?: Subscription;
    #registerSub?: Subscription;

    constructor() {
        // could not be unsubscribed, because it is provided in root
        // this.#storageService.storageEvent$(StorageKeys.ACCESS_TOKEN)
        //     .pipe(filter(e => e.action !== "delete"))
        //     .subscribe({
        //         next: () => {
        //             this.#refreshAccessTokenOnWS();
        //         }
        //     });
        if (!this.#storageService.get(StorageKeys.API_URL)) {
            this.#storageService.set(StorageKeys.API_URL, environment.backend.api)
        }

        effect(() => {
            if (this.#visibilityService.visible()) {
                if (this.isLoggedIn()) {
                    this.#canGoToPrivate.set(true);
                }
                this.#handleRefreshLock();
                return;
            }
            this.#lockAbortController.abort();
            if (this.#refreshingTimer !== null) {
                clearTimeout(this.#refreshingTimer);
                this.#refreshingTimer = null;
            }
        }, { allowSignalWrites: true });
    }

    ngOnDestroy(): void {
        this.#loginSub?.unsubscribe();
    }

    register(
        user: UserRegister,
    ): void {
        // If user is already logged in, do nothing
        if (this.isLoggedIn()) {
            return;
        }

        if (this.#registerSub) {
            this.#registerSub.unsubscribe();
        }

        this.#registerSub = this.#http.post<TokensFromApi>(
            new URL("auth/register", this.#storageService.get(StorageKeys.API_URL)!).href,
            user,
        ).subscribe({
            next: ({ refresh_token, access_token }) => {
                this.#logging.log("auth", "User registred successfully.");
                this.#storageService
                    .set(StorageKeys.ACCESS_TOKEN, access_token)
                    .set(StorageKeys.REFRESH_TOKEN, refresh_token);

                this.#scheduleNextRefresh();

                this.#handleRefreshLock();
                this.#toastr.success(
                    "You have been registered.",
                    "Register",
                );
                this.#canGoToPrivate.set(true);
            },
            error: (err: HttpErrorResponse) => {
                this.#logging.log("auth", "User register failed.", err);
                console.error(err);
                if (err.error.detail) {
                    this.#toastr.error(
                        err.error.detail,
                        "Register"
                    );
                    return;
                }
                this.#toastr.error(
                    err.error,
                    "Register"
                );
            }
        });
    }

    login(
        username: string,
        password: string
    ): void {
        // If user is already logged in, do nothing
        if (this.isLoggedIn()) {
            return;
        }

        if (this.#loginSub) {
            this.#loginSub.unsubscribe();
        }

        const body = new URLSearchParams();
        body.set("username", username);
        body.set("password", password);
        // FastAPI OAuth2PasswordRequestForm requires this field
        body.set("grant_type", "password");

        this.#loginSub = this.#http.post<TokensFromApi>(
            new URL("auth/login", this.#storageService.get(StorageKeys.API_URL)!).href,
            body.toString(),
            {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
            },
        ).subscribe({
            next: ({ refresh_token, access_token }) => {
                this.#logging.log("auth", "User logged in successfully.");
                this.#storageService
                    .set(StorageKeys.ACCESS_TOKEN, access_token)
                    .set(StorageKeys.REFRESH_TOKEN, refresh_token);

                this.#scheduleNextRefresh();

                this.#handleRefreshLock();
                this.#toastr.success(
                    "You have been logged in.",
                    "Login",
                );
                this.#canGoToPrivate.set(true);
            },
            error: (err: HttpErrorResponse) => {
                this.#logging.log("auth", "User login failed.", err);
                console.error(err);
                if (err.error.detail) {
                    this.#toastr.error(
                        err.error.detail,
                        "Login"
                    );
                    return;
                }
                this.#toastr.error(
                    err.statusText,
                    "Login"
                );
            }
        });
    }

    refresh(): void {
        this.#logging.log("auth", "Initiating refreshing of access token.");
        if (!this.#canRefreshToken || this.#isRefreshingToken || !this.#visibilityService.visible()) return;

        const refreshToken = this.getRefreshToken();
        if (!refreshToken) {
            this.logout();
            return;
        }
        const access_token_payload = Object(this.getDecodedAccessToken());

        this.#logging.log("auth", "Refreshing of access token.");
        this.#isRefreshingToken = true;
        try {
            this.#http.post<TokensFromApi>(
                new URL("auth/refresh", this.#storageService.get(StorageKeys.API_URL)!).href,
                {
                    refresh_token: refreshToken,
                    requested_scopes: access_token_payload.scope || null,
                }
            ).subscribe({
                next: ({ refresh_token, access_token }) => {
                    this.#logging.log("auth", "Access token was refreshed.");
                    this.#storageService
                        .set(StorageKeys.ACCESS_TOKEN, access_token)
                        .set(StorageKeys.REFRESH_TOKEN, refresh_token);

                    this.#canGoToPrivate.set(true);
                    this.#scheduleNextRefresh();

                    this.#isRefreshingToken = false;
                }, error: (err: HttpErrorResponse) => {
                    this.#logging.error("auth", "Error while refreshing token.", err);
                    this.#isRefreshingToken = false;

                    if (err.status !== 0) {
                        this.#storageService.delete(StorageKeys.REFRESH_TOKEN);
                        this.logout();
                        return;
                    }
                    this.#scheduleNextRefresh();
                },
            });
        } catch (err) {
            this.#logging.log("auth", "Error while refreshing token.", err);
            this.#isRefreshingToken = false;
            this.logout();
        }
    }

    logout(): void {
        if (!this.isLoggedIn()) return;

        const refreshToken = this.getRefreshToken();
        const apiUrl = this.#storageService.get(StorageKeys.API_URL);

        if (!refreshToken || !apiUrl) {
            window.location.reload();
            return;
        }

        // TODO rework with navigator.sendBeacon
        this.#http.post(
            (new URL("auth/logout", apiUrl)).href,
            { }
        ).pipe(
            timeout(1000)
        ).subscribe({
            next: () => {
                this.#logging.log("auth", "User logged out successfully.");
                this.#toastr.success(
                    "You have been logged out.",
                    "Logout",
                );
            },
            error: (err: HttpErrorResponse) => {
                this.#logging.error("auth", "User logout failed.", err);
                console.error(err);
                this.#toastr.error(
                    `Logout request failed. You might still be logged in on the server. Error: ${err.message}`,
                    "Logout",
                );
            },
            complete: () => {
                this.#storageService
                    .delete(StorageKeys.ACCESS_TOKEN)
                    .delete(StorageKeys.REFRESH_TOKEN);
                this.#canGoToPrivate.set(false);
            }
        });
    }

    #scheduleNextRefresh(): void {
        try {
            this.#logging.log("auth", "Scheduling next token refresh.");
            if (this.#visibilityService.visible() === false) return;

            // pokud je již naplánované obnovení, zrušíme ho
            if (this.#refreshingTimer !== null) {
                clearTimeout(this.#refreshingTimer);
                this.#refreshingTimer = null;
            }
            const accessToken = this.getAccessToken()!;
            if (accessToken === null) {
                this.refresh();
            }
            const parsedAccessToken = jwtDecode(accessToken);

            // if the token is non-expiring, there is no point in planning for renewal
            if (parsedAccessToken.exp !== undefined) {
                const remainingValidity = (parsedAccessToken.exp * 1000) - Date.now();

                // at the earliest after 5 seconds, but at the latest 15 seconds before expiration
                const refreshTime = Math.max(5_000, remainingValidity - 15_000);
                this.#logging.log("auth", `Next token refresh in ${refreshTime / 1000} s.`);
                this.#refreshingTimer = setTimeout(() => {
                    this.refresh();
                }, refreshTime);
            }
            // if the token is corrupted, log out the user
            // should not occur if the token is issued by the api server
        } catch (err) {
            this.logout();
        }
    }

    #handleRefreshLock() {
        if (this.#canRefreshToken === true) return;
        if (this.#visibilityService.visible() === false) return;

        if (this.#lockAbortController.signal.aborted) {
            this.#lockAbortController = new AbortController();
        }
        this.#logging.log("auth", "Requesting refresh lock.");
        navigator.locks.request(LockNames.REFRESH_LOCK, { signal: this.#lockAbortController.signal }, () => {
            this.#logging.log("auth", "This window will refresh access tokens.");
            this.#canRefreshToken = true;

            if (this.isLoggedIn()) {
                this.#scheduleNextRefresh();
            } else {
                this.refresh();
            }

            return new Promise((_, r) => {
                this.#lockAbortController.signal.addEventListener("abort", () => r());
            });
        }).catch(() => {
            this.#logging.log("auth", "This window will not refresh access tokens.");
            this.#canRefreshToken = false;
            setTimeout(() => this.#handleRefreshLock(), 500);
        });
    }

    isLoggedIn(): boolean {
        const accessToken = this.getAccessToken();
        if (accessToken === null) return false;

        try {
            const parsedAccessToken = jwtDecode(accessToken);
            return parsedAccessToken.exp === undefined || parsedAccessToken.exp * 1000 > Date.now();
        } catch (err) {
            return false;
        }
    }

    getAccessToken(): string | null {
        return this.#storageService.get(StorageKeys.ACCESS_TOKEN);
    }

    getDecodedAccessToken() {
        const accessToken = this.getAccessToken();
        if (accessToken === null) return null;

        try {
            return jwtDecode(accessToken);
        } catch (err) {
            return null;
        }
    }

    getUsername(): string {
        return this.getDecodedAccessToken()!.sub!;
    }

    getScopes(): string {
        const scope = Object(this.getDecodedAccessToken())?.scope as string | undefined;

        const ss = (scope ?? "")
            .toString()
            .split(",")
            .map(s => s.trim())
            .filter(Boolean)
            .join(", ") || "undefined";

        return ss;
    }

    getRefreshToken(): string | null {
        return this.#storageService.get(StorageKeys.REFRESH_TOKEN);
    }

    getDecodedRefreshToken() {
        const refreshToken = this.getRefreshToken();
        if (refreshToken === null) return null;

        try {
            return jwtDecode(refreshToken);
        } catch (err) {
            return null;
        }
    }

    #refreshAccessTokenOnWS(): void {
        this.#logging.log("auth", "NOW SHOULD Refresh access token on WS, but it is NOT IMPLEMENTED right now.");
        // this.#logging.log("auth", "Refreshing access token on WS.", this.#socket.connected);
        // // eslint-disable-next-line @typescript-eslint/no-explicit-any
        // (this.#socket.ioSocket as any)._opts.extraHeaders["Authorization"] = `Bearer ${this.getAccessToken()}`;

        // if (this.#socket.connected) {
        //   this.#socket.emit("refresh", this.getAccessToken());
        // } else {
        //   this.#socket.connect();
        // }
    }
}
