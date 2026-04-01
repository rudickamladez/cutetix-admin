import { Component, effect, inject, Input, signal } from '@angular/core';
import { form, required, email, submit } from '@angular/forms/signals';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { UserService } from '../users.service';
import { User, UserUpdate } from '../users.types';
import { HttpErrorResponse } from '@angular/common/http';
import { SCOPES_LIST } from '../../../types/auth.types';

@Component({
  selector: 'app-users-form',
  templateUrl: './users-form.component.html',
  styleUrls: ['./users-form.component.scss'],
  standalone: false
})
export class UsersFormComponent {
  readonly #router = inject(Router);
  readonly #usersService = inject(UserService);
  readonly #toastr = inject(ToastrService);
  protected readonly isCreateMode = this.#router.url.includes('/add');
  protected readonly isDetailMode = this.#router.url.includes('/detail');
  protected readonly scopesList = SCOPES_LIST;

  readonly #id = signal<string | null>(null);
  protected readonly user = this.#usersService.userByIdResource(() => this.#id());
  @Input({}) id(value: string | undefined) {
    this.#id.set(value ?? null);
  }

  protected userModel = signal<UserUpdate>({
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
      if (this.isCreateMode) {
        required(schemaPath.plaintext_password, { message: 'Password is required' });
      }
    }
  );

  constructor() {

    effect(() => {
      if (!this.#id() || this.isCreateMode) {
        return;
      }

      const err = this.user.error();
      if (!err) {
        return;
      }
      this.#toastr.error(
        err.message,
        'Cannot load user',
        {
          progressBar: true,
        }
      );
    });
  }

  protected saveUser(event: Event): void {
    event.preventDefault();

    if (this.isCreateMode) {
      submit(this.userForm, async () => {
        this.#usersService.create(this.userModel()).subscribe({
          next: (user: User) => {
            this.#toastr.info(
              'Successfully created.',
              `User '${user.username}'`,
              {
                progressBar: true,
              }
            );
            this.#router.navigate(['users', 'edit', user.uuid]);
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

        this.#usersService.update(currentUser.uuid, this.userModel()).subscribe({
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
