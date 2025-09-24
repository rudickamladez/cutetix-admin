import { Component, Input, OnDestroy, ChangeDetectionStrategy, inject } from '@angular/core';
import { FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged, Subject, takeUntil } from 'rxjs';
import { StorageService } from '../../services/storage.service';
import { StorageKeys } from 'src/app/tokens/storage.tokens';

@Component({
  selector: 'app-local-storage-field',
  templateUrl: './component.html',
  styleUrls: ['./component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LocalStorageFieldComponent implements OnDestroy {
  readonly #storageService = inject(StorageService);
  private destroy$ = new Subject<void>();

  /** Required: the storage key */
  @Input({ required: true }) key!: StorageKeys;

  /** Label shown above the field */
  @Input() label = 'Value';
  /** Input type */
  @Input() type: 'text' | 'password' | 'url' = 'text';
  /** Placeholder text */
  @Input() placeholder?: string;
  /** Autocomplete attribute */
  @Input() autocomplete?: string = "off";
  /** Debounce (ms) for auto-save */
  @Input() autosaveDebounce = 400;
  /** Enable/disable auto-save */
  @Input() autosave: boolean = false;

  ctrl = new FormControl<string>('', { nonNullable: true });
  dirty = false;
  status = '';

  ngOnInit(): void {
    // Initialize from localStorage
    const initial = this.#storageService.get(this.key) ?? '';
    this.ctrl.setValue(initial, { emitEvent: false });

    // Auto-save on changes
    this.ctrl.valueChanges
      .pipe(
        debounceTime(this.autosave ? this.autosaveDebounce : 0),
        distinctUntilChanged(),
        takeUntil(this.destroy$),
      )
      .subscribe(val => {
        this.dirty = true;
        if (!this.autosave) return;
        this.write(val ?? '');
      });

    // React to storage events (other tabs/windows)
    this.#storageService.storageEvent$(this.key)
      .pipe(takeUntil(this.destroy$))
      .subscribe(e => {
        const incoming = e.currentValue ?? '';
        if (this.ctrl.value !== incoming) {
          this.ctrl.setValue(incoming, { emitEvent: false });
          this.dirty = false;
          this.flashStatus(e.action === 'delete' ? 'Deleted from storage' : 'Updated from storage');
        }
      });
  }

  saveNow() {
    this.write(this.ctrl.value ?? '');
  }

  resetToStored() {
    const current = this.#storageService.get(this.key) ?? '';
    this.ctrl.setValue(current, { emitEvent: false });
    this.dirty = false;
    this.flashStatus('Reverted to stored value');
  }

  private write(val: string) {
    this.#storageService.set(this.key, val);
    this.dirty = false;
    this.flashStatus('Saved');
  }

  private flashStatus(text: string) {
    this.status = text;
    setTimeout(() => (this.status = ''), 1200);
  }

  ngOnDestroy(): void {
    this.destroy$.next(); this.destroy$.complete();
  }
}
