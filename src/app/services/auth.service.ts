import { Injectable, type OnDestroy, effect, inject, signal } from "@angular/core";
import { HttpClient, HttpErrorResponse } from "@angular/common/http";

import { jwtDecode } from "jwt-decode";
import { Observable, of, throwError, timeout, type Subscription } from "rxjs";
import { catchError, finalize, map, shareReplay } from "rxjs/operators";
// import { Socket } from "ngx-socket-io";
import { SnackbarToastrService } from './snackbar-toastr.service';

import { StorageService } from "./storage.service";
import { StorageKeys } from "../tokens/storage.tokens";
import { LoggingService } from "./logging.service";
import { LockNames } from "../tokens/lock.tokens";
import { VisibilityService } from "./visibility.service";
import { environment } from "src/environments/environment";
import { UserRegister } from "../types/auth.types";
import { Router } from "@angular/router";
// import { NgxIndexedDBService } from "ngx-indexed-db";

type TokensFromApi = {
    refresh_token: string,
    access_token: string,
}

const REFRESH_WAIT_MS = 10_000;

@Injectable({
    providedIn: "root"
})
export class AuthService implements OnDestroy {
    readonly #http = inject(HttpClient);
    readonly #toastr = inject(SnackbarToastrService);
    readonly #router = inject(Router);
    // readonly #socket = inject(Socket);
    readonly #logging = inject(LoggingService);
    readonly #storageService = inject(StorageService);
    readonly #visibilityService = inject(VisibilityService);
    // readonly #idbService = inject(NgxIndexedDBService, { optional: true });

    readonly #canGoToPrivate = signal(this.isLoggedIn());
    readonly canGoToPrivate = this.#canGoToPrivate.asReadonly();

    #canRefreshToken = false;
    #isRefreshingToken = false;
    #refreshOperation$: Observable<string> | null = null;

    #lockAbortController = new AbortController();

    #refreshingTimer: ReturnType<typeof setTimeout> | null = null;
    #loginSub?: Subscription;
    #registerSub?: Subscription;
    #refreshSub?: Subscription;
    #refreshRequestSub?: Subscription;
    #apiUrlSub?: Subscription;
    #accessTokenSub?: Subscription;

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

        // A non-owner tab asks the existing lock owner to refresh through this
        // storage event. No second Web Lock request is queued behind its lock.
        this.#refreshRequestSub = this.#storageService.storageEvent$(StorageKeys.AUTH_REFRESH_REQUEST)
            .subscribe(event => {
                if (event.currentValue && this.#canRefreshToken) {
                    this.refresh();
                }
            });

        // API_URL is shared between tabs. A change invalidates tokens issued by
        // the previously configured backend in every open tab.
        this.#apiUrlSub = this.#storageService.storageEvent$(StorageKeys.API_URL)
            .subscribe(() => this.logout(true));
        this.#accessTokenSub = this.#storageService.storageEvent$(StorageKeys.ACCESS_TOKEN)
            .subscribe(event => {
                if (!event.currentValue) {
                    this.#canGoToPrivate.set(false);
                } else if (this.isLoggedIn()) {
                    this.#canGoToPrivate.set(true);
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
        }, { allowSignalWrites: true });

        let wasAuthenticated = this.canGoToPrivate();
        effect(() => {
            const isAuthenticated = this.canGoToPrivate();
            if (!isAuthenticated && wasAuthenticated) {
                this.#router.navigate(["/login"]);
            }
            wasAuthenticated = isAuthenticated;
        });
    }

