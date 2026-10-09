import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdministrationLayoutComponent } from './layout/layout.component';
import { NavBarComponent } from './layout/nav-bar/nav-bar.component';
import { NavBarItemComponent } from './layout/nav-bar-item/nav-bar-item.component';
import { LoggedUserComponent } from './layout/logged-user/logged-user.component';
import { NavBarSubitemComponent } from './layout/nav-bar-subitem/nav-bar-subitem.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { RouterModule } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { LoadingComponent } from './loading/loading.component';
import { ReactiveFormsModule } from '@angular/forms';
import { TicketGroupsListComponent } from './ticket_groups/list/ticket_groups-list.component';
import { TicketGroupsFormComponent } from './ticket_groups/form/ticket_groups-form.component';
import { EventsListComponent } from './events/list/events-list.component';
import { TicketsListComponent } from './tickets/list/tickets-list.component';
import { TicketsFormComponent } from './tickets/form/tickets-form.component';
import { EventsFormComponent } from './events/form/events-form.component';
import { SharedModule } from '../shared/shared.module';
import { DashboardEventOverviewComponent } from './dashboard/event-overview/dashboard-event-overview.component';
import { UsersListComponent } from './users/list/users-list.component';
import { UsersFormComponent } from './users/form/users-form.component';
import { FormField } from '@angular/forms/signals';
import { EventPermissionsComponent } from './events/permissions/event-permissions.component';
import { CurrentEventComponent } from './layout/current-event/current-event.component';

@NgModule({
    imports: [
        CommonModule,
        RouterModule,
        FontAwesomeModule,
        ReactiveFormsModule,
        SharedModule,
        FormField,
        EventPermissionsComponent,
        CurrentEventComponent,
        AdministrationLayoutComponent,
        NavBarComponent,
        NavBarItemComponent,
        LoggedUserComponent,
        NavBarSubitemComponent,
        DashboardComponent,
        DashboardEventOverviewComponent,
        LoadingComponent,
        TicketGroupsListComponent,
        TicketGroupsFormComponent,
        EventsListComponent,
        EventsFormComponent,
        TicketsListComponent,
        TicketsFormComponent,
        UsersListComponent,
        UsersFormComponent,
    ]
})
export class AdministrationModule { }
