import { HttpClient, HttpResourceRef, httpResource } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Ticket } from './tickets.types';
import { StorageKeys } from 'src/app/tokens/storage.tokens';
import { StorageService } from 'src/app/services/storage.service';

@Injectable({
  providedIn: 'root'
})
export class TicketService {
  readonly #httpClient = inject(HttpClient);
  readonly #storageService = inject(StorageService);

  readonly #apiPath = 'tickets';

  readonly tickets = httpResource<Ticket[]>(
    () => this.#endpoint('/'),
    {
      defaultValue: [],
    }
  );

  constructor() {
    this.tickets.reload();
  }

  #endpoint(path: string): string {
    return new URL(`${this.#apiPath}${path}`, this.#storageService.get(StorageKeys.API_URL)!).href;
  }

  public ticketByIdResource(
    getId: () => string | null | undefined
  ): HttpResourceRef<Ticket | undefined> {
    return httpResource<Ticket>(() => {
      const id = getId();
      if (!id) {
        return undefined;
      }
      return this.#endpoint(`/${id}/`);
    });
  }

  public create(ticket: Ticket): Observable<Ticket> {
    return this.#httpClient.post<Ticket>(
      this.#endpoint('/'),
      ticket
    ).pipe(
      tap(() => this.tickets.reload())
    );
  }

  public delete(id: string): Observable<Ticket> {
    return this.#httpClient.delete<Ticket>(
      this.#endpoint(`/${id}/`),
    ).pipe(
      tap(() => this.tickets.reload())
    );
  }

  public cancel(ticket: Ticket): Observable<Ticket> {
    return this.#httpClient.post<Ticket>(
      this.#endpoint('/cancel/'),
      {
        id: ticket.id,
        email: ticket.email,
      }
    ).pipe(
      tap(() => this.tickets.reload())
    );
  }
}