    ngOnDestroy(): void {
        this.#loginSub?.unsubscribe();
        this.#refreshRequestSub?.unsubscribe();
        this.#apiUrlSub?.unsubscribe();
        this.#accessTokenSub?.unsubscribe();
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
                this.#logging.error("auth", "User register failed.", err);
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
                this.#logging.error("auth", "User login failed.", err);
                if (err.error.detail) {
                    this.#toastr.error(
                        err.error.detail,
                        "Login"
                    );
                    return;
                }
                this.#toastr.error(
                    err.message,
                    "Login"
                );
            }
        });
    }

    refresh(): void {
        this.#logging.log("auth", "Initiating refreshing of access token.");
        if (!this.#canRefreshToken || !this.#visibilityService.visible()) return;
        if (this.#isRefreshingToken) return;

        if (!this.getRefreshToken()) {
            this.logout(true);
            return;
        }

        this.#refreshSub = this.#startRefresh().subscribe({
            error: () => undefined,
        });
    }

    /**
     * Refreshes for an HTTP 401 using the tab that already owns REFRESH_LOCK.
     * The operation is shared with scheduled refreshes in this tab. Other tabs
     * signal the lock owner and wait for the shared access-token storage event.
     */
    refreshForUnauthorizedRequest(failedAccessToken: string): Observable<string> {
        const currentAccessToken = this.getAccessToken();
        if (currentAccessToken && currentAccessToken !== failedAccessToken) {
            return of(currentAccessToken);
        }

        if (this.#refreshOperation$) {
            return this.#refreshOperation$;
        }

        if (!this.getRefreshToken()) {
            this.logout(true);
            return throwError(() => new Error("No refresh token is available."));
        }

        if (this.#canRefreshToken && this.#visibilityService.visible()) {
            return this.#startRefresh();
        }

        return this.#waitForRefreshFromLockOwner(failedAccessToken);
    }

    #startRefresh(): Observable<string> {
        if (this.#refreshOperation$) return this.#refreshOperation$;

        const refreshToken = this.getRefreshToken();
        const apiUrl = this.#storageService.get(StorageKeys.API_URL);
        if (!refreshToken || !apiUrl) {
            this.logout(true);
            return throwError(() => new Error("Refresh credentials or API URL are unavailable."));
        }

        const refreshUrl = new URL("auth/refresh", apiUrl).href;
        const accessTokenPayload = Object(this.getDecodedAccessToken());
        this.#logging.log("auth", "Refreshing of access token.");
        this.#isRefreshingToken = true;

        const operation$ = this.#http.post<TokensFromApi>(
            refreshUrl,
            {
                refresh_token: refreshToken,
                requested_scopes: accessTokenPayload.scope || null,
            },
        ).pipe(
            map(({ refresh_token, access_token }) => {
                // The API may have changed while this request was in flight.
                // Never persist credentials issued by the previous API.
                if (this.#storageService.get(StorageKeys.API_URL) !== apiUrl) {
                    throw new Error("API URL changed while refreshing credentials.");
                }

                this.#logging.log("auth", "Access token was refreshed.");
                this.#storageService
                    .set(StorageKeys.ACCESS_TOKEN, access_token)
                    .set(StorageKeys.REFRESH_TOKEN, refresh_token);
                this.#canGoToPrivate.set(true);
                this.#scheduleNextRefresh();
                return access_token;
            }),
            catchError((err: unknown) => {
                this.#logging.error("auth", "Error while refreshing token.", err);

                // Rejected/invalid refresh credentials are definitive. Clear
                // locally without making another request to the failed backend.
                if (err instanceof HttpErrorResponse && [400, 401, 403].includes(err.status)) {
                    this.logout(true);
                } else if (this.#storageService.get(StorageKeys.API_URL) === apiUrl) {
                    // Network/server failures preserve the session and retry on
                    // the existing schedule; callers receive this error now.
                    this.#scheduleNextRefresh();
                }

                return throwError(() => err);
            }),
            finalize(() => {
                this.#isRefreshingToken = false;
                this.#refreshOperation$ = null;
            }),
            shareReplay({ bufferSize: 1, refCount: false }),
        );

        this.#refreshOperation$ = operation$;
        return operation$;
    }

    #waitForRefreshFromLockOwner(failedAccessToken: string): Observable<string> {
        return new Observable<string>(subscriber => {
            const timeoutId = setTimeout(() => {
                subscriber.error(new Error("Timed out waiting for another tab to refresh the access token."));
            }, REFRESH_WAIT_MS);

            const accessTokenSub = this.#storageService.storageEvent$(StorageKeys.ACCESS_TOKEN)
                .subscribe(event => {
                    if (event.currentValue === failedAccessToken) return;
                    if (event.currentValue) {
                        subscriber.next(event.currentValue);
                        subscriber.complete();
                    } else {
                        subscriber.error(new Error("Authentication ended while waiting for token refresh."));
                    }
                });

            // Subscribe to storage changes before checking state or signaling,
            // so a token update cannot be missed in the cross-tab race window.
            const currentAccessToken = this.getAccessToken();
            if (currentAccessToken !== failedAccessToken) {
                if (currentAccessToken) {
                    subscriber.next(currentAccessToken);
                    subscriber.complete();
                } else {
                    subscriber.error(new Error("Authentication ended while waiting for token refresh."));
                }
            } else {
                this.#storageService.set(
                    StorageKeys.AUTH_REFRESH_REQUEST,
                    `${Date.now()}-${Math.random().toString(36).slice(2)}`,
                );
            }

            return () => {
                clearTimeout(timeoutId);
                accessTokenSub.unsubscribe();
            };
        });
    }

    logout(skipBackendRequest = false): void {
        const logoutLogic = () => {
            this.#storageService
                .delete(StorageKeys.ACCESS_TOKEN)
                .delete(StorageKeys.REFRESH_TOKEN);
            this.#canGoToPrivate.set(false);
        };

        if (skipBackendRequest) {
            this.#loginSub?.unsubscribe();
            this.#registerSub?.unsubscribe();
            this.#refreshSub?.unsubscribe();
            this.#isRefreshingToken = false;
            if (this.#refreshingTimer !== null) {
                clearTimeout(this.#refreshingTimer);
                this.#refreshingTimer = null;
            }
            logoutLogic();
            return;
        }

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
            {}
        ).pipe(
            timeout(1000)
        ).subscribe({
            next: () => {
                this.#logging.log("auth", "User logged out successfully.");
                this.#toastr.success(
                    "You have been logged out.",
                    "Logout",
                );
                logoutLogic();
            },
            error: (err: HttpErrorResponse) => {
                this.#logging.error("auth", "User logout failed.", err);
                this.#toastr.error(
                    `Logout request failed. You might still be logged in on the server. Error: ${err.message}`,
                    "Logout",
                );
                logoutLogic();
            },
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
            const accessToken = this.getAccessToken();
            if (accessToken === null) {
                this.refresh();
                return;
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
            this.logout(true);
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
        return this.getScopesList().join(", ") || "undefined";
    }

    getScopesList(): string[] {
        const scope = Object(this.getDecodedAccessToken())?.scope as string | undefined;

        return (scope ?? "")
            .toString()
            .split(/[,\s]+/)
            .map(s => s.trim())
            .filter(Boolean);
    }

    hasScope(scope: string): boolean {
        return this.getScopesList().includes(scope);
    }

    hasAnyScope(...scopes: string[]): boolean {
        if (scopes.length === 0) {
            return false;
        }

        const availableScopes = this.getScopesList();
        return scopes.some(scope => availableScopes.includes(scope));
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
