/**
 * Response constants - Default messages and status codes
 */

// Default success messages
export const SUCCESS_MESSAGES = {
  CREATED: "Resource created successfully",
  UPDATED: "Resource updated successfully",
  DELETED: "Resource deleted successfully",
  RETRIEVED: "Data retrieved successfully",
  OPERATION_COMPLETE: "Operation completed successfully",
} as const;

// Default error messages
export const ERROR_MESSAGES = {
  BAD_REQUEST: "Invalid request parameters",
  UNAUTHORIZED: "Authentication required",
  FORBIDDEN: "Insufficient permissions",
  NOT_FOUND: "Resource not found",
  VALIDATION_FAILED: "Validation failed",
  RATE_LIMITED: "Rate limit exceeded",
  SERVER_ERROR: "Internal server error occurred",
} as const;

// HTTP Status codes
export const HTTP_STATUS_CODES = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  VALIDATION_ERROR: 422,
  RATE_LIMITED: 429,
  SERVER_ERROR: 500,
} as const;

// Response defaults
export const RESPONSE_DEFAULTS = {
  SUCCESS_STATUS_CODE: 200,
  ERROR_STATUS_CODE: 400,
  DEFAULT_SUCCESS_MESSAGE: "Operation successful",
  DEFAULT_ERROR_MESSAGE: "An error occurred",
} as const;
