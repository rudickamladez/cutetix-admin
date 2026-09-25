import { Component, inject } from '@angular/core';
import { TicketService } from '../tickets.service';
import { Ticket } from '../tickets.types';
import { faBan, faPen, faTrash } from '@fortawesome/free-solid-svg-icons';
import { ToastrService } from 'ngx-toastr';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-tickets-list',
  templateUrl: './tickets-list.component.html',
  styleUrls: ['./tickets-list.component.scss'],
  standalone: false
})
export class TicketsListComponent {
  readonly #ticketsService = inject(TicketService);
  readonly #toastr = inject(ToastrService);

  protected readonly editIcon = faPen;
  protected readonly deleteIcon = faTrash;
  protected readonly cancelIcon = faBan;
  protected readonly tickets = this.#ticketsService.tickets;

  #notCancelledTicketToastr(ticket: Ticket, error: HttpErrorResponse | Error | string) {
    this.#toastr.error(
      typeof error === 'string' ? error : error.message,
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
      typeof error === 'string' ? error : error.message,
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
}
