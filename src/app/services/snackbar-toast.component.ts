import { Component, inject } from '@angular/core';
import { MAT_SNACK_BAR_DATA, MatSnackBarRef } from '@angular/material/snack-bar';

@Component({
    selector: 'app-snackbar-toast',
    template: '{{ message }}',
    host: {
        '(click)': 'dismiss()',
        '(keydown.enter)': 'dismiss()',
        '(keydown.space)': 'dismiss()',
        '[attr.role]': '"button"',
        '[attr.tabindex]': '0',
        '[style.display]': '"block"',
        '[style.width]': '"100%"',
        '[style.cursor]': '"pointer"',
    },
})
export class SnackbarToastComponent {
    readonly message = inject<string>(MAT_SNACK_BAR_DATA);
    readonly #snackBarRef = inject<MatSnackBarRef<SnackbarToastComponent>>(MatSnackBarRef);

    dismiss(): void {
        this.#snackBarRef.dismiss();
    }
}
