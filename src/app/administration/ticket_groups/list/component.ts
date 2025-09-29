import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { TicketGroupService } from '../ticket_groups.service';
import { TicketGroup } from '../ticket_groups.types';
import { faPen, faTrash } from '@fortawesome/free-solid-svg-icons';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';
import { ADTSettings } from 'angular-datatables/src/models/settings';

@Component({
    selector: 'app-ticket_groups-list',
    templateUrl: './component.html',
    styleUrls: ['./component.scss'],
    standalone: false
})
export class TicketGroupsListComponent implements OnInit, OnDestroy {
  public faPen = faPen;
  public faTrash = faTrash;
  public ticket_groups: TicketGroup[] = [];
  public loadingState = 1;
  public errorLoading = {
    enabled: false,
    text: '',
  };
  dtOptions: ADTSettings = {
    pagingType: 'full_numbers',
    pageLength: 25,
  };
  // We use this trigger because fetching the list can be quite long,
  // thus we ensure the data is fetched before rendering
  dtTrigger: Subject<any> = new Subject<any>();

  constructor(
    private readonly ticket_groupService: TicketGroupService,
    private readonly toastr: ToastrService,
    private readonly router: Router
  ) { }

  ngOnInit(): void {
    this.ticket_groupService.get().subscribe({
      next: (ticket_groups) => {
        this.ticket_groups = ticket_groups;
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

    this.ticket_groupService.deleteAsObservable().subscribe(
      (ticket_group) => {
        this.ticket_groups.splice(this.ticket_groups.indexOf(ticket_group), 1);
      }
    );
  }

  ngOnDestroy(): void {
    // Do not forget to unsubscribe the event
    this.dtTrigger.unsubscribe();
  }

  public edit(ticket_group: TicketGroup) {
    this.router.navigate(['/ticket_groups/edit/' + ticket_group.id])
  }

  public delete(ticket_group: TicketGroup) {
    if (!ticket_group.id) {
      this.toastr.error(
        `<div><b>Ticket group DIDN'T deleted!</b><br/>Can't delete! Didn't receive ticket_group id.</div>`,
        '',
        {
          enableHtml: true,
          progressBar: true,
        }
      );
      return;
    }
    this.ticket_groupService.delete(ticket_group.id).subscribe(
      (ticket_group) => {
        if (!ticket_group) {
          this.toastr.error(
            `<div><b>Ticket group DIDN'T deleted!</b></div>`,
            '',
            {
              enableHtml: true,
              progressBar: true,
            }
          );
          return
        }
        this.ticket_groups.splice(this.ticket_groups.indexOf(ticket_group), 1);
        this.toastr.info(
          `<b>Ticket group "${ticket_group.name}" deleted</b>`,
          '',
          {
            enableHtml: true,
            progressBar: true
          }
        );
      }
    )
  }
}
