/**
 * Validation constants for unified validation patterns
 * Replaces scattered validation rules with centralized patterns
 */

export const VALIDATION_PATTERNS = {
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  OBJECT_ID: /^[0-9a-fA-F]{24}$/,
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^\+?[\d\s-()]+$/,
  NUMERIC: /^\d+$/,
} as const;

export const VALIDATION_MESSAGES = {
  INVALID_ID: 'Invalid ID format provided',
  INVALID_UUID: 'Invalid UUID format',
  INVALID_OBJECT_ID: 'Invalid MongoDB ObjectId format',
  INVALID_EMAIL: 'Invalid email format',
  INVALID_PHONE: 'Invalid phone number format',
  REQUIRED_FIELD: 'This field is required',
  INVALID_PAGINATION: 'Invalid pagination parameters',
  INVALID_SEARCH: 'Invalid search parameters',
  SEARCH_TOO_SHORT: 'Search term is too short',
  SEARCH_TOO_LONG: 'Search term is too long',
  INVALID_ENTITY_TYPE: 'Invalid entity type provided',
  VALIDATION_FAILED: 'Validation failed for one or more fields',
} as const;

export const VALIDATION_DEFAULTS = {
  MIN_SEARCH_LENGTH: 2,
  MAX_SEARCH_LENGTH: 100,
  CASE_SENSITIVE_SEARCH: false,
  SEARCH_MODE: 'contains' as const,
  ALLOW_EMPTY_SEARCH: false,
} as const;