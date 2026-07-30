import { Component, effect, inject, signal } from '@angular/core';
import { debounce, email, form, required, submit, FormField } from '@angular/forms/signals';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { StorageKeys } from '../tokens/storage.tokens';
import { StorageService } from '../services/storage.service';
import { faCog, faPersonCirclePlus, faSignInAlt } from '@fortawesome/free-solid-svg-icons';
import { UserLogin, UserRegister } from '../types/auth.types';
import { ReactiveFormsModule } from '@angular/forms';
import { NgClass } from '@angular/common';
import { LocalStorageFieldComponent } from '../components/local-storage-field/local-storage-field.component';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { CopyrightComponent } from '../components/copyright/copyright.component';

@Component({
    templateUrl: './login-page.component.html',
    styleUrls: ['./login-page.component.scss'],
    imports: [
        ReactiveFormsModule,
        FormField,
        NgClass,
        LocalStorageFieldComponent,
        FaIconComponent,
        CopyrightComponent,
    ],
})
export class LoginPageComponent {
  readonly #auth = inject(AuthService);
  readonly #router = inject(Router);
  readonly storageService = inject(StorageService);

  protected errorText?: string;

  protected loginModel = signal<UserLogin>({
    username: '',
    password: '',
  });
  protected loginForm = form(
    this.loginModel,
    (schemaPath) => {
      required(schemaPath.username, { message: 'Username is required.' });
      required(schemaPath.password, { message: 'Password is required.' });
    }
  );

  protected registerModel = signal<UserRegister>({
    email: '',
    username: '',
    full_name: '',
    plaintext_password: '',
  });
  protected registerForm = form(
    this.registerModel,
    (schemaPath) => {
      debounce(schemaPath.email, 500);
      required(schemaPath.email, { message: 'Email is required.' });
      email(schemaPath.email);

      required(schemaPath.username, { message: 'Username is required.' });
      required(schemaPath.full_name, { message: 'Full name is required.' });
      required(schemaPath.plaintext_password, { message: 'Password is required.' });
    }
  );

  protected readonly canRun = signal(false);
  protected readonly showConfig = signal(false);
  readonly keys = StorageKeys;
  protected readonly mode = signal<'login' | 'register'>('login');

  // icons
  protected readonly loginIcon = faSignInAlt;
  protected readonly settingsIcon = faCog;
  protected readonly registerIcon = faPersonCirclePlus;


  constructor() {
    // Check if browser is chromium based and version >= 132
    if (this.storageService.getBoolean(StorageKeys.BROWSER_CORE_CHECK) === false) {
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

    effect(() => {
      const canGoToPrivate = this.#auth.canGoToPrivate();
      if (canGoToPrivate) {
        this.#router.navigate(["/dashboard"]);
      }
    });
  }

  protected login(event: Event) {
    event.preventDefault();

    submit(this.loginForm, async () => {
      await this.#auth.login(
        this.loginModel().username,
        this.loginModel().password,
      );
    });
  }

  protected register(event: Event) {
    event.preventDefault();

    submit(this.registerForm, async () => {
      await this.#auth.register(this.registerModel());
    });
  }

  protected toggleMode() {
    this.mode.update(mode => mode === 'login' ? 'register' : 'login');
  }

  public toggleConfigVisibility() {
    this.showConfig.update(value => !value);
  }
}
