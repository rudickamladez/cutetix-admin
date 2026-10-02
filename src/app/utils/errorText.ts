import { HttpErrorResponse } from '@angular/common/http';

/**
 * One-line reason a request failed, fit to show the user.
 *
 * `HttpErrorResponse.message` says `Http failure response for <url>: 403
 * Forbidden`, which repeats what the UI already knows and drops the sentence
 * the API wrote. FastAPI puts that sentence in `error.detail`, so prefer it.
 */
export function errorText(err: unknown): string {
    if (err instanceof HttpErrorResponse) {
        const detail = (err.error as { detail?: unknown } | null)?.detail;

        // Plain HTTPException -> a single string.
        if (typeof detail === 'string' && detail.length > 0) {
            return detail;
        }

        // Request body validation -> array of {loc, msg, type}.
        if (Array.isArray(detail)) {
            const messages = detail.map(describeValidationError).filter(Boolean);
            if (messages.length > 0) {
                return messages.join('\n');
            }
        }

        return err.statusText || `HTTP error ${err.status}`;
    }

    return err instanceof Error ? err.message : String(err);
}

/**
 * `loc` starts with the body/query/path marker, e.g. `["body","scopes"]`;
 * dropping the first segment leaves something a user can act on.
 */
function describeValidationError(item: unknown): string {
    if (typeof item === 'string') {
        return item;
    }
    if (!item || typeof item !== 'object') {
        return '';
    }

    const { loc, msg } = item as { loc?: unknown; msg?: unknown };
    const path = Array.isArray(loc)
        ? loc.slice(1).map(String).filter(Boolean).join('.')
        : '';
    const text = typeof msg === 'string' ? msg : '';

    if (path.length > 0 && text.length > 0) {
        return `${path}: ${text}`;
    }
    return path || text;
}

/** The caller is authenticated but not allowed to do this. */
export function isForbidden(err: unknown): boolean {
    return err instanceof HttpErrorResponse && err.status === 403;
}

/**
 * The API refused a revocation that would have left the caller unable to
 * manage the event any further. See `_refuse_self_lockout` in the backend's
 * `app/routers/events.py`.
 */
export function isSelfLockout(err: unknown): boolean {
    return err instanceof HttpErrorResponse && err.status === 409;
}
