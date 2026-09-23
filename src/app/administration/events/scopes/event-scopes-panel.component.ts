import { Component, computed, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { ToastrService } from 'ngx-toastr';

import { AuthService } from 'src/app/services/auth.service';
import { UsersService } from 'src/app/services/users.service';
import { errorText, isForbidden, isSelfLockout } from 'src/app/utils/errorText';
import {
    USER_SEARCH_MIN_LENGTH,
    UserSearchService,
} from '../../users/user-search.service';
import { UserSearchResult } from '../../users/users.types';
import { EventScopesService } from './event-scopes.service';
import {
    EVENT_GRANTABLE_SCOPES,
    EVENT_SCOPE_LABELS,
    EventScope,
    EventScopeGrantee,
    isUuid,
} from './event-scopes.types';

/** What the Add row currently points at. */
type SelectedGrantee = {
    uuid: string;
    label: string;
    disabled: boolean;
};

/**
 * Own grants without which this panel stops working: `events:edit` for its
 * writes, `events:read` for its grant list.
 */
const PANEL_ESSENTIAL_SCOPES = ['events:edit', 'events:read'] as const;

/**
 * Who holds which permissions on one event, and controls to change it.
 *
 * Grants here apply to this event only. They are a second, independent way to
 * be allowed in: the backend lets a caller through if they hold the scope in
 * their access token (which applies to every event) *or* here (this event
 * only). So someone listed here needs no global scopes to do the job.
 */
@Component({
    selector: 'app-event-scopes-panel',
    standalone: true,
    imports: [FormsModule],
    templateUrl: './event-scopes-panel.component.html',
    styleUrls: ['./event-scopes-panel.component.scss'],
})
export class EventScopesPanelComponent {
    readonly event_id = input.required<string>();

    readonly #eventScopes = inject(EventScopesService);
    readonly #auth = inject(AuthService);
    readonly #currentUser = inject(UsersService);
    readonly #userSearch = inject(UserSearchService);
    readonly #toastr = inject(ToastrService);

    protected readonly scopeColumns = EVENT_SCOPE_LABELS;
    protected readonly scopeChoices = EVENT_GRANTABLE_SCOPES;
    protected readonly minSearchLength = USER_SEARCH_MIN_LENGTH;

    protected readonly scopes = this.#eventScopes.scopesByEventResource(() => this.event_id());

    /**
     * The picker's search term, and the results for it.
     *
     * A signal rather than a two-bound `ngModel` property: `searchResource`
     * reads it to build its URL, which is what makes the search reactive. The
     * template binds `ngModel` with a one-way read plus an explicit handler, so
     * typing is the only thing that writes here.
     */
    readonly #term = signal('');
    protected readonly term = this.#term.asReadonly();
    protected readonly results = this.#userSearch.searchResource(this.#term);

    /** Picked out of `results`, or typed directly as a UUID. */
    readonly #selected = signal<SelectedGrantee | null>(null);
    protected readonly selected = this.#selected.asReadonly();

    protected readonly newScope = signal<EventScope>('events:read');

    /** A write is in flight; disables the controls until the answer lands. */
    readonly #busy = signal(false);
    protected readonly busy = this.#busy.asReadonly();

    // ---------------------------------------------------------------- state

    /**
     * Grantees are read through these computeds rather than stored in state:
     * the template reads them, so the signals' own notification is what
     * refreshes the view — no change-detection nudging needed.
     */
    protected readonly grantees = computed(() => this.buildGrantees());

    protected readonly unknownScopes = computed(() => this.buildUnknownScopes());

    /**
     * Whether this event's grants may be changed from here.
     *
     * Needs `events:edit`, held globally or granted for this event. When the
     * grant list itself cannot be read there is no way to tell either way —
     * event-local grants are not in the access token — so the controls are
     * shown and the server's answer decides, exactly as the backend's own docs
     * require ("the frontend must show these buttons unconditionally — it
     * cannot know whether the user can manage a given event"). Hiding them on
     * an unreadable list instead would strand a holder of local `events:edit`
     * with no way to grant themselves the `events:read` the list needs.
     */
    protected readonly canManage = computed(() => {
        if (this.#auth.hasScope('events:edit')) {
            return true;
        }
        if (this.scopes.error()) {
            return true;
        }
        const mine = this.myUuid();
        if (mine === undefined) {
            return false;
        }
        return this.scopes.value().some(
            row => row.user_uuid === mine && row.scope === 'events:edit'
        );
    });

    private buildGrantees(): EventScopeGrantee[] {
        const byUser = new Map<string, Set<string>>();
        for (const row of this.scopes.value()) {
            const held = byUser.get(row.user_uuid) ?? new Set<string>();
            held.add(row.scope);
            byUser.set(row.user_uuid, held);
        }
        return [...byUser.entries()]
            .map(([user_uuid, scopes]) => ({ user_uuid, scopes }))
            // Own row first, then by display name, so the table is predictable
            // rather than following whatever order the API returned.
            .sort((a, b) => {
                if (this.isMe(a.user_uuid) !== this.isMe(b.user_uuid)) {
                    return this.isMe(a.user_uuid) ? -1 : 1;
                }
                return this.displayName(a.user_uuid).localeCompare(this.displayName(b.user_uuid));
            });
    }

    /**
     * Grants on this event whose scope this build does not know about.
     *
     * The backend owns that allowlist and can gain a scope before this app
     * does. Listing them keeps such a grant from being invisible to the person
     * who needs to remove it.
     */
    private buildUnknownScopes(): string[] {
        const known: readonly string[] = EVENT_GRANTABLE_SCOPES;
        const found = new Set<string>();
        for (const row of this.scopes.value()) {
            if (!known.includes(row.scope)) {
                found.add(row.scope);
            }
        }
        return [...found].sort();
    }

    // --------------------------------------------------------------- naming

    protected myUuid(): string | undefined {
        return this.#currentUser.user.value()?.uuid;
    }

    protected isMe(userUuid: string): boolean {
        const mine = this.myUuid();
        return mine !== undefined && mine === userUuid;
    }

    /**
     * Names learned while using this panel, keyed by uuid.
     *
     * Every grantee the table can name was picked out of a search result to be
     * added, and that result is transient — the picker is cleared after a
     * grant, and a later search replaces it. Without remembering the name here
     * the row would fall back to a raw UUID for the person you just added.
     *
     * There is no uuid→name lookup to fall back on: the search endpoint takes a
     * term rather than an id, and the full user list needs a scope this panel's
     * main users do not have. So anybody granted by someone else before this
     * page was opened can only be shown as their UUID, and that is the honest
     * answer rather than a gap to paper over.
     */
    readonly #labels = new Map<string, string>();

    protected displayName(userUuid: string): string {
        if (this.isMe(userUuid)) {
            return 'you';
        }
        return this.#labels.get(userUuid) ?? userUuid;
    }

    /** How a user found in search results is written, in the list and in the table. */
    protected labelFor(user: UserSearchResult): string {
        return user.full_name ? `${user.full_name} (${user.username})` : user.username;
    }

    // ----------------------------------------------------------- the toggle

    protected held(userUuid: string, scope: string): boolean {
        return this.grantees().find(g => g.user_uuid === userUuid)?.scopes.has(scope) ?? false;
    }

    /**
     * Revoking this box would leave the caller unable to use this panel.
     *
     * Two ways to lose the panel outright, one the backend enforces and one it
     * does not:
     *
     * - `events:edit` is what every write here needs, and the backend refuses
     *   to remove a local admin's last one (409) — nothing they can still reach
     *   can mint it back.
     * - `events:read` is what the grant list needs. The backend does *not*
     *   guard this one, so unchecking it succeeds, the list starts answering
     *   403, and putting it back means granting a scope to yourself by UUID
     *   without being able to see the table.
     *
     * Both are disabled up front instead of being discovered by hitting them. A
     * holder of the equivalent *global* scope always keeps a way back in, so
     * their box stays usable.
     */
    protected lockoutProtected(userUuid: string, scope: string): boolean {
        if (!PANEL_ESSENTIAL_SCOPES.includes(scope as (typeof PANEL_ESSENTIAL_SCOPES)[number])) {
            return false;
        }
        return this.isMe(userUuid)
            && !this.#auth.hasScope(scope)
            && this.held(userUuid, scope);
    }

    protected lockoutHint(userUuid: string, scope: string): string {
        if (!this.lockoutProtected(userUuid, scope)) {
            return '';
        }
        const job = scope === 'events:edit'
            ? 'change this event\'s permissions'
            : 'see this event\'s permissions';
        return `This is your last way to ${job}. `
            + `Have someone with the global ${scope} scope revoke it for you instead.`;
    }

    protected toggle(userUuid: string, scope: EventScope, wantGranted: boolean): void {
        if (this.lockoutProtected(userUuid, scope) && !wantGranted) {
            return;
        }
        const call = wantGranted
            ? this.#eventScopes.grant(this.event_id(), userUuid, scope)
            : this.#eventScopes.revoke(this.event_id(), userUuid, scope);
        this.#write(call, wantGranted ? `Granted ${scope}.` : `Revoked ${scope}.`);
    }

    protected revokeAll(grantee: EventScopeGrantee): void {
        if (!confirm(`Remove all of ${this.displayName(grantee.user_uuid)}'s permissions for this event?`)) {
            return;
        }
        this.#write(
            this.#eventScopes.replace(this.event_id(), grantee.user_uuid, []),
            'All permissions removed.'
        );
    }

    // ---------------------------------------------------------- the add row

    protected onTermChange(value: string): void {
        this.#term.set(value);
        // A new search invalidates whatever was picked from the last one.
        this.#selected.set(null);
    }

    /**
     * Choose a user from the results.
     *
     * Leaves the term exactly as typed: rewriting it to the chosen name would
     * start a new search that matches nobody, and the list would contradict the
     * selection. The picked user is confirmed underneath instead.
     */
    protected pick(user: UserSearchResult): void {
        const label = this.labelFor(user);
        this.#labels.set(user.uuid, label);
        this.#selected.set({ uuid: user.uuid, label, disabled: user.disabled });
    }

    protected get searchTooShort(): boolean {
        return this.term().trim().length < USER_SEARCH_MIN_LENGTH;
    }

    /**
     * The search endpoint refused this caller (it needs `events:edit`
     * somewhere). Only the result list is hidden — this same input is also the
     * UUID paste field, the escape hatch the denial hint promises, so it must
     * stay usable.
     */
    protected get searchDenied(): boolean {
        return isForbidden(this.results.error());
    }

    /**
     * A typed term is usable when it is a UUID.
     *
     * The escape hatch for the cases search cannot cover: a person with a
     * two-character name, or a grant the organiser wants to prepare before the
     * other side has registered. `PUT` rejects a uuid that names no user, so a
     * wrong one fails loudly rather than creating a dangling grant.
     */
    protected typedUuid(): string | undefined {
        const raw = this.term().trim();
        return isUuid(raw) ? raw : undefined;
    }

    protected chosenGrantee(): SelectedGrantee | null {
        const typed = this.typedUuid();
        if (this.#selected() !== null) {
            return this.#selected();
        }
        return typed ? { uuid: typed, label: typed, disabled: false } : null;
    }

    /** Why Add is unavailable, or empty when it is available. */
    protected addProblem(): string {
        if (this.busy()) {
            return 'Waiting for the previous change.';
        }
        const grantee = this.chosenGrantee();
        if (grantee === null) {
            return this.searchTooShort
                ? `Type at least ${USER_SEARCH_MIN_LENGTH} characters, or paste a user ID.`
                : 'Pick a user from the list.';
        }
        if (grantee.disabled) {
            return 'That account is disabled. Enable it before granting it anything.';
        }
        return '';
    }

    protected canAdd(): boolean {
        return this.addProblem().length === 0;
    }

    protected addGrantee(): void {
        const grantee = this.chosenGrantee();
        if (grantee === null || !this.canAdd()) {
            return;
        }
        const scope = this.newScope();
        this.#write(
            this.#eventScopes.grant(this.event_id(), grantee.uuid, scope),
            `${scope} granted to ${grantee.label}.`
        );
        this.resetAddRow();
    }

    private resetAddRow(): void {
        this.#term.set('');
        this.#selected.set(null);
        this.newScope.set('events:read');
    }

    // ------------------------------------------------------------- writing

    /**
     * Run a write, then let the server's answer redraw the table.
     *
     * No box is flipped locally first: the API applies its own checks (scope
     * allowlist, the lockout rule, whether the user exists) and reloading is the
     * only way to show its result rather than our guess at it.
     */
    #write(call: Observable<unknown>, successMessage: string): void {
        this.#busy.set(true);
        call.subscribe({
            next: () => {
                this.#busy.set(false);
                this.#toastr.info(successMessage, 'Permissions', { progressBar: true });
                this.scopes.reload();
            },
            error: (err: unknown) => {
                this.#busy.set(false);
                this.#toastr.error(
                    errorText(err),
                    isSelfLockout(err) ? 'Refused' : 'Permissions',
                    { progressBar: true }
                );
                // Resync even on failure: the rejection may still have changed
                // what other people see, and our copy is now suspect.
                this.scopes.reload();
            },
        });
    }

    // -------------------------------------------------------------- display

    protected readDenied(): boolean {
        return isForbidden(this.scopes.error());
    }

    protected errorText(err: unknown): string {
        return errorText(err);
    }

}
