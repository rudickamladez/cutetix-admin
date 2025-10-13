import { Component, inject, Inject, DOCUMENT } from '@angular/core';
import { Router } from '@angular/router';
import { faRepeat, faSignOutAlt, faUser } from '@fortawesome/free-solid-svg-icons';
import { AuthService } from 'src/app/services/auth.service';
import { UsersService } from 'src/app/services/users.service';

@Component({
  selector: 'app-logged-user',
  templateUrl: './logged-user.component.html',
  styleUrls: ['./logged-user.component.scss'],
  standalone: false
})
export class LoggedUserComponent {
  protected readonly authService = inject(AuthService);
  protected readonly usersService = inject(UsersService);

  // icons
  protected readonly userIcon = faUser;
  switchThemeIcon = faRepeat;
  logoutIcon = faSignOutAlt;
  myProfileIcon = faUser;

  constructor(
    @Inject(DOCUMENT) private document: Document,
    private readonly router: Router,
  ) {
  }

  openProfile() {
    this.router.navigate(['/profile']);
  }

  logout() {
    this.authService.logout();
  }

  protected toggleTheme() {
    this.document.body.classList.toggle('light');
    this.document.body.classList.toggle('alt-font');
  }

}