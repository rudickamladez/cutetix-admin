import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { EventService } from '../../events/events.service';

@Component({
  imports: [],
  selector: 'app-current-event',
  styleUrls: ['./current-event.component.scss'],
  templateUrl: './current-event.component.html',
})
export class CurrentEventComponent {
  readonly #eventsService = inject(EventService);
  readonly #route = inject(ActivatedRoute);
  readonly #eventId = this.#route.snapshot.paramMap.get('event-id');
  protected readonly event = this.#eventsService.eventByIdResource(() => this.#eventId);

}
