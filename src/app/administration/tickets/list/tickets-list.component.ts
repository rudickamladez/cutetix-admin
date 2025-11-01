import type { OnInit } from "@angular/core";
import { Component, inject } from "@angular/core";
import { Router } from "@angular/router";

import {
  faBan,
  faBroom,
  faPen,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import { ToastrService } from "ngx-toastr";

import { TicketService } from "../tickets.service";
import type { Ticket } from "../tickets.types";

type FilterState = {
  query: string;
  status: "any" | string;
  group: "any" | string;
  event: "any" | string;
};

@Component({
  selector: "app-tickets-list",
  templateUrl: "./tickets-list.component.html",
  styleUrls: ["./tickets-list.component.scss"],
  standalone: false,
})
export class TicketsListComponent implements OnInit {
  private readonly ticketsService = inject(TicketService);
  private readonly toastr = inject(ToastrService);
  private readonly router = inject(Router);

  cleaningIcon = faBroom;
  public faPen = faPen;
  public faTrash = faTrash;
  public cancelIcon = faBan;

  public tickets: Ticket[] = [];
  public filteredTickets: Ticket[] = [];

  public loadingState = 1;
  public errorLoading = { enabled: false, text: "" };

  private startup = true;
  private queryDebounce?: number;

  public filter: FilterState = {
    query: "",
    status: "any",
    group: "any",
    event: "any",
  };

  ngOnInit(): void {
    this.updateTickets();

    this.ticketsService.deleteAsObservable().subscribe(ticket => {
      const idx = this.tickets.findIndex(
        t => t === ticket || t.id === ticket.id
      );
      if (idx >= 0) {
        this.tickets.splice(idx, 1);
        this.applyFilter();
      }
    });
  }

  // --- načtení a filtrace ---
  private updateTickets(): void {
    this.loadingState = 1;
    this.errorLoading = { enabled: false, text: "" };

    this.ticketsService.get().subscribe({
      next: tickets => {
        this.tickets = tickets;
        if (this.startup) {
          this.startup = false;
        }
        this.applyFilter();
        this.loadingState--;
      },
      error: err => {
        console.error(err);
        this.errorLoading.enabled = true;
        this.errorLoading.text = err?.message ?? "Unknown error";
        this.loadingState--;
      },
    });
  }

  private normalize(value: unknown): string {
    return (value ?? "").toString().toLowerCase();
  }

  private matchesQuery(ticket: Ticket, q: string): boolean {
    if (!q) {
      return true;
    }

    const fields: string[] = [
      ticket.firstname,
      ticket.lastname,
      ticket.email,
      ticket.description,
      ticket.id?.toString(),
      ticket.group?.name,
      ticket.group?.event?.name,
    ].map(v => this.normalize(v));

    return fields.some(f => f.includes(q));
  }

  private matchesStatus(
    ticket: Ticket,
    status: FilterState["status"]
  ): boolean {
    if (status === "any") {
      return true;
    }
    return String(ticket.status) === status;
  }

  private matchesGroup(ticket: Ticket, group: FilterState["group"]): boolean {
    if (group === "any") {
      return true;
    }
    return group === ticket.group?.id;
  }

  private matchesEvent(ticket: Ticket, eventF: FilterState["event"]): boolean {
    if (eventF === "any") {
      return true;
    }
    return eventF === ticket.group?.event?.id;
  }

  private applyFilter(): void {
    const q = this.filter.query.trim().toLowerCase();

    this.filteredTickets = this.tickets.filter(
      t =>
        this.matchesQuery(t, q) &&
        this.matchesStatus(t, this.filter.status) &&
        this.matchesGroup(t, this.filter.group) &&
        this.matchesEvent(t, this.filter.event)
    );
  }

  public hasActiveFilters(): boolean {
    return (
      Boolean(this.filter.query) ||
      this.filter.status !== "any" ||
      this.filter.group !== "any" ||
      this.filter.event !== "any"
    );
  }

  public clearFilters(): void {
    this.filter = { query: "", status: "any", group: "any", event: "any" };
    this.applyFilter();
  }

  // --- UI handlery bez FormsModule ---
  public onQueryChange(ev: Event): void {
    // jednoduchý debounce ~250ms
    const value = (ev.target as HTMLInputElement).value;
    this.filter.query = value;
    if (this.queryDebounce) {
      window.clearTimeout(this.queryDebounce);
    }
    this.queryDebounce = window.setTimeout(() => this.applyFilter(), 250);
  }
  public onStatusChange(ev: Event): void {
    this.filter.status = (ev.target as HTMLSelectElement).value;
    this.applyFilter();
  }
  public onGroupChange(ev: Event): void {
    this.filter.group = (ev.target as HTMLSelectElement).value;
    this.applyFilter();
  }
  public onEventChange(ev: Event): void {
    this.filter.event = (ev.target as HTMLSelectElement).value;
    this.applyFilter();
  }

  // --- stávající akce ---
  private notCancelledTicketToastr(ticket: Ticket): void {
    this.toastr.error(
      `${ticket.firstname} ${ticket.lastname}`,
      "Ticket DIDN'T cancelled!",
      { progressBar: true }
    );
  }

  public cancel(ticket: Ticket): void {
    if (
      !confirm(
        `Are you sure to cancel ticket for "${ticket.firstname} ${ticket.lastname}"?`
      )
    ) {
      this.notCancelledTicketToastr(ticket);
      return;
    }
    this.ticketsService.cancel(ticket).subscribe(t => {
      this.updateTickets();
      this.toastr.info(`${t.firstname} ${t.lastname}`, "Ticket cancelled", {
        progressBar: true,
      });
    });
  }

  public edit(ticket: Ticket): void {
    this.router.navigate(["/tickets/edit/" + ticket.id]);
  }

  private notDeletedTicketToastr(ticket: Ticket): void {
    this.toastr.error(
      `${ticket.firstname} ${ticket.lastname}`,
      "Ticket DIDN'T deleted!",
      { progressBar: true }
    );
  }

  public delete(ticket: Ticket): void {
    if (!ticket.id) {
      this.toastr.error(
        "Can't delete! Didn't receive ticket id.",
        "Ticket DIDN'T deleted!",
        { progressBar: true }
      );
      return;
    }
    if (
      !confirm(
        `Are you sure to delete ticket for "${ticket.firstname} ${ticket.lastname}"?`
      )
    ) {
      this.notDeletedTicketToastr(ticket);
      return;
    }
    // TODO: try catch?
    this.ticketsService.delete(ticket.id).subscribe(t => {
      this.updateTickets();
      this.toastr.info(`${t.firstname} ${t.lastname}`, "Ticket deleted", {
        progressBar: true,
      });
    });
  }
}
