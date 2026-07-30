import { Component, effect, inject, signal } from '@angular/core';
import { FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { EventService } from '../events.service';
import { ToastrService } from 'ngx-toastr';
import { ActivatedRoute, Router } from '@angular/router';
import { LoadingComponent } from '../../loading/loading.component';

@Component({
    selector: 'app-events-form',
    templateUrl: './events-form.component.html',
    styleUrls: ['./events-form.component.scss'],
    imports: [LoadingComponent, ReactiveFormsModule]
})
export class EventsFormComponent {
  readonly #router = inject(Router);
  readonly #route = inject(ActivatedRoute);
  readonly #eventService = inject(EventService);
  readonly #toastr = inject(ToastrService);
  readonly #id = signal<string | null>(this.#route.snapshot.paramMap.get('id'));
  readonly #eventResource = this.#eventService.eventByIdResource(() => this.#id());
  #loadErrorShown = false;

  public readonly event = this.#eventResource;
  public readonly isEditing = this.#id() != null;
  public form = new FormGroup({
    name: new FormControl('', Validators.required),
    ticketsSalesStart: new FormControl(new Date().toISOString().substring(0, 16), Validators.required),
    ticketsSalesEnd: new FormControl(new Date(new Date().getDate() + 14).toISOString().substring(0, 16), Validators.required),
    smtpMailFrom: new FormControl(''),
    mailTextNewTicket: new FormControl('New ticket has been created.', Validators.required),
    mailHtmlNewTicket: new FormControl('<p>New ticket has been created.</p>', Validators.required),
    mailTextCancelledTicket: new FormControl('Your ticket has been cancelled.', Validators.required),
    mailHtmlCancelledTicket: new FormControl('<p>Your ticket has been cancelled.</p>', Validators.required),
  });
  public title: string = 'New event';
  public editButtonEnabled: boolean = true;
  public editButtonText: string = 'Create';
  public formMethod: () => void = this.createEvent;

  constructor() {
    // Check detail view
    if (this.#router.url.includes('edit')) {
      this.title = 'Event edit'
      this.editButtonText = 'Edit';
    } else if (this.#router.url.includes('detail')) {
      this.title = 'Event detail';
      this.editButtonEnabled = false;
      this.form.get('name')?.disable();
      this.form.get('ticketsSalesStart')?.disable();
      this.form.get('ticketsSalesEnd')?.disable();
      this.form.get('smtpMailFrom')?.disable();
      this.form.get('mailTextNewTicket')?.disable();
      this.form.get('mailHtmlNewTicket')?.disable();
      this.form.get('mailTextCancelledTicket')?.disable();
      this.form.get('mailHtmlCancelledTicket')?.disable();
    }

    // Editing event
    if (this.isEditing) {
      // Update form submit method
      this.formMethod = this.editEvent;

      effect(() => {
        const event = this.#eventResource.value();
        if (!event) {
          return;
        }
        this.form.setValue({
          name: event.name,
          ticketsSalesStart: event.tickets_sales_start,
          ticketsSalesEnd: event.tickets_sales_end,
          smtpMailFrom: event.smtp_mail_from,
          mailTextNewTicket: event.mail_text_new_ticket,
          mailHtmlNewTicket: event.mail_html_new_ticket,
          mailTextCancelledTicket: event.mail_text_cancelled_ticket,
          mailHtmlCancelledTicket: event.mail_html_cancelled_ticket,
        });
      });

      effect(() => {
        const err = this.#eventResource.error();
        if (!err || this.#loadErrorShown) {
          return;
        }
        this.#loadErrorShown = true;
          this.form.get('name')?.disable();
          this.form.get('ticketsSalesStart')?.disable();
          this.form.get('ticketsSalesEnd')?.disable();
          this.#toastr.error(
            err.message,
            'Cannot load ticket group',
            {
              progressBar: true,
            }
          );
      });
    }
  }

  public createEvent() {
    this.#eventService.create(
      {
        name: this.form.value.name || '',
        tickets_sales_start: this.form.value.ticketsSalesStart || new Date().toISOString().substring(0, 16),
        tickets_sales_end: this.form.value.ticketsSalesEnd || new Date(new Date().getDate() + 14).toISOString().substring(0, 16),
        smtp_mail_from: this.form.value.smtpMailFrom || '',
        mail_text_new_ticket: this.form.value.mailTextNewTicket || '',
        mail_html_new_ticket: this.form.value.mailHtmlNewTicket || '',
        mail_text_cancelled_ticket: this.form.value.mailTextCancelledTicket || '',
        mail_html_cancelled_ticket: this.form.value.mailHtmlCancelledTicket || '',
      }
    ).subscribe({
      next: (event) => {
        this.#toastr.info(
          'Successfully created.',
          `Event called '${event.name}'`,
          {
            progressBar: true
          }
        );
        this.#router.navigate(['/events/detail/' + event.id]);
      },
      error: (err) => {
        this.#toastr.error(
          `NOT CREATED! Error: ${err.message}`,
          'Event',
          {
            progressBar: true
          }
        )
      }
    })
  }

  public editEvent() {
    const id = this.#id();
    if (!id) {
      return;
    }
    this.#eventService.update(
      id,
      {
        name: this.form.value.name || '',
        tickets_sales_start: this.form.value.ticketsSalesStart || new Date().toISOString().substring(0, 16),
        tickets_sales_end: this.form.value.ticketsSalesEnd || new Date(new Date().getDate() + 14).toISOString().substring(0, 16),
        smtp_mail_from: this.form.value.smtpMailFrom || '',
        mail_text_new_ticket: this.form.value.mailTextNewTicket || '',
        mail_html_new_ticket: this.form.value.mailHtmlNewTicket || '',
        mail_text_cancelled_ticket: this.form.value.mailTextCancelledTicket || '',
        mail_html_cancelled_ticket: this.form.value.mailHtmlCancelledTicket || '',
      }
    ).subscribe({
      next: (event) => {
        this.#toastr.info(
          'Successfully edited.',
          `Event called '${event.name}'`,
          {
            progressBar: true
          }
        );
        this.#router.navigate(['/events/detail/' + event.id]);
      },
      error: (err) => {
        this.#toastr.error(
          `NOT EDITED! Error: ${err.message}`,
          'Event',
          {
            progressBar: true
          }
        )
      }
    })
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
