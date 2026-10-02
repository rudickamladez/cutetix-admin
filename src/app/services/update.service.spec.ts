import { TestBed } from "@angular/core/testing";
import { DOCUMENT } from "@angular/common";
import { SwUpdate } from "@angular/service-worker";
import { Subject } from "rxjs";
import { LoggingService } from "./logging.service";
import { SnackbarToastrService } from "./snackbar-toastr.service";
import { UpdateService } from "./update.service";

describe("UpdateService", () => {
    it("reloads the page when a new version is ready", () => {
        const versionUpdates = new Subject<{ type: string }>();
        const updates = {
            versionUpdates,
            isEnabled: false,
            activateUpdate: jasmine.createSpy("activateUpdate"),
        };
        const reload = jasmine.createSpy("reload");

        TestBed.configureTestingModule({
            providers: [
                UpdateService,
                { provide: SwUpdate, useValue: updates },
                { provide: DOCUMENT, useValue: { defaultView: { location: { reload } } } },
                { provide: LoggingService, useValue: jasmine.createSpyObj("LoggingService", ["log", "error"]) },
                { provide: SnackbarToastrService, useValue: jasmine.createSpyObj("SnackbarToastrService", ["show", "error"]) },
            ],
        });

        TestBed.inject(UpdateService);
        versionUpdates.next({ type: "VERSION_READY" });

        expect(reload).toHaveBeenCalled();
        expect(updates.activateUpdate).not.toHaveBeenCalled();
    });
});
