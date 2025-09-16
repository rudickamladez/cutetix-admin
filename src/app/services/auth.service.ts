import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { jwtDecode } from "jwt-decode";
import { effect, inject, Injectable, signal } from "@angular/core";
import { ToastrService } from "ngx-toastr";
import { filter, Subscription } from "rxjs";
// import { Socket } from "ngx-socket-io";
import { LoggingService } from "./logging.service";
import { environment } from "src/environments/environment";
import { StorageService } from "./storage.service";
import { StorageKeys } from "../tokens/storage.tokens";
import { LockNames } from "../tokens/lock.tokens";
import { VisibilityService } from "./visibility.service";

type TokensFromApi = {
    access_token: string,
    refresh_token: string,
    token_type: string,
}

@Injectable({
    providedIn: "root"
})
export class AuthService {
    readonly #http = inject(HttpClient);
    readonly #toastr = inject(ToastrService);
    // readonly #socket = inject(Socket);
    readonly #logging = inject(LoggingService);
    readonly #storageService = inject(StorageService);
    readonly #visibilityService = inject(VisibilityService);
    // readonly #idbService = inject(NgxIndexedDBService, { optional: true });

    readonly #canGoToPrivate = signal(false);
    readonly canGoToPrivate = this.#canGoToPrivate.asReadonly();

    #canrefresh_token = false;
    #isRefreshingToken = false;

    #lockAbortController = new AbortController();

    #refreshingTimer: ReturnType<typeof setTimeout> | null = null;
    #loginSub?: Subscription;


    constructor() {
        // could not be unsubscribed, because it is provided in root
        this.#storageService.storageEvent$(StorageKeys.ACCESS_TOKEN)
            .pipe(filter(e => e.action !== "delete"))
            .subscribe({
                next: () => {
                    this.#refreshaccess_tokenOnWS();
                }
            });

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
        });
    }

    ngOnDestroy(): void {
        this.#loginSub?.unsubscribe();
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
            new URL("auth/login", environment.backend.api).href,
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
                this.#canGoToPrivate.set(true);
            },
            error: (err: HttpErrorResponse) => {
                this.#logging.log("auth", "User login failed.", err);
                console.error(err);
                this.#toastr.error(err.statusText);
            }
        });
    }



    refresh(): void {
        this.#logging.log("auth", "Initiating refreshing of access token.");
        if (!this.#canrefresh_token || this.#isRefreshingToken || !this.#visibilityService.visible()) return;

        const refresh_token = this.getrefresh_token();
        if (!refresh_token) {
            this.logout();
            return;
        }

        this.#logging.log("auth", "Refreshing of access token.");
        this.#isRefreshingToken = true;
        try {
            this.#http.post<TokensFromApi>(new URL("refresh", environment.backend.api).href, { refresh_token }).subscribe({
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

                    if (err.status === 401) {   // pokud není navázáno spojení, status erroru je 0, tj. nechceme uživatele odhlásit
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

        const refresh_token = this.getrefresh_token();
        this.#storageService.clear();

        if (!refresh_token) {
            window.location.reload();
            return;
        }
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
            const access_token = this.getaccess_token()!;
            if (access_token === null) {
                this.refresh();
            }
            const parsedaccess_token = jwtDecode(access_token);

            // if the token is non-expiring, there is no point in planning for renewal
            if (parsedaccess_token.exp !== undefined) {
                const remainingValidity = (parsedaccess_token.exp * 1000) - Date.now();

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
        if (this.#canrefresh_token === true) return;
        if (this.#visibilityService.visible() === false) return;

        if (this.#lockAbortController.signal.aborted) {
            this.#lockAbortController = new AbortController();
        }
        this.#logging.log("auth", "Requesting refresh lock.");
        navigator.locks.request(LockNames.REFRESH_LOCK, { signal: this.#lockAbortController.signal }, () => {
            this.#logging.log("auth", "This window will refresh access tokens.");
            this.#canrefresh_token = true;

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
            this.#canrefresh_token = false;
            setTimeout(() => this.#handleRefreshLock(), 500);
        });
    }

    isLoggedIn(): boolean {
        const access_token = this.getaccess_token();
        if (access_token === null) return false;

        try {
            const parsedaccess_token = jwtDecode(access_token);
            return parsedaccess_token.exp === undefined || parsedaccess_token.exp * 1000 > Date.now();
        } catch (err) {
            return false;
        }
    }

    getaccess_token(): string | null {
        return this.#storageService.get(StorageKeys.ACCESS_TOKEN);
    }

    getrefresh_token(): string | null {
        return this.#storageService.get(StorageKeys.REFRESH_TOKEN);
    }

    #refreshaccess_tokenOnWS(): void {
        this.#logging.log("auth", "NOW SHOULD Refresh access token on WS, but it is NOT IMPLEMENTED right now.");
        // this.#logging.log("auth", "Refreshing access token on WS.", this.#socket.connected);
        // // eslint-disable-next-line @typescript-eslint/no-explicit-any
        // (this.#socket.ioSocket as any)._opts.extraHeaders["Authorization"] = `Bearer ${this.getaccess_token()}`;

        // if (this.#socket.connected) {
        //     this.#socket.emit("refresh", this.getaccess_token());
        // } else {
        //     this.#socket.connect();
        // }
    }
}
