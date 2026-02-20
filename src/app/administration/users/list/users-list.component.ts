import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { faEye, faPen, faTrash } from '@fortawesome/free-solid-svg-icons';
import { ToastrService } from 'ngx-toastr';
import { AdministrationUsersService } from '../users.service';
import { AdministrationUser } from '../users.types';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-users-list',
  templateUrl: './users-list.component.html',
  styleUrls: ['./users-list.component.scss'],
  standalone: false
})
export class UsersListComponent implements OnInit {
  readonly #usersService = inject(AdministrationUsersService);
  readonly #router = inject(Router);
  readonly #toastr = inject(ToastrService);
  readonly #authService = inject(AuthService);

  protected readonly editIcon = faPen;
  protected readonly detailIcon = faEye;
  protected readonly deleteIcon = faTrash;

  public users: AdministrationUser[] = [];
  public filteredUsers: AdministrationUser[] = [];
  public search = '';
  public includeDisabled = true;
  public loadingState = 1;
  public errorLoading = {
    enabled: false,
    text: '',
  };

  ngOnInit(): void {
    this.#usersService.get().subscribe({
      next: (users) => {
        this.errorLoading.enabled = false;
        this.users = [...users].sort((left, right) => (left.username ?? '').localeCompare(right.username ?? ''));
        this.applyFilters();
        this.loadingState--;
      },
      error: (err: Error) => {
        console.error(err);
        this.errorLoading.enabled = true;
        this.errorLoading.text = err.message;
        this.loadingState--;
      }
    });
  }

  public onSearchChange(value: string): void {
    this.search = value;
    this.applyFilters();
  }

  public onDisabledFilterChange(checked: boolean): void {
    this.includeDisabled = checked;
    this.applyFilters();
  }

  public clearFilters(): void {
    this.search = '';
    this.includeDisabled = true;
    this.applyFilters();
  }

  public edit(user: AdministrationUser): void {
    this.#router.navigate(['/users/edit', user.username]);
  }

  public detail(user: AdministrationUser): void {
    this.#router.navigate(['/users/detail', user.username]);
  }

  public delete(user: AdministrationUser): void {
    if (!user.uuid) {
      this.#toastr.error(
        `Cannot delete user '${user.username}'. Missing UUID.`,
        'User DIDN\'T deleted!',
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
        this.users = this.users.filter(existingUser => existingUser.uuid !== user.uuid);
        this.applyFilters();
        this.#toastr.info(
          user.username,
          'User deleted',
          {
            progressBar: true,
          }
        );
      },
      error: (err: Error) => {
        console.error(err);
        this.#toastr.error(
          `NOT DELETED! Error: ${err.message}`,
          'User',
          {
            progressBar: true,
          }
        );
      }
    });
  }

  public canViewUser(): boolean {
    return this.hasScope('users:read');
  }

  public canEditUser(): boolean {
    return this.hasScope('users:read') && this.hasScope('users:edit');
  }

  public canDeleteUser(): boolean {
    return this.hasScope('users:edit');
  }

  private hasScope(scope: string): boolean {
    const scopes = this.#authService.getScopes();
    if (!scopes || scopes === 'undefined') {
      return false;
    }

    return scopes
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)
      .includes(scope);
  }

  private applyFilters(): void {
    const search = this.search.trim().toLowerCase();

    this.filteredUsers = this.users.filter((user) => {
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
}
