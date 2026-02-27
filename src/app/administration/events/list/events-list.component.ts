import { Component, inject } from '@angular/core';
import { EventService } from '../events.service';
import { Event } from '../events.types';
import { faPen, faStar, faStarHalfStroke, faTrash } from '@fortawesome/free-solid-svg-icons';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';
import { UsersService } from 'src/app/services/users.service';

@Component({
  selector: 'app-events-list',
  templateUrl: './events-list.component.html',
  styleUrls: ['./events-list.component.scss'],
  standalone: false
})
export class EventsListComponent {
  readonly #eventsService = inject(EventService);
  readonly #usersService = inject(UsersService);
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

  public delete(event: Event) {
    if (!event.id) {
      this.#toastr.error(
        `<div><b>Event wasn't deleted!</b><br/>Can't delete! Didn't receive event id.</div>`,
        '',
        {
          enableHtml: true,
          progressBar: true,
        }
      );
      return;
    }
    // this.eventsService.delete(event.id).subscribe(
    //   (event) => {
    //     if (!event) {
    //       this.toastr.error(
    //         `<div><b>Event wasn't deleted!</b></div>`,
    //         '',
    //         {
    //           enableHtml: true,
    //           progressBar: true,
    //         }
    //       );
    //       return
    //     }
    //     this.events.splice(this.events.indexOf(event), 1);
    //     this.toastr.info(
    //       `<b>Event "${event.name}" deleted</b>`,
    //       '',
    //       {
    //         enableHtml: true,
    //         progressBar: true
    //       }
    //     );
    //   }
    // )
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
