import { inject } from "@angular/core";
import type { CanActivateFn } from "@angular/router";
import { Router } from "@angular/router";

import { AuthService } from "../services/auth.service";

export const logoutGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  authService.logout();
  return router.createUrlTree(["/"]);
};
