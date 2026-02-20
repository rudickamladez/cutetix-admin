import { Component, inject } from '@angular/core';
import { TicketService } from '../tickets.service';
import { Ticket } from '../tickets.types';
import { faBan, faPen, faTrash } from '@fortawesome/free-solid-svg-icons';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';

@Component({
  selector: 'app-tickets-list',
  templateUrl: './tickets-list.component.html',
  styleUrls: ['./tickets-list.component.scss'],
  standalone: false
})
export class TicketsListComponent {
  readonly #ticketsService = inject(TicketService);
  readonly #toastr = inject(ToastrService);
  readonly #router = inject(Router);

  protected readonly editIcon = faPen;
  protected readonly deleteIcon = faTrash;
  protected readonly cancelIcon = faBan;
  protected readonly tickets = this.#ticketsService.tickets;

  #notCancelledTicketToastr(ticket: Ticket) {
    this.#toastr.error(
      `${ticket.firstname} ${ticket.lastname}`,
      'Ticket DIDN\'T cancelled!',
      {
        progressBar: true,
      }
    );
  }

  public cancel(ticket: Ticket) {
    if (!confirm(
      `Are you sure to cancel ticket for "${ticket.firstname} ${ticket.lastname}"?`
    )) {
      this.#notCancelledTicketToastr(ticket);
      return;
    }
    this.#ticketsService.cancel(ticket).subscribe({
      next: (cancelledTicket) => {
        if (!cancelledTicket) {
          this.#notCancelledTicketToastr(ticket);
          return;
        }
        this.#toastr.info(
          `${cancelledTicket.firstname} ${cancelledTicket.lastname}`,
          'Ticket cancelled',
          {
            progressBar: true
          }
        );
      }
    });
  }

  public edit(ticket: Ticket) {
    this.#router.navigate(['/tickets/edit/' + ticket.id]);
  }

  #notDeletedTicketToastr(ticket: Ticket) {
    this.#toastr.error(
      `${ticket.firstname} ${ticket.lastname}`,
      'Ticket DIDN\'T deleted!',
      {
        progressBar: true,
      }
    );
  }

  public delete(ticket: Ticket) {
    if (!ticket.id) {
      this.#toastr.error(
        'Can\'t delete! Didn\'t receive ticket id.',
        'Ticket DIDN\'T deleted!',
        {
          progressBar: true,
        }
      );
      return;
    }
    if (!confirm(
      `Are you sure to delete ticket for "${ticket.firstname} ${ticket.lastname}"?`
    )) {
      this.#notDeletedTicketToastr(ticket);
      return;
    }
    this.#ticketsService.delete(ticket.id).subscribe({
      next: (deletedTicket) => {
        if (!deletedTicket) {
          this.#notDeletedTicketToastr(ticket);
          return;
        }
        this.#toastr.info(
          `${deletedTicket.firstname} ${deletedTicket.lastname}`,
          'Ticket deleted',
          {
            progressBar: true
          }
        );
      }
    });
  }

  protected loadErrorText(): string {
    const err = this.tickets.error();
    if (!err) {
      return '';
    }
    if (err instanceof Error) {
      return err.message;
    }
    return String(err);
  }
}
