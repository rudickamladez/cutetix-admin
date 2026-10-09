import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { StorageKeys } from '../tokens/storage.tokens';
import { AdminModeService } from '../services/adminMode.service';
import { faRepeat } from '@fortawesome/free-solid-svg-icons';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { UserInfoComponent } from '../components/user-info/user-info.component';
import { LocalStorageFieldComponent } from '../components/local-storage-field/local-storage-field.component';

@Component({
    selector: 'app-user-profile',
    templateUrl: './user-profile.component.html',
    styleUrls: ['./user-profile.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [FaIconComponent, UserInfoComponent, LocalStorageFieldComponent]
})
export class UserProfileComponent {
  readonly keys = StorageKeys;
  readonly adminModeService = inject(AdminModeService);
  readonly toggleIcon = faRepeat;
}
