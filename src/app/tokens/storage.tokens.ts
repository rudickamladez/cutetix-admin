export const StorageKeys = {
  REFRESH_TOKEN: "a",
  ACCESS_TOKEN: "b",
} as const;

export type StorageKeys = typeof StorageKeys[keyof typeof StorageKeys];
