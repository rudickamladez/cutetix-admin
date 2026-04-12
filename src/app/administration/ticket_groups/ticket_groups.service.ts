import { HttpClient, HttpResourceRef, httpResource } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { TicketGroup, TicketGroupSum, TicketGroupUpdate } from './ticket_groups.types';
import { StorageService } from 'src/app/services/storage.service';
import { StorageKeys } from 'src/app/tokens/storage.tokens';

@Injectable({
  providedIn: 'root'
})
export class TicketGroupService {
  readonly #httpClient = inject(HttpClient);
  readonly #storageService = inject(StorageService);

  readonly #apiPath = 'ticket_groups';

  readonly ticketGroups = httpResource<TicketGroup[]>(
    () => this.#endpoint('/'),
    {
      defaultValue: [],
    }
  );

  readonly activeSum = httpResource<TicketGroupSum>(
    () => this.#endpoint('/active/sum/')
  );

  constructor() {
    this.ticketGroups.reload();
    this.activeSum.reload();
  }

  #endpoint(path: string): string {
    return new URL(`${this.#apiPath}${path}`, this.#storageService.get(StorageKeys.API_URL)!).href;
  }

  public ticketGroupByIdResource(
    getId: () => string | null | undefined
  ): HttpResourceRef<TicketGroup | undefined> {
    return httpResource<TicketGroup>(() => {
      const id = getId();
      if (!id) {
        return undefined;
      }
      return this.#endpoint(`/${id}/`);
    });
  }

  public create(ticket_group: TicketGroup): Observable<TicketGroup> {
    return this.#httpClient.post<TicketGroup>(
      this.#endpoint('/'),
      ticket_group
    ).pipe(
      tap(() => {
        this.ticketGroups.reload();
        this.activeSum.reload();
      })
    );
  }

  public update(
    id: string,
    body: TicketGroupUpdate
  ): Observable<TicketGroup> {
    return this.#httpClient.put<TicketGroup>(
      this.#endpoint(`/${id}/`),
      body
    ).pipe(
      tap(() => {
        this.ticketGroups.reload();
        this.activeSum.reload();
      })
    );
  }

  public delete(id: string): Observable<void> {
    return this.#httpClient.delete<void>(
      this.#endpoint(`/${id}/`),
    ).pipe(
      tap(() => {
        this.ticketGroups.reload();
        this.activeSum.reload();
      })
    );
  }
}
