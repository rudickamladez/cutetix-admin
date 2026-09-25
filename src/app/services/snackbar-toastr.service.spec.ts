import { TestBed } from '@angular/core/testing';
import { MatSnackBar, MatSnackBarRef, TextOnlySnackBar } from '@angular/material/snack-bar';
import { Subject } from 'rxjs';
import { SnackbarToastrService } from './snackbar-toastr.service';

describe('SnackbarToastrService', () => {
    let service: SnackbarToastrService;
    let snackBar: jasmine.SpyObj<MatSnackBar>;

    beforeEach(() => {
        snackBar = jasmine.createSpyObj<MatSnackBar>('MatSnackBar', ['open', 'dismiss']);
        snackBar.open.and.callFake(() => createSnackBarRef());

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

        expect(snackBar.open).toHaveBeenCalledWith(
            'Events: Saved',
            undefined,
            jasmine.objectContaining({
                duration: 5000,
                panelClass: ['snackbar-success'],
            }),
        );
    });

    it('keeps toast active until it is dismissed', () => {
        const toast = service.show('Updates are being applied.', 'Updates', { timeOut: 0 });

        expect(toast?.toastRef.isInactive()).toBeFalse();
        toast?.toastRef.close();
        expect(toast?.toastRef.isInactive()).toBeTrue();
    });
});

function createSnackBarRef(): MatSnackBarRef<TextOnlySnackBar> {
    const dismissed$ = new Subject<void>();
    const action$ = new Subject<void>();

    return {
        dismiss: () => dismissed$.next(),
        afterDismissed: () => dismissed$.asObservable(),
        onAction: () => action$.asObservable(),
    } as unknown as MatSnackBarRef<TextOnlySnackBar>;
}
