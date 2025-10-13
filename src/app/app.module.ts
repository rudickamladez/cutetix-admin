import { CommonModule } from "@angular/common";
import { provideHttpClient, withFetch, withInterceptors } from "@angular/common/http";
import { isDevMode, NgModule } from "@angular/core";
import { ReactiveFormsModule } from "@angular/forms";
import { BrowserModule } from "@angular/platform-browser";
import { RouterModule } from "@angular/router";
import { ServiceWorkerModule } from "@angular/service-worker";

import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";

import { AdministrationModule } from "./administration/administration.module";
import { AppComponent } from "./app.component";
import { APP_ROUTES } from "./app.routes";
import { LocalStorageFieldComponent } from "./components/local-storage-field/local-storage-field.component";
import { HelloComponent } from "./hello/hello.component";
import { LoginPageComponent } from "./login-page/login-page.component";
import { NotFoundComponent } from "./not-found/not-found.component";

import { SharedModule } from "./shared/shared.module";
import { UserProfileComponent } from "./user-profile/user-profile.component";
import { authInterceptor } from "./interceptors/auth.interceptor";

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
    FontAwesomeModule,
    SharedModule,
    ServiceWorkerModule.register("ngsw-worker.js", {
      enabled: !isDevMode(),
      // Register the ServiceWorker as soon as the application is stable
      // or after 30 seconds (whichever comes first).
      registrationStrategy: "registerWhenStable:30000",
    }),
  ],
  providers: [provideHttpClient(withFetch(), withInterceptors([authInterceptor]))],
})
export class AppModule {}
