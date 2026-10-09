import { Component, computed, effect, inject, input, signal, ChangeDetectionStrategy } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { disabled, form, required, submit, FormField } from '@angular/forms/signals';
import { EventService } from '../events.service';
import { SnackbarToastrService } from '../../../services/snackbar-toastr.service';
import { Router } from '@angular/router';
import { EventPermissionsService } from 'src/app/services/event-permissions.service';
import { Observable, firstValueFrom, of } from 'rxjs';
import { EventCreate } from '../events.types';
import { LoadingComponent } from '../../loading/loading.component';
import { EventPermissionsComponent } from '../permissions/event-permissions.component';
import { AsyncPipe } from '@angular/common';

@Component({
    selector: 'app-events-form',
    templateUrl: './events-form.component.html',
    styleUrls: ['./events-form.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [LoadingComponent, FormField, EventPermissionsComponent, AsyncPipe]
})
export class EventsFormComponent {
  readonly #router = inject(Router);
  readonly #eventService = inject(EventService);
  readonly #toastr = inject(SnackbarToastrService);
  readonly #eventPermissions = inject(EventPermissionsService);
  readonly #eventResource = this.#eventService.activeEventResource;
  #loadErrorShown = false;

  readonly mode = input.required<'new' | 'edit' | 'detail'>();
  readonly eventIdParam = input<string | null>(null, { alias: 'event-id' });
  public readonly event = this.#eventResource;
  public readonly isEditing = computed(() => this.mode() !== 'new');
  public readonly eventId = computed(() => this.eventIdParam() ?? '');
  protected readonly canManagePermissions = computed<Observable<boolean>>(() => this.eventIdParam()
    ? this.#eventPermissions.canForEvent(this.eventIdParam()!, 'events:edit')
    : of(false));
  protected readonly eventModel = signal<EventCreate>({
    name: '',
    tickets_sales_start: new Date().toISOString().substring(0, 16),
    tickets_sales_end: new Date(new Date().getDate() + 14).toISOString().substring(0, 16),
    smtp_mail_from: '',
    mail_text_new_ticket: 'New ticket has been created.',
    mail_html_new_ticket: '<p>New ticket has been created.</p>',
    mail_text_cancelled_ticket: 'Your ticket has been cancelled.',
    mail_html_cancelled_ticket: '<p>Your ticket has been cancelled.</p>',
  });
  protected readonly eventForm = form(this.eventModel, path => {
    required(path.name);
    required(path.tickets_sales_start);
    required(path.tickets_sales_end);
    required(path.mail_text_new_ticket);
    required(path.mail_html_new_ticket);
    required(path.mail_text_cancelled_ticket);
    required(path.mail_html_cancelled_ticket);
    disabled(path, { when: () => this.mode() === 'detail' });
  });

  constructor() {
    effect(() => {
      if (!this.isEditing()) {
        return;
      }
      const event = this.#eventResource.value();
      if (event && String(event.id) === this.eventIdParam()) {
        this.eventModel.set({
          name: event.name,
          tickets_sales_start: event.tickets_sales_start,
          tickets_sales_end: event.tickets_sales_end,
          smtp_mail_from: event.smtp_mail_from,
          mail_text_new_ticket: event.mail_text_new_ticket,
          mail_html_new_ticket: event.mail_html_new_ticket,
          mail_text_cancelled_ticket: event.mail_text_cancelled_ticket,
          mail_html_cancelled_ticket: event.mail_html_cancelled_ticket,
        });
      }

      const activeEventId = this.#eventService.activeEventId();
      const err = this.#eventResource.error();
      if (activeEventId !== this.eventIdParam() || !err || this.#loadErrorShown) {
        return;
      }
      this.#loadErrorShown = true;
      const detail = err instanceof HttpErrorResponse ? err.error?.detail : undefined;
      this.#toastr.error(
        typeof detail === 'string' ? detail : err.message,
        'Cannot load event',
        { progressBar: true }
      );
    });
  }

  protected saveEvent(event: Event): void {
    event.preventDefault();
    if (this.mode() === 'detail') {
      return;
    }
    submit(this.eventForm, async () => {
      try {
        const event = this.mode() === 'new'
          ? await firstValueFrom(this.#eventService.create(this.eventModel()))
          : await firstValueFrom(this.#eventService.update(this.eventIdParam()!, this.eventModel()));
        this.#toastr.info(
          this.mode() === 'new' ? 'Successfully created.' : 'Successfully edited.',
          `Event called '${event.name}'`,
          { progressBar: true }
        );
        this.#router.navigate(['/events/detail/' + event.id]);
      } catch (err) {
        this.#toastr.error(
          `${this.mode() === 'new' ? 'NOT CREATED' : 'NOT EDITED'}! Error: ${err instanceof Error ? err.message : String(err)}`,
          'Event',
          { progressBar: true }
        );
      }
    });
  }

  protected loadErrorText(): string {
    const err = this.event.error();
    if (!err) {
      return '';
    }
    if (err instanceof Error) {
      return err.message;
    }
    return String(err);
  }
}
