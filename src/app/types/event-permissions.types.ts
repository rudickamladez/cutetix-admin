import { UserSearchResult } from "./user-search.types";

export const EVENT_SCOPES = [
  'events:read',
  'events:edit',
  'ticket_groups:read',
  'ticket_groups:edit',
  'tickets:read',
  'tickets:edit',
] as const;

export type EventScope = (typeof EVENT_SCOPES)[number];

export type EventUserScope = {
  event_id: number;
  user_uuid: string;
  user: UserSearchResult;
  scope: EventScope;
};

export type EventUserScopesReplace = {
  scopes: EventScope[];
};
