import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { faEye, faPen, faTrash } from '@fortawesome/free-solid-svg-icons';
import { ToastrService } from 'ngx-toastr';
import { UserService } from '../users.service';
import { User } from '../users.types';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-users-list',
  templateUrl: './users-list.component.html',
  styleUrls: ['./users-list.component.scss'],
  standalone: false
})
export class UsersListComponent {
  readonly #usersService = inject(UserService);
  protected readonly router = inject(Router);
  readonly #toastr = inject(ToastrService);
  protected readonly authService = inject(AuthService);
  protected readonly editIcon = faPen;
  protected readonly detailIcon = faEye;
  protected readonly deleteIcon = faTrash;
  protected readonly users = this.#usersService.users;

  public filteredUsers: User[] = [];
  public search = '';
  public includeDisabled = true;

  public onSearchChange(value: string): void {
    this.search = value;
    this.#applyFilters();
  }

  public onDisabledFilterChange(checked: boolean): void {
    this.includeDisabled = checked;
    this.#applyFilters();
  }

  public clearFilters(): void {
    this.search = '';
    this.includeDisabled = true;
    this.#applyFilters();
  }

  public delete(user: User): void {
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

    // this.#usersService.delete(user.uuid).subscribe({
    //   next: () => {
    //     this.users = this.users.filter(existingUser => existingUser.uuid !== user.uuid);
    //     this.#applyFilters();
    //     this.#toastr.info(
    //       user.username,
    //       'User deleted',
    //       {
    //         progressBar: true,
    //       }
    //     );
    //   },
    //   error: (err: Error) => {
    //     console.error(err);
    //     this.#toastr.error(
    //       `Error: ${err.message}`,
    //       'User wasn\'t deleted!',
    //       {
    //         progressBar: true,
    //       }
    //     );
    //   }
    // });
  }

  #applyFilters(): void {
    const search = this.search.trim().toLowerCase();

    this.filteredUsers = this.users.value().filter((user) => {
      if (!this.includeDisabled && user.disabled) {
        return false;
      }

      if (!search) {
        return true;
      }

      const scopes = (user.scopes ?? []).join(', ').toLowerCase();
      return (user.username ?? '').toLowerCase().includes(search)
        || (user.full_name ?? '').toLowerCase().includes(search)
        || (user.email ?? '').toLowerCase().includes(search)
        || scopes.includes(search);
    });
  }

  protected loadErrorText(): string {
    const err = this.users.error();
    if (!err) {
      return '';
    }
    if (err instanceof Error) {
      return err.message;
    }
    return String(err);
  }
}
