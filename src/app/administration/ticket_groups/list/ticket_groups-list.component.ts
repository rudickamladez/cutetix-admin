import { Component, computed, inject, ChangeDetectionStrategy, signal } from '@angular/core';
import { TicketGroupService } from '../ticket_groups.service';
import { faPen, faTrash } from '@fortawesome/free-solid-svg-icons';
import { SnackbarToastrService } from '../../../services/snackbar-toastr.service';
import { HttpErrorResponse } from '@angular/common/http';
import { TicketGroup } from '../ticket_groups.types';
import { EventPermissionsService } from 'src/app/services/event-permissions.service';
import { Observable } from 'rxjs';
import { matchesSearch } from '../../../shared/matches-search';

@Component({
  selector: 'app-ticket_groups-list',
  templateUrl: './ticket_groups-list.component.html',
  styleUrls: ['./ticket_groups-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false
})
export class TicketGroupsListComponent {
  readonly #ticket_groupService = inject(TicketGroupService);
  readonly #toastr = inject(SnackbarToastrService);
  readonly #eventPermissions = inject(EventPermissionsService);
  readonly #editPermissions = new Map<number, Observable<boolean>>();

  protected readonly editIcon = faPen;
  protected readonly deleteIcon = faTrash;
  protected readonly ticketGroups = this.#ticket_groupService.ticketGroups;
  protected readonly search = signal('');
  protected readonly filteredTicketGroups = computed(() => this.ticketGroups.value().filter((ticketGroup) =>
    matchesSearch(this.search(), [ticketGroup.name, ticketGroup.id, ticketGroup.event?.name, ticketGroup.event_id])
  ));

  protected canEdit(eventId: number): Observable<boolean> {
    const cachedPermission = this.#editPermissions.get(eventId);
    if (cachedPermission) {
      return cachedPermission;
    }

    const permission = this.#eventPermissions.canForEvent(eventId, 'ticket_groups:edit');
    this.#editPermissions.set(eventId, permission);
    return permission;
  }

  public deleteTicketGroup(ticket_group: TicketGroup): void {
    if (!ticket_group.id) {
      return;
    }
    if (!confirm(`Are you sure to delete ticket group "${ticket_group.name}"?`)) {
      this.#toastr.error(
          'Deletion cancelled by user.',
          'Ticket group',
          {
            progressBar: true,
          }
        );
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
          err.error?.detail ?? err.message,
          'Ticket group wasn\'t deleted!',
          {
            progressBar: true,
          }
        );
      }
    });
  }
}
