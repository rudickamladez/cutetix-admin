import { Routes } from '@angular/router';
import { LoginPageComponent } from './login-page/login-page.component';
import { NotFoundComponent } from './not-found/not-found.component';
import { DashboardComponent } from './administration/dashboard/dashboard.component';
import { AdministrationLayoutComponent } from './administration/layout/layout.component';
import { TicketGroupsListComponent } from './administration/ticket_groups/list/ticket_groups-list.component';
import { TicketGroupsNewComponent } from './administration/ticket_groups/new/ticket_groups-new.component';
import { TicketGroupsEditComponent } from './administration/ticket_groups/edit/ticket_groups-edit.component';
import { UserProfileComponent } from './user-profile/user-profile.component';
import { EventsListComponent } from './administration/events/list/events-list.component';
import { TicketsListComponent } from './administration/tickets/list/tickets-list.component';
import { TicketsNewComponent } from './administration/tickets/new/tickets-new.component';
import { TicketsEditComponent } from './administration/tickets/edit/tickets-edit.component';
import { EventsFormComponent } from './administration/events/form/events-form.component';
import { UsersListComponent } from './administration/users/list/users-list.component';
import { UsersFormComponent } from './administration/users/form/users-form.component';
import { authGuard } from './guards/auth.guard';
import { logoutGuard } from './guards/logout.guard';
import { usersSectionGuard } from './guards/users-section.guard';
import { eventCreateGuard, eventEditGuard } from './guards/event-permissions.guard';
import { ticketGroupEditGuard } from './guards/ticket-group-permissions.guard';
import { ticketEditGuard } from './guards/ticket-permissions.guard';
import { eventTicketsReadGuard } from './guards/event-permissions.guard';

let eventsChildren: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'list',
  },
  {
    path: 'list',
    component: EventsListComponent
  },
  {
    path: 'add',
    component: EventsFormComponent,
    canActivate: [eventCreateGuard]
  },
  {
    path: 'edit/:id',
    component: EventsFormComponent,
    canActivate: [eventEditGuard]
  },
  {
    path: 'detail/:id',
    component: EventsFormComponent
  },
  {
    path: ':id/tickets',
    component: TicketsListComponent,
    canActivate: [eventTicketsReadGuard]
  }
];

export let APP_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    component: LoginPageComponent,
  },
  {
    path: 'logout',
    canActivate: [logoutGuard],
    component: LoginPageComponent,
  },
  {
    path: '',
    component: AdministrationLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        component: DashboardComponent
      },
      {
        path: 'profile',
        component: UserProfileComponent
      },
      {
        path: 'tickets',
        children: [
          {
            path: '',
            pathMatch: 'full',
            redirectTo: 'list',
          },
          {
            path: 'list',
            component: TicketsListComponent
          },
          {
            path: 'add',
            component: TicketsNewComponent
          },
          {
            path: 'edit/:id',
            component: TicketsEditComponent,
            canActivate: [ticketEditGuard]
          }
        ]
      },
      {
        path: 'ticket_groups',
        children: [
          {
            path: '',
            pathMatch: 'full',
            redirectTo: 'list',
          },
          {
            path: 'list',
            component: TicketGroupsListComponent
          },
          {
            path: 'add',
            component: TicketGroupsNewComponent
          },
          {
            path: 'edit/:id',
            component: TicketGroupsEditComponent,
            canActivate: [ticketGroupEditGuard]
          },
          {
            path: 'detail/:id',
            component: TicketGroupsEditComponent,
          }
        ]
      },
      {
        path: 'my-events',
        children: eventsChildren,
      },
      {
        path: 'events',
        children: eventsChildren,
      },
      {
        path: 'users',
        canActivate: [usersSectionGuard],
        children: [
          {
            path: '',
            pathMatch: 'full',
            redirectTo: 'list',
          },
          {
            path: 'list',
            component: UsersListComponent
          },
          {
            path: 'add',
            component: UsersFormComponent,
            data: {
              mode: 'new',
            },
          },
          {
            path: 'edit/:id',
            component: UsersFormComponent,
            data: {
              mode: 'edit',
            },
          },
          {
            path: 'detail/:id',
            component: UsersFormComponent,
            data: {
              mode: 'detail',
            },
          },
        ]
      },
      {
        path: '**',
        pathMatch: 'full',
        component: NotFoundComponent
      }
    ]
  },
  {
    path: '**',
    component: NotFoundComponent
  }
];
