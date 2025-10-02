import {
    HttpInterceptorFn,
    HttpErrorResponse,
    HttpRequest,
    HttpHandlerFn,
    HttpEvent
} from '@angular/common/http';
import { inject } from '@angular/core';
import { BehaviorSubject, Observable, throwError, of, timeout } from 'rxjs';
import { catchError, filter, map, switchMap, take } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { StorageService } from '../services/storage.service';
import { StorageKeys } from '../tokens/storage.tokens';

const SKIP_AUTH_HEADER = 'X-Skip-Auth';
const SKIP_REFRESH_HEADER = 'X-Skip-Refresh';

let refreshInProgress = false;
const refreshToken$ = new BehaviorSubject<string | null>(null);

// bezpečný limit, ať to nevisí navždy (můžeš upravit)
const REFRESH_WAIT_MS = 10_000;

export const authInterceptor: HttpInterceptorFn =
    (req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> => {
        const auth = inject(AuthService);

        let request = req;

        // Přidej Authorization, pokud není výslovně zakázáno
        if (!req.headers.has(SKIP_AUTH_HEADER)) {
            const accessToken = auth.getAccessToken();
            if (accessToken) {
                request = addAuthHeader(req, accessToken);
            }
        } else {
            // odstraň marker, ať neleze ven
            request = req.clone({ headers: req.headers.delete(SKIP_AUTH_HEADER) });
        }

        return next(request).pipe(
            catchError(err => {
                if (err instanceof HttpErrorResponse && err.status === 401 && !request.headers.has(SKIP_REFRESH_HEADER)) {
                    return handle401(request, next);
                }
                return throwError(() => err);
            })
        );
    };

function handle401(originalReq: HttpRequest<any>, next: HttpHandlerFn): Observable<HttpEvent<any>> {
    const auth = inject(AuthService);
    const storage = inject(StorageService);

    const previousToken = auth.getAccessToken();

    // Pokud už někdo refresuje (v tomto okně), jen počkáme na výsledek
    if (refreshInProgress) {
        return refreshToken$.pipe(
            filter((t): t is string => t !== null),
            take(1),
            switchMap((newToken) => next(addAuthHeader(originalReq, newToken)))
        );
    }

    refreshInProgress = true;
    refreshToken$.next(null);

    // Vyvolej refresh v tomto okně (může být no-op, pokud nemáme lock; v tom případě počkáme na event ze "správného" okna)
    auth.refresh();

    return waitForAccessTokenChange$(storage, previousToken).pipe(
        switchMap((newToken) => {
            refreshInProgress = false;
            refreshToken$.next(newToken);
            return next(addAuthHeader(originalReq, newToken));
        }),
        catchError(err => {
            refreshInProgress = false;
            refreshToken$.next(null);
            return throwError(() => err);
        })
    );
}

/**
 * Čeká na událost změny ACCESS_TOKEN v localStorage, která má neprázdnou hodnotu
 * a liší se od previousToken. Má timeout, aby to neskončilo ve visu.
 */
function waitForAccessTokenChange$(
    storage: StorageService,
    previousToken: string | null
): Observable<string> {
    return storage.storageEvent$(StorageKeys.ACCESS_TOKEN).pipe(
        map(e => e.currentValue),                 // bereme novou hodnotu
        filter((v): v is string => !!v && v !== previousToken),
        take(1),
        timeout({ first: REFRESH_WAIT_MS })
    );
}

function addAuthHeader(req: HttpRequest<any>, token: string) {
    const headers = req.headers
        .delete(SKIP_REFRESH_HEADER) // nešířit marker dál
        .set('Authorization', `Bearer ${token}`);
    return req.clone({ headers });
}
