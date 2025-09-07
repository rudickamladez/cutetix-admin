import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { HelloComponent } from './hello/hello.component';
import { NotFoundComponent } from './not-found/not-found.component';
import { LoginPageComponent } from './login-page/login-page.component';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { APP_ROUTES } from './app.routes';
import { AdministrationModule } from './administration/administration.module';
import { DataTablesModule } from 'angular-datatables';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { UserProfileComponent } from './user-profile/user-profile.component';

@NgModule({
    declarations: [
        AppComponent,
        HelloComponent,
        NotFoundComponent,
        LoginPageComponent,
        UserProfileComponent,
    ],
    bootstrap: [AppComponent],
    imports: [
        AdministrationModule,
        BrowserModule,
        ReactiveFormsModule,
        RouterModule.forRoot(APP_ROUTES, { useHash: false }),
        DataTablesModule,
        FontAwesomeModule
    ],
    providers: []
})
export class AppModule { }
