import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { EventService } from '../events.service';
import { Event } from '../events.types';
import { faPen, faStar, faStarHalfStroke, faTrash } from '@fortawesome/free-solid-svg-icons';
import { Router } from '@angular/router';
import { UsersService } from 'src/app/services/users.service';
import { AuthService } from 'src/app/services/auth.service';


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
  protected readonly authService = inject(AuthService);
  protected readonly editIcon = faPen;
  protected readonly deleteIcon = faTrash;
  protected readonly events = this.eventsService.events;
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
