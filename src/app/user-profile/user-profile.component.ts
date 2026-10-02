import { Component, ChangeDetectionStrategy } from '@angular/core';
import { StorageKeys } from '../tokens/storage.tokens';

@Component({
  selector: 'app-user-profile',
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false
})
export class UserProfileComponent {
  readonly keys = StorageKeys;
}
