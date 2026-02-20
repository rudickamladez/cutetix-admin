import { Component, inject } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { AdministrationUsersService } from '../users.service';
import { AdministrationUser, AdministrationUserCreate } from '../users.types';

@Component({
  selector: 'app-users-form',
  templateUrl: './users-form.component.html',
  styleUrls: ['./users-form.component.scss'],
  standalone: false
})
export class UsersFormComponent {
  readonly #router = inject(Router);
  readonly #route = inject(ActivatedRoute);
  readonly #usersService = inject(AdministrationUsersService);
  readonly #toastr = inject(ToastrService);
  readonly #formBuilder = inject(FormBuilder);

  public readonly isCreateMode = this.#router.url.includes('/add');
  public readonly isDetailMode = this.#router.url.includes('/detail/');
  public username: string | null = null;
  public loadingState = 1;
  public errorLoading = {
    enabled: false,
    text: '',
  };
  public title = this.isCreateMode ? 'New user' : this.isDetailMode ? 'User detail' : 'User edit';
  public submitButtonEnabled = !this.isDetailMode;
  public submitButtonText = this.isCreateMode ? 'Create' : 'Save';
  private userFromDb: AdministrationUser | null = null;

  public form = this.#formBuilder.nonNullable.group({
    username: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    fullName: ['', [Validators.required]],
    disabled: [false],
    scopes: [''],
    plaintextPassword: [''],
  });

  constructor() {
    if (this.isCreateMode) {
      this.form.controls.plaintextPassword.addValidators(Validators.required);
      this.form.controls.plaintextPassword.updateValueAndValidity({ emitEvent: false });
      this.loadingState = 0;
      return;
    }

    this.form.controls.username.disable({ emitEvent: false });
    if (this.isDetailMode) {
      this.disableEditableControls();
    }

    this.username = this.#route.snapshot.paramMap.get('username');
    if (!this.username) {
      this.errorLoading.enabled = true;
      this.errorLoading.text = 'User identifier is missing from route.';
      this.loadingState--;
      this.#toastr.error('Cannot load user detail', 'User');
      return;
    }

    this.#usersService.getByUsername(this.username).subscribe({
      next: (user) => {
        this.userFromDb = user;
        this.errorLoading.enabled = false;
        this.form.setValue({
          username: user.username,
          email: user.email,
          fullName: user.full_name,
          disabled: user.disabled,
          scopes: (user.scopes ?? []).join(', '),
          plaintextPassword: '',
        });
        this.loadingState--;
      },
      error: (err: Error) => {
        console.error(err);
        this.errorLoading.enabled = true;
        this.errorLoading.text = err.message;
        this.disableEditableControls();
        this.loadingState--;
        this.#toastr.error(err.message, 'Cannot load user');
      }
    });
  }

  public saveUser(): void {
    if (this.isCreateMode) {
      this.createUser();
      return;
    }

    if (!this.username) {
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if (this.userFromDb === null) {
      return;
    }

    const formValue = this.form.getRawValue();
    const payload: AdministrationUser = {
      ...this.userFromDb,
      email: formValue.email,
      full_name: formValue.fullName,
      disabled: formValue.disabled,
      scopes: this.parseScopes(formValue.scopes),
      favorite_events: this.userFromDb.favorite_events ?? [],
    };

    const password = formValue.plaintextPassword.trim();
    if (password.length > 0) {
      payload.plaintext_password = password;
    } else {
      delete payload.plaintext_password;
    }

    this.#usersService.update(this.userFromDb.uuid, payload).subscribe({
      next: (user: AdministrationUser) => {
        this.userFromDb = user;
        this.#toastr.info('Successfully edited.', `User '${user.username}'`, {
          progressBar: true,
        });
        this.#router.navigate(['/users/detail', user.username]);
      },
      error: (err: Error) => {
        console.error(err);
        this.#toastr.error(`NOT EDITED! Error: ${err.message}`, 'User', {
          progressBar: true,
        });
      }
    });
  }

  private createUser(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const formValue = this.form.getRawValue();
    const username = formValue.username.trim();
    const password = formValue.plaintextPassword.trim();
    if (username.length === 0 || password.length === 0) {
      this.form.markAllAsTouched();
      return;
    }

    const payload: AdministrationUserCreate = {
      username,
      email: formValue.email,
      full_name: formValue.fullName,
      disabled: formValue.disabled,
      scopes: this.parseScopes(formValue.scopes),
      plaintext_password: password,
    };

    this.#usersService.create(payload).subscribe({
      next: (user) => {
        console.log(user);
        this.#toastr.info('Successfully created.', `User '${user.username}'`, {
          progressBar: true,
        });
        this.#router.navigate(['/users/detail', user.username]);
      },
      error: (err: Error) => {
        console.error(err);
        this.#toastr.error(`NOT CREATED! Error: ${err.message}`, 'User', {
          progressBar: true,
        });
      }
    });
  }

  private parseScopes(scopesInput: string): string[] {
    return scopesInput
      .split(',')
      .map(scope => scope.trim())
      .filter(scope => scope.length > 0);
  }

  private disableEditableControls(): void {
    this.form.get('email')?.disable();
    this.form.get('fullName')?.disable();
    this.form.get('disabled')?.disable();
    this.form.get('scopes')?.disable();
    this.form.get('plaintextPassword')?.disable();
  }
}
