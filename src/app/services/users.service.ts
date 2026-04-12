import { HttpClient, httpResource } from "@angular/common/http";
import { effect, inject, Injectable } from "@angular/core";
import { ToastrService } from "ngx-toastr";

import { StorageKeys } from "../tokens/storage.tokens";
import type { User } from "../types/auth.types";
import { equal } from "../utils/deepEqual";
import { LoggingService } from "./logging.service";
import { StorageService } from "./storage.service";

const API_PATH = "users";

@Injectable()
export class UsersService {
  readonly #toastr = inject(ToastrService);
  readonly #logging = inject(LoggingService);
  readonly #storageService = inject(StorageService);
  readonly #httpClient = inject(HttpClient);

  readonly user = httpResource<User>(
    () => new URL(`${API_PATH}/me/`, this.#storageService.get(StorageKeys.API_URL)!).href,
    {
      equal,
    }
  );

  constructor() {
    effect(() => {
      this.#logging.log("user", "User changed:", this.user.value());
    });

    effect(() => {
      const err = this.user.error();
      if (!err) {
        return;
      }
      this.#logging.error("user", "Failed to fetch user data:", err);
      this.#toastr.error("Failed to fetch user data", "Error");
    });
  }

  isEventFavorited(eventId: string): boolean {
    const user = this.user.value();
    if (!user || !user.favorite_events) {
      return false;
    }

    return user.favorite_events.some(event => event.id === eventId);
  }

  toggleEventFavorite(eventId: string): void {
    if (this.isEventFavorited(eventId)) {
      this.removeEventFavorite(eventId);
      return;
    }

    this.addEventFavorite(eventId);
  }

  addEventFavorite(eventId: string) {
    const baseUrl = this.#storageService.get(StorageKeys.API_URL)!;
    const url = new URL(`${API_PATH}/me/favorite_events/${eventId}/`, baseUrl);

    return this.#httpClient.post(url.href, null).subscribe({
      next: () => {
        this.#toastr.success("Event added to favorites", "Success");
      },
      error: (err) => {
        this.#logging.error("user", "Failed to favorite event:", err);
        this.#toastr.error("Failed to favorite event", "Error");
      },
      complete: () => {
        this.user.reload();
      },
    });
  }

  removeEventFavorite(eventId: string) {
    const baseUrl = this.#storageService.get(StorageKeys.API_URL)!;
    const url = new URL(`${API_PATH}/me/favorite_events/${eventId}/`, baseUrl);

    return this.#httpClient.delete(url.href).subscribe({
      next: () => {
        this.#toastr.success("Event removed from favorites", "Success");
      },
      error: (err) => {
        this.#logging.error("user", "Failed to remove favorite event:", err);
        this.#toastr.error("Failed to remove favorite event", "Error");
      },
      complete: () => {
        this.user.reload();
      },
    });
  }
}
