import { Component, inject, isDevMode } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { UpdateService } from './services/update.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html'
})
export class AppComponent {
  readonly #updateService = inject(UpdateService);

  constructor(
    private titleService: Title
  ) { }
  ngOnInit(): void {
    if (isDevMode()) {
      this.titleService.setTitle(`DEV ${this.titleService.getTitle()}`)
    }
  }
}
