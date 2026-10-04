import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { FontAwesomeModule, IconDefinition } from '@fortawesome/angular-fontawesome';
import { faCalendar, faClock, faEye, faPen, faTicket, faTrash, faFloppyDisk, faCircleNotch } from '@fortawesome/free-solid-svg-icons';
import { catchError, debounceTime, distinctUntilChanged, map, of, switchMap, tap } from 'rxjs';
import { EventPermissionsService } from 'src/app/services/event-permissions.service';
import { SnackbarToastrService } from 'src/app/services/snackbar-toastr.service';
import { UserSearchService } from 'src/app/services/user-search.service';
import { EVENT_SCOPES, EventScope, EventUserScope } from 'src/app/types/event-permissions.types';
import { UserSearchResult } from 'src/app/types/user-search.types';

type PermissionUser = {
  userId: string;
  identity: UserSearchResult;
  scopes: EventScope[];
  saving: boolean;
  error: string | null;
};

const PERMISSION_GROUPS: ReadonlyArray<{
  icon: IconDefinition;
  name: string;
  read: EventScope;
  edit: EventScope;
}> = [
    { icon: faCalendar, name: 'Events', read: 'events:read', edit: 'events:edit' },
    { icon: faClock, name: 'Ticket Groups', read: 'ticket_groups:read', edit: 'ticket_groups:edit' },
    { icon: faTicket, name: 'Tickets', read: 'tickets:read', edit: 'tickets:edit' },
  ];

const EDIT_SCOPE_FOR_READ: Readonly<Partial<Record<EventScope, EventScope>>> = {
  'events:read': 'events:edit',
  'ticket_groups:read': 'ticket_groups:edit',
  'tickets:read': 'tickets:edit',
};

const READ_SCOPE_FOR_EDIT: Readonly<Partial<Record<EventScope, EventScope>>> = {
  'events:edit': 'events:read',
  'ticket_groups:edit': 'ticket_groups:read',
  'tickets:edit': 'tickets:read',
};

@Component({
  selector: 'app-event-permissions',
  templateUrl: './event-permissions.component.html',
  styleUrls: ['./event-permissions.component.scss'],
  standalone: true,
  imports: [CommonModule, FontAwesomeModule, ReactiveFormsModule],
})
export class EventPermissionsComponent implements OnInit {
  readonly eventId = input.required<string>();

  readonly #eventPermissions = inject(EventPermissionsService);
  readonly #userSearch = inject(UserSearchService);
  readonly #toastr = inject(SnackbarToastrService);
  readonly #users = signal<PermissionUser[]>([]);
  readonly #searchResults = signal<UserSearchResult[]>([]);
  readonly #selectedUser = signal<UserSearchResult | null>(null);
  readonly #searching = signal(false);
  readonly #searchError = signal<string | null>(null);
  readonly #loading = signal(true);
  readonly #loadError = signal<string | null>(null);

