import type { TicketGroup } from "../ticket_groups/ticket_groups.types";

export type Event = {
  id?: string;
  name: string;
  tickets_sales_start: string;
  tickets_sales_end: string;
  smtp_mail_from: string;
  mail_text_new_ticket: string;
  mail_html_new_ticket: string;
  mail_text_cancelled_ticket: string;
  mail_html_cancelled_ticket: string;

  ticket_groups?: [TicketGroup];
};

export type EventCapacitySummary = {
  paid: number;
  free: number;
  reserved: number;
  total: number;
  cancelled: number;
};
