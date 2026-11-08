import { HttpClient, HttpResourceRef, httpResource, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Event, EventCapacitySummary, EventCreate } from './events.types';
import { StorageKeys } from 'src/app/tokens/storage.tokens';
import { StorageService } from 'src/app/services/storage.service';
import { SnackbarToastrService } from '../../services/snackbar-toastr.service';
import { errorMessage } from '../../utils/error-message';
import { TicketGroupService } from '../ticket_groups/ticket_groups.service';
import { TicketService } from '../../services/tickets.service';
import { LoggingService } from '../../services/logging.service';

@Injectable({
  providedIn: 'root'
})
export class EventService {
  readonly #httpClient = inject(HttpClient);

  readonly #storageService = inject(StorageService);
  readonly #toastr = inject(SnackbarToastrService);
  readonly #ticketGroups = inject(TicketGroupService);
  readonly #tickets = inject(TicketService);
  readonly #logging = inject(LoggingService);

  readonly #apiPath = 'events';

  readonly #currentEvent = signal<Event | undefined>(undefined);
  readonly currentEvent = this.#currentEvent.asReadonly();
  readonly #activeEventId = signal<string | null>(null);
  readonly activeEventId = this.#activeEventId.asReadonly();
  readonly activeEventResource = this.eventByIdResource(() => this.#activeEventId());

  setActiveEventId(eventId: string | null): void {
    this.#activeEventId.set(eventId);
  }

  setCurrentEvent(event: Event | undefined): void {
    this.#currentEvent.set(event);
  }

  readonly events = httpResource<Event[]>(
    () => this.#endpoint('/'),
    {
      defaultValue: [],
    }
  );

  readonly myEvents = httpResource<Event[]>(
    () => this.#endpoint('/me'),
    {
      defaultValue: [],
    }
  );

  constructor() {
    this.events.reload();
  }

  #endpoint(path: string): string {
    return new URL(`${this.#apiPath}${path}`, this.#storageService.get(StorageKeys.API_URL)!).href;
  }

  public eventByIdResource(
    getId: () => string | null | undefined
  ): HttpResourceRef<Event | undefined> {
    return httpResource<Event>(() => {
      const id = getId();
      if (!id) {
        return undefined;
      }
      return this.#endpoint(`/${id}/`);
    });
  }

  public eventCapacitySummaryByIdResource(
    getId: () => string | null | undefined
  ): HttpResourceRef<EventCapacitySummary | undefined> {
    return httpResource<EventCapacitySummary>(() => {
      const id = getId();
      if (!id) {
        return undefined;
      }
      return this.#endpoint(`/capacity_summary/${id}/`);
    });
  }

  public create(event: EventCreate): Observable<Event> {
    return this.#httpClient.post<Event>(
      this.#endpoint('/'),
      event
    ).pipe(
      tap(() => {
        this.events.reload();
        this.myEvents.reload();
      })
    );
  }

  public update(
    id: string,
    body: EventCreate
  ): Observable<Event> {
    return this.#httpClient.patch<Event>(
      this.#endpoint(`/${id}/`),
      body
    ).pipe(
      tap(() => {
        this.events.reload();
        this.myEvents.reload();
        if (this.#activeEventId() === id) {
          this.activeEventResource.reload();
        }
      })
    );
  }

  public delete(event: Event): void {
    this.#httpClient.delete<void>(
      this.#endpoint(`/${event.id}/`)
    ).pipe(
      tap(() => {
        this.events.reload();
        this.myEvents.reload();
        this.#ticketGroups.ticketGroups.reload();
        this.#ticketGroups.activeSum.reload();
        this.#tickets.tickets.reload();
      })
    ).subscribe({
      next: () => {
        this.#toastr.info(
          event.name,
          'Event deleted',
          {
            progressBar: true
          }
        );
      },
      error: (err: HttpErrorResponse) => {
        this.#logging.error('events', 'Event deletion failed.', err);
        this.#toastr.error(
          `Error: ${errorMessage(err)}`,
          'Event wasn\'t deleted!',
          {
            progressBar: true,
          }
        );
      }
    });
  }
}
