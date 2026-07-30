import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { TicketService } from '../tickets.service';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';
import { TicketGroupService } from '../../ticket_groups/ticket_groups.service';
import { TicketGroup } from '../../ticket_groups/ticket_groups.types';
import { TicketStatusEnum } from '../tickets.types';

@Component({
    selector: 'app-tickets-new',
    templateUrl: './tickets-new.component.html',
    styleUrls: ['./tickets-new.component.scss'],
    imports: [ReactiveFormsModule]
})
export class TicketsNewComponent {
  readonly #router = inject(Router);
  readonly #ticketService = inject(TicketService);
  readonly #ticketgroupService = inject(TicketGroupService);
  readonly #toastr = inject(ToastrService);

  public form = new FormGroup({
    firstname: new FormControl('', Validators.required),
    lastname: new FormControl('', Validators.required),
    email: new FormControl('', Validators.required),
    description: new FormControl(''),
    status: new FormControl(TicketStatusEnum.new, Validators.required),
    groupId: new FormControl(0, Validators.required)
  });
  protected readonly groupsResource = this.#ticketgroupService.ticketGroups;

  public newTicketGroup() {
    this.#ticketService.create({
      firstname: this.form.value.firstname || '',
      lastname: this.form.value.lastname || '',
      email: this.form.value.email || '',
      status: this.form.value.status || TicketStatusEnum.new,
      group_id: this.form.value.groupId || 0
    }).subscribe({
      next: (ticket) => {
        this.#toastr.info(
          'Successfully created.',
          `Ticket for '${ticket.email}'`,
          {
            progressBar: true
          }
        );
        this.#router.navigate(['/tickets/list']);
      },
      error: (err) => {
        this.#toastr.error(
          `NOT CREATED! Error: ${err.message}`,
          'Ticket',
          {
            progressBar: true
          }
        )
      }
    })
  }

  protected groups(): Array<TicketGroup> {
    return this.groupsResource.value();
  }

  protected loadErrorText(): string {
    const err = this.groupsResource.error();
    if (!err) {
      return '';
    }
    if (err instanceof Error) {
      return err.message;
    }
    return String(err);
  }
}
