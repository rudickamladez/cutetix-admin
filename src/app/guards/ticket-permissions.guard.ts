import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of, switchMap } from 'rxjs';
import { TicketService } from '../administration/tickets/tickets.service';
import { EventPermissionsService } from '../services/event-permissions.service';

export const ticketEditGuard: CanActivateFn = route => {
  const eventPermissions = inject(EventPermissionsService);
  const router = inject(Router);
  const ticketId = route.paramMap.get('id');
  const denied = router.createUrlTree(['/tickets/list']);

  if (!ticketId) {
    return denied;
  }
  if (eventPermissions.hasGlobalScope('tickets:edit')) {
    return true;
  }

  return inject(TicketService).getById(ticketId).pipe(
    switchMap(ticket => {
      const eventId = ticket.group?.event_id;
      return eventId === undefined
        ? of(false)
        : eventPermissions.canForEvent(eventId, 'tickets:edit');
    }),
    map(canEdit => canEdit || denied),
    catchError(() => of(denied))
  );
};
