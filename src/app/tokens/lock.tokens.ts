export const LockNames = {
  REFRESH_LOCK: "0026d727-3ffe-46a7-a47f-04a3b05e5283",
} as const;

export type LockNames = (typeof LockNames)[keyof typeof LockNames];
