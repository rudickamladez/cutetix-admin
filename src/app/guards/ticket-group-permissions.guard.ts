import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of, switchMap } from 'rxjs';
import { TicketGroupService } from '../administration/ticket_groups/ticket_groups.service';
import { EventPermissionsService } from '../services/event-permissions.service';

export const ticketGroupEditGuard: CanActivateFn = route => {
  const eventPermissions = inject(EventPermissionsService);
  const router = inject(Router);
  const ticketGroupId = route.paramMap.get('id');
  const denied = router.createUrlTree(['/ticket_groups/list']);

  if (!ticketGroupId) {
    return denied;
  }
  if (eventPermissions.hasGlobalScope('ticket_groups:edit')) {
    return true;
  }

  return inject(TicketGroupService).getById(ticketGroupId).pipe(
    switchMap(ticketGroup => eventPermissions.canForEvent(
      ticketGroup.event_id,
      'ticket_groups:edit'
    )),
    map(canEdit => canEdit || denied),
    catchError(() => of(denied))
  );
};
