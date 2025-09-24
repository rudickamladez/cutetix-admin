import { Component, inject } from '@angular/core';
import { StorageKeys } from '../tokens/storage.tokens';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-user-profile',
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.scss'],
})
export class UserProfileComponent {
  readonly keys = StorageKeys;
  readonly #auth = inject(AuthService);

  constructor() { }

  get username(): string {
    return this.#auth.getDecodedAccessToken()?.sub || "undefined";
  }

  get name() {
    return "undefined";
  }

  get email() {
    return "undefined";
  }

  get email_verified() {
    return "undefined";
  }



}
