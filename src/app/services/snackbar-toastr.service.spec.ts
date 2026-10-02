import { TestBed } from '@angular/core/testing';
import { MAT_SNACK_BAR_DATA, MatSnackBar, MatSnackBarRef } from '@angular/material/snack-bar';
import { Subject } from 'rxjs';
import { SnackbarToastComponent } from './snackbar-toast.component';
import { SnackbarToastrService } from './snackbar-toastr.service';

describe('SnackbarToastrService', () => {
    let service: SnackbarToastrService;
    let snackBar: jasmine.SpyObj<MatSnackBar>;

    beforeEach(() => {
        snackBar = jasmine.createSpyObj<MatSnackBar>('MatSnackBar', ['openFromComponent', 'dismiss']);
        snackBar.openFromComponent.and.callFake(() => createSnackBarRef() as never);

        TestBed.configureTestingModule({
            providers: [
                SnackbarToastrService,
                { provide: MatSnackBar, useValue: snackBar },
            ],
        });

        service = TestBed.inject(SnackbarToastrService);
    });

    it('shows success toast with snackbar success class', () => {
        service.success('Saved', 'Events');

        expect(snackBar.openFromComponent).toHaveBeenCalledWith(
            SnackbarToastComponent,
            jasmine.objectContaining({
                data: 'Events: Saved',
                duration: 5000,
                panelClass: ['snackbar-success'],
            }),
        );
    });

    it('includes a close action when requested', () => {
        service.success('Saved', 'Events', { closeButton: true });

        expect(snackBar.openFromComponent).toHaveBeenCalledWith(
            SnackbarToastComponent,
            jasmine.objectContaining({ action: 'Close' }),
        );
    });

    it('keeps toast active until it is dismissed', () => {
        const toast = service.show('Updates are being applied.', 'Updates', { timeOut: 0 });

        expect(toast?.toastRef.isInactive()).toBeFalse();
        toast?.toastRef.close();
        expect(toast?.toastRef.isInactive()).toBeTrue();
    });
});

describe('SnackbarToastComponent', () => {
    it('dismisses the snackbar when clicked', () => {
        const snackBarRef = jasmine.createSpyObj<MatSnackBarRef<SnackbarToastComponent>>('MatSnackBarRef', ['dismiss']);

        TestBed.configureTestingModule({
            imports: [SnackbarToastComponent],
            providers: [
                { provide: MAT_SNACK_BAR_DATA, useValue: 'Saved' },
                { provide: MatSnackBarRef, useValue: snackBarRef },
            ],
        });

        const fixture = TestBed.createComponent(SnackbarToastComponent);
        fixture.nativeElement.click();

        expect(snackBarRef.dismiss).toHaveBeenCalled();
    });
});

function createSnackBarRef(): MatSnackBarRef<SnackbarToastComponent> {
    const dismissed$ = new Subject<void>();
    const action$ = new Subject<void>();

    return {
        dismiss: () => dismissed$.next(),
        afterDismissed: () => dismissed$.asObservable(),
        onAction: () => action$.asObservable(),
    } as unknown as MatSnackBarRef<SnackbarToastComponent>;
}
