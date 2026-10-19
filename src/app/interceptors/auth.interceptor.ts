import {
    HttpInterceptorFn,
    HttpErrorResponse,
    HttpRequest,
    HttpHandlerFn,
    HttpEvent,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { StorageService } from '../services/storage.service';
import { StorageKeys } from '../tokens/storage.tokens';

const SKIP_AUTH_HEADER = 'X-Skip-Auth';
const SKIP_REFRESH_HEADER = 'X-Skip-Refresh';

type AuthEndpoint = 'login' | 'register' | 'refresh' | 'logout';

export const authInterceptor: HttpInterceptorFn =
    (req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> => {
        // Resolve dependencies synchronously, while Angular's injection context is active.
        const auth = inject(AuthService);
        const storage = inject(StorageService);
        const apiUrl = storage.get(StorageKeys.API_URL);
        const apiRequest = isWithinApiBase(req.url, apiUrl);
        const authEndpoint = apiRequest ? getAuthEndpoint(req.url, apiUrl) : null;
        const skipAuth = req.headers.has(SKIP_AUTH_HEADER);
        const skipRefresh = req.headers.has(SKIP_REFRESH_HEADER);

        let request = req.clone({
            headers: req.headers
                .delete(SKIP_AUTH_HEADER)
                .delete(SKIP_REFRESH_HEADER),
        });

        let attachedAccessToken: string | null = null;
        const shouldAttachAuth = authEndpoint === null || authEndpoint === 'logout';
        if (apiRequest && shouldAttachAuth && !skipAuth) {
            attachedAccessToken = auth.getAccessToken();
            if (attachedAccessToken) {
                request = addAuthHeader(request, attachedAccessToken);
            }
        }

        return next(request).pipe(
            catchError((err: unknown) => {
                // Auth endpoints and non-API URLs must never start an automatic refresh.
                if (
                    !(err instanceof HttpErrorResponse) ||
                    err.status !== 401 ||
                    !apiRequest ||
                    authEndpoint !== null ||
                    skipRefresh ||
                    !attachedAccessToken ||
                    storage.get(StorageKeys.API_URL) !== apiUrl ||
                    !isWithinApiBase(request.url, storage.get(StorageKeys.API_URL))
                ) {
                    return throwError(() => err);
                }

                return auth.refreshForUnauthorizedRequest(attachedAccessToken).pipe(
                    switchMap((newToken) => {
                        // The configured API may have changed while refresh was in flight.
                        // Do not retry an old URL or attach credentials from the new session.
                        if (
                            storage.get(StorageKeys.API_URL) !== apiUrl ||
                            !isWithinApiBase(request.url, storage.get(StorageKeys.API_URL)) ||
                            auth.getAccessToken() !== newToken
                        ) {
                            return throwError(() => err);
                        }

                        // Calling next() retries only downstream interceptors; this request is
                        // therefore attempted at most once after refresh.
                        return next(addAuthHeader(request, newToken));
                    }),
                );
            }),
        );
    };

function addAuthHeader(req: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
    return req.clone({ headers: req.headers.set('Authorization', `Bearer ${token}`) });
}

function isWithinApiBase(requestUrl: string, apiUrl: string | null): boolean {
    if (!apiUrl) return false;

    try {
        const base = new URL(apiUrl, window.location.origin);
        const request = new URL(requestUrl, window.location.origin);
        if (base.origin !== request.origin) return false;

        const baseSegments = pathSegments(base.pathname);
        const requestSegments = pathSegments(request.pathname);
        return baseSegments.every((segment, index) => requestSegments[index] === segment);
    } catch {
        return false;
    }
}

function getAuthEndpoint(requestUrl: string, apiUrl: string | null): AuthEndpoint | null {
    if (!apiUrl || !isWithinApiBase(requestUrl, apiUrl)) return null;

    try {
        const base = new URL(apiUrl, window.location.origin);
        const request = new URL(requestUrl, window.location.origin);
        const baseSegments = pathSegments(base.pathname);
        const requestSegments = pathSegments(request.pathname);
        if (requestSegments.length !== baseSegments.length + 2) return null;

        const [authSegment, endpoint] = requestSegments.slice(baseSegments.length);
        if (authSegment !== 'auth') return null;
        if (endpoint === 'login' || endpoint === 'register' || endpoint === 'refresh' || endpoint === 'logout') {
            return endpoint;
        }
        return null;
    } catch {
        return null;
    }
}

function pathSegments(pathname: string): string[] {
    return pathname.split('/').filter(Boolean);
}
