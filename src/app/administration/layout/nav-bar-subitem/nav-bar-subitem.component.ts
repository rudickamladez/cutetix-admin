import { Component, Input } from '@angular/core';
import { RouterLinkActive, RouterLink } from '@angular/router';

@Component({
    selector: 'app-nav-bar-subitem',
    templateUrl: './nav-bar-subitem.component.html',
    styleUrls: ['./nav-bar-subitem.component.scss'],
    imports: [RouterLinkActive, RouterLink]
})
export class NavBarSubitemComponent {
  @Input() name = '';
  @Input() link = '';
  constructor() { }
}
