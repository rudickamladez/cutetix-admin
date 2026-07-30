import { Component, inject } from '@angular/core';
import { UsersService } from 'src/app/services/users.service';
import { DashboardEventOverviewComponent } from './event-overview/dashboard-event-overview.component';

@Component({
    selector: 'app-dashboard',
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.scss'],
    imports: [DashboardEventOverviewComponent]
})
export class DashboardComponent {
  protected readonly usersService = inject(UsersService);
}
