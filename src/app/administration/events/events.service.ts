import { HttpClient, HttpResourceRef, httpResource, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Event, EventCapacitySummary, EventCreate } from './events.types';
import { StorageKeys } from 'src/app/tokens/storage.tokens';
import { StorageService } from 'src/app/services/storage.service';
import { SnackbarToastrService } from '../../services/snackbar-toastr.service';

@Injectable({
  providedIn: 'root'
})
export class EventService {
  readonly #API_PATH = 'events';
  
  readonly #httpClient = inject(HttpClient);

  readonly #storageService = inject(StorageService);
  readonly #toastr = inject(SnackbarToastrService);

  readonly #apiPath = 'events';

  readonly events = httpResource<Event[]>(
    () => this.#endpoint('/'),
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
      tap(() => this.events.reload())
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
      tap(() => this.events.reload())
    );
  }

  public delete(
    event: Event,
    shouldConfirm = true,
  ): void {
    if (shouldConfirm && !confirm(`Are you sure to delete event "${event.name}"?`)) {
      return;
    }
    this.#httpClient.delete<void>(
      this.#endpoint(`/${event.id}/`)
    ).pipe(
      tap(() => this.events.reload())
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
        console.error(err);
        this.#toastr.error(
          `Error: ${err.message}`,
          'Event wasn\'t deleted!',
          {
            progressBar: true,
          }
        );
      }
    });
  }
}
