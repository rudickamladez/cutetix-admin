import type { Routes } from "@angular/router";

import { DashboardComponent } from "./administration/dashboard/dashboard.component";
import { EventsFormComponent } from "./administration/events/form/events-form.component";
import { EventsListComponent } from "./administration/events/list/events-list.component";
import { AdministrationLayoutComponent } from "./administration/layout/layout.component";
import { TicketGroupsEditComponent } from "./administration/ticket_groups/edit/events-edit.component";
import { TicketGroupsListComponent } from "./administration/ticket_groups/list/ticket_groups-list.component";
import { TicketGroupsNewComponent } from "./administration/ticket_groups/new/ticket_groups-new.component";
import { TicketsListComponent } from "./administration/tickets/list/tickets-list.component";
import { TicketsNewComponent } from "./administration/tickets/new/tickets-new.component";
import { authGuard } from "./guards/auth.guard";
import { logoutGuard } from "./guards/logout.guard";
import { HelloComponent } from "./hello/hello.component";
import { LoginPageComponent } from "./login-page/login-page.component";
import { NotFoundComponent } from "./not-found/not-found.component";
import { UserProfileComponent } from "./user-profile/user-profile.component";

export const APP_ROUTES: Routes = [
  {
    path: "",
    redirectTo: "home",
    pathMatch: "full",
  },
  {
    path: "home",
    component: HelloComponent,
  },
  {
    path: "login",
    component: LoginPageComponent,
  },
  {
    path: "logout",
    canActivate: [logoutGuard],
    component: LoginPageComponent,
  },
  {
    path: "",
    component: AdministrationLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: "",
        redirectTo: "dashboard",
        pathMatch: "full",
      },
      {
        path: "dashboard",
        component: DashboardComponent,
      },
      {
        path: "profile",
        component: UserProfileComponent,
      },
      {
        path: "tickets",
        children: [
          {
            path: "",
            pathMatch: "full",
            redirectTo: "list",
          },
          {
            path: "list",
            component: TicketsListComponent,
          },
          {
            path: "add",
            component: TicketsNewComponent,
          },
        ],
      },
      {
        path: "ticket_groups",
        children: [
          {
            path: "",
            pathMatch: "full",
            redirectTo: "list",
          },
          {
            path: "list",
            component: TicketGroupsListComponent,
          },
          {
            path: "add",
            component: TicketGroupsNewComponent,
          },
          {
            path: "edit/:id",
            component: TicketGroupsEditComponent,
          },
          {
            path: "detail/:id",
            component: TicketGroupsEditComponent,
          },
        ],
      },
      {
        path: "events",
        children: [
          {
            path: "",
            pathMatch: "full",
            redirectTo: "list",
          },
          {
            path: "list",
            component: EventsListComponent,
          },
          {
            path: "add",
            component: EventsFormComponent,
          },
          {
            path: "edit/:id",
            component: EventsFormComponent,
          },
          {
            path: "detail/:id",
            component: EventsFormComponent,
          },
        ],
      },
      {
        path: "**",
        pathMatch: "full",
        component: NotFoundComponent,
      },
    ],
  },
  {
    path: "**",
    component: NotFoundComponent,
  },
];
