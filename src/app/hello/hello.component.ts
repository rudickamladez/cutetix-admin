import type { OnInit } from "@angular/core";
import { Component, inject } from "@angular/core";
import { Router } from "@angular/router";

import { faPersonRunning } from "@fortawesome/free-solid-svg-icons";

import { AuthService } from "../services/auth.service";

@Component({
  selector: "app-hello",
  templateUrl: "./hello.component.html",
  styleUrls: ["./hello.component.scss"],
  standalone: false,
})
export class HelloComponent implements OnInit {
  readonly #auth = inject(AuthService);
  readonly #router = inject(Router);

  // icons
  enterIcon = faPersonRunning;

  constructor() {}

  ngOnInit(): void {
    if (this.#auth.isLoggedIn()) {
      this.#router.navigate(["/dashboard"]);
    }
  }
}
