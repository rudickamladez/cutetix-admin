import { Injectable, type OnDestroy, effect, inject, signal } from "@angular/core";
import { HttpClient, type HttpErrorResponse } from "@angular/common/http";

import { jwtDecode } from "jwt-decode";
import { firstValueFrom, Subject, takeUntil, TimeoutError, timeout, type Subscription } from "rxjs";
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

    #refreshingTimer: ReturnType<typeof setTimeout> | null = null;
    #loginSub?: Subscription;
    #registerSub?: Subscription;
    #sessionRestore?: Promise<boolean>;
    #cancelRefreshRequests = new Subject<void>();
    #sessionGeneration = 0;
    #refreshRetryAfter = 0;
    #refreshLockAbortController?: AbortController;

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
                    this.#scheduleNextRefresh();
                } else if (this.getRefreshToken()) {
                    void this.#refreshWithLock();
                }
                return;
            }
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
        this.#cancelRefreshRequests.complete();
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
                this.#refreshRetryAfter = 0;

                this.#scheduleNextRefresh();

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
                this.#refreshRetryAfter = 0;

                this.#scheduleNextRefresh();

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
        void this.#refreshWithLock();
    }

    logout(skipBackendRequest = false): void {
        const wasLoggedIn = this.isLoggedIn();
        const accessToken = this.getAccessToken();
        const refreshToken = this.getRefreshToken();
        const apiUrl = this.#storageService.get(StorageKeys.API_URL);

        this.#sessionGeneration++;
        this.#sessionRestore = undefined;
        this.#refreshLockAbortController?.abort();
        this.#refreshLockAbortController = undefined;
        this.#cancelRefreshRequests.next();
        this.#loginSub?.unsubscribe();
        this.#registerSub?.unsubscribe();
        if (this.#refreshingTimer !== null) {
            clearTimeout(this.#refreshingTimer);
            this.#refreshingTimer = null;
        }
        this.#storageService
            .delete(StorageKeys.ACCESS_TOKEN)
            .delete(StorageKeys.REFRESH_TOKEN);
        this.#canGoToPrivate.set(false);

        if (skipBackendRequest || !wasLoggedIn || !refreshToken || !apiUrl) return;

        // TODO rework with navigator.sendBeacon
        this.#http.post(
            (new URL("auth/logout", apiUrl)).href,
            {},
            accessToken ? { headers: { Authorization: `Bearer ${accessToken}` } } : {},
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
                this.#toastr.error(
                    `Logout request failed. You might still be logged in on the server. Error: ${err.message}`,
                    "Logout",
                );
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
            this.logout();
        }
    }

    isTokenExpired(token: string): boolean {
        try {
            const parsedToken = jwtDecode(token);
            return parsedToken.exp !== undefined && parsedToken.exp * 1000 <= Date.now();
        } catch {
            return true;
        }
    }

    isLoggedIn(): boolean {
        const accessToken = this.getAccessToken();
        if (accessToken === null) return false;

        try {
            return !this.isTokenExpired(accessToken);
        } catch (err) {
            return false;
        }
    }

    ensureAuthenticated(): Promise<boolean> {
        if (this.isLoggedIn()) {
            this.#refreshRetryAfter = 0;
            this.#canGoToPrivate.set(true);
            return Promise.resolve(true);
        }
        if (Date.now() < this.#refreshRetryAfter) return Promise.resolve(false);
        return this.#refreshWithLock();
    }

    #refreshWithLock(): Promise<boolean> {
        if (this.#sessionRestore) return this.#sessionRestore;
        const storedRefreshToken = this.getRefreshToken();
        if (!storedRefreshToken || this.isTokenExpired(storedRefreshToken)) {
            this.#canGoToPrivate.set(false);
            return Promise.resolve(false);
        }

        const generation = this.#sessionGeneration;
        const performRefresh = async (): Promise<boolean> => {
            if (generation !== this.#sessionGeneration) return false;

            // Another tab may have refreshed while this tab waited for the lock.
            const currentAccessToken = this.getAccessToken();
            if (currentAccessToken && !this.isTokenExpired(currentAccessToken)) {
                this.#refreshRetryAfter = 0;
                this.#canGoToPrivate.set(true);
                this.#scheduleNextRefresh();
                return true;
            }

            const refreshToken = this.getRefreshToken();
            if (!refreshToken || this.isTokenExpired(refreshToken)) {
                this.#canGoToPrivate.set(false);
                return false;
            }

            try {
                const tokens = await firstValueFrom(this.#http.post<TokensFromApi>(
                    new URL("auth/refresh", this.#storageService.get(StorageKeys.API_URL)!).href,
                    {
                        refresh_token: refreshToken,
                        requested_scopes: Object(this.getDecodedAccessToken())?.scope || null,
                    },
                ).pipe(
                    timeout(10_000),
                    takeUntil(this.#cancelRefreshRequests),
                ));

                if (generation !== this.#sessionGeneration || this.getRefreshToken() !== refreshToken) {
                    return false;
                }
                this.#storageService
                    .set(StorageKeys.ACCESS_TOKEN, tokens.access_token)
                    .set(StorageKeys.REFRESH_TOKEN, tokens.refresh_token);
                this.#refreshRetryAfter = 0;
                this.#canGoToPrivate.set(true);
                this.#scheduleNextRefresh();
                this.#logging.log("auth", "Access token was refreshed.");
                return true;
            } catch (err) {
                if (generation !== this.#sessionGeneration) return false;
                this.#logging.error("auth", "Error while refreshing token.", err);
                const latestAccessToken = this.getAccessToken();
                if (latestAccessToken && !this.isTokenExpired(latestAccessToken)) {
                    this.#canGoToPrivate.set(true);
                    this.#scheduleNextRefresh();
                    return true;
                }
                if (err instanceof HttpErrorResponse && err.status !== 0 && this.getRefreshToken() === refreshToken) {
                    this.#storageService.delete(StorageKeys.REFRESH_TOKEN);
                }
                this.#refreshRetryAfter = Date.now() + 15_000;
                this.#canGoToPrivate.set(false);
                if ((err instanceof HttpErrorResponse && err.status === 0) || err instanceof TimeoutError) {
                    this.#scheduleNextRefresh();
                }
                return false;
            }
        };

        let lockTimeout: ReturnType<typeof setTimeout> | undefined;
        let lockAbortController: AbortController | undefined;
        let coordinatedRefresh: Promise<boolean>;
        if (navigator.locks) {
            lockAbortController = new AbortController();
            this.#refreshLockAbortController = lockAbortController;
            lockTimeout = setTimeout(() => lockAbortController?.abort(), 15_000);
            coordinatedRefresh = navigator.locks.request(
                LockNames.REFRESH_LOCK,
                { signal: lockAbortController.signal },
                performRefresh,
            );
        } else {
            coordinatedRefresh = performRefresh();
        }
        const sharedRefresh = Promise.resolve(coordinatedRefresh).catch(err => {
            if (generation === this.#sessionGeneration) {
                this.#logging.error("auth", "Could not acquire refresh lock.", err);
                this.#refreshRetryAfter = Date.now() + 15_000;
                this.#scheduleNextRefresh();
            }
            return false;
        }).finally(() => {
            if (lockTimeout !== undefined) clearTimeout(lockTimeout);
            if (this.#refreshLockAbortController === lockAbortController) {
                this.#refreshLockAbortController = undefined;
            }
            if (this.#sessionRestore === sharedRefresh) this.#sessionRestore = undefined;
        });
        this.#sessionRestore = sharedRefresh;
        return sharedRefresh;
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
