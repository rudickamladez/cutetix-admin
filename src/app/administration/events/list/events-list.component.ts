import { Component, computed, inject, ChangeDetectionStrategy, signal } from '@angular/core';
import { EventService } from '../events.service';
import { Event } from '../events.types';
import { faPen, faStar, faStarHalfStroke, faTicket, faTrash } from '@fortawesome/free-solid-svg-icons';
import { ActivatedRoute, Router } from '@angular/router';
import { UsersService } from 'src/app/services/users.service';
import { EventPermissionsService } from 'src/app/services/event-permissions.service';
import { Observable } from 'rxjs';
import { matchesSearch } from '../../../shared/matches-search';
import { getAriaSort, sortRows, TableSortState, toggleSort } from '../../../shared/table-sort';
import { ConfirmDialogService } from '../../../services/confirm-dialog.service';

type EventSortColumn = 'name' | 'tickets_sales_start' | 'tickets_sales_end';

@Component({
  selector: 'app-events-list',
  templateUrl: './events-list.component.html',
  styleUrls: ['./events-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false
})
export class EventsListComponent {
  protected readonly eventsService = inject(EventService);
  readonly #usersService = inject(UsersService);
  readonly #router = inject(Router);
  readonly #route = inject(ActivatedRoute);
  readonly #eventPermissions = inject(EventPermissionsService);
  readonly #confirmDialog = inject(ConfirmDialogService);
  readonly #editPermissions = new Map<string, Observable<boolean>>();
  protected readonly isMyEvents = this.#route.parent?.routeConfig?.path === 'my-events';
  protected readonly events = this.isMyEvents
  ? this.eventsService.myEvents
  : this.eventsService.events;
  protected readonly search = signal('');
  protected readonly filteredEvents = computed(() => this.events.value().filter((event) =>
    matchesSearch(this.search(), [event.name, event.id])
  ));
  protected readonly sortState = signal<TableSortState<EventSortColumn>>({ column: null, direction: null });
  protected readonly sortedEvents = computed(() => sortRows(
    this.filteredEvents(),
    this.sortState(),
    (event, column) => event[column]
  ));
  
  // Icons
  protected readonly editIcon = faPen;
  protected readonly deleteIcon = faTrash;
  protected readonly favoriteEventIcon = faStar;
  protected readonly unfavoriteEventIcon = faStarHalfStroke;
  protected readonly ticketsIcon = faTicket;

  protected toggleSort(column: EventSortColumn): void {
    this.sortState.update((state) => toggleSort(state, column));
  }

  protected sortAriaSort(column: EventSortColumn): 'ascending' | 'descending' | 'none' {
    return getAriaSort(this.sortState(), column);
  }

  favoriteIcon(eventId: string) {
    if (this.#usersService.isEventFavorited(eventId)) {
      return this.unfavoriteEventIcon; // icon for removal
    }
    return this.favoriteEventIcon; // icon for adding
  }

  favorite(eventId: string) {
    this.#usersService.toggleEventFavorite(eventId);
  }

  protected openEventTickets(event: Event) {
    this.#router.navigate([(this.isMyEvents ? '/my-events' : '/events'), event.id, 'tickets', 'list']);
  }

  protected deleteEvent(event: Event): void {
    this.#confirmDialog.confirm({
      title: 'Delete event',
      message: `Are you sure to delete event "${event.name}"?`,
      confirmLabel: 'Delete',
      destructive: true,
    }).subscribe((confirmed) => {
      if (confirmed) {
        this.eventsService.delete(event);
      }
    });
  }

  public canViewTickets(eventId: string): Observable<boolean> {
    return this.#eventPermissions.canForEvent(eventId, 'tickets:read');
  }

  public edit(event: Event) {
    this.#router.navigate(['/events/edit/' + event.id])
  }

  protected canEdit(eventId: string): Observable<boolean> {
    const cachedPermission = this.#editPermissions.get(eventId);
    if (cachedPermission) {
      return cachedPermission;
    }

    const permission = this.#eventPermissions.canForEvent(eventId, 'events:edit');
    this.#editPermissions.set(eventId, permission);
    return permission;
  }

  protected loadErrorText(): string {
    const err = this.events.error();
    if (!err) {
      return '';
    }
    if (err instanceof Error) {
      return err.message;
    }
    return String(err);
  }
}
