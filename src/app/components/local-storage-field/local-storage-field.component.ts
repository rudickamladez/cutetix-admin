import type { OnDestroy, OnInit } from "@angular/core";
import { ChangeDetectionStrategy, Component, inject, Input } from "@angular/core";
import { FormControl } from "@angular/forms";

import { debounceTime, distinctUntilChanged, Subject, takeUntil } from "rxjs";
import type { StorageKeys } from "src/app/tokens/storage.tokens";

import { StorageService } from "../../services/storage.service";

@Component({
  selector: "app-local-storage-field",
  templateUrl: "./local-storage-field.component.html",
  styleUrls: ["./local-storage-field.component.scss"],
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LocalStorageFieldComponent implements OnInit, OnDestroy {
  readonly #storageService = inject(StorageService);
  private destroy$ = new Subject<void>();

  @Input({ required: true }) key!: StorageKeys;
  @Input() label = "Value";
  @Input() type: "text" | "password" | "url" | "checkbox" = "text";
  @Input() placeholder?: string;
  @Input() autocomplete: string = "off";
  @Input() autosaveDebounce = 400;
  @Input() autosave = false;

  ctrl = new FormControl<string | boolean>("", { nonNullable: true });
  dirty = false;
  status = "";
  cid = ""; // ID for label

  get isCheckbox() {
    return this.type === "checkbox";
  }

  ngOnInit(): void {
    // create ID when we know the key value
    this.cid = `lsf_${String(this.key)}_${Math.random().toString(36).slice(2, 8)}`;

    const stored = this.#storageService.get(this.key);
    const initial = this.isCheckbox ? this.#toBool(stored) : (stored ?? "");
    this.ctrl.setValue(initial as any, { emitEvent: false });

    const delay = this.autosave ? (this.isCheckbox ? 0 : this.autosaveDebounce) : 0;

    this.ctrl.valueChanges
      .pipe(debounceTime(delay), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(val => {
        this.dirty = true;
        if (!this.autosave) {
          return;
        }
        this.write(val);
      });

    this.#storageService
      .storageEvent$(this.key)
      .pipe(takeUntil(this.destroy$))
      .subscribe(e => {
        const incoming = this.isCheckbox ? this.#toBool(e.currentValue) : (e.currentValue ?? "");
        if (this.ctrl.value !== incoming) {
          this.ctrl.setValue(incoming as any, { emitEvent: false });
          this.dirty = false;
          this.flashStatus(e.action === "delete" ? "Deleted from storage" : "Updated from storage");
        }
      });
  }

  saveNow() {
    this.write(this.ctrl.value);
  }

  resetToStored() {
    const current = this.#storageService.get(this.key);
    const val = this.isCheckbox ? this.#toBool(current) : (current ?? "");
    this.ctrl.setValue(val as any, { emitEvent: false });
    this.dirty = false;
    this.flashStatus("Reverted to stored value");
  }

  // TODO
  // resetToEnv() {
  //   const current = StorageKeysToENV[this.key] ?? '';
  //   this.ctrl.setValue(current, { emitEvent: false });
  //   this.dirty = false;
  //   this.flashStatus('Reverted to ENV value');
  // }

  private write(val: string | boolean | null | undefined) {
    if (this.isCheckbox) {
      const b = this.#toBool(val);
      this.#storageService.set(this.key, b ? "true" : "false"); // kompatibilně jako string
    } else {
      this.#storageService.set(this.key, (val ?? "").toString());
    }
    this.dirty = false;
    this.flashStatus("Saved");
  }

  private flashStatus(text: string) {
    this.status = text;
    setTimeout(() => (this.status = ""), 1200);
  }

  #toBool(v: unknown): boolean {
    if (typeof v === "boolean") {
      return v;
    }
    if (typeof v === "number") {
      return v !== 0;
    }
    if (typeof v === "string") {
      const s = v.trim().toLowerCase();
      if (["true", "1", "yes", "y", "on"].includes(s)) {
        return true;
      }
      if (["false", "0", "no", "n", "off", ""].includes(s)) {
        return false;
      }
    }
    return false;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
