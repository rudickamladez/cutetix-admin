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

/**
 * What `GET /users/search` returns: enough to fill a grant form, nothing else.
 *
 * Deliberately not `User` — `email`, `scopes` and `favorite_events` stay on the
 * server, `scopes` because it would tell any organiser who else holds global
 * powers. See `UserSearchResult` in the backend's app/schemas/user.py.
 */
export type UserSearchResult = Pick<UserBase, 'username' | 'full_name' | 'disabled'> & {
  uuid: string;
};