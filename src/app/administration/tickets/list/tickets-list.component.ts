import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { TicketService } from '../../../services/tickets.service';
import { Ticket } from '../tickets.types';
import { faBan, faPen, faTrash } from '@fortawesome/free-solid-svg-icons';
import { SnackbarToastrService } from '../../../services/snackbar-toastr.service';
import { HttpErrorResponse } from '@angular/common/http';
import { EventPermissionsService } from 'src/app/services/event-permissions.service';
import { Observable, of } from 'rxjs';
import { ActivatedRoute } from '@angular/router';

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
  protected readonly deleteIcon = faTrash;
  protected readonly cancelIcon = faBan;

  readonly #route = inject(ActivatedRoute);
  readonly #eventId = this.#route.snapshot.paramMap.get('id');
  protected readonly isGlobal = !this.#eventId;

  protected readonly tickets = this.isGlobal
    ? this.#ticketsService.tickets
    : this.#ticketsService.getTicketsByEventIdResource(() => this.#eventId);

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
