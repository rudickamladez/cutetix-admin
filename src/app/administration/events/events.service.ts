import { HttpClient, HttpResourceRef, httpResource } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Event, EventCapacitySummary, EventCreate } from './events.types';
import { StorageKeys } from 'src/app/tokens/storage.tokens';
import { StorageService } from 'src/app/services/storage.service';

@Injectable({
  providedIn: 'root'
})
export class EventService {
  readonly #httpClient = inject(HttpClient);
  readonly #storageService = inject(StorageService);

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
}
