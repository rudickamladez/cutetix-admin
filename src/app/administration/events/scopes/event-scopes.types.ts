/**
 * A single grant: one user may do one thing on one event.
 *
 * Mirrors `app/schemas/event_user_scope.py::EventUserScope`. There is no id —
 * the three fields together are the primary key, so a row is addressed by its
 * own contents (which is why revoking takes the scope in the path).
 */
export interface EventUserScope {
    event_id: number;
    /** UUID as text. This one is a real UUID, unlike some binary columns the API leaks as bytes. */
    user_uuid: string;
    /**
     * Scope name as the server sent it.
     *
     * A bare `string` rather than `EventScope`, because the server's allowlist
     * is the authority and can gain a scope before this build knows the name;
     * typing the response as the local union would make that case look
     * impossible here while it is perfectly possible on the wire.
     */
    scope: string;
}

/**
 * Scopes that can be granted for a single event.
 *
 * Kept in step with `EVENT_GRANTABLE_SCOPES` in the backend's
 * `app/auth_scopes.py`. The list is an allowlist there: granting a
 * global-only scope such as `users:edit` against one event is rejected with
 * 422, because it reads as "curator of this event" while meaning "edit any
 * user in the system". So adding an entry here that the backend has not
 * whitelisted produces a checkbox that always fails, silently and confusingly.
 */
export const EVENT_GRANTABLE_SCOPES = [
    'events:read',
    'events:edit',
    'ticket_groups:read',
    'ticket_groups:edit',
    'tickets:read',
    'tickets:edit',
] as const;

export type EventScope = typeof EVENT_GRANTABLE_SCOPES[number];

/** One grantee and the scopes they hold on the event currently being viewed. */
export interface EventScopeGrantee {
    user_uuid: string;
    /**
     * Scope names they hold, for O(1) checkbox state.
     *
     * Plain strings, not `EventScope`: the backend owns that allowlist and may
     * hand back a scope this build has never heard of, and such a grant must
     * still be visible to whoever needs to remove it rather than dropped for
     * not fitting a local type.
     */
    scopes: Set<string>;
}

/**
 * Column headers for the grant table, with the plain-language question each
 * scope answers. Grouped read/edit pairs so the table reads as three
 * permissions rather than six unrelated switches.
 */
export const EVENT_SCOPE_LABELS: ReadonlyArray<{
    scope: EventScope;
    label: string;
}> = [
    { scope: 'events:read', label: 'View event' },
    { scope: 'events:edit', label: 'Edit event' },
    { scope: 'ticket_groups:read', label: 'View ticket groups' },
    { scope: 'ticket_groups:edit', label: 'Edit ticket groups' },
    { scope: 'tickets:read', label: 'View tickets' },
    { scope: 'tickets:edit', label: 'Edit tickets' },
];

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Whether a grantee input names a user directly.
 *
 * The backend's scope routes take the user by UUID. Until the user search
 * endpoint exists (cutetix-backend#69) a UUID is the only identifier an
 * event-local admin can supply, so the form validates for one.
 */
export function isUuid(value: string): boolean {
    return UUID_PATTERN.test(value.trim());
}
