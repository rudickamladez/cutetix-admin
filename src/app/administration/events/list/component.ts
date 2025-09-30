import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { EventService } from '../events.service';
import { Event } from '../events.types';
import { faPen, faTrash } from '@fortawesome/free-solid-svg-icons';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';

@Component({
  selector: 'app-events-list',
  templateUrl: './component.html',
  styleUrls: ['./component.scss'],
  standalone: false
})
export class EventsListComponent implements OnInit, OnDestroy {
  public faPen = faPen;
  public faTrash = faTrash;
  public events: Event[] = [];
  public loadingState = 1;
  public errorLoading = {
    enabled: false,
    text: '',
  };
  // We use this trigger because fetching the list can be quite long,
  // thus we ensure the data is fetched before rendering
  dtTrigger: Subject<any> = new Subject<any>();

  constructor(
    private readonly eventsService: EventService,
    private readonly toastr: ToastrService,
    private readonly router: Router
  ) { }

  ngOnInit(): void {

    this.eventsService.get().subscribe({
      next: (events) => {
        this.events = events;
        // Calling the DT trigger to manually render the table
        this.dtTrigger.next(null);
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

  ngOnDestroy(): void {
    // Do not forget to unsubscribe the event
    this.dtTrigger.unsubscribe();
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
