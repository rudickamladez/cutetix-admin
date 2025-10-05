import { Component, inject, OnInit } from '@angular/core';
import { EventService } from '../events.service';
import { Event } from '../events.types';
import { faPen, faStar, faStarHalf, faStarHalfStroke, faTrash } from '@fortawesome/free-solid-svg-icons';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';
import { UsersService } from 'src/app/services/users.service';

@Component({
  selector: 'app-events-list',
  templateUrl: './event-list.component.html',
  styleUrls: ['./event-list.component.scss'],
  standalone: false
})
export class EventsListComponent implements OnInit {
  readonly eventsService = inject(EventService);
  readonly usersService = inject(UsersService);
  readonly toastr = inject(ToastrService);
  readonly router = inject(Router);
  public editIcon = faPen;
  public deleteIcon = faTrash;
  public events: Event[] = [];
  public loadingState = 1;
  public errorLoading = {
    enabled: false,
    text: '',
  };

  ngOnInit(): void {
    this.eventsService.get().subscribe({
      next: (events) => {
        this.errorLoading.enabled = false;
        this.events = events;
        this.loadingState--;
      },
      error: (err) => {
        console.error(err);
        this.errorLoading.enabled = true;
        this.errorLoading.text = err.message;
        this.loadingState--;
      },
    });

    this.eventsService.deleteAsObservable().subscribe(
      (event) => {
        this.events.splice(this.events.indexOf(event), 1);
      }
    );
  }

  favoriteIcon(eventId: string) {
    if (this.usersService.isEventFavorited(eventId)) {
      return faStarHalfStroke; // icon for removal
    }
    return faStar; // icon for adding
  }

  favorite(eventId: string) {
    if (this.usersService.isEventFavorited(eventId)) {
      this.usersService.removeEventFavorite(eventId);
      window.location.reload();
      return;
    }
    this.usersService.addEventFavorite(eventId);
    window.location.reload();
  }

  public edit(event: Event) {
    this.router.navigate(['/events/edit/' + event.id])
  }

  public delete(event: Event) {
    if (!event.id) {
      this.toastr.error(
        `<div><b>Event DIDN'T deleted!</b><br/>Can't delete! Didn't receive event id.</div>`,
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
    //         `<div><b>Event DIDN'T deleted!</b></div>`,
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
}
