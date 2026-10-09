import { Component, computed, inject, ChangeDetectionStrategy, signal } from '@angular/core';
import { TicketService } from '../../../services/tickets.service';
import { Ticket } from '../tickets.types';
import { faBan, faEye, faPen, faTrash } from '@fortawesome/free-solid-svg-icons';
import { SnackbarToastrService } from '../../../services/snackbar-toastr.service';
import { HttpErrorResponse } from '@angular/common/http';
import { EventPermissionsService } from 'src/app/services/event-permissions.service';
import { Observable, of } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { matchesSearch } from '../../../shared/matches-search';
import { getAriaSort, sortRows, TableSortState, toggleSort } from '../../../shared/table-sort';

type TicketSortColumn = 'lastname' | 'firstname' | 'id' | 'email' | 'group' | 'event' | 'status';

@Component({
  selector: 'app-tickets-list',
  templateUrl: './tickets-list.component.html',
  styleUrls: ['./tickets-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false
})
export class TicketsListComponent {
  readonly #ticketsService = inject(TicketService);
  readonly #toastr = inject(SnackbarToastrService);
  readonly #eventPermissions = inject(EventPermissionsService);
  readonly #editPermissions = new Map<string, Observable<boolean>>();
  readonly #denied = of(false);

  protected readonly editIcon = faPen;
  protected readonly viewIcon = faEye;
  protected readonly deleteIcon = faTrash;
  protected readonly cancelIcon = faBan;

  readonly #route = inject(ActivatedRoute);
  readonly #eventId = this.#route.snapshot.paramMap.get('event-id');
  protected readonly isGlobal = !this.#eventId;

  protected readonly tickets = this.isGlobal
    ? this.#ticketsService.tickets
    : this.#ticketsService.getTicketsByEventIdResource(() => this.#eventId);
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
      ticket.group?.event_id ?? this.#eventId
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
    return ['/my-events', String(eventId), 'tickets', ticket.id, 'edit'];
  }

  protected viewTicketRoute(ticket: Ticket): string[] {
    const eventId = ticket.group?.event_id;
    if (!eventId || !ticket.id) {
      return [];
    }
    if (this.isGlobal) {
      return ['/tickets', 'detail', ticket.id];
    }
    return ['/my-events', String(eventId), 'tickets', ticket.id, 'detail'];
  }

  #notCancelledTicketToastr(ticket: Ticket, error: HttpErrorResponse | Error | string) {
    this.#toastr.error(
      this.#errorMessage(error),
      'Ticket wasn\'t cancelled!',
      {
        progressBar: true,
      }
    );
  }

  public cancel(ticket: Ticket) {
    if (!confirm(
      `Are you sure to cancel ticket for "${ticket.firstname} ${ticket.lastname}"?`
    )) {
      this.#notCancelledTicketToastr(ticket, 'Cancellation cancelled by user.');
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
  }

  #notDeletedTicketToastr(ticket: Ticket, error: HttpErrorResponse | Error | string) {
    this.#toastr.error(
      this.#errorMessage(error),
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
    if (!confirm(
      `Are you sure to delete ticket for "${ticket.firstname} ${ticket.lastname}"?`
    )) {
      this.#notDeletedTicketToastr(ticket, 'Deletion cancelled by user.');
      return;
    }
    this.#ticketsService.delete(ticket.id).subscribe({
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
  }

  #errorMessage(error: HttpErrorResponse | Error | string): string {
    if (typeof error === 'string') {
      return error;
    }
    if (error instanceof HttpErrorResponse) {
      return error.error?.detail ?? error.message;
    }
    return error.message;
  }
}
