import { Component, computed, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { faEye, faPen, faTrash, faUserSlash } from '@fortawesome/free-solid-svg-icons';
import { SnackbarToastrService } from '../../../services/snackbar-toastr.service';
import { UserService } from '../users.service';
import { User } from '../users.types';
import { AuthService } from 'src/app/services/auth.service';
import { matchesSearch } from '../../../shared/matches-search';
import { getAriaSort, sortRows, TableSortState, toggleSort } from '../../../shared/table-sort';
import { ConfirmDialogService } from '../../../services/confirm-dialog.service';
import { LoadingComponent } from '../../loading/loading.component';
import { TableSearchComponent } from '../../../components/table-search/table-search.component';
import { TableSortHeaderComponent } from '../../../components/table-sort-header/table-sort-header.component';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { LoggingService } from '../../../services/logging.service';
import { errorMessage } from '../../../utils/error-message';

type UserSortColumn = 'username' | 'full_name' | 'email' | 'disabled';

@Component({
    selector: 'app-users-list',
    templateUrl: './users-list.component.html',
    styleUrls: ['./users-list.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [LoadingComponent, TableSearchComponent, TableSortHeaderComponent, FaIconComponent]
})
export class UsersListComponent {
  readonly #usersService = inject(UserService);
  readonly #toastr = inject(SnackbarToastrService);
  readonly #confirmDialog = inject(ConfirmDialogService);
  readonly #logging = inject(LoggingService);
  protected readonly router = inject(Router);
  protected readonly authService = inject(AuthService);
  protected readonly editIcon = faPen;
  protected readonly detailIcon = faEye;
  protected readonly deleteIcon = faTrash;
  protected readonly disabledIcon = faUserSlash;
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

    this.#confirmDialog.confirm({
      title: 'Delete user',
      message: `Are you sure to delete user "${user.username}"?`,
      confirmLabel: 'Delete',
      destructive: true,
    }).subscribe((confirmed) => {
      if (!confirmed) {
        return;
      }
      this.#usersService.delete(user.uuid!).subscribe({
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
        error: (err: unknown) => {
          this.#logging.error('user', 'User deletion failed.', err);
          this.#toastr.error(
            `Error: ${errorMessage(err)}`,
            'User wasn\'t deleted!',
            {
              progressBar: true,
            }
          );
        }
      });
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
    return errorMessage(err);
  }
}
