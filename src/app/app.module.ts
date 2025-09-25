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
import { provideHttpClient, withFetch, withInterceptors } from "@angular/common/http";
import { authInterceptor } from './interceptors/auth.interceptor';
import { LocalStorageFieldComponent } from './components/local-storage-field/component';
import { CommonModule } from '@angular/common';
import { SharedModule } from './shared/shared.module';


@NgModule({
    declarations: [
        AppComponent,
        HelloComponent,
        NotFoundComponent,
        LoginPageComponent,
        UserProfileComponent,
        LocalStorageFieldComponent,
    ],
    bootstrap: [AppComponent],
    imports: [
        AdministrationModule,
        BrowserModule,
        CommonModule,
        ReactiveFormsModule,
        RouterModule.forRoot(APP_ROUTES, { useHash: false }),
        DataTablesModule,
        FontAwesomeModule,
        SharedModule,
    ],
    providers: [
        provideHttpClient(
            withFetch(),
            withInterceptors([authInterceptor]),
        ),
    ]
})
export class AppModule { }
