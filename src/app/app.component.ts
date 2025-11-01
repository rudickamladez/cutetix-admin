import type { OnInit } from "@angular/core";
import { Component, inject, isDevMode } from "@angular/core";
import { Title } from "@angular/platform-browser";

import { environment } from "src/environments/environment";

import { StorageService } from "./services/storage.service";
import { UpdateService } from "./services/update.service";
import { StorageKeys } from "./tokens/storage.tokens";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  standalone: false,
})
export class AppComponent implements OnInit {
  readonly #storageService = inject(StorageService);
  readonly #updateService = inject(UpdateService);
  readonly #titleService = inject(Title);

  ngOnInit(): void {
    if (isDevMode()) {
      this.#titleService.setTitle(`DEV ${this.#titleService.getTitle()}`);
    }

    this.#storageService.setIfNull(
      StorageKeys.API_URL,
      environment.backend.api
    );
    this.#storageService.setIfNull(
      StorageKeys.BROWSER_CORE_CHECK,
      environment.BROWSER_CORE_CHECK.toString()
    );
  }
}
