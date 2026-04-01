import { isDevMode, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { HelloComponent } from './hello/hello.component';
import { NotFoundComponent } from './not-found/not-found.component';
import { LoginPageComponent } from './login-page/login-page.component';
import { ReactiveFormsModule } from '@angular/forms';
import { provideRouter, RouterModule, withComponentInputBinding } from '@angular/router';
import { APP_ROUTES } from './app.routes';
import { AdministrationModule } from './administration/administration.module';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { UserProfileComponent } from './user-profile/user-profile.component';
import { provideHttpClient, withFetch, withInterceptors } from "@angular/common/http";
import { authInterceptor } from './interceptors/auth.interceptor';
import { LocalStorageFieldComponent } from './components/local-storage-field/local-storage-field.component';
import { CommonModule } from '@angular/common';
import { SharedModule } from './shared/shared.module';
import { ServiceWorkerModule } from '@angular/service-worker';
import { FormField } from '@angular/forms/signals';


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
        RouterModule,
        FontAwesomeModule,
        SharedModule,
        ServiceWorkerModule.register('ngsw-worker.js', {
            enabled: !isDevMode(),
            // Register the ServiceWorker as soon as the application is stable
            // or after 30 seconds (whichever comes first).
            registrationStrategy: 'registerWhenStable:30000'
        }),
        FormField,
    ],
    providers: [
        provideHttpClient(
            withFetch(),
            withInterceptors([authInterceptor]),
        ),
        provideRouter(
            APP_ROUTES,
            withComponentInputBinding(),
        ),
    ]
})
export class AppModule { }
