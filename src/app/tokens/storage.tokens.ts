export const StorageKeys = {
  REFRESH_TOKEN: "a",
  ACCESS_TOKEN: "b",
  // PERMANENT_FULLSCREEN: "g",
  API_URL: "c",
  THEME: "l",
} as const;

export type StorageKeys = typeof StorageKeys[keyof typeof StorageKeys];
