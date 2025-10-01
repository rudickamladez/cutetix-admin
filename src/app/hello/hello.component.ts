import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';


@Component({
    selector: 'app-hello',
    templateUrl: './hello.component.html',
    styleUrls: ['./hello.component.scss'],
    standalone: false
})
export class HelloComponent implements OnInit {
  readonly #auth = inject(AuthService);
  readonly #router = inject(Router);

  constructor() { }

  ngOnInit(): void {
    if (this.#auth.isLoggedIn()) {
      this.#router.navigate(['/dashboard']);
    }
  }
}
