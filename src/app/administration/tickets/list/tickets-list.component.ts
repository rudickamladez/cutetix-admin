import { Component, computed, inject, ChangeDetectionStrategy, signal } from '@angular/core';
import { TicketService } from '../../../services/tickets.service';
import { Ticket } from '../tickets.types';
import { faBan, faEye, faPen, faTrash } from '@fortawesome/free-solid-svg-icons';
import { SnackbarToastrService } from '../../../services/snackbar-toastr.service';
import { EventPermissionsService } from 'src/app/services/event-permissions.service';
import { Observable, of } from 'rxjs';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { matchesSearch } from '../../../shared/matches-search';
import { getAriaSort, sortRows, TableSortState, toggleSort } from '../../../shared/table-sort';
import { ConfirmDialogService } from '../../../services/confirm-dialog.service';
import { LoadingComponent } from '../../loading/loading.component';
import { TableSearchComponent } from '../../../components/table-search/table-search.component';
import { TableSortHeaderComponent } from '../../../components/table-sort-header/table-sort-header.component';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { AsyncPipe } from '@angular/common';
import { errorMessage } from '../../../utils/error-message';
import { toSignal } from '@angular/core/rxjs-interop';

type TicketSortColumn = 'lastname' | 'firstname' | 'id' | 'email' | 'group' | 'event' | 'status';

