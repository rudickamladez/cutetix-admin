import { Event } from '../events/events.types';

export type AdministrationUser = {
  email: string;
  username: string;
  full_name: string;
  disabled: boolean;
  scopes?: string[];
  uuid: string;
  favorite_events?: Event[];
  plaintext_password?: string;
};

export type AdministrationUserCreate = {
  email: string;
  username: string;
  full_name: string;
  disabled: boolean;
  scopes: string[];
  plaintext_password: string;
};
