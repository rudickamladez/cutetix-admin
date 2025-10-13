import { Injectable, signal } from "@angular/core";

@Injectable({
  providedIn: "root",
})
export class VisibilityService {
  readonly #visible = signal(!document.hidden);
  readonly visible = this.#visible.asReadonly();

  constructor() {
    document.addEventListener("visibilitychange", () => {
      this.#visibilitychange();
    });
  }

  #visibilitychange(): void {
    this.#visible.set(!document.hidden);
  }
}
