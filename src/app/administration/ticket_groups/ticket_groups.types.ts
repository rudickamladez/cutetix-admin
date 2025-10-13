import type { Event } from "../events/events.types";

export type TicketGroup = {
  id?: string;
  name: string;
  capacity: number;
  event_id: number;
  event?: Event;
};

export type TicketGroupUpdate = {
  name?: string;
  capacity?: number;
  event_id?: number;
};

export type TicketGroupSum = {
  paid: number;
  free: number;
  reserved: number;
  total: number;
  cancelled: number;
};
