import { Component } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { TicketService } from '../../tickets/tickets.service';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';
import { TicketGroupService } from '../../ticket_groups/ticket_groups.service';
import { TicketGroup } from '../../ticket_groups/ticket_groups.types';
import { TicketStatusEnum } from '../tickets.types';

@Component({
  selector: 'app-tickets-new',
  templateUrl: './component.html',
  styleUrls: ['./component.scss']
})
export class TicketsNewComponent {
  public form = new FormGroup({
    firstname: new FormControl('', Validators.required),
    lastname: new FormControl('', Validators.required),
    email: new FormControl('', Validators.required),
    description: new FormControl(''),
    status: new FormControl(TicketStatusEnum.new, Validators.required),
    groupId: new FormControl(0, Validators.required)
  });
  public groups: Array<TicketGroup> = [];

  constructor(
    private router: Router,
    private ticketService: TicketService,
    private ticketgroupService: TicketGroupService,
    private toastr: ToastrService
  ) { }

  ngOnInit(): void {
    this.ticketgroupService.get().subscribe({
      next: (ticket_groups) => {
        this.groups = ticket_groups;
      }
    })
  }

  public newTicketGroup() {
    this.ticketService.create({
      firstname: this.form.value.firstname || '',
      lastname: this.form.value.lastname || '',
      email: this.form.value.email || '',
      status: this.form.value.status || TicketStatusEnum.new,
      group_id: this.form.value.groupId || 0
    }).subscribe({
      next: (ticket) => {
        this.toastr.info(
          'Successfully created.',
          `Ticket for '${ticket.email}'`,
          {
            progressBar: true
          }
        );
        this.router.navigate(['/tickets/list']);
      },
      error: (err) => {
        this.toastr.error(
          `NOT CREATED! Error: ${err.message}`,
          'Ticket',
          {
            progressBar: true
          }
        )
      }
    })
  }
}
