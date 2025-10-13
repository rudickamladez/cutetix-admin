import { Injectable } from "@angular/core";

import { filter, fromEvent, map, merge, type Observable, Subject } from "rxjs";

import type { StorageKeys } from "../tokens/storage.tokens";

type CustomStorageEvent = {
  readonly currentValue: string | null;
  readonly action: CustomStorageEventAction;
  readonly key: string;
};

type CustomStorageEventAction = "create" | "update" | "delete";

@Injectable({
  providedIn: "root",
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
        }))
      ),
      this.#storageEventsFromThisWindow.pipe(filter(e => e.key === key))
    ).pipe(
      map(e => ({
        ...e,
        key,
      }))
    );
  }

  #actionMapper<T = string | null>(previous: T, current: T): CustomStorageEventAction {
    if (previous !== null) {
      return current !== null ? "update" : "delete";
    }
    return current !== null ? "create" : "delete";
  }

  get<T extends string = string>(key: StorageKeys, defaultValue?: T): T | null {
    return (localStorage.getItem(key) ?? defaultValue ?? null) as T | null;
  }

  getBoolean(key: StorageKeys, fallback = false): boolean {
    const v = this.get<any>(key);
    if (typeof v === "boolean") {
      return v;
    }
    if (typeof v === "number") {
      return v !== 0;
    }
    if (typeof v === "string") {
      const s = v.trim().toLowerCase();
      if (["true", "1", "yes", "y", "on"].includes(s)) {
        return true;
      }
      if (["false", "0", "no", "n", "off", ""].includes(s)) {
        return false;
      }
    }
    return fallback;
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

  setIfNull<T extends string = string>(key: StorageKeys, value: T): this {
    if (this.get(key) === null) {
      this.set(key, value);
    }
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
      key,
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
