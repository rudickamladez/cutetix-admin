import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { faPersonRunning } from '@fortawesome/free-solid-svg-icons';


@Component({
    selector: 'app-hello',
    templateUrl: './hello.component.html',
    styleUrls: ['./hello.component.scss'],
    standalone: false
})
export class HelloComponent implements OnInit {
  readonly #auth = inject(AuthService);
  readonly #router = inject(Router);

  // icons
  protected readonly enterIcon = faPersonRunning;

  constructor() { }

  ngOnInit(): void {
    if (this.#auth.canGoToPrivate()) {
      this.#router.navigate(['/dashboard']);
    }
  }
}
