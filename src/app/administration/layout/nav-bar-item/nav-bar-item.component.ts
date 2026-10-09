import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { MenuItem } from '../nav-bar/menu-items';
import { RouterLinkActive, RouterLink } from '@angular/router';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';

@Component({
    selector: 'app-nav-bar-item',
    templateUrl: './nav-bar-item.component.html',
    styleUrls: ['./nav-bar-item.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [RouterLinkActive, RouterLink, FaIconComponent]
})
export class NavBarItemComponent {
    @Input() selected = false;
    @Input() item!: MenuItem;
}
