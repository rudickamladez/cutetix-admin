import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, input, signal } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faEye, faPen, faCalendar, faTicket, IconDefinition, faClock } from '@fortawesome/free-solid-svg-icons';
import { HttpErrorResponse } from '@angular/common/http';
import { EventPermissionsService } from 'src/app/services/event-permissions.service';
import { SnackbarToastrService } from 'src/app/services/snackbar-toastr.service';
import { EVENT_SCOPES, EventScope, EventUserScope } from 'src/app/types/event-permissions.types';

type PermissionUser = {
  userId: string;
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
  imports: [CommonModule, FontAwesomeModule],
})
export class EventPermissionsComponent implements OnInit {
  readonly eventId = input.required<string>();

  readonly #eventPermissions = inject(EventPermissionsService);
  readonly #toastr = inject(SnackbarToastrService);
  readonly #users = signal<PermissionUser[]>([]);
  readonly #newUserId = signal('');
  readonly #addUserError = signal<string | null>(null);
  readonly #loading = signal(true);
  readonly #loadError = signal<string | null>(null);

  protected readonly users = this.#users.asReadonly();
  protected readonly newUserId = this.#newUserId.asReadonly();
  protected readonly addUserError = this.#addUserError.asReadonly();
  protected readonly loading = this.#loading.asReadonly();
  protected readonly loadError = this.#loadError.asReadonly();
  protected readonly permissionGroups = PERMISSION_GROUPS;
  protected readonly readIcon = faEye;
  protected readonly editIcon = faPen;

  ngOnInit(): void {
    this.#load();
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

  protected setNewUserId(userId: string): void {
    this.#newUserId.set(userId);
    this.#addUserError.set(null);
  }

  protected addUser(): void {
    const userId = this.#newUserId().trim();
    if (!userId) {
      this.#addUserError.set('Enter a user UUID.');
      return;
    }
    if (this.#users().some(user => user.userId === userId)) {
      this.#addUserError.set('This user already has local permissions for this event.');
      return;
    }

    this.#users.update(users => [...users, {
      userId,
      scopes: [],
      saving: false,
      error: null,
    }]);
    this.#newUserId.set('');
    this.#addUserError.set(null);
  }

  protected save(user: PermissionUser): void {
    this.#setUserState(user.userId, { saving: true, error: null });
    this.#eventPermissions.replaceUserScopes(
      this.eventId(),
      user.userId,
      user.scopes
    ).subscribe({
      next: scopes => {
        const savedScopes = scopes.map(scope => scope.scope);
        if (savedScopes.length === 0) {
          this.#users.update(users => users.filter(current => current.userId !== user.userId));
          return;
        }
        this.#setUserState(user.userId, {
          scopes: this.#orderedScopes(new Set(savedScopes)),
          saving: false,
          error: null,
        });
      },
      error: error => {
        const message = this.#errorMessage(error);
        this.#setUserState(user.userId, { saving: false, error: message });
        this.#toastr.error(message, 'Event permissions');
      },
    });
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
    const users = new Map<string, Set<EventScope>>();
    for (const scope of scopes) {
      const userScopes = users.get(scope.user_uuid) ?? new Set<EventScope>();
      userScopes.add(scope.scope);
      users.set(scope.user_uuid, userScopes);
    }
    return [...users.entries()].map(([userId, userScopes]) => ({
      userId,
      scopes: this.#orderedScopes(userScopes),
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
}
