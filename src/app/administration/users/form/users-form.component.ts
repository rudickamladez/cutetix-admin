import { Component, effect, inject, input, signal, ChangeDetectionStrategy } from '@angular/core';
import { form, required, email, submit, disabled, FormField } from '@angular/forms/signals';
import { Router } from '@angular/router';
import { SnackbarToastrService } from '../../../services/snackbar-toastr.service';
import { UserService } from '../users.service';
import { User, UserCreate, UserUpdate } from '../users.types';
import { HttpErrorResponse } from '@angular/common/http';
import { SCOPES_ENTRIES } from '../../../types/auth.types';
import { LoadingComponent } from '../../loading/loading.component';

@Component({
    selector: 'app-users-form',
    templateUrl: './users-form.component.html',
    styleUrls: ['./users-form.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [LoadingComponent, FormField]
})
export class UsersFormComponent {
  readonly #router = inject(Router);
  readonly #usersService = inject(UserService);
  readonly #toastr = inject(SnackbarToastrService);
  protected readonly scopesEntries = SCOPES_ENTRIES;

  readonly userId = input<string | null>(null, { alias: 'user-id' });
  readonly mode = input.required<'new' | 'edit' | 'detail'>();
  protected readonly user = this.#usersService.userByIdResource(() => this.userId());

  protected userModel = signal<UserCreate & Pick<UserUpdate, 'uuid'>>({
    email: '',
    username: '',
    full_name: '',
    disabled: false,
    scopes: [],
    favorite_events: [],
    plaintext_password: '',
    ...this.user.value()
  });

  protected userForm = form(
    this.userModel,
    (schemaPath) => {
      required(schemaPath.username, { message: 'Username is required' });
      required(schemaPath.email, { message: 'Email is required' });
      email(schemaPath.email, { message: 'Invalid email format' });
      required(schemaPath.full_name, { message: 'Full name is required' });
      required(schemaPath.plaintext_password, {
        message: 'Password is required',
        when: () => this.mode() === 'new',
      });

      disabled(schemaPath, { when: () => this.mode() === 'detail' });
    }
  );

  constructor() {
    effect(() => {
      this.userId();
      if (this.mode() === 'new') {
        return;
      }
      this.user.reload();
    });

    effect(() => {
      const err = this.user.error();
      if (!err) {
        return;
      }
      this.#toastr.error(
        err instanceof HttpErrorResponse ? err.error?.detail ?? err.message : err.message,
        'Cannot load user',
        {
          progressBar: true,
        }
      );
    });

    effect(() => {
      if (this.mode() === 'new') {
        return;
      }
      this.userModel.set({
        email: '',
        username: '',
        full_name: '',
        disabled: false,
        scopes: [],
        favorite_events: [],
        plaintext_password: '',
        ...this.user.value()
      });
    });
  }

  protected hasScope(scope: string): boolean {
    return this.userModel().scopes.includes(scope);
  }

  protected updateScope(scope: string, checked: boolean): void {
    this.userModel.update(user => ({
      ...user,
      scopes: checked
        ? [...new Set([...user.scopes, scope])]
        : user.scopes.filter(currentScope => currentScope !== scope),
    }));
  }

  protected saveUser(event: Event): void {
    event.preventDefault();

    if (this.mode() === 'new') {
      submit(this.userForm, async () => {
        await this.#usersService.create(this.userModel()).subscribe({
          next: () => {
            this.#toastr.info(
              'Successfully created.',
              'User',
              {
                progressBar: true,
              }
            );
            this.#router.navigate(['users']);
          },
          error: (err: HttpErrorResponse) => {
            console.error(err);
            this.#toastr.error(
              err.error.detail ? err.error.detail : err.message,
              'User not created',
              {
                progressBar: true,
              }
            );
          }
        });
      });
    } else {
      submit(this.userForm, async () => {
        const currentUser = this.user.value();
        if (!currentUser) {
          return;
        }

        const { plaintext_password: _plaintextPassword, ...userUpdate } = this.userModel();
        await this.#usersService.update(currentUser.uuid, {
          ...userUpdate,
          uuid: currentUser.uuid,
        }).subscribe({
          next: (user: User) => {
            this.#toastr.info(
              'Successfully edited.',
              `User '${user.username}'`,
              {
                progressBar: true,
              }
            );
            this.#router.navigate(['/users/edit', user.uuid]);
          },
          error: (err: HttpErrorResponse) => {
            console.error(err);
            this.#toastr.error(
              err.error.detail ? err.error.detail : err.message,
              'User not edited',
              {
                progressBar: true,
              }
            );
          }
        });
      });
    }
  }
}
