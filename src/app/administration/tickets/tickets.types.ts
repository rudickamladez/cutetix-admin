import { TicketGroup } from "../ticket_groups/ticket_groups.types";

export interface Ticket {
    id?: string;
    firstname: string;
    lastname: string;
    email: string;
    status?: TicketStatusEnum;
    description?: string;
    group_id: number;
    group?: TicketGroup;
}

export interface TicketUpdate {
    firstname: string;
    lastname: string;
    email: string;
    status: TicketStatusEnum;
    description: string;
    group_id: number;
}

export enum TicketStatusEnum {
    new = 0,
    confirmed = 1,
    paid = 2,
    cancelled = 3,
}
