import { Event } from '../events/events.types';

type UserBase = {
  email: string;
  username: string;
  full_name: string;
  disabled: boolean;
  scopes: string[];
  favorite_events: Event[];
}

export type User = UserBase & {
  uuid: string;
};

export type UserCreate = UserBase & {
  plaintext_password: string;
};

export type UserUpdate = UserBase & {
  uuid?: string;
  plaintext_password: string;
}