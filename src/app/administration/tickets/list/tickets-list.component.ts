import { Component, OnInit, inject } from '@angular/core';
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
export class TicketsListComponent implements OnInit {
  readonly #ticketsService = inject(TicketService);
  readonly #toastr = inject(ToastrService);
  readonly #router = inject(Router);

  protected readonly editIcon = faPen;
  protected readonly deleteIcon = faTrash;
  protected readonly cancelIcon = faBan;
  public tickets: Ticket[] = [];
  public loadingState = 1;
  public errorLoading = {
    enabled: false,
    text: '',
  };
  #startup = true;

  #updateTickets() {
    this.loadingState = 1;
    this.errorLoading = {
      enabled: false,
      text: '',
    }
    this.#ticketsService.get().subscribe({
      next: (tickets) => {
        this.tickets = tickets;
        if (this.#startup) {
          this.#startup = false;
        }
        this.loadingState--;
      },
      error: (err) => {
        console.error(err);
        this.errorLoading.enabled = true;
        this.errorLoading.text = err.message;
        this.loadingState--;
      },
    });
  }

  ngOnInit(): void {
    this.#updateTickets();

    this.#ticketsService.deleteAsObservable().subscribe(
      (ticket) => {
        this.tickets.splice(this.tickets.indexOf(ticket), 1);
      }
    );
  }

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
      this.#notCancelledTicketToastr(ticket)
      return
    }
    this.#ticketsService.cancel(ticket).subscribe(
      (ticket) => {
        if (!ticket) {
          this.#notCancelledTicketToastr(ticket)
          return
        }
        this.#updateTickets();
        this.#toastr.info(
          `${ticket.firstname} ${ticket.lastname}`,
          'Ticket cancelled',
          {
            progressBar: true
          }
        );
      }
    )
  }

  public edit(ticket: Ticket) {
    this.#router.navigate(['/tickets/edit/' + ticket.id])
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
    this.#ticketsService.delete(ticket.id).subscribe(
      (t) => {
        if (!t) {
          this.#notDeletedTicketToastr(ticket);
          return
        }
        this.#updateTickets();
        this.#toastr.info(
          `${t.firstname} ${t.lastname}`,
          'Ticket deleted',
          {
            progressBar: true
          }
        );
      }
    )
  }
}