@Component({
    selector: 'app-tickets-list',
    templateUrl: './tickets-list.component.html',
    styleUrls: ['./tickets-list.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [LoadingComponent, TableSearchComponent, TableSortHeaderComponent, RouterLink, FaIconComponent, AsyncPipe]
})
export class TicketsListComponent {
  readonly #ticketsService = inject(TicketService);
  readonly #toastr = inject(SnackbarToastrService);
  readonly #confirmDialog = inject(ConfirmDialogService);
  readonly #eventPermissions = inject(EventPermissionsService);
  readonly #editPermissions = new Map<string, Observable<boolean>>();
  readonly #denied = of(false);

  protected readonly editIcon = faPen;
  protected readonly viewIcon = faEye;
  protected readonly deleteIcon = faTrash;
  protected readonly cancelIcon = faBan;

  readonly #route = inject(ActivatedRoute);
  readonly #router = inject(Router);
  readonly #routeParams = toSignal(this.#route.paramMap, { initialValue: this.#route.snapshot.paramMap });
  protected readonly isGlobal = this.#routeParams().get('event-id') === null;

  protected readonly tickets = this.isGlobal
    ? this.#ticketsService.tickets
    : this.#ticketsService.getTicketsByEventIdResource(() => this.#routeParams().get('event-id'));
  protected readonly search = signal('');
  protected readonly filteredTickets = computed(() => this.tickets.value().filter((ticket) =>
    matchesSearch(this.search(), [
      ticket.lastname,
      ticket.firstname,
      ticket.id,
      ticket.email,
      ticket.description,
      ticket.group?.name,
      ticket.group?.event?.name,
      ticket.group?.event?.id,
      ticket.group?.event_id ?? this.#routeParams().get('event-id')
    ])
  ));
  protected readonly sortState = signal<TableSortState<TicketSortColumn>>({ column: null, direction: null });
  protected readonly sortedTickets = computed(() => sortRows(
    this.filteredTickets(),
    this.sortState(),
    (ticket, column) => {
      switch (column) {
        case 'group': return ticket.group?.name;
        case 'event': return ticket.group?.event?.name ?? '';
        default: return ticket[column];
      }
    }
  ));

  protected toggleSort(column: TicketSortColumn): void {
    this.sortState.update((state) => toggleSort(state, column));
  }

  protected sortAriaSort(column: TicketSortColumn): 'ascending' | 'descending' | 'none' {
    return getAriaSort(this.sortState(), column);
  }

  protected canEdit(ticket: Ticket): Observable<boolean> {
    const eventId = ticket.group?.event_id;
    if (eventId === undefined) {
      return this.#denied;
    }
    const cacheKey = eventId.toString();
    const cachedPermission = this.#editPermissions.get(cacheKey);
    if (cachedPermission) {
      return cachedPermission;
    }

    const permission = this.#eventPermissions.canForEvent(eventId, 'tickets:edit');
    this.#editPermissions.set(cacheKey, permission);
    return permission;
  }

  protected canRead(ticket: Ticket): Observable<boolean> {
    if (
      this.#eventPermissions.hasGlobalScope('tickets:read')
      || this.#eventPermissions.hasGlobalScope('tickets:edit')
    ) {
      return of(true);
    }
    const eventId = ticket.group?.event_id;
    return eventId === undefined
      ? this.#denied
      : this.#eventPermissions.canForEvent(eventId, 'tickets:read');
  }

  protected editTicketRoute(ticket: Ticket): string[] {
    const eventId = ticket.group?.event_id;
    if (!eventId || !ticket.id) {
      return [];
    }
    if (this.isGlobal) {
      return ['/tickets', 'edit', ticket.id];
    }
    const eventBase = this.#router.url.startsWith('/events/') ? '/events' : '/my-events';
    return [eventBase, String(eventId), 'tickets', ticket.id, 'edit'];
  }

  protected viewTicketRoute(ticket: Ticket): string[] {
    const eventId = ticket.group?.event_id;
    if (!eventId || !ticket.id) {
      return [];
    }
    if (this.isGlobal) {
      return ['/tickets', 'detail', ticket.id];
    }
    const eventBase = this.#router.url.startsWith('/events/') ? '/events' : '/my-events';
    return [eventBase, String(eventId), 'tickets', ticket.id, 'detail'];
  }

  #notCancelledTicketToastr(ticket: Ticket, error: unknown) {
    this.#toastr.error(
      errorMessage(error),
      'Ticket wasn\'t cancelled!',
      {
        progressBar: true,
      }
    );
  }

  public cancel(ticket: Ticket) {
    this.#confirmDialog.confirm({
      title: 'Cancel ticket',
      message: `Are you sure to cancel ticket for "${ticket.firstname} ${ticket.lastname}"?`,
      confirmLabel: 'Cancel ticket',
      destructive: true,
    }).subscribe((confirmed) => {
      if (!confirmed) {
        return;
      }
      this.#ticketsService.cancel(ticket).subscribe({
        next: () => {
          this.#toastr.info(
            'Successfully cancelled.',
            'Ticket',
            {
              progressBar: true
            }
          );
        },
        error: (err) => {
          this.#notCancelledTicketToastr(ticket, err);
        },
        complete: () => {
          if (!this.isGlobal) {
            this.tickets.reload();
          }
        }
      });
    });
  }

  #notDeletedTicketToastr(ticket: Ticket, error: unknown) {
    this.#toastr.error(
      errorMessage(error),
      'Ticket wasn\'t deleted!',
      {
        progressBar: true,
      }
    );
  }

  public deleteTicket(ticket: Ticket) {
    if (!ticket.id) {
      this.#notDeletedTicketToastr(ticket, 'Missing ID.');
      return;
    }
    this.#confirmDialog.confirm({
      title: 'Delete ticket',
      message: `Are you sure to delete ticket for "${ticket.firstname} ${ticket.lastname}"?`,
      confirmLabel: 'Delete',
      destructive: true,
    }).subscribe((confirmed) => {
      if (!confirmed) {
        return;
      }
      this.#ticketsService.delete(ticket.id!).subscribe({
        next: () => {
          this.#toastr.info(
            'Successfully deleted.',
            'Ticket deleted',
            {
              progressBar: true
            }
          );
        },
        error: (err) => {
          this.#notDeletedTicketToastr(ticket, err);
        },
        complete: () => {
          if (!this.isGlobal) {
            this.tickets.reload();
          }
        }
      });
    });
  }

}
