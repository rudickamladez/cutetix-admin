// import { environment } from "src/environments/environment";

export const StorageKeys = {
  ACCESS_TOKEN: "access_token",
  REFRESH_TOKEN: "refresh_token",
  API_URL: "api_url",
  THEME: "theme",
  BROWSER_CORE_CHECK: "browser_core_check",
  SUDO_PASSWORD_MODE: "sudo_password_mode",
} as const;

// TODO
// export const StorageKeysToENV = {
//   API_URL: environment.backend.api,
// }

export type StorageKeys = typeof StorageKeys[keyof typeof StorageKeys];
