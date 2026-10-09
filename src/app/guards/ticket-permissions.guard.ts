import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of, switchMap } from 'rxjs';
import { TicketService } from '../services/tickets.service';
import { EventPermissionsService } from '../services/event-permissions.service';

export const ticketEditGuard: CanActivateFn = route => {
  const eventPermissions = inject(EventPermissionsService);
  const router = inject(Router);
  const ticketId = route.paramMap.get('id');
  const routeEventId = route.paramMap.get('event-id')
    ?? route.parent?.paramMap.get('event-id');
  const denied = router.createUrlTree(['/tickets/list']);

  if (!ticketId) {
    return denied;
  }
  if (!routeEventId && eventPermissions.hasGlobalScope('tickets:edit')) {
    return true;
  }

  return inject(TicketService).getById(ticketId).pipe(
    switchMap(ticket => {
      const ticketEventId = ticket.group?.event_id;
      if (ticketEventId === undefined || (routeEventId && String(ticketEventId) !== routeEventId)) {
        return of(false);
      }
      return eventPermissions.hasGlobalScope('tickets:edit')
        ? of(true)
        : eventPermissions.canForEvent(ticketEventId, 'tickets:edit');
    }),
    map(canEdit => canEdit || denied),
    catchError(() => of(denied))
  );
};

export const ticketReadGuard: CanActivateFn = route => {
  const eventPermissions = inject(EventPermissionsService);
  const router = inject(Router);
  const ticketId = route.paramMap.get('id');
  const eventId = route.paramMap.get('event-id')
    ?? route.parent?.paramMap.get('event-id');
  const denied = eventId
    ? router.createUrlTree(['/my-events', eventId, 'tickets', 'list'])
    : router.createUrlTree(['/tickets/list']);

  if (!ticketId) {
    return denied;
  }
  if (!eventId && (
    eventPermissions.hasGlobalScope('tickets:read')
    || eventPermissions.hasGlobalScope('tickets:edit')
  )) {
    return true;
  }

  return inject(TicketService).getById(ticketId).pipe(
    switchMap(ticket => {
      const ticketEventId = ticket.group?.event_id;
      if (ticketEventId === undefined || (eventId && String(ticketEventId) !== eventId)) {
        return of(false);
      }
      return eventPermissions.hasGlobalScope('tickets:read')
        || eventPermissions.hasGlobalScope('tickets:edit')
        ? of(true)
        : eventPermissions.canForEvent(ticketEventId, 'tickets:read');
    }),
    map(canRead => canRead || denied),
    catchError(() => of(denied))
  );
};
