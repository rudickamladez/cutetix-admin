import { Event } from "../events/events.types";

export interface TicketGroup {
    id?: string;
    name: string;
    capacity: number;
    event_id: number;
    event?: Event;
}

export interface TicketGroupUpdate {
    name?: string;
    capacity?: number;
    event_id?: number;
}

export interface TicketGroupSum {
    paid: number;
    free: number;
    reserved: number;
    total: number;
    cancelled: number;
}