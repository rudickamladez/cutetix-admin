import { Component } from '@angular/core';
import { UsersService } from '../../services/users.service';
import { NavBarComponent } from './nav-bar/nav-bar.component';
import { LoggedUserComponent } from './logged-user/logged-user.component';
import { RouterOutlet } from '@angular/router';
import { CopyrightComponent } from '../../components/copyright/copyright.component';

@Component({
    selector: 'app-administration-layout',
    templateUrl: './layout.component.html',
    styleUrls: ['./layout.component.scss'],
    providers: [UsersService],
    imports: [NavBarComponent, LoggedUserComponent, RouterOutlet, CopyrightComponent]
})
export class AdministrationLayoutComponent {

}
