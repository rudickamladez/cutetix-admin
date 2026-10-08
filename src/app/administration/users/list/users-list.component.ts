import { Component, computed, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { faEye, faPen, faTrash } from '@fortawesome/free-solid-svg-icons';
import { SnackbarToastrService } from '../../../services/snackbar-toastr.service';
import { UserService } from '../users.service';
import { User } from '../users.types';
import { AuthService } from 'src/app/services/auth.service';
import { HttpErrorResponse } from '@angular/common/http';
import { matchesSearch } from '../../../shared/matches-search';
import { getAriaSort, sortRows, TableSortState, toggleSort } from '../../../shared/table-sort';

type UserSortColumn = 'username' | 'full_name' | 'email' | 'disabled';

@Component({
  selector: 'app-users-list',
  templateUrl: './users-list.component.html',
  styleUrls: ['./users-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false
})
export class UsersListComponent {
  readonly #usersService = inject(UserService);
  readonly #toastr = inject(SnackbarToastrService);
  protected readonly router = inject(Router);
  protected readonly authService = inject(AuthService);
  protected readonly editIcon = faPen;
  protected readonly detailIcon = faEye;
  protected readonly deleteIcon = faTrash;
  protected readonly users = this.#usersService.users;

  protected filteredUsers = computed(() => this.#filterUsers());
  protected sortState = signal<TableSortState<UserSortColumn>>({ column: null, direction: null });
  protected sortedUsers = computed(() => sortRows(
    this.filteredUsers(),
    this.sortState(),
    (user, column) => user[column]
  ));
  protected search = signal('');
  protected includeDisabled = signal(true);

  protected toggleSort(column: UserSortColumn): void {
    this.sortState.update((state) => toggleSort(state, column));
  }

  protected sortAriaSort(column: UserSortColumn): 'ascending' | 'descending' | 'none' {
    return getAriaSort(this.sortState(), column);
  }

  protected clearFilters(): void {
    this.search.set('');
    this.includeDisabled.set(true);
  }

  protected delete(user: User): void {
    if (!user.uuid) {
      this.#toastr.error(
        `Cannot delete user '${user.username}'. Missing UUID.`,
        'User wasn\'t deleted!',
        {
          progressBar: true,
        }
      );
      return;
    }

    if (!confirm(`Are you sure to delete user "${user.username}"?`)) {
      return;
    }

    this.#usersService.delete(user.uuid).subscribe({
      next: () => {
        this.#filterUsers();
        this.#toastr.info(
          user.username,
          'User deleted',
          {
            progressBar: true,
          }
        );
      },
      error: (err: HttpErrorResponse) => {
        console.error(err);
        this.#toastr.error(
          `Error: ${err.error?.detail ?? err.message}`,
          'User wasn\'t deleted!',
          {
            progressBar: true,
          }
        );
      }
    });
  }

  #filterUsers(): User[] {
    return this.users.value().filter((user) => {
      if (!this.includeDisabled() && user.disabled) {
        return false;
      }

      return matchesSearch(this.search(), [
        user.username ?? '',
        user.full_name ?? '',
        user.email ?? '',
        ...(user.scopes ?? [])
      ]);
    });
  }

  protected loadErrorText(): string {
    const err = this.users.error();
    if (!err) {
      return '';
    }
    if (err instanceof HttpErrorResponse) {
      return err.error?.detail ?? err.message;
    }
    if (err instanceof Error) {
      return err.message;
    }
    return String(err);
  }
}
