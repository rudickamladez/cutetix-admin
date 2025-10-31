import { inject, Injectable } from "@angular/core";
import { SwUpdate } from "@angular/service-worker";

import type { ActiveToast } from "ngx-toastr";
import { ToastrService } from "ngx-toastr";
import { filter, interval } from "rxjs";

import { LoggingService } from "./logging.service";

@Injectable({
  providedIn: "root",
})
export class UpdateService {
  readonly #toastr = inject(ToastrService);
  readonly #updates = inject(SwUpdate);
  readonly #logging = inject(LoggingService);

  #toastRef?: ActiveToast<any>;

  constructor() {
    this.#updates.versionUpdates
      .pipe(filter(e => e.type === "VERSION_DETECTED"))
      .subscribe(() => {
        this.#logging.log(
          "swUpdate",
          "New version was detected on the server."
        );
        if (
          this.#toastRef === undefined ||
          this.#toastRef.toastRef.isInactive()
        ) {
          this.#toastRef = this.#toastr.show(
            "Updates are being applied. The application will be reloaded.",
            "Updates",
            {
              timeOut: 0,
            }
          );
        }
      });

    this.#updates.versionUpdates
      .pipe(filter(e => e.type === "VERSION_READY"))
      .subscribe(async () => {
        try {
          if (await this.#updates.activateUpdate()) {
            this.#logging.log(
              "swUpdate",
              "New version was activated. Refreshing."
            );
            window.location.reload();
            return;
          }
          // should not be reachable
          this.#logging.error(
            "swUpdate",
            "New version was not activated, because no new version was found."
          );
        } catch (e) {
          this.#logging.error(
            "swUpdate",
            "Application can not be activated.",
            e
          );
          this.#toastr.error(
            "The application failed to update. The application will be reloaded.",
            "Updates"
          );
          window.location.reload();
        }
      });

    if (this.#updates.isEnabled) {
      this.#logging.log(
        "swUpdate",
        "Service worker updates enabled. Starting checking for updates."
      );
      interval(30_000).subscribe(async () => {
        this.#logging.log("swUpdate", "Checking for updates.");
        try {
          if (await this.#updates.checkForUpdate()) {
            this.#logging.log(
              "swUpdate",
              "New version was found and is ready to be activated."
            );
            return;
          }
          this.#logging.log("swUpdate", "No new version was found.");
        } catch (error) {
          this.#logging.error(
            "swUpdate",
            "Error ocurred while checking for updates."
          );
        }
      });
    }
  }
}
