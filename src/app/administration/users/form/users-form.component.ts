import { Component, effect, inject, input, signal } from '@angular/core';
import { form, required, email, submit, disabled } from '@angular/forms/signals';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { UserService } from '../users.service';
import { User, UserUpdate } from '../users.types';
import { HttpErrorResponse } from '@angular/common/http';
import { SCOPES_ENTRIES } from '../../../types/auth.types';

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
  protected readonly scopesEntries = SCOPES_ENTRIES;

  readonly id = input<string | null>(null);
  readonly mode = input.required<'new' | 'edit' | 'detail'>();
  protected readonly user = this.#usersService.userByIdResource(() => this.id());

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
      
      // if (this.mode() == 'new') {
        // required(schemaPath.plaintext_password, { message: 'Password is required' });
      // }

      disabled(schemaPath, () => { return this.mode() === 'detail'; });
    }
  );

  constructor() {

    effect(() => {
      this.id();
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
        err.message,
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

        await this.#usersService.update(currentUser.uuid, this.userModel()).subscribe({
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
