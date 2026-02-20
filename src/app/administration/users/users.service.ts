import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { StorageService } from 'src/app/services/storage.service';
import { StorageKeys } from 'src/app/tokens/storage.tokens';
import { AdministrationUser, AdministrationUserCreate } from './users.types';

@Injectable({
  providedIn: 'root'
})
export class AdministrationUsersService {
  readonly #httpClient = inject(HttpClient);
  readonly #storageService = inject(StorageService);
  readonly #apiPath = 'users';

  private endpoint(path = ''): string {
    const suffix = path.length > 0 ? `/${path}` : '/';
    return new URL(`${this.#apiPath}${suffix}`, this.#storageService.get(StorageKeys.API_URL)!).href;
  }

  public get(): Observable<AdministrationUser[]> {
    return this.#httpClient.get<AdministrationUser[]>(
      this.endpoint('')
    );
  }

  public getByUsername(username: string): Observable<AdministrationUser> {
    return this.#httpClient.get<AdministrationUser>(
      this.endpoint(`by-username/${encodeURIComponent(username)}`)
    );
  }

  public create(body: AdministrationUserCreate): Observable<AdministrationUser> {
    return this.#httpClient.post<AdministrationUser>(
      this.endpoint(''),
      body
    );
  }

  public update(id: string, body: AdministrationUser): Observable<AdministrationUser> {
    return this.#httpClient.put<AdministrationUser>(
      this.endpoint(`${encodeURIComponent(id)}`),
      body
    );
  }

  public delete(id: string): Observable<void> {
    return this.#httpClient.delete<void>(
      this.endpoint(`${encodeURIComponent(id)}`)
    );
  }
}
