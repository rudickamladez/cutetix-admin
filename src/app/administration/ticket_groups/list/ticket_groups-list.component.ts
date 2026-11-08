import { Component, computed, inject, ChangeDetectionStrategy, signal } from '@angular/core';
import { TicketGroupService } from '../ticket_groups.service';
import { faPen, faPeopleGroup, faTrash } from '@fortawesome/free-solid-svg-icons';
import { SnackbarToastrService } from '../../../services/snackbar-toastr.service';
import { HttpErrorResponse } from '@angular/common/http';
import { TicketGroup } from '../ticket_groups.types';
import { EventPermissionsService } from 'src/app/services/event-permissions.service';
import { Observable } from 'rxjs';
import { matchesSearch } from '../../../shared/matches-search';
import { getAriaSort, sortRows, TableSortState, toggleSort } from '../../../shared/table-sort';
import { ConfirmDialogService } from '../../../services/confirm-dialog.service';
import { LoadingComponent } from '../../loading/loading.component';
import { TableSearchComponent } from '../../../components/table-search/table-search.component';
import { TableSortHeaderComponent } from '../../../components/table-sort-header/table-sort-header.component';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { AsyncPipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';

type TicketGroupSortColumn = 'name' | 'capacity' | 'event';

@Component({
    selector: 'app-ticket-groups-list',
    templateUrl: './ticket_groups-list.component.html',
    styleUrls: ['./ticket_groups-list.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [LoadingComponent, TableSearchComponent, TableSortHeaderComponent, RouterLink, FaIconComponent, AsyncPipe]
})
export class TicketGroupsListComponent {
  readonly #ticket_groupService = inject(TicketGroupService);
  readonly #toastr = inject(SnackbarToastrService);
  readonly #confirmDialog = inject(ConfirmDialogService);
  readonly #eventPermissions = inject(EventPermissionsService);
  readonly #route = inject(ActivatedRoute);
  readonly #router = inject(Router);
  readonly #routeParams = toSignal(this.#route.paramMap, { initialValue: this.#route.snapshot.paramMap });
  protected readonly isGlobal = this.#routeParams().get('event-id') === null;
  readonly #editPermissions = new Map<number, Observable<boolean>>();

  // Icons
  protected readonly editIcon = faPen;
  protected readonly deleteIcon = faTrash;
  protected readonly capacityIcon = faPeopleGroup;

  protected readonly ticketGroups = this.isGlobal
    ? this.#ticket_groupService.ticketGroups
    : this.#ticket_groupService.ticketGroupsByEventIdResource(() => this.#routeParams().get('event-id'));
  protected readonly search = signal('');
  protected readonly filteredTicketGroups = computed(() => this.ticketGroups.value().filter(ticketGroup =>
    matchesSearch(this.search(), [ticketGroup.name, ticketGroup.id, ticketGroup.event?.name, ticketGroup.event_id])
  ));
  protected readonly sortState = signal<TableSortState<TicketGroupSortColumn>>({ column: null, direction: null });
  protected readonly sortedTicketGroups = computed(() => sortRows(
    this.filteredTicketGroups(),
    this.sortState(),
    (ticketGroup, column) => column === 'event' ? ticketGroup.event?.name : ticketGroup[column]
  ));

  protected ticketGroupEditLink(ticketGroup: TicketGroup): string[] {
    const eventId = this.#routeParams().get('event-id');
    if (!eventId) {
      return ['/ticket_groups', 'edit', String(ticketGroup.id)];
    }
    const eventBase = this.#router.url.startsWith('/events/') ? '/events' : '/my-events';
    return [eventBase, eventId, 'ticket-groups', String(ticketGroup.id), 'edit'];
  }

  protected toggleSort(column: TicketGroupSortColumn): void {
    this.sortState.update((state) => toggleSort(state, column));
  }

  protected sortAriaSort(column: TicketGroupSortColumn): 'ascending' | 'descending' | 'none' {
    return getAriaSort(this.sortState(), column);
  }

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
    this.#confirmDialog.confirm({
      title: 'Delete ticket group',
      message: `Are you sure to delete ticket group "${ticket_group.name}"?`,
      confirmLabel: 'Delete',
      destructive: true,
    }).subscribe((confirmed) => {
      if (!confirmed) {
        return;
      }
      this.#ticket_groupService.delete(ticket_group.id!).subscribe({
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
        },
        complete: () => {
          if (!this.isGlobal) {
            this.ticketGroups.reload();
          }
        }
      });
    });
  }
}
