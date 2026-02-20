import { Component, inject } from '@angular/core';
import { TicketGroupService } from '../ticket_groups.service';
import { TicketGroup } from '../ticket_groups.types';
import { faPen, faTrash } from '@fortawesome/free-solid-svg-icons';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';

@Component({
  selector: 'app-ticket_groups-list',
  templateUrl: './ticket_groups-list.component.html',
  styleUrls: ['./ticket_groups-list.component.scss'],
  standalone: false
})
export class TicketGroupsListComponent {
  readonly #ticket_groupService = inject(TicketGroupService);
  readonly #toastr = inject(ToastrService);
  readonly #router = inject(Router);

  protected readonly editIcon = faPen;
  protected readonly deleteIcon = faTrash;
  protected readonly ticketGroups = this.#ticket_groupService.ticketGroups;

  public edit(ticket_group: TicketGroup) {
    this.#router.navigate(['/ticket_groups/edit/' + ticket_group.id]);
  }

  public delete(ticket_group: TicketGroup) {
    if (!ticket_group.id) {
      this.#toastr.error(
        `<div><b>Ticket group wasn't deleted!</b><br/>Can't delete! Didn't receive ticket_group id.</div>`,
        '',
        {
          enableHtml: true,
          progressBar: true,
        }
      );
      return;
    }
    this.#ticket_groupService.delete(ticket_group.id).subscribe({
      next: (deletedGroup) => {
        if (!deletedGroup) {
          this.#toastr.error(
            `<div><b>Ticket group wasn't deleted!</b></div>`,
            '',
            {
              enableHtml: true,
              progressBar: true,
            }
          );
          return;
        }
        this.#toastr.info(
          `<b>Ticket group "${deletedGroup.name}" deleted</b>`,
          '',
          {
            enableHtml: true,
            progressBar: true
          }
        );
      }
    });
  }

  protected loadErrorText(): string {
    const err = this.ticketGroups.error();
    if (!err) {
      return '';
    }
    if (err instanceof Error) {
      return err.message;
    }
    return String(err);
  }
}
