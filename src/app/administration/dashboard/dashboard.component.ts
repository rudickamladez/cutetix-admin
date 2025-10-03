import { Component, inject } from '@angular/core';
import { UsersService } from 'src/app/services/users.service';
import { User } from 'src/app/types/auth.types';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  standalone: false
})
export class DashboardComponent {
  readonly #users = inject(UsersService);
  user: User = this.#users.user()!;
}
