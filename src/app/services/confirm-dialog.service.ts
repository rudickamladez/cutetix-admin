import { inject, Injectable } from '@angular/core';
import { Dialog } from '@angular/cdk/dialog';
import { map, Observable } from 'rxjs';
import { ConfirmDialogComponent } from '../components/confirm-dialog/confirm-dialog.component';
import { ConfirmDialogData } from '../components/confirm-dialog/confirm-dialog.types';

@Injectable({ providedIn: 'root' })
export class ConfirmDialogService {
  readonly #dialog = inject(Dialog);

  confirm(data: ConfirmDialogData): Observable<boolean> {
    return this.#dialog.open<boolean, ConfirmDialogData, ConfirmDialogComponent>(
      ConfirmDialogComponent,
      {
        data,
        role: 'alertdialog',
        ariaLabelledBy: 'confirm-dialog-title',
        ariaDescribedBy: 'confirm-dialog-message',
        autoFocus: 'first-tabbable',
        panelClass: 'confirm-dialog-panel',
      },
    ).closed.pipe(map((result) => result === true));
  }
}
