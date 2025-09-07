import { Component, effect, inject, OnDestroy, signal } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { AuthService } from '../services/auth.service';

@Component({
  templateUrl: './login-page.component.html',
  styleUrls: ['./login-page.component.scss']
})
export class LoginPageComponent {
  readonly #auth = inject(AuthService);
  readonly #router = inject(Router);

  public loggingIn: boolean = false;
  public loginFailed: boolean = false;
  public errorText?: string;
  public loginForm = new FormGroup({
    username: new FormControl(''),
    password: new FormControl('')
  });

  protected readonly canRun = signal(false);

  constructor() {
    // Check if browser is chromium based and version >= 132
    if (environment.BROWSER_CORE_CHECK === false) {
      this.canRun.set(true);
    } else {
      // eslint-disable-next-line  @typescript-eslint/no-explicit-any
      const brands = (navigator as any).userAgentData?.brands as { brand: string, version: string }[] | undefined;
      if (brands && brands.some(({ brand, version }) => brand === "Chromium" && Number(version) >= 132)) {
        this.canRun.set(true);
      } else {
        this.errorText = "Your browser is not supported. Please use a Chromium-based browser (Chrome, Edge, Opera, Brave) with version 132 or higher.";
        this.canRun.set(false);
      }
    }


    if (this.#auth.isLoggedIn()) {
      this.#router.navigate(["/dashboard"]);
    }

    effect(() => {
      const canGoToPrivate = this.#auth.canGoToPrivate();
      if (canGoToPrivate) {
        this.#router.navigate(["/dashboard"]);
      }
    });
  }

  protected loginWithPassword() {
    // Show loading spinner
    this.loggingIn = true;

    this.#auth.login(
      this.loginForm.value.username ?? '',
      this.loginForm.value.password ?? ''
    );
  }

}