  protected readonly users = this.#users.asReadonly();
  protected readonly selectedUser = this.#selectedUser.asReadonly();
  protected readonly searching = this.#searching.asReadonly();
  protected readonly searchError = this.#searchError.asReadonly();
  protected readonly loading = this.#loading.asReadonly();
  protected readonly loadError = this.#loadError.asReadonly();
  protected readonly permissionGroups = PERMISSION_GROUPS;
  protected readonly readIcon = faEye;
  protected readonly editIcon = faPen;
  protected readonly searchControl = new FormControl('', { nonNullable: true });
  protected readonly suggestions = computed(() => {
    const assignedUsers = new Set(this.#users().map(user => user.userId));
    return this.#searchResults().filter(user => !assignedUsers.has(user.uuid));
  });
  protected readonly deleteIcon = faTrash;
  protected readonly saveIcon = faFloppyDisk;
  protected readonly loadingIcon = faCircleNotch;

  constructor() {
    this.searchControl.valueChanges.pipe(
      tap(() => this.#selectedUser.set(null)),
      map(query => query.trim()),
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(query => {
        this.#searchError.set(null);
        if (!query) {
          this.#searching.set(false);
          return of<UserSearchResult[]>([]);
        }
        this.#searching.set(true);
        return this.#userSearch.search(query).pipe(
          catchError(error => {
            this.#searchError.set(this.#errorMessage(error));
            return of<UserSearchResult[]>([]);
          })
        );
      }),
      takeUntilDestroyed()
    ).subscribe(users => {
      this.#searching.set(false);
      this.#searchResults.set(users);
    });
  }

  ngOnInit(): void {
    this.#load();
  }

  protected selectUser(user: UserSearchResult): void {
    this.#selectedUser.set(user);
    this.#searchResults.set([]);
    this.#searchError.set(null);
    this.searchControl.setValue(user.full_name, { emitEvent: false });
  }

  protected addUser(): void {
    const user = this.#selectedUser();
    if (!user || this.#users().some(current => current.userId === user.uuid)) {
      return;
    }
    this.#users.update(users => [...users, {
      userId: user.uuid,
      identity: user,
      scopes: [],
      saving: false,
      error: null,
    }]);
    this.#selectedUser.set(null);
    this.#searchResults.set([]);
    this.searchControl.setValue('', { emitEvent: false });
  }

  protected hasScope(user: PermissionUser, scope: EventScope): boolean {
    const impliedEditScope = EDIT_SCOPE_FOR_READ[scope];
    return user.scopes.includes(scope)
      || (impliedEditScope !== undefined && user.scopes.includes(impliedEditScope));
  }

  protected updateScope(userId: string, scope: EventScope, checked: boolean): void {
    this.#users.update(users => users.map(user => {
      if (user.userId !== userId) {
        return user;
      }

      const scopes = new Set(user.scopes);
      const readScope = READ_SCOPE_FOR_EDIT[scope];
      const editScope = EDIT_SCOPE_FOR_READ[scope];
      if (checked) {
        scopes.add(scope);
        if (readScope) {
          scopes.add(readScope);
        }
      } else {
        scopes.delete(scope);
        if (editScope) {
          scopes.delete(editScope);
        }
      }
      return { ...user, scopes: this.#orderedScopes(scopes), error: null };
    }));
  }

  protected save(user: PermissionUser): void {
    if (user.scopes.length === 0) {
      return;
    }
    const userName = user.identity.full_name || user.identity.username;
    this.#setUserState(user.userId, { saving: true, error: null });
    this.#eventPermissions.replaceUserScopes(
      this.eventId(),
      user.userId,
      user.scopes
    ).subscribe({
      next: () => {
        this.#toastr.success(
          `Permissions for ${userName} were updated.`,
          'Event permissions'
        );
        this.#eventPermissions.invalidateMyScopes(this.eventId());
        this.#load();
      },
      error: error => {
        const message = this.#errorMessage(error);
        this.#setUserState(user.userId, { saving: false, error: message });
        this.#toastr.error(message, 'Event permissions');
      },
    });
  }

  protected displayName(user: PermissionUser): string {
    return user.identity.full_name || user.identity.username;
  }

  #load(): void {
    this.#loading.set(true);
    this.#loadError.set(null);
    this.#eventPermissions.getScopes(this.eventId()).subscribe({
      next: scopes => {
        this.#users.set(this.#groupByUser(scopes));
        this.#loading.set(false);
      },
      error: error => {
        this.#loadError.set(this.#errorMessage(error));
        this.#loading.set(false);
      },
    });
  }

  #groupByUser(scopes: EventUserScope[]): PermissionUser[] {
    const users = new Map<string, { scopes: Set<EventScope>; identity: UserSearchResult }>();
    for (const scope of scopes) {
      const user = users.get(scope.user_uuid) ?? {
        scopes: new Set<EventScope>(),
        identity: scope.user,
      };
      user.scopes.add(scope.scope);
      users.set(scope.user_uuid, user);
    }
    return [...users.entries()].map(([userId, user]) => ({
      userId,
      identity: user.identity,
      scopes: this.#orderedScopes(user.scopes),
      saving: false,
      error: null,
    }));
  }

  #orderedScopes(scopes: Set<EventScope>): EventScope[] {
    return EVENT_SCOPES.filter(scope => scopes.has(scope));
  }

  #setUserState(userId: string, state: Partial<PermissionUser>): void {
    this.#users.update(users => users.map(user =>
      user.userId === userId ? { ...user, ...state } : user
    ));
  }

  #errorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      return error.error?.detail ?? error.message;
    }
    return error instanceof Error ? error.message : String(error);
  }

  deleteUser(user: PermissionUser): void {
    const userName = user.identity.full_name || user.identity.username;
    this.#setUserState(user.userId, { saving: true, error: null });
    this.#eventPermissions.replaceUserScopes(
      this.eventId(),
      user.userId,
      []
    ).subscribe({
      next: () => {
        this.#toastr.success(
          `Permissions for ${userName} were deleted.`,
          'Event permissions'
        );
        this.#eventPermissions.invalidateMyScopes(this.eventId());
        this.#load();
      },
      error: error => {
        const message = this.#errorMessage(error);
        this.#setUserState(user.userId, { saving: false, error: message });
        this.#toastr.error(message, 'Event permissions');
      },
    });
  }
}
