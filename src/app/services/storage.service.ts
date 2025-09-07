import { Injectable } from "@angular/core";

import { fromEvent, filter, map, type Observable, merge, Subject } from "rxjs";
import { StorageKeys } from "../tokens/storage.tokens";

type CustomStorageEvent = {
  readonly currentValue: string | null;
  readonly action: CustomStorageEventAction;
  readonly key: string;
}

type CustomStorageEventAction = "create" | "update" | "delete";

@Injectable({
  providedIn: "root"
})
export class StorageService {
  #storageEventsFromThisWindow = new Subject<Omit<CustomStorageEvent, "key"> & { readonly key: string | null }>();

  storageEvent$(key: StorageKeys): Observable<CustomStorageEvent> {
    return merge(
      fromEvent<StorageEvent>(window, "storage").pipe(
        filter(e => e.key === key || e.key === null),
        map(e => ({
          currentValue: e.newValue,
          action: this.#actionMapper(e.oldValue, e.newValue),
          key: e.key,
        })),
      ),
      this.#storageEventsFromThisWindow.pipe(
        filter(e => e.key === key),
      ),
    ).pipe(map(e => ({
      ...e,
      key,
    })));
  }

  #actionMapper<T = string | null>(previous: T, current: T): CustomStorageEventAction {
    if (previous !== null) {
      return current !== null ? "update" : "delete";
    }
    return current !== null ? "create" : "delete";
  }

  get<T extends string = string>(key: StorageKeys): T | null {
    return localStorage.getItem(key) as T | null;
  }

  set<T extends string = string>(key: StorageKeys, value: T): this {
    const previousValue = localStorage.getItem(key);
    localStorage.setItem(key, value);
    const currentValue = localStorage.getItem(key);
    
    this.#storageEventsFromThisWindow.next({
      currentValue,
      action: this.#actionMapper(previousValue, currentValue),
      key,
    });
    return this;
  }

  delete(key: StorageKeys): this {
    const previousValue = localStorage.getItem(key);
    if (previousValue === null) {
      return this;
    }
    localStorage.removeItem(key);
    this.#storageEventsFromThisWindow.next({
      currentValue: null,
      action: "delete",
      key
    });
    return this;
  }

  clear(): void {
    localStorage.clear();
    this.#storageEventsFromThisWindow.next({
      currentValue: null,
      action: "delete",
      key: null,
    });
  }
}
