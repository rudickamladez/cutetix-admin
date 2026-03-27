import { Component, effect, inject, signal } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { UserService } from '../users.service';
import { User, UserCreate, UserUpdate } from '../users.types';

@Component({
  selector: 'app-users-form',
  templateUrl: './users-form.component.html',
  styleUrls: ['./users-form.component.scss'],
  standalone: false
})
export class UsersFormComponent {
  readonly #router = inject(Router);
  readonly #route = inject(ActivatedRoute);
  readonly #usersService = inject(UserService);
  readonly #toastr = inject(ToastrService);
  readonly #formBuilder = inject(FormBuilder);
  readonly #id = signal<string | null>(this.#route.snapshot.paramMap.get('id'));
  readonly #userResource = this.#usersService.userByIdResource(() => this.#id());
  #loadErrorShown = false;

  protected readonly user = this.#userResource;
  protected readonly isCreateMode = this.#router.url.includes('/add');
  protected readonly isDetailMode = this.#router.url.includes('/detail');

  protected form = this.#formBuilder.nonNullable.group({
    username: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    full_name: ['', [Validators.required]],
    disabled: [false],
    scopes: [''],
    plaintext_password: [''],
  });

  constructor() {
    if (this.isCreateMode) {
      this.form.controls.plaintext_password.addValidators(Validators.required);
      this.form.controls.plaintext_password.updateValueAndValidity({ emitEvent: false });
      return;
    }

    if (this.isDetailMode) {
      this.form.disable();
    }

    effect(() => {
      const user = this.#userResource.value();
      if (!user) {
        return;
      }

      this.form.setValue({
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        disabled: user.disabled,
        scopes: (user.scopes ?? []).join(', '),
        plaintext_password: '',
      });
    });

    effect(() => {
      const err = this.#userResource.error();
      if (!err || this.#loadErrorShown) {
        return;
      }

      this.#loadErrorShown = true;
      this.form.disable();
      this.#toastr.error(err.message, 'Cannot load user', {
        progressBar: true,
      });
    });
  }

  protected saveUser(): void {
    if (this.isCreateMode) {
      this.createUser();
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const currentUser = this.#userResource.value();
    if (!currentUser) {
      return;
    }

    const formValue = this.form.getRawValue();
    const payload: UserUpdate = {
      ...currentUser,
      ...formValue,
      scopes: this.parseScopes(formValue.scopes),
    };

    this.#usersService.update(currentUser.uuid, payload).subscribe({
      next: (user: User) => {
        this.#toastr.info('Successfully edited.', `User '${user.username}'`, {
          progressBar: true,
        });
        this.#router.navigate(['/users/edit', user.uuid]);
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
    if (
      formValue.username.length === 0 ||
      formValue.plaintext_password.length === 0
    ) {
      this.form.markAllAsTouched();
      return;
    }

    const payload: UserCreate = {
      ...formValue,
      favorite_events: [],
      scopes: this.parseScopes(formValue.scopes),
    };

    this.#usersService.create(payload).subscribe({
      next: (user: User) => {
        this.#toastr.info('Successfully created.', `User '${user.username}'`, {
          progressBar: true,
        });
        this.#router.navigate(['/users/edit', user.uuid]);
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
      .split(/[,\s]+/)
      .map(scope => scope.trim())
      .filter(scope => scope.length > 0);
  }

  protected loadErrorText(): string {
    const err = this.user.error();
    if (!err) {
      return '';
    }
    if (err instanceof Error) {
      return err.message;
    }
    return String(err);
  }
}
