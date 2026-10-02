import { Injectable, inject } from "@angular/core";
import { DOCUMENT } from "@angular/common";
import { SwUpdate } from "@angular/service-worker";
import { SnackbarToast, SnackbarToastrService } from './snackbar-toastr.service';
import { filter, interval } from "rxjs";
import { LoggingService } from "./logging.service";

@Injectable({
    providedIn: "root"
})
export class UpdateService {
    readonly #toastr = inject(SnackbarToastrService);
    readonly #updates = inject(SwUpdate);
    readonly #logging = inject(LoggingService);
    readonly #document = inject(DOCUMENT);

    #toastRef: SnackbarToast<any> | null = null;

    constructor() {
        this.#updates.versionUpdates
            .pipe(
                filter(e => e.type === "VERSION_DETECTED"))
            .subscribe(() => {
                this.#logging.log("swUpdate", "New version was detected on the server.");
                if (this.#toastRef === null || this.#toastRef.toastRef.isInactive()) {
                    this.#toastRef = this.#toastr.show("Updates are being applied. The application will be reloaded.", "Updates", {
                        timeOut: 0,
                    });
                }
            });

        this.#updates.versionUpdates
            .pipe(
                filter(e => e.type === "VERSION_READY"))
            .subscribe(() => {
                this.#logging.log("swUpdate", "New version is ready. Reloading.");
                this.#document.defaultView?.location.reload();
            });

        if (this.#updates.isEnabled) {
            this.#logging.log("swUpdate", "Service worker updates enabled. Starting checking for updates.");
            interval(30_000).subscribe(async () => {
                this.#logging.log("swUpdate", "Checking for updates.");
                try {
                    if (await this.#updates.checkForUpdate()) {
                        this.#logging.log("swUpdate", "New version was found and is ready to be activated.");
                        return;
                    }
                    this.#logging.log("swUpdate", "No new version was found.");
                } catch (error) {
                    this.#logging.error("swUpdate", "Error ocurred while checking for updates.");
                }
            });
        }
    }
}
