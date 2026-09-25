import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

@Component({
    selector: 'app-nav-bar-subitem',
    templateUrl: './nav-bar-subitem.component.html',
    styleUrls: ['./nav-bar-subitem.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class NavBarSubitemComponent {
  @Input() name = '';
  @Input() link = '';
  constructor() { }
}
