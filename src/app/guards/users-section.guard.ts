import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const usersSectionGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

return authService.hasAnyScope('users:read', 'users:edit') || router.createUrlTree(['/dashboard']);
};
