import { Component } from '@angular/core';
import { StorageKeys } from '../tokens/storage.tokens';
import { UserInfoComponent } from '../components/user-info/user-info.component';
import { LocalStorageFieldComponent } from '../components/local-storage-field/local-storage-field.component';

@Component({
    selector: 'app-user-profile',
    templateUrl: './user-profile.component.html',
    styleUrls: ['./user-profile.component.scss'],
    imports: [UserInfoComponent, LocalStorageFieldComponent]
})
export class UserProfileComponent {
  readonly keys = StorageKeys;
}
