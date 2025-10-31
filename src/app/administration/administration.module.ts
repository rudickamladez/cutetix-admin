import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { ReactiveFormsModule } from "@angular/forms";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { RouterModule } from "@angular/router";

import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { ToastrModule } from "ngx-toastr";

import { DashboardComponent } from "./dashboard/dashboard.component";
import { SharedModule } from "../shared/shared.module";
import { DashboardEventOverviewComponent } from "./dashboard/event-overview/dashboard-event-overview.component";
import { EventsFormComponent } from "./events/form/events-form.component";
import { EventsListComponent } from "./events/list/events-list.component";
import { AdministrationLayoutComponent } from "./layout/layout.component";
import { LoggedUserComponent } from "./layout/logged-user/logged-user.component";
import { NavBarComponent } from "./layout/nav-bar/nav-bar.component";
import { NavBarItemComponent } from "./layout/nav-bar-item/nav-bar-item.component";
import { NavBarSubitemComponent } from "./layout/nav-bar-subitem/nav-bar-subitem.component";
import { LoadingComponent } from "./loading/loading.component";
import { TicketGroupsEditComponent } from "./ticket_groups/edit/events-edit.component";
import { TicketGroupsListComponent } from "./ticket_groups/list/ticket_groups-list.component";
import { TicketGroupsNewComponent } from "./ticket_groups/new/ticket_groups-new.component";
import { TicketsListComponent } from "./tickets/list/tickets-list.component";
import { TicketsNewComponent } from "./tickets/new/tickets-new.component";

@NgModule({
  declarations: [
    AdministrationLayoutComponent,
    NavBarComponent,
    NavBarItemComponent,
    LoggedUserComponent,
    NavBarSubitemComponent,
    DashboardComponent,
    DashboardEventOverviewComponent,
    LoadingComponent,
    TicketGroupsListComponent,
    TicketGroupsEditComponent,
    TicketGroupsNewComponent,
    EventsListComponent,
    EventsFormComponent,
    TicketsListComponent,
    TicketsNewComponent,
  ],
  imports: [
    CommonModule,
    RouterModule,
    FontAwesomeModule,
    BrowserAnimationsModule,
    ToastrModule.forRoot(),
    ReactiveFormsModule,
    SharedModule,
  ],
})
export class AdministrationModule {}
