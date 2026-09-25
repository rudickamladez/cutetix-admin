import { Injectable, inject } from '@angular/core';
import { MatSnackBar, MatSnackBarRef, TextOnlySnackBar } from '@angular/material/snack-bar';
import { EMPTY, Observable, Subject, mapTo, of } from 'rxjs';
import { ActiveToast, IndividualConfig } from 'ngx-toastr';

@Injectable()
export class SnackbarToastrService {
    readonly #snackBar = inject(MatSnackBar);

    toastrConfig = {} as never;
    currentlyActive = 0;
    toasts: ActiveToast<unknown>[] = [];
    overlayContainer = undefined;
    previousToastMessage: string | undefined;
    #index = 0;

    show<C = unknown, ConfigPayload = unknown>(
        message?: string,
        title?: string,
        override?: Partial<IndividualConfig<ConfigPayload>>,
        type = 'info',
    ): ActiveToast<C> | null {
        const toastId = ++this.#index;
        const hidden$ = new Subject<void>();
        let inactive = false;

        const snackBarRef = this.#snackBar.open(
            this.#buildMessage(message, title),
            override?.closeButton ? 'Close' : undefined,
            {
                duration: this.#resolveDuration(override),
                horizontalPosition: 'end',
                verticalPosition: 'top',
                panelClass: [`snackbar-${type}`],
            },
        );

        snackBarRef.afterDismissed().subscribe(() => {
            inactive = true;
            hidden$.next();
            hidden$.complete();
            this.toasts = this.toasts.filter(toast => toast.toastId !== toastId);
            this.currentlyActive = this.toasts.length;
        });

        const toastRef = this.#createToastRef(snackBarRef, hidden$, () => inactive);
        const activeToast = {
            toastId,
            title: title ?? '',
            message: message ?? '',
            portal: null as never,
            toastRef: toastRef as never,
            onShown: of(void 0),
            onHidden: hidden$.asObservable(),
            onTap: snackBarRef.onAction().pipe(mapTo(void 0)),
            onAction: snackBarRef.onAction(),
        } as ActiveToast<C>;

        this.previousToastMessage = message;
        this.toasts.push(activeToast as ActiveToast<unknown>);
        this.currentlyActive = this.toasts.length;

        return activeToast;
    }

    success<ConfigPayload = unknown>(
        message?: string,
        title?: string,
        override?: Partial<IndividualConfig<ConfigPayload>>,
    ): ActiveToast<unknown> {
        return this.show(message, title, override, 'success') as ActiveToast<unknown>;
    }

    error<ConfigPayload = unknown>(
        message?: string,
        title?: string,
        override?: Partial<IndividualConfig<ConfigPayload>>,
    ): ActiveToast<unknown> {
        return this.show(message, title, override, 'error') as ActiveToast<unknown>;
    }

    info<ConfigPayload = unknown>(
        message?: string,
        title?: string,
        override?: Partial<IndividualConfig<ConfigPayload>>,
    ): ActiveToast<unknown> {
        return this.show(message, title, override, 'info') as ActiveToast<unknown>;
    }

    warning<ConfigPayload = unknown>(
        message?: string,
        title?: string,
        override?: Partial<IndividualConfig<ConfigPayload>>,
    ): ActiveToast<unknown> {
        return this.show(message, title, override, 'warning') as ActiveToast<unknown>;
    }

    clear(toastId?: number): void {
        if (toastId === undefined) {
            this.#snackBar.dismiss();
            return;
        }

        this.remove(toastId);
    }

    remove(toastId: number): boolean {
        const toast = this.toasts.find(item => item.toastId === toastId);
        if (!toast) {
            return false;
        }

        toast.toastRef.close();
        return true;
    }

    findDuplicate(title: string, message: string): ActiveToast<unknown> {
        return this.toasts.find(item => item.title === title && item.message === message) as ActiveToast<unknown>;
    }

    #buildMessage(message?: string, title?: string): string {
        if (title && message) {
            return `${title}: ${message}`;
        }

        return title || message || '';
    }

    #resolveDuration<ConfigPayload = unknown>(override?: Partial<IndividualConfig<ConfigPayload>>): number | undefined {
        if (override?.disableTimeOut === true || override?.timeOut === 0) {
            return undefined;
        }

        return override?.timeOut ?? 5000;
    }

    #createToastRef(
        snackBarRef: MatSnackBarRef<TextOnlySnackBar>,
        hidden$: Observable<void>,
        isInactive: () => boolean,
    ) {
        return {
            componentInstance: null as never,
            close: () => snackBarRef.dismiss(),
            manualClose: () => snackBarRef.dismiss(),
            manualClosed: () => hidden$,
            timeoutReset: () => EMPTY,
            countDuplicate: () => EMPTY,
            afterClosed: () => hidden$,
            isInactive,
            activate: () => undefined,
            afterActivate: () => of(void 0),
            onDuplicate: () => undefined,
        };
    }
}
