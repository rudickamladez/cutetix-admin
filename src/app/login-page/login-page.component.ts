import { Component, effect, inject, signal } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { debounce, email, form, required } from '@angular/forms/signals';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { StorageKeys } from '../tokens/storage.tokens';
import { StorageService } from '../services/storage.service';
import { faCircleNotch, faCog, faPersonCirclePlus, faSignInAlt } from '@fortawesome/free-solid-svg-icons';
import { UserRegister } from '../types/auth.types';

@Component({
  templateUrl: './login-page.component.html',
  styleUrls: ['./login-page.component.scss'],
  standalone: false,
})
export class LoginPageComponent {
  readonly #auth = inject(AuthService);
  readonly #router = inject(Router);
  readonly storageService = inject(StorageService);

  public loggingIn: boolean = false;
  public loginFailed: boolean = false;
  public errorText?: string;
  public loginForm = new FormGroup({
    username: new FormControl(''),
    password: new FormControl('')
  });

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
      required(schemaPath.email);
      email(schemaPath.email);

      required(schemaPath.username, { message: 'Username is required.' });
      required(schemaPath.full_name);
      required(schemaPath.plaintext_password);
    }
  );

  protected readonly canRun = signal(false);
  protected readonly showConfig = signal(false);
  readonly keys = StorageKeys;
  protected readonly mode = signal<'login' | 'register'>('login');

  // icons
  protected readonly loginIcon = faSignInAlt;
  protected readonly loadingIcon = faCircleNotch;
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

  protected loginWithPassword() {
    // Show loading spinner
    this.loggingIn = true;

    this.#auth.login(
      this.loginForm.value.username ?? '',
      this.loginForm.value.password ?? ''
    );

    // Hide loading spinner
    this.loggingIn = false;
  }

  public toggleConfigVisibility() {
    this.showConfig.update(value => !value);
  }

  protected register(event: Event) {
    event.preventDefault();
    
    this.#auth.register(this.registerModel());
  }

  protected toggleMode() {
    this.mode.update(mode => mode === 'login' ? 'register' : 'login');
  }
}
