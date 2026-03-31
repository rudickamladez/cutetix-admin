import { Event } from "../administration/events/events.types";

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
