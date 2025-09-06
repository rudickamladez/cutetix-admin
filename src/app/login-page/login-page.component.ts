import { Component, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { OAuthService } from 'angular-oauth2-oidc';
import { authPasswordFlowConfig } from '../auth-password-flow.config';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';

@Component({
  templateUrl: './login-page.component.html',
  styleUrls: ['./login-page.component.scss']
})
export class LoginPageComponent implements OnInit {
  public loggingIn: boolean = false;
  public loginFailed: boolean = false;
  public errorText?: string;
  public loginForm = new FormGroup({
    username: new FormControl(''),
    password: new FormControl('')
  });

  protected readonly canRun = signal(false);

  constructor(
    private router: Router,
    private oauthService: OAuthService
  ) {
    // Check if browser is chromium based and version >= 132
    if (environment.BROWSER_CORE_CHECK === false) {
      this.canRun.set(true);
    } else {
      // eslint-disable-next-line  @typescript-eslint/no-explicit-any
      const brands = (navigator as any).userAgentData?.brands as { brand: string, version: string }[] | undefined;
      if (brands && brands.some(({ brand, version }) => brand === "Chromium" && Number(version) >= 132)) {
        this.canRun.set(true);
      } else {
        this.errorText = "Your browser is not supported. Please use a Chromium-based browser (Chrome, Edge, Opera, Brave) with version 132 or higher.";
        this.canRun.set(false);
      }
    }

    // Tweak config for password flow
    // This is just needed b/c this demo uses both,
    // implicit flow as well as password flow

    this.oauthService.configure(authPasswordFlowConfig);
    this.oauthService.loadDiscoveryDocument();
    if (this.oauthService.hasValidAccessToken()) {
      this.router.navigate(['/dashboard']);
    }
  }

  ngOnInit() { }

  loginWithPassword() {
    this.loggingIn = true;
    this.oauthService
      .fetchTokenUsingPasswordFlowAndLoadUserProfile(
        this.loginForm.value.username ?? '',
        this.loginForm.value.password ?? ''
      )
      .then(() => {
        console.debug('successfully logged in');
        this.oauthService.setupAutomaticSilentRefresh();
        this.loginFailed = false;
        this.router.navigate(['/dashboard']);
        this.loggingIn = false;
      })
      .catch((err) => {
        console.error('error logging in', err);
        this.errorText = err.error.error_description;
        this.loginFailed = true;
        this.loginForm.value.password = '';
        this.loggingIn = false;
      });
  }

}
