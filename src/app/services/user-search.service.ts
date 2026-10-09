import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { StorageKeys } from '../tokens/storage.tokens';
import { UserSearchResult } from '../types/user-search.types';
import { StorageService } from './storage.service';

@Injectable({
  providedIn: 'root'
})
export class UserSearchService {
  readonly #httpClient = inject(HttpClient);
  readonly #storageService = inject(StorageService);

  search(query: string): Observable<UserSearchResult[]> {
    const endpoint = new URL(
      'users/search',
      this.#storageService.get(StorageKeys.API_URL)!
    ).href;
    return this.#httpClient.get<UserSearchResult[]>(endpoint, {
      params: { q: query }
    });
  }
}
