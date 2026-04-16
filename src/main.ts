import { environment } from './environments/environment';
import { enableProdMode, provideZoneChangeDetection, isDevMode } from '@angular/core';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './app/interceptors/auth.interceptor';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { APP_ROUTES } from './app/app.routes';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideServiceWorker } from '@angular/service-worker';
import { DefaultNoAnimationsGlobalConfig, provideToastr } from 'ngx-toastr';
import { AppComponent } from './app/app.component';

if (environment.production) {
  enableProdMode();
}

bootstrapApplication(AppComponent, {
    providers: [
        provideZoneChangeDetection(),
        provideHttpClient(withFetch(), withInterceptors([authInterceptor])),
        provideRouter(APP_ROUTES, withComponentInputBinding()),
        provideToastr(DefaultNoAnimationsGlobalConfig),
        provideServiceWorker('ngsw-worker.js', {
            enabled: !isDevMode(),
            // Register the ServiceWorker as soon as the application is stable
            // or after 30 seconds (whichever comes first).
            registrationStrategy: 'registerWhenStable:30000',
        }),
    ]
})
  .catch(err => console.error(err));
