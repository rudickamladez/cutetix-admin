import { Component, inject, DOCUMENT } from '@angular/core';
import { faRepeat, faSignOutAlt, faUser } from '@fortawesome/free-solid-svg-icons';
import { AuthService } from 'src/app/services/auth.service';
import { UsersService } from 'src/app/services/users.service';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { UserInfoComponent } from '../../../components/user-info/user-info.component';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-logged-user',
    templateUrl: './logged-user.component.html',
    styleUrls: ['./logged-user.component.scss'],
    imports: [FaIconComponent, UserInfoComponent, RouterLink]
})
export class LoggedUserComponent {
  readonly #document = inject<Document>(DOCUMENT);

  protected readonly authService = inject(AuthService);
  protected readonly usersService = inject(UsersService);

  // icons
  protected readonly userIcon = faUser;
  protected readonly switchThemeIcon = faRepeat;
  protected readonly logoutIcon = faSignOutAlt;
  protected readonly myProfileIcon = faUser;

  protected toggleTheme() {
    this.#document.body.classList.toggle('light');
    this.#document.body.classList.toggle('alt-font');
  }

}
