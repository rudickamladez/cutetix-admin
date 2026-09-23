import { HttpErrorResponse } from '@angular/common/http';
import { errorText, isForbidden, isSelfLockout } from './errorText';

/**
 * The cases that matter are the ones where the naive `err.message` was wrong:
 * the API's explanation lives in `error.detail`, and a body-validation failure
 * is a list rather than a string.
 */
describe('errorText', () => {
    function httpError(status: number, error: unknown, statusText = ''): HttpErrorResponse {
        return new HttpErrorResponse({ status, error, statusText });
    }

    it('prefers the API explanation over the transport message', () => {
        const err = httpError(403, { detail: "Not enough permissions for event 7 (missing 'tickets:read')" });
        expect(errorText(err)).toBe("Not enough permissions for event 7 (missing 'tickets:read')");
    });

    it('flattens a body-validation list into one line per problem', () => {
        const err = httpError(422, {
            detail: [
                { loc: ['body', 'scopes'], msg: 'Field required', type: 'missing' },
                { loc: ['body', 'scopes', 0], msg: 'String should have at least 1 character', type: 'string_too_short' },
            ],
        });
        expect(errorText(err)).toBe(
            'scopes: Field required\nscopes.0: String should have at least 1 character'
        );
    });

    it('keeps an unrecognised response readable', () => {
        expect(errorText(httpError(422, { detail: [] }, 'Unprocessable Content'))).toBe('Unprocessable Content');
        expect(errorText(httpError(500, 'Internal Server Error'))).toBe('Internal Server Error');
    });

    it('falls back to the status when there is nothing else', () => {
        expect(errorText(httpError(503, null))).toBe('HTTP error 503');
    });

    it('handles a plain Error and a bare string', () => {
        expect(errorText(new Error('offline'))).toBe('offline');
        expect(errorText('cancelled')).toBe('cancelled');
    });

    it('never returns empty for a falsy input', () => {
        expect(errorText(undefined).length).toBeGreaterThan(0);
    });
});

describe('permission predicates', () => {
    it('recognises a refusal to act', () => {
        expect(isForbidden(new HttpErrorResponse({ status: 403 }))).toBeTrue();
        expect(isForbidden(new HttpErrorResponse({ status: 401 }))).toBeFalse();
        expect(isForbidden(new Error('nope'))).toBeFalse();
    });

    it('recognises the self-lockout refusal, which is not a plain error', () => {
        expect(isSelfLockout(new HttpErrorResponse({ status: 409 }))).toBeTrue();
        expect(isSelfLockout(new HttpErrorResponse({ status: 403 }))).toBeFalse();
    });
});
