import { TestBed } from '@angular/core/testing';
import {
    HttpClientTestingModule,
    HttpTestingController,
} from '@angular/common/http/testing';

import { StorageKeys } from 'src/app/tokens/storage.tokens';
import { EventScopesService } from './event-scopes.service';
import { EventUserScopeWithUser, labelsByGrantee } from './event-scopes.types';

/**
 * URL shape is worth pinning down: these routes are addressed by a composite
 * key (event, user, scope) with no id to get wrong, and a subtly wrong path is
 * a 404 that looks like missing data rather than a bug.
 */
describe('EventScopesService', () => {
    const BASE = 'http://api.test';
    let service: EventScopesService;
    let http: HttpTestingController;

    beforeEach(() => {
        localStorage.setItem(StorageKeys.API_URL, BASE);
        // HttpClientTestingModule alone wires HttpClient to the testing
        // controller; adding provideHttpClient() would install the real
        // backend over it and the requests would leave the test.
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [EventScopesService],
        });
        service = TestBed.inject(EventScopesService);
        http = TestBed.inject(HttpTestingController);
    });

    afterEach(() => http.verify());

    it('grants a scope at the per-scope route', () => {
        service.grant(7, 'a-uuid', 'tickets:read').subscribe();

        const req = http.expectOne(`${BASE}/events/7/scopes/a-uuid/tickets%3Aread/`);
        expect(req.request.method).toBe('PUT');
        req.flush({ event_id: 7, user_uuid: 'a-uuid', scope: 'tickets:read' });
    });

    it('revokes at the same route', () => {
        service.revoke(7, 'a-uuid', 'events:edit').subscribe();

        const req = http.expectOne(`${BASE}/events/7/scopes/a-uuid/events%3Aedit/`);
        expect(req.request.method).toBe('DELETE');
        req.flush(null);
    });

    /**
     * The backend makes `scopes` required so that a request which dropped the
     * key cannot silently revoke all of someone's access. Sending `[]` is the
     * deliberate "revoke everything"; sending no key at all is the accident it
     * guards against, so this must always include it.
     */
    it('always sends the scopes key, including when empty', () => {
        service.replace(7, 'a-uuid', []).subscribe();

        const req = http.expectOne(`${BASE}/events/7/scopes/a-uuid/`);
        expect(req.request.method).toBe('PUT');
        expect(req.request.body).toEqual({ scopes: [] });
        req.flush([]);
    });

    it('replaces with the exact list given', () => {
        service.replace(7, 'a-uuid', ['events:read', 'tickets:read']).subscribe();

        const req = http.expectOne(`${BASE}/events/7/scopes/a-uuid/`);
        expect(req.request.body).toEqual({ scopes: ['events:read', 'tickets:read'] });
        req.flush([]);
    });
});

/**
 * The grant list is the one response that has to arrive readable: an
 * event-local admin cannot resolve a UUID by any other route, so a row without
 * its grantee is a row the panel can only print as an identifier.
 */
describe('labelsByGrantee', () => {
    const GRANTEE = {
        uuid: '11111111-1111-1111-1111-111111111111',
        username: 'jnovak',
        full_name: 'Jan Novak',
        disabled: false,
    };

    function row(scope: string, user?: typeof GRANTEE): EventUserScopeWithUser {
        return {
            event_id: 7,
            user_uuid: user?.uuid ?? '22222222-2222-2222-2222-222222222222',
            scope,
            ...(user ? { user } : {}),
        };
    }

    it('names a grantee once, however many scopes they hold', () => {
        const labels = labelsByGrantee([row('events:read', GRANTEE), row('tickets:edit', GRANTEE)]);

        expect(labels.size).toBe(1);
        expect(labels.get(GRANTEE.uuid)).toBe('Jan Novak (jnovak)');
    });

    it('falls back to the username when the account has no full name', () => {
        const labels = labelsByGrantee([row('events:read', { ...GRANTEE, full_name: '' })]);

        expect(labels.get(GRANTEE.uuid)).toBe('jnovak');
    });

    /**
     * A backend predating the grantee field omits it rather than sending null.
     * Leaving such a row out is what lets the panel keep its own name for the
     * person, or show the UUID — either is better than an empty cell.
     */
    it('leaves rows the backend did not name unlabelled', () => {
        const labels = labelsByGrantee([row('events:read'), row('events:read', GRANTEE)]);

        expect(labels.size).toBe(1);
        expect(labels.has('22222222-2222-2222-2222-222222222222')).toBeFalse();
    });
});
