import { Component, inject } from '@angular/core';
import { TicketGroupService } from '../ticket_groups.service';
import { faPen, faTrash } from '@fortawesome/free-solid-svg-icons';
import { ToastrService } from 'ngx-toastr';
import { HttpErrorResponse } from '@angular/common/http';
import { TicketGroup } from '../ticket_groups.types';

@Component({
  selector: 'app-ticket_groups-list',
  templateUrl: './ticket_groups-list.component.html',
  styleUrls: ['./ticket_groups-list.component.scss'],
  standalone: false
})
export class TicketGroupsListComponent {
  readonly #ticket_groupService = inject(TicketGroupService);
  readonly #toastr = inject(ToastrService);

  protected readonly editIcon = faPen;
  protected readonly deleteIcon = faTrash;
  protected readonly ticketGroups = this.#ticket_groupService.ticketGroups;

  public deleteTicketGroup(ticket_group: TicketGroup): void {
    if (!ticket_group.id) {
      return;
    }
    if (!confirm(`Are you sure to delete ticket group "${ticket_group.name}"?`)) {
      return;
    }
    this.#ticket_groupService.delete(ticket_group!.id).subscribe({
      next: () => {
        this.#toastr.info(
          'Successfully deleted.',
          'Ticket group',
          {
            progressBar: true
          }
        );
      },
      error: (err: HttpErrorResponse) => {
        this.#toastr.error(
          err.message,
          'Ticket group wasn\'t deleted!',
          {
            progressBar: true,
          }
        );
      }
    });
  }
}
