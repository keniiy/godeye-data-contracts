/**
 * Kong Gateway authentication constants
 * Standardizes header names and auth patterns across all services
 */

export const KONG_HEADERS = {
  USER_ID: 'x-user-id',
  USER_EMAIL: 'x-user-email', 
  USER_TYPE: 'x-user-type',
  PROFILE_ID: 'x-user-profile-id',
  PROFILE_KIND: 'x-user-profile-kind',
  PHONE: 'x-user-phone',
  FIRST_NAME: 'x-user-first-name',
  LAST_NAME: 'x-user-last-name',
} as const;

export const AUTH_MESSAGES = {
  UNAUTHORIZED: 'Authentication required to access this resource',
  FORBIDDEN: 'Insufficient permissions to access this resource',
  INVALID_TOKEN: 'Invalid or expired authentication token',
  TOKEN_EXPIRED: 'Authentication token has expired',
  USER_CONTEXT_MISSING: 'User context not found in headers - Kong Gateway auth required',
  INVALID_USER_TYPE: 'Invalid user type provided',
  ROLE_NOT_ALLOWED: 'User role is not allowed to access this resource',
} as const;

export const AUTH_DEFAULTS = {
  REQUIRED: true,
  CACHE_CONTEXT: false,
  CACHE_TTL: 300, // 5 minutes
  ALLOWED_ROLES: [] as string[],
} as const;