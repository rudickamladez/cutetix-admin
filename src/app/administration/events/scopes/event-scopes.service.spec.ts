import { TestBed } from '@angular/core/testing';
import {
    HttpClientTestingModule,
    HttpTestingController,
} from '@angular/common/http/testing';

import { StorageKeys } from 'src/app/tokens/storage.tokens';
import { EventScopesService } from './event-scopes.service';

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
