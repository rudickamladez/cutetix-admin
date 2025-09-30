import { Component, Input } from '@angular/core';
import { MenuItem } from '../nav-bar/menu-items';

@Component({
    selector: 'app-nav-bar-item',
    templateUrl: './nav-bar-item.component.html',
    styleUrls: ['./nav-bar-item.component.scss'],
    standalone: false
})
export class NavBarItemComponent {
    @Input() selected = false;
    @Input() item!: MenuItem;
}
