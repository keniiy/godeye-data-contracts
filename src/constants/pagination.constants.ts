/**
 * Pagination constants for consistent pagination across all services
 */

export const PAGINATION_DEFAULTS = {
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
  DEFAULT_PAGE: 1,
  MIN_PAGE: 1,
  MIN_LIMIT: 1,
} as const;

export const PAGINATION_MESSAGES = {
  INVALID_LIMIT: 'Limit must be between 1 and 100',
  INVALID_PAGE: 'Page must be greater than 0',
  NO_RESULTS: 'No results found',
  LIMIT_EXCEEDED: 'Limit exceeds maximum allowed value',
  INVALID_PAGINATION_PARAMS: 'Invalid pagination parameters provided',
} as const;