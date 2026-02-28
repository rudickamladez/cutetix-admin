import { Component } from '@angular/core';
import { UsersService } from '../../services/users.service';

@Component({
    selector: 'app-administration-layout',
    templateUrl: './layout.component.html',
    styleUrls: ['./layout.component.scss'],
    providers: [UsersService],
    standalone: false
})
export class AdministrationLayoutComponent {

}
