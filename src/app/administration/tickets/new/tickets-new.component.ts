import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { TicketService } from '../tickets.service';
import { SnackbarToastrService } from '../../../services/snackbar-toastr.service';
import { Router } from '@angular/router';
import { TicketGroupService } from '../../ticket_groups/ticket_groups.service';
import { TicketGroup } from '../../ticket_groups/ticket_groups.types';
import { TicketStatusEnum } from '../tickets.types';
import { EventPermissionsService } from 'src/app/services/event-permissions.service';
import { Observable, of, take } from 'rxjs';

@Component({
    selector: 'app-tickets-new',
    templateUrl: './tickets-new.component.html',
    styleUrls: ['./tickets-new.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class TicketsNewComponent {
  readonly #router = inject(Router);
  readonly #ticketService = inject(TicketService);
  readonly #ticketgroupService = inject(TicketGroupService);
  readonly #toastr = inject(SnackbarToastrService);
  readonly #eventPermissions = inject(EventPermissionsService);
  readonly #createPermissions = new Map<number, Observable<boolean>>();
  readonly #denied = of(false);

  public form = new FormGroup({
    firstname: new FormControl('', Validators.required),
    lastname: new FormControl('', Validators.required),
    email: new FormControl('', Validators.required),
    description: new FormControl(''),
    status: new FormControl(TicketStatusEnum.new, Validators.required),
    groupId: new FormControl<string | null>(null, Validators.required)
  });
  protected readonly groupsResource = this.#ticketgroupService.ticketGroups;

  public newTicketGroup() {
    const group = this.#selectedGroup();
    if (!group?.id) {
      return;
    }

    this.#eventPermissions.canForEvent(group.event_id, 'tickets:edit').pipe(
      take(1)
    ).subscribe(canCreate => {
      if (!canCreate) {
        this.#toastr.error(
          'You cannot create a ticket for this ticket group.',
          'Ticket'
        );
        return;
      }
      this.#createTicket(group.id!);
    });
  }

  #createTicket(groupId: string): void {
    this.#ticketService.create({
      firstname: this.form.value.firstname || '',
      lastname: this.form.value.lastname || '',
      email: this.form.value.email || '',
      status: this.form.value.status || TicketStatusEnum.new,
      group_id: Number(groupId)
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

  protected canCreateTicket(eventId: number): Observable<boolean> {
    const cachedPermission = this.#createPermissions.get(eventId);
    if (cachedPermission) {
      return cachedPermission;
    }

    const permission = this.#eventPermissions.canForEvent(eventId, 'tickets:edit');
    this.#createPermissions.set(eventId, permission);
    return permission;
  }

  protected canCreateTicketForSelectedGroup(): Observable<boolean> {
    const group = this.#selectedGroup();
    return group ? this.canCreateTicket(group.event_id) : this.#denied;
  }

  #selectedGroup(): TicketGroup | undefined {
    const selectedGroupId = this.form.controls.groupId.value;
    return this.groups().find(group => group.id === selectedGroupId);
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
