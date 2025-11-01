import { Component, inject } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";

import { ToastrService } from "ngx-toastr";

import { EventService } from "../events.service";

@Component({
  selector: "app-events-form",
  templateUrl: "./events-form.component.html",
  styleUrls: ["./events-form.component.scss"],
  standalone: false,
})
export class EventsFormComponent {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private eventService = inject(EventService);
  private toastr = inject(ToastrService);

  public id: string | null;
  public form = new FormGroup({
    name: new FormControl("", Validators.required),
    ticketsSalesStart: new FormControl(
      new Date().toISOString().substring(0, 16),
      Validators.required
    ),
    ticketsSalesEnd: new FormControl(
      new Date(new Date().getDate() + 14).toISOString().substring(0, 16),
      Validators.required
    ),
    smtpMailFrom: new FormControl(""),
    mailTextNewTicket: new FormControl(
      "New ticket has been created.",
      Validators.required
    ),
    mailHtmlNewTicket: new FormControl(
      "<p>New ticket has been created.</p>",
      Validators.required
    ),
    mailTextCancelledTicket: new FormControl(
      "Your ticket has been cancelled.",
      Validators.required
    ),
    mailHtmlCancelledTicket: new FormControl(
      "<p>Your ticket has been cancelled.</p>",
      Validators.required
    ),
  });
  public title: string = "New event";
  public editButtonEnabled: boolean = true;
  public editButtonText: string = "Create";
  public formMethod = this.createEvent;

  constructor() {
    // Check detail view
    if (this.router.url.includes("edit")) {
      this.title = "Event edit";
      this.editButtonText = "Edit";
    } else if (this.router.url.includes("detail")) {
      this.title = "Event detail";
      this.editButtonEnabled = false;
      this.form.get("name")?.disable();
      this.form.get("ticketsSalesStart")?.disable();
      this.form.get("ticketsSalesEnd")?.disable();
      this.form.get("smtpMailFrom")?.disable();
      this.form.get("mailTextNewTicket")?.disable();
      this.form.get("mailHtmlNewTicket")?.disable();
      this.form.get("mailTextCancelledTicket")?.disable();
      this.form.get("mailHtmlCancelledTicket")?.disable();
    }

    // Get ID from query
    this.id = this.route.snapshot.paramMap.get("id");

    // Editing event
    if (this.id !== null) {
      // Update form submit method
      this.formMethod = this.editEvent;

      // Load event object from database
      this.eventService.getById(this.id).subscribe({
        // Success
        next: event => {
          this.toastr.info("Loaded successfully.", "Event", {
            progressBar: true,
          });
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
        },
        // Error
        error: err => {
          this.form.get("name")?.disable();
          this.form.get("ticketsSalesStart")?.disable();
          this.form.get("ticketsSalesEnd")?.disable();
          this.toastr.error(err.message, "Cannot load ticket group", {
            progressBar: true,
          });
          return;
        },
      });
    }
  }

  public createEvent(): void {
    this.eventService
      .create({
        name: this.form.value.name || "",
        tickets_sales_start:
          this.form.value.ticketsSalesStart ||
          new Date().toISOString().substring(0, 16),
        tickets_sales_end:
          this.form.value.ticketsSalesEnd ||
          new Date(new Date().getDate() + 14).toISOString().substring(0, 16),
        smtp_mail_from: this.form.value.smtpMailFrom || "",
        mail_text_new_ticket: this.form.value.mailTextNewTicket || "",
        mail_html_new_ticket: this.form.value.mailHtmlNewTicket || "",
        mail_text_cancelled_ticket:
          this.form.value.mailTextCancelledTicket || "",
        mail_html_cancelled_ticket:
          this.form.value.mailHtmlCancelledTicket || "",
      })
      .subscribe({
        next: event => {
          this.toastr.info(
            "Successfully created.",
            `Event called '${event.name}'`,
            {
              progressBar: true,
            }
          );
          this.router.navigate(["/events/detail/" + event.id]);
        },
        error: err => {
          this.toastr.error(`NOT CREATED! Error: ${err.message}`, "Event", {
            progressBar: true,
          });
        },
      });
  }

  public editEvent(): void {
    this.eventService
      .update(this.id || "", {
        name: this.form.value.name || "",
        tickets_sales_start:
          this.form.value.ticketsSalesStart ||
          new Date().toISOString().substring(0, 16),
        tickets_sales_end:
          this.form.value.ticketsSalesEnd ||
          new Date(new Date().getDate() + 14).toISOString().substring(0, 16),
        smtp_mail_from: this.form.value.smtpMailFrom || "",
        mail_text_new_ticket: this.form.value.mailTextNewTicket || "",
        mail_html_new_ticket: this.form.value.mailHtmlNewTicket || "",
        mail_text_cancelled_ticket:
          this.form.value.mailTextCancelledTicket || "",
        mail_html_cancelled_ticket:
          this.form.value.mailHtmlCancelledTicket || "",
      })
      .subscribe({
        next: event => {
          this.toastr.info(
            "Successfully edited.",
            `Event called '${event.name}'`,
            {
              progressBar: true,
            }
          );
          this.router.navigate(["/events/detail/" + event.id]);
        },
        error: err => {
          this.toastr.error(`NOT EDITED! Error: ${err.message}`, "Event", {
            progressBar: true,
          });
        },
      });
  }
}
