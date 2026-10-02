import { HttpClient, HttpResourceRef, httpResource } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { StorageService } from 'src/app/services/storage.service';
import { StorageKeys } from 'src/app/tokens/storage.tokens';
import { UserSearchResult } from './users.types';

/** Below this the backend answers 422; searching feels broken, so do not ask. */
export const USER_SEARCH_MIN_LENGTH = 3;

/**
 * Read-only user search, built for the scope-grant picker.
 *
 * Separate from `UserService` on purpose: `GET /users/` needs the global
 * `users:read` scope, which an event-local admin never has, while this needs
 * only `events:edit` on at least one event — the person this picker exists for.
 * It returns a projection (uuid, username, full_name, disabled) rather than the
 * full user record, and e-mail matching is exact so it cannot be used to walk
 * the address book.
 */
@Injectable({
    providedIn: 'root'
})
export class UserSearchService {
    readonly #httpClient = inject(HttpClient);
    readonly #storageService = inject(StorageService);

    readonly #apiPath = 'users';

    #endpoint(path: string): string {
        return new URL(`${this.#apiPath}${path}`, this.#storageService.get(StorageKeys.API_URL)!).href;
    }

    /**
     * Users matching the term produced by `getQuery`, or nothing while it
     * yields a short/blank term. The backend matches the e-mail exactly or the
     * username as a prefix, caps results at 20, and answers `[]` on a miss.
     */
    public searchResource(
        getQuery: () => string | null | undefined
    ): HttpResourceRef<UserSearchResult[]> {
        return httpResource<UserSearchResult[]>(() => {
            const q = getQuery()?.trim();
            if (q === undefined || q === null || q.length < USER_SEARCH_MIN_LENGTH) {
                return undefined;
            }
            return {
                url: this.#endpoint('/search/'),
                params: { q },
            };
        }, {
            defaultValue: [],
        });
    }
}
