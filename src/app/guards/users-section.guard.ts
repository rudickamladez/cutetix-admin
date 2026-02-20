import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const usersSectionGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.hasAnyScope('users:read', 'users:edit')) {
    return true;
  }

  return router.createUrlTree(['/dashboard']);
};
