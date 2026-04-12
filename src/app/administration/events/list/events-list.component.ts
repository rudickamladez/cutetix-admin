import { Component, inject } from '@angular/core';
import { EventService } from '../events.service';
import { Event } from '../events.types';
import { faPen, faStar, faStarHalfStroke, faTrash } from '@fortawesome/free-solid-svg-icons';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';
import { UsersService } from 'src/app/services/users.service';
import { AuthService } from 'src/app/services/auth.service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-events-list',
  templateUrl: './events-list.component.html',
  styleUrls: ['./events-list.component.scss'],
  standalone: false
})
export class EventsListComponent {
  readonly #eventsService = inject(EventService);
  readonly #usersService = inject(UsersService);
  protected readonly authService = inject(AuthService);
  readonly #toastr = inject(ToastrService);
  readonly #router = inject(Router);
  protected readonly editIcon = faPen;
  protected readonly deleteIcon = faTrash;
  protected readonly events = this.#eventsService.events;
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

  public deleteEvent(event: Event) {
    if (!event.id) {
      this.#toastr.error(
        `Cannot delete event "${event.name}"! Didn't receive event id.`,
        'Event wasn\'t deleted!',
        {
          progressBar: true,
        }
      );
      return;
    }
    if (!confirm(`Are you sure to delete event "${event.name}"?`)) {
      return;
    }
    this.#eventsService.delete(event.id).subscribe({
      next: () => {
        this.#toastr.info(
          event.name,
          'Event deleted',
          {
            progressBar: true
          }
        );
      },
      error: (err: HttpErrorResponse) => {
        console.error(err);
        this.#toastr.error(
          `Error: ${err.message}`,
          'Event wasn\'t deleted!',
          {
            progressBar: true,
          }
        );
      }
    })
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
