import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { EventService } from '../events.service';
import { Event } from '../events.types';
import { faPen, faStar, faStarHalfStroke, faTrash } from '@fortawesome/free-solid-svg-icons';
import { ActivatedRoute, Router } from '@angular/router';
import { UsersService } from 'src/app/services/users.service';
import { EventPermissionsService } from 'src/app/services/event-permissions.service';
import { Observable } from 'rxjs';


@Component({
  selector: 'app-events-list',
  templateUrl: './events-list.component.html',
  styleUrls: ['./events-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false
})
export class EventsListComponent {
  protected readonly eventsService = inject(EventService);
  readonly #usersService = inject(UsersService);
  readonly #router = inject(Router);
  readonly #route = inject(ActivatedRoute);
  readonly #eventPermissions = inject(EventPermissionsService);
  readonly #editPermissions = new Map<string, Observable<boolean>>();
  protected readonly editIcon = faPen;
  protected readonly deleteIcon = faTrash;
  protected readonly events = this.#route.parent?.routeConfig?.path === 'my-events'
    ? this.eventsService.myEvents
    : this.eventsService.events;
  protected readonly favoriteEventIcon = faStar;
  protected readonly unfavoriteEventIcon = faStarHalfStroke;

  favoriteIcon(eventId: string) {
    if (this.#usersService.isEventFavorited(eventId)) {
      return this.unfavoriteEventIcon; // icon for removal
    }
    return this.favoriteEventIcon; // icon for adding
  }

  favorite(eventId: string) {
    this.#usersService.toggleEventFavorite(eventId);
  }

  public edit(event: Event) {
    this.#router.navigate(['/events/edit/' + event.id])
  }

  protected canEdit(eventId: string): Observable<boolean> {
    const cachedPermission = this.#editPermissions.get(eventId);
    if (cachedPermission) {
      return cachedPermission;
    }

    const permission = this.#eventPermissions.canForEvent(eventId, 'events:edit');
    this.#editPermissions.set(eventId, permission);
    return permission;
  }

  protected loadErrorText(): string {
    const err = this.events.error();
    if (!err) {
      return '';
    }
    if (err instanceof Error) {
      return err.message;
    }
    return String(err);
  }
}
