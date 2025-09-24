export const StorageKeys = {
  ACCESS_TOKEN: "access_token",
  REFRESH_TOKEN: "refresh_token",
  API_URL: "api_url",
  THEME: "theme",
  BROWSER_CORE_CHECK: "browser_core_check"
} as const;

export type StorageKeys = typeof StorageKeys[keyof typeof StorageKeys];
