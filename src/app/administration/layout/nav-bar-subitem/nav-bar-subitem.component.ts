import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { RouterLinkActive, RouterLink } from '@angular/router';

@Component({
    selector: 'app-nav-bar-subitem',
    templateUrl: './nav-bar-subitem.component.html',
    styleUrls: ['./nav-bar-subitem.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [RouterLinkActive, RouterLink]
})
export class NavBarSubitemComponent {
  @Input() name = '';
  @Input() link = '';
  @Input() exact = true;
  @Input() activeOverride = false;
  constructor() { }
}
