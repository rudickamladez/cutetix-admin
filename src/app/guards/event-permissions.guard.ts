import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { EventPermissionsService } from '../services/event-permissions.service';

export const eventCreateGuard: CanActivateFn = () => {
  const eventPermissions = inject(EventPermissionsService);
  const router = inject(Router);

  return eventPermissions.hasGlobalScope('events:edit')
    || router.createUrlTree(['/events/list']);
};

export const eventEditGuard: CanActivateFn = route => {
  const eventPermissions = inject(EventPermissionsService);
  const router = inject(Router);
  const eventId = route.paramMap.get('event-id');

  if (!eventId) {
    return router.createUrlTree(['/events/list']);
  }

  return eventPermissions.canForEvent(eventId, 'events:edit').pipe(
    map(canEdit => canEdit || router.createUrlTree(['/events/list'])),
    catchError(() => of(router.createUrlTree(['/events/list'])))
  );
};

export const eventTicketsReadGuard: CanActivateFn = route => {
  const eventPermissions = inject(EventPermissionsService);
  const router = inject(Router);

  const eventId = route.paramMap.get('event-id');

  if (!eventId) {
    return router.createUrlTree(['/my-events/list']);
  }

  return eventPermissions.canForEvent(eventId, 'tickets:read').pipe(
    map(canRead =>
      canRead || router.createUrlTree(['/my-events/list'])
    ),
    catchError(() =>
      of(router.createUrlTree(['/my-events/list']))
    )
  );
};
