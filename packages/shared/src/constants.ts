// Shared constants

export const DEFAULT_ACCESS_LEVEL = 10;
export const SYSOP_ACCESS_LEVEL = 200;

export const SESSION_TIMEOUT_MS = 60 * 60 * 1000; // 60 minutes

export const RATE_LIMITS = {
  LOGIN_ATTEMPTS: 5,
  MESSAGES_PER_HOUR: 30,
  AI_REQUESTS_PER_MINUTE: 10,
} as const;

export const PASSWORD_MIN_LENGTH = 6;
export const HANDLE_MIN_LENGTH = 3;
export const HANDLE_MAX_LENGTH = 20;

export const BCRYPT_COST_FACTOR = 10;
