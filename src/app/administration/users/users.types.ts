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
 * The least the API says about a user to someone who is not a global
 * administrator: who they are, and whether their account still works.
 *
 * One type for both places it appears — a `GET /users/search` result, and the
 * grantee on each row of `GET /events/{id}/scopes` — because the two must be
 * able to say nothing different about a person. Deliberately not `User`:
 * `email`, `scopes` and `favorite_events` stay on the server, `scopes` because
 * it would tell any organiser who else holds global powers. Mirrors
 * `UserSearchResult` in the backend's app/schemas/user.py, the single model
 * both of those responses are built from.
 */
export type UserSearchResult = Pick<UserBase, 'username' | 'full_name' | 'disabled'> & {
  uuid: string;
};

/**
 * How a user is written to an organiser: name where there is one, and the
 * username that proves it is a distinct account.
 *
 * `full_name` is not unique and not required, so it cannot be the identifier —
 * but it is what a person recognises. Lives beside the type because every
 * display of this shape should read the same way.
 */
export function userLabel(user: Pick<UserSearchResult, 'username' | 'full_name'>): string {
  return user.full_name ? `${user.full_name} (${user.username})` : user.username;
}