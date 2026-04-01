import { Event } from "../administration/events/events.types";

export const SCOPES_LIST = [
    "users:read", "users:edit",
    "events:read", "events:edit",
    "token_family:read", // "token_family:edit",
    "ticket_groups:read", "ticket_groups:edit",
    "tickets:read", "tickets:edit",
];

export type AuthTokenResponse = {
    access_token: string;
    refrresh_token: string;
    token_type: string;
}

export type AuthTokenData = {
    username?: string;
    scopes?: string[];
}

export type User = {
    email: string;
    username: string;
    full_name: string;
    plaintext_password?: string;
    disabled: boolean;
    scopes?: string[];
    uuid?: string;
    favorite_events: Event[];
}