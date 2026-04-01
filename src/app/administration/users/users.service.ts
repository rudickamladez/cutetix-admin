import { HttpClient, httpResource, HttpResourceRef } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { StorageService } from 'src/app/services/storage.service';
import { StorageKeys } from 'src/app/tokens/storage.tokens';
import { User, UserCreate, UserUpdate } from './users.types';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  readonly #httpClient = inject(HttpClient);
  readonly #storageService = inject(StorageService);

  readonly #apiPath = 'users';

  readonly users = httpResource<User[]>(
    () => this.#endpoint('/'),
    {
      defaultValue: [],
    }
  );

  constructor() {
    this.users.reload();
  }

  #endpoint(path: string): string {
    return new URL(`${this.#apiPath}${path}`, this.#storageService.get(StorageKeys.API_URL)!).href;
  }

  public userByIdResource(
    getId: () => string | null | undefined
  ): HttpResourceRef<User | undefined> {
    return httpResource<User>(() => {
      const id = getId();
      if (!id) {
        return undefined;
      }
      return this.#endpoint(`/${id}/`);
    });
  }

  public userByUsernameResource(
    username: () => string | null | undefined
  ): HttpResourceRef<User | undefined> {
    return httpResource<User | undefined>(() => {
      const usernameValue = username();
      if (!usernameValue) {
        return undefined;
      }
      return this.#endpoint(`/by-username/${usernameValue}/`);
    });
  }

  public create(
    user: UserCreate
  ): Observable<User> {
    return this.#httpClient.post<User>(
      this.#endpoint('/'),
      user
    ).pipe(
      tap(() => this.users.reload())
    );
  }

  public update(
    id: string,
    body: UserUpdate
  ): Observable<User> {
    return this.#httpClient.put<User>(
      this.#endpoint(`/${id}/`),
      body
    ).pipe(
      tap(() => this.users.reload())
    );
  }

  public delete(
    id: string
  ): Observable<void> {
    return this.#httpClient.delete<void>(
      this.#endpoint(`/${id}/`)
    ).pipe(
      tap(() => this.users.reload())
    );
  }
}
