import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of, switchMap } from 'rxjs';
import { TicketGroupService } from '../administration/ticket_groups/ticket_groups.service';
import { EventPermissionsService } from '../services/event-permissions.service';

export const ticketGroupEditGuard: CanActivateFn = route => {
  const eventPermissions = inject(EventPermissionsService);
  const router = inject(Router);
  const ticketGroupId = route.paramMap.get('ticket-group-id');
  const eventId = route.parent?.paramMap.get('event-id');
  const eventPath = route.pathFromRoot.some(snapshot => snapshot.routeConfig?.path === 'events') ? '/events' : '/my-events';
  const denied = eventId
    ? router.createUrlTree([eventPath, eventId, 'ticket-groups', 'list'])
    : router.createUrlTree(['/ticket_groups/list']);

  if (!ticketGroupId) {
    return denied;
  }
  const hasGlobalEdit = eventPermissions.hasGlobalScope('ticket_groups:edit');
  if (!eventId && hasGlobalEdit) {
    return true;
  }

  return inject(TicketGroupService).getById(ticketGroupId).pipe(
    switchMap(ticketGroup => {
      if (eventId && String(ticketGroup.event_id) !== eventId) {
        return of(denied);
      }
      return hasGlobalEdit
        ? of(true)
        : eventPermissions.canForEvent(ticketGroup.event_id, 'ticket_groups:edit').pipe(
          map(canEdit => canEdit || denied)
        );
    }),
    catchError(() => of(denied))
  );
};

export const ticketGroupEventContextGuard: CanActivateFn = route => {
  const router = inject(Router);
  const ticketGroupId = route.paramMap.get('ticket-group-id');
  const eventId = route.parent?.paramMap.get('event-id');

  if (!eventId) {
    return true;
  }

  const eventPath = route.pathFromRoot.some(snapshot => snapshot.routeConfig?.path === 'events') ? '/events' : '/my-events';
  const denied = router.createUrlTree([eventPath, eventId, 'ticket-groups', 'list']);
  if (!ticketGroupId) {
    return denied;
  }

  return inject(TicketGroupService).getById(ticketGroupId).pipe(
    map(ticketGroup => String(ticketGroup.event_id) === eventId || denied),
    catchError(() => of(denied))
  );
};
