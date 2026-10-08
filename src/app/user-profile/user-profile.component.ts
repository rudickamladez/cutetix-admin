import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { StorageKeys } from '../tokens/storage.tokens';
import { AdminModeService } from '../services/adminMode.service';
import { faRepeat } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-user-profile',
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false
})
export class UserProfileComponent {
  readonly keys = StorageKeys;
  readonly adminModeService = inject(AdminModeService);
  readonly toggleIcon = faRepeat;
}
