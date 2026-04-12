import { Event } from "../administration/events/events.types";

export const SCOPES = {
    "users:read": "Read users",
    "users:edit": "Edit users",
    "events:read": "Read events",
    "events:edit": "Edit events",
    "token_family:read": "Read token families",
    // "token_family:edit": "Edit token families",
    "ticket_groups:read": "Read ticket groups",
    "ticket_groups:edit": "Edit ticket groups",
    "tickets:read": "Read tickets",
    "tickets:edit": "Edit tickets",
} as const;

export const SCOPES_ENTRIES = Object.entries(SCOPES) as [
    keyof typeof SCOPES,
    (typeof SCOPES)[keyof typeof SCOPES]
][];

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

export type UserRegister = {
    email: string;
    username: string;
    full_name: string;
    plaintext_password: string;
}

export type UserLogin = {
    username: string,
    password: string,
}
