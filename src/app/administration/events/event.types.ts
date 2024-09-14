import { Time } from "../times/time.types";

export interface Event {
    id?: string;
    name: string;
    tickets_sales_start: string;
    tickets_sales_end: string;
    ticket_groups?: [Time]
}
