import { inject, Injectable } from '@angular/core';
import { StorageService } from './storage.service';
import { LoggingService } from './logging.service';
import { StorageKeys } from '../tokens/storage.tokens';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { mapBoolean } from '../utils/booleanMapper';

@Injectable({
  providedIn: 'root',
})
export class AdminModeService {
  readonly #logging = inject(LoggingService);
  readonly #storageService = inject(StorageService);

  readonly status = toSignal(this.#storageService.storageEvent$(StorageKeys.ADMIN_MODE).pipe(
    map(v => mapBoolean(v.currentValue)) 
  ), {
    initialValue: this.#storageService.getBoolean(StorageKeys.ADMIN_MODE) ,
  });

  constructor() {
    this.#storageService.setIfNull(StorageKeys.ADMIN_MODE, "false", () => {
      this.#logging.log("adminMode", `Set default initial value. Current value: ${this.status()}.`)
    });
  }

  on(): void {
    this.#storageService.set(StorageKeys.ADMIN_MODE, "true");
    this.#logging.log("adminMode", `Force ON. Current value: ${this.status()}.`);
  }
  
  off(): void {
    this.#storageService.set(StorageKeys.ADMIN_MODE, "false");
    this.#logging.log("adminMode", `Force OFF. Current value: ${this.status()}.`);
  }

  toggle(): void {
    this.#storageService.set(StorageKeys.ADMIN_MODE, String(!this.status()));
    this.#logging.log("adminMode", `Toggle. Current value: ${this.status()}.`);
  }
}
