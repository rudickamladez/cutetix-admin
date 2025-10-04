import { effect, inject, Injectable } from "@angular/core";

import { ToastrService } from "ngx-toastr";

import { equal } from "../utils/deepEqual";
import { LoggingService } from "./logging.service";
import type { User } from "../types/auth.types";
import { StorageKeys } from "../tokens/storage.tokens";
import { StorageService } from "./storage.service";
import { httpResource } from "@angular/common/http";

const API_PATH: string = "users";

@Injectable({
  providedIn: "root"
})
export class UsersService {
  readonly #toastr = inject(ToastrService);
  readonly #logging = inject(LoggingService);
  readonly #storageService = inject(StorageService);

  readonly user = httpResource<User>(
    () => new URL(`${API_PATH}/me/`, this.#storageService.get(StorageKeys.API_URL)!).href,
    {
      equal
    }
  );

  constructor() {
    effect(() => {
      this.#logging.log("user", "User changed:", this.user.value());
    });

    effect(() => {
      if (this.user.error()) {
        this.#logging.error("user", "Failed to fetch user data:", this.user.error());
        this.#toastr.error("Failed to fetch user data", "Error");
      }
    });
  }
}
