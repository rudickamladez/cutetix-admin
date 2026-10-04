import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable, of, shareReplay, tap } from 'rxjs';
import { StorageKeys } from '../tokens/storage.tokens';
import { EventScope, EventUserScope, EventUserScopesReplace } from '../types/event-permissions.types';
import { AuthService } from './auth.service';
import { StorageService } from './storage.service';

type EventId = number | string;

@Injectable({
  providedIn: 'root'
})
export class EventPermissionsService {
  readonly #httpClient = inject(HttpClient);
  readonly #authService = inject(AuthService);
  readonly #storageService = inject(StorageService);

  readonly #myScopesCache = new Map<string, Observable<EventUserScope[]>>();

  #endpoint(eventId: EventId, path = ''): string {
    const encodedEventId = encodeURIComponent(eventId.toString());
    return new URL(
      `events/${encodedEventId}/scopes${path}`,
      this.#storageService.get(StorageKeys.API_URL)!
    ).href;
  }

  getMyScopes(eventId: EventId): Observable<EventUserScope[]> {
    const cacheKey = eventId.toString();
    const cachedScopes = this.#myScopesCache.get(cacheKey);
    if (cachedScopes) {
      return cachedScopes;
    }

    const scopes = this.#httpClient.get<EventUserScope[]>(
      this.#endpoint(eventId, '/me')
    ).pipe(
      shareReplay({ bufferSize: 1, refCount: false })
    );
    this.#myScopesCache.set(cacheKey, scopes);
    return scopes;
  }

  getScopes(eventId: EventId): Observable<EventUserScope[]> {
    return this.#httpClient.get<EventUserScope[]>(this.#endpoint(eventId));
  }

  getUserScopes(eventId: EventId, userId: string): Observable<EventUserScope[]> {
    return this.#httpClient.get<EventUserScope[]>(
      this.#endpoint(eventId, `/${encodeURIComponent(userId)}`)
    );
  }

  replaceUserScopes(
    eventId: EventId,
    userId: string,
    scopes: EventScope[]
  ): Observable<EventUserScope[]> {
    const body: EventUserScopesReplace = { scopes };
    return this.#httpClient.put<EventUserScope[]>(
      this.#endpoint(eventId, `/${encodeURIComponent(userId)}`),
      body
    ).pipe(
      tap(() => this.invalidateMyScopes(eventId))
    );
  }

  grantScope(
    eventId: EventId,
    userId: string,
    scope: EventScope
  ): Observable<EventUserScope> {
    return this.#httpClient.put<EventUserScope>(
      this.#endpoint(
        eventId,
        `/${encodeURIComponent(userId)}/${encodeURIComponent(scope)}`
      ),
      null
    ).pipe(
      tap(() => this.invalidateMyScopes(eventId))
    );
  }

  revokeScope(
    eventId: EventId,
    userId: string,
    scope: EventScope
  ): Observable<void> {
    return this.#httpClient.delete<void>(
      this.#endpoint(
        eventId,
        `/${encodeURIComponent(userId)}/${encodeURIComponent(scope)}`
      )
    ).pipe(
      tap(() => this.invalidateMyScopes(eventId))
    );
  }

  hasGlobalScope(scope: EventScope): boolean {
    return this.#authService.hasScope(scope);
  }

  hasEventScope(eventId: EventId, scope: EventScope): Observable<boolean> {
    return this.getMyScopes(eventId).pipe(
      map(scopes => scopes.some(eventScope => eventScope.scope === scope))
    );
  }

  canForEvent(eventId: EventId, scope: EventScope): Observable<boolean> {
    if (this.hasGlobalScope(scope)) {
      return of(true);
    }
    return this.hasEventScope(eventId, scope);
  }

  invalidateMyScopes(eventId?: EventId): void {
    if (eventId === undefined) {
      this.#myScopesCache.clear();
      return;
    }
    this.#myScopesCache.delete(eventId.toString());
  }

  refreshMyScopes(eventId: EventId): Observable<EventUserScope[]> {
    this.invalidateMyScopes(eventId);
    return this.getMyScopes(eventId);
  }
}
