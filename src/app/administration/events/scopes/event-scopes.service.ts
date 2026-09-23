import { HttpClient, HttpResourceRef, httpResource } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { StorageService } from 'src/app/services/storage.service';
import { StorageKeys } from 'src/app/tokens/storage.tokens';
import { EventScope, EventUserScope } from './event-scopes.types';

/**
 * Per-event grants, i.e. who may do what on one concrete event.
 *
 * Separate from the scopes carried in the access token, which are global and
 * grant the same power on *every* event. The backend accepts either: holding
 * the global scope, or holding a grant on that one event.
 */
@Injectable({
    providedIn: 'root'
})
export class EventScopesService {
    readonly #httpClient = inject(HttpClient);
    readonly #storageService = inject(StorageService);

    readonly #apiPath = 'events';

    #endpoint(path: string): string {
        return new URL(`${this.#apiPath}${path}`, this.#storageService.get(StorageKeys.API_URL)!).href;
    }

    /**
     * Every grant on the event, one row per user per scope.
     *
     * An event with no extra grantees is an empty list, not an error, so the
     * caller only has to branch on `error()`. Reads need `events:read`, global
     * or granted for this event.
     *
     * The caller keeps the returned resource and calls `reload()` after a
     * successful write — the server validates every write against its own
     * allowlist and the self-lockout rule, so its answer is the one to show.
     */
    public scopesByEventResource(
        getEventId: () => string | number | null | undefined
    ): HttpResourceRef<EventUserScope[]> {
        return httpResource<EventUserScope[]>(() => {
            const id = getEventId();
            if (id === null || id === undefined || id === '') {
                return undefined;
            }
            return this.#endpoint(`/${id}/scopes/`);
        }, {
            defaultValue: [],
        });
    }

    /**
     * Grant one scope to one user.
     *
     * Idempotent server-side, so a request the user double-clicked cannot
     * produce a duplicate or an error.
     */
    public grant(
        eventId: string | number,
        userUuid: string,
        scope: EventScope
    ): Observable<EventUserScope> {
        return this.#httpClient.put<EventUserScope>(
            this.#scopeEndpoint(eventId, userUuid, scope),
            {}
        );
    }

    /**
     * Revoke one scope from one user; the API answers 204 with no body.
     *
     * Can return 409 when this would remove the caller's own last
     * `events:edit` grant - see `isSelfLockout`.
     */
    public revoke(
        eventId: string | number,
        userUuid: string,
        scope: EventScope
    ): Observable<void> {
        return this.#httpClient.delete<void>(
            this.#scopeEndpoint(eventId, userUuid, scope)
        );
    }

    /**
     * Set a user's scopes for the event to exactly this list.
     *
     * `scopes` is always sent, including as an empty array: the backend treats
     * a missing key as a malformed request (422) precisely so that a dropped
     * field cannot silently revoke all of someone's access. An empty array is
     * the deliberate way to say "revoke everything".
     */
    public replace(
        eventId: string | number,
        userUuid: string,
        scopes: readonly EventScope[]
    ): Observable<EventUserScope[]> {
        return this.#httpClient.put<EventUserScope[]>(
            this.#endpoint(`/${eventId}/scopes/${encodeURIComponent(userUuid)}/`),
            { scopes: [...scopes] }
        );
    }

    #scopeEndpoint(
        eventId: string | number,
        userUuid: string,
        scope: EventScope
    ): string {
        // The scope contains a colon - legal in a path segment, but encoded so
        // a request cannot change meaning if a value ever gains a reserved
        // character.
        return this.#endpoint(
            `/${eventId}/scopes/${encodeURIComponent(userUuid)}/${encodeURIComponent(scope)}/`
        );
    }
}
