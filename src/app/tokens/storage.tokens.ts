export const StorageKeys = {
  ACCESS_TOKEN: "access_token",
  REFRESH_TOKEN: "refresh_token",
  API_URL: "api_url",
  THEME: "theme",
} as const;

export type StorageKeys = typeof StorageKeys[keyof typeof StorageKeys];
