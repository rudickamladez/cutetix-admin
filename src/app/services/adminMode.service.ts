import { inject, Injectable } from '@angular/core';
import { StorageService } from './storage.service';
import { LoggingService } from './logging.service';
import { StorageKeys } from '../tokens/storage.tokens';

@Injectable({
  providedIn: 'root',
})
export class AdminModeService {
  readonly #logging = inject(LoggingService);
  readonly #storageService = inject(StorageService);

  constructor() {
    if (this.#storageService.get(StorageKeys.ADMIN_MODE) == null) {
      this.off(true);
      this.#logging.log("adminMode", `Set default initial value. Current value: ${this.status()}.`)
    }
  }

  status(): boolean {
    return this.#storageService.get(StorageKeys.ADMIN_MODE) == String(true);
  }

  on(silent: boolean = false): void {
    this.#storageService.set(StorageKeys.ADMIN_MODE, String(true));
    if (!silent) {
      this.#logging.log("adminMode", `Force ON. Current value: ${this.status()}.`);
    }
  }
  
  off(silent: boolean = false): void {
    this.#storageService.set(StorageKeys.ADMIN_MODE, String(false));
    if (!silent) {
      this.#logging.log("adminMode", `Force OFF. Current value: ${this.status()}.`);
    }
  }

  toggle(): void {
    this.#storageService.set(StorageKeys.ADMIN_MODE, String(!this.status()));
    this.#logging.log("adminMode", `Toggle. Current value: ${this.status()}.`);
  }
}
