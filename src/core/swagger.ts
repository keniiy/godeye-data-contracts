/**
 * Unified Swagger Documentation System
 * Standardized API documentation across all services
 */

import { applyDecorators, Type, HttpStatus } from "@nestjs/common";
import {
  ApiResponse as NestApiResponse,
  getSchemaPath,
  ApiExtraModels,
} from "@nestjs/swagger";

/**
 * Configuration for description handling
 */
export interface DescriptionConfig {
  maxLength?: number;
  truncateAt?: number;
  addEllipsis?: boolean;
  preserveFormatting?: boolean;
}

/**
 * Default description configuration
 */
const DEFAULT_DESCRIPTION_CONFIG: Required<DescriptionConfig> = {
  maxLength: 500,
  truncateAt: 450,
  addEllipsis: true,
  preserveFormatting: false,
};

/**
 * Truncate and optimize description text for Swagger UI
 * Handles large descriptions by truncating them and preserving important information
 */
export function optimizeDescription(
  description: string,
  config: DescriptionConfig = {}
): { description: string; isTruncated: boolean; originalLength: number } {
  const finalConfig = { ...DEFAULT_DESCRIPTION_CONFIG, ...config };
  const originalLength = description.length;

  if (originalLength <= finalConfig.maxLength) {
    return {
      description,
      isTruncated: false,
      originalLength,
    };
  }

  // Find a good truncation point (prefer end of sentence)
  let truncateAt = finalConfig.truncateAt;
  const truncationZone = description.substring(
    truncateAt - 50,
    truncateAt + 50
  );
  const sentenceEnd = truncationZone.match(/[.!?]\s/);

  if (sentenceEnd) {
    const sentenceEndIndex =
      truncationZone.indexOf(sentenceEnd[0]) + (truncateAt - 50);
    if (sentenceEndIndex > 0 && sentenceEndIndex < finalConfig.maxLength) {
      truncateAt = sentenceEndIndex + 1;
    }
  }

  let truncatedDescription = description.substring(0, truncateAt).trim();

  if (finalConfig.addEllipsis) {
    truncatedDescription += "...";
  }

  // Add truncation notice
  const remainingChars = originalLength - truncateAt;
  truncatedDescription += `\n\n*[Truncated: ${remainingChars} more characters. See external documentation for full details.]*`;

  return {
    description: truncatedDescription,
    isTruncated: true,
    originalLength,
  };
}

/**
 * Enhanced API decorator with description optimization
 */
export function ApiResponseWithOptimizedDescription<T>(
  dataType: Type<T>,
  options: {
    description: string;
    paginated?: boolean;
    status_code?: number;
    errors?: Array<
      | "BadRequest"
      | "Unauthorized"
      | "Forbidden"
      | "NotFound"
      | "Conflict"
      | "UnprocessableEntity"
      | "TooManyRequests"
      | "InternalServerError"
    >;
    externalDocUrl?: string;
    descriptionConfig?: DescriptionConfig;
  }
): MethodDecorator {
  const optimizedDesc = optimizeDescription(
    options.description,
    options.descriptionConfig
  );

  return ApiResponse(dataType, {
    ...options,
    description: optimizedDesc.description,
  });
}

/**
 * Unified API Response Decorator
 * Replaces @ApiSuccessResponse, @ApiPaginatedResponse, @CommonApiErrorResponses
 */
export function ApiResponse<T>(
  dataType: Type<T>,
  options: {
    description: string;
    paginated?: boolean;
    status_code?: number;
    errors?: Array<
      | "BadRequest"
      | "Unauthorized"
      | "Forbidden"
      | "NotFound"
      | "Conflict"
      | "UnprocessableEntity"
      | "TooManyRequests"
      | "InternalServerError"
    >;
  }
): MethodDecorator {
  const decorators = [];

  // Add the data type to extra models
  decorators.push(ApiExtraModels(dataType));

  // Success response schema
  const successSchema = options.paginated
    ? createPaginatedResponseSchema(dataType, options.description)
    : createSuccessResponseSchema(dataType, options.description);

  decorators.push(
    NestApiResponse({
      status: options.status_code || HttpStatus.OK,
      description: options.description,
      schema: successSchema,
    })
  );

  // Add error responses
  if (options.errors) {
    options.errors.forEach((errorType) => {
      decorators.push(createErrorResponseDecorator(errorType));
    });
  }

  return applyDecorators(...decorators);
}

/**
 * Create success response schema with enhanced support for deeply populated responses
 */
function createSuccessResponseSchema<T>(
  dataType: Type<T>,
  description: string
) {
  return {
    type: "object",
    required: [
      "success",
      "message",
      "data",
      "status_code",
      "time_ms",
      "timestamp",
      "trace_id",
    ],
    properties: {
      success: {
        type: "boolean",
        example: true,
        description: "Indicates if the operation was successful",
      },
      message: {
        type: "string",
        example: description,
        description: "Human-readable message describing the result",
      },
      data: {
        $ref: getSchemaPath(dataType),
        description: "Response data payload",
      },
      status_code: {
        type: "number",
        example: 200,
        description: "HTTP status code",
      },
      time_ms: {
        type: "number",
        example: 45,
        description: "Request processing time in milliseconds",
      },
      timestamp: {
        type: "string",
        example: "2025-08-01T10:30:00.000Z",
        description: "ISO 8601 timestamp of the response",
      },
      trace_id: {
        type: "string",
        example: "trace_1725182200000_abc123def",
        description: "Unique trace identifier for request tracking",
      },
      metadata: {
        type: "object",
        description:
          "BLAZING FAST enhanced metadata with comprehensive query and performance info",
        nullable: true,
        properties: {
          queryTime: {
            type: "string",
            example: "45ms",
            description: "Query execution time with unit",
          },
          searchAlgorithms: {
            type: "array",
            items: { type: "string" },
            example: ["exact", "fuzzy"],
            description: "Search algorithms used in query processing",
          },
          backendConditions: {
            type: "array",
            items: { type: "string" },
            example: ["status", "isDeleted"],
            description: "Backend conditions applied to the query",
          },
          relationsLoaded: {
            type: "array",
            items: { type: "string" },
            example: ["profile", "permissions"],
            description: "Relations that were loaded/populated",
          },
          relationErrors: {
            type: "array",
            items: { type: "string" },
            example: [],
            description: "Any relation loading errors encountered",
          },
          filters: {
            type: "object",
            properties: {
              appliedFilters: {
                type: "array",
                items: { type: "string" },
                example: ["status"],
                description: "Currently applied filters",
              },
              availableFilters: {
                type: "array",
                items: { type: "string" },
                example: ["status", "role", "business_type"],
                description: "Available filter options",
              },
            },
            description: "Filter metadata",
          },
          sorting: {
            type: "object",
            properties: {
              sortBy: {
                type: "string",
                example: "created_at",
                description: "Current sort field",
              },
              sortOrder: {
                type: "string",
                enum: ["asc", "desc"],
                example: "desc",
                description: "Sort direction",
              },
              availableSorts: {
                type: "array",
                items: { type: "string" },
                example: ["created_at", "updated_at", "name"],
                description: "Available sort fields",
              },
            },
            description: "Sorting metadata",
          },
          ms_speed: {
            type: "number",
            example: 45,
            description: "Processing speed in milliseconds (legacy)",
          },
          cpu_usage_percent: {
            type: "number",
            example: 23.5,
            description: "CPU usage percentage",
          },
          memory_used_mb: {
            type: "number",
            example: 128.4,
            description: "Memory usage in MB",
          },
          heap_used_mb: {
            type: "number",
            example: 64.2,
            description: "Heap memory usage in MB",
          },
          cache_hit: {
            type: "boolean",
            example: true,
            description: "Whether cache was hit (legacy)",
          },
          cacheStatus: {
            type: "string",
            enum: ["hit", "miss", "bypass"],
            example: "hit",
            description: "Cache status",
          },
          lastUpdated: {
            type: "string",
            example: "2025-08-01T10:30:00.000Z",
            description: "Last update timestamp",
          },
        },
      },
    },
  };
}

/**
 * Create BLAZING FAST paginated response schema with standardized structure
 */
function createPaginatedResponseSchema<T>(
  dataType: Type<T>,
  description: string
) {
  return {
    type: "object",
    required: [
      "success",
      "message",
      "data",
      "status_code",
      "time_ms",
      "timestamp",
      "trace_id",
    ],
    properties: {
      success: {
        type: "boolean",
        example: true,
        description: "Indicates if the operation was successful",
      },
      message: {
        type: "string",
        example: description,
        description: "Human-readable message describing the result",
      },
      data: {
        type: "object",
        required: [
          "items",
          "total",
          "page",
          "limit",
          "totalPages",
          "hasNext",
          "hasPrev",
        ],
        properties: {
          items: {
            type: "array",
            items: { $ref: getSchemaPath(dataType) },
            description: "Array of data items",
          },
          total: {
            type: "number",
            example: 25,
            description: "Total number of items available",
          },
          page: {
            type: "number",
            example: 1,
            description: "Current page number (1-based)",
          },
          limit: {
            type: "number",
            example: 10,
            description: "Number of items per page",
          },
          totalPages: {
            type: "number",
            example: 3,
            description: "Total number of pages (camelCase)",
          },
          hasNext: {
            type: "boolean",
            example: true,
            description: "Whether there is a next page (camelCase)",
          },
          hasPrev: {
            type: "boolean",
            example: false,
            description: "Whether there is a previous page (camelCase)",
          },
        },
        description:
          "BLAZING FAST paginated data container with items and pagination info",
      },
      status_code: {
        type: "number",
        example: 200,
        description: "HTTP status code",
      },
      time_ms: {
        type: "number",
        example: 150,
        description: "Request processing time in milliseconds",
      },
      timestamp: {
        type: "string",
        example: "2025-07-29T10:30:00.000Z",
        description: "ISO 8601 timestamp of the response",
      },
      trace_id: {
        type: "string",
        example: "trace_1722164200000_abc123def",
        description: "Unique trace identifier for request tracking",
      },
      metadata: {
        type: "object",
        description:
          "BLAZING FAST enhanced metadata with comprehensive query and performance info",
        nullable: true,
        properties: {
          queryTime: {
            type: "string",
            example: "120ms",
            description: "Query execution time with unit",
          },
          searchAlgorithms: {
            type: "array",
            items: { type: "string" },
            example: ["fuzzy", "exact", "contains"],
            description: "Search algorithms used in query processing",
          },
          backendConditions: {
            type: "array",
            items: { type: "string" },
            example: ["status", "isDeleted", "isVerified"],
            description: "Backend conditions applied to the query",
          },
          relationsLoaded: {
            type: "array",
            items: { type: "string" },
            example: ["business", "profile", "permissions"],
            description: "Relations that were loaded/populated",
          },
          relationErrors: {
            type: "array",
            items: { type: "string" },
            example: [],
            description: "Any relation loading errors encountered",
          },
          activeCount: {
            type: "number",
            example: 8,
            description: "Number of active items",
          },
          pendingCount: {
            type: "number",
            example: 3,
            description: "Number of pending items",
          },
          suspendedCount: {
            type: "number",
            example: 1,
            description: "Number of suspended items",
          },
          filters: {
            type: "object",
            properties: {
              appliedFilters: {
                type: "array",
                items: { type: "string" },
                example: ["role", "status", "business_type"],
                description: "Currently applied filters",
              },
              availableFilters: {
                type: "array",
                items: { type: "string" },
                example: [
                  "role",
                  "status",
                  "job_title",
                  "business_type",
                  "permissions",
                ],
                description: "Available filter options",
              },
            },
            description: "Filter metadata",
          },
          sorting: {
            type: "object",
            properties: {
              sortBy: {
                type: "string",
                example: "invited_at",
                description: "Current sort field",
              },
              sortOrder: {
                type: "string",
                enum: ["asc", "desc"],
                example: "desc",
                description: "Sort direction",
              },
              availableSorts: {
                type: "array",
                items: { type: "string" },
                example: [
                  "invited_at",
                  "activated_at",
                  "first_name",
                  "last_name",
                  "status",
                ],
                description: "Available sort fields",
              },
            },
            description: "Sorting metadata",
          },
          ms_speed: {
            type: "number",
            example: 85,
            description: "Processing speed in milliseconds (legacy)",
          },
          cpu_usage_percent: {
            type: "number",
            example: 34.2,
            description: "CPU usage percentage",
          },
          memory_used_mb: {
            type: "number",
            example: 156.7,
            description: "Memory usage in MB",
          },
          heap_used_mb: {
            type: "number",
            example: 78.3,
            description: "Heap memory usage in MB",
          },
          cache_hit: {
            type: "boolean",
            example: false,
            description: "Whether cache was hit (legacy)",
          },
          cacheStatus: {
            type: "string",
            enum: ["hit", "miss", "bypass"],
            example: "hit",
            description: "Cache status",
          },
          lastUpdated: {
            type: "string",
            example: "2025-07-15T14:30:00.000Z",
            description: "Last update timestamp",
          },
        },
      },
    },
  };
}

/**
 * Create error response decorator
 */
function createErrorResponseDecorator(errorType: string): MethodDecorator {
  const errorConfig = getErrorConfig(errorType);

  return NestApiResponse({
    status: errorConfig.status,
    description: errorConfig.description,
    schema: {
      type: "object",
      required: [
        "success",
        "error",
        "message",
        "status_code",
        "time_ms",
        "timestamp",
        "trace_id",
      ],
      properties: {
        success: {
          type: "boolean",
          example: false,
          description: "Indicates if the operation was successful",
        },
        error: {
          type: "string",
          example: errorConfig.error,
          description: "Error code or type",
        },
        message: {
          type: "string",
          example: errorConfig.message,
          description: "Human-readable error message",
        },
        status_code: {
          type: "number",
          example: errorConfig.status,
          description: "HTTP status code",
        },
        time_ms: {
          type: "number",
          example: 25,
          description: "Request processing time in milliseconds",
        },
        timestamp: {
          type: "string",
          example: "2025-07-29T10:30:00.000Z",
          description: "ISO 8601 timestamp of the response",
        },
        trace_id: {
          type: "string",
          example: "trace_1722164200000_abc123def",
          description: "Unique trace identifier for request tracking",
        },
        metadata: {
          type: "object",
          description: "Additional error metadata",
          nullable: true,
        },
      },
    },
  });
}

/**
 * Get error configuration
 */
function getErrorConfig(errorType: string) {
  const configs = {
    BadRequest: {
      status: HttpStatus.BAD_REQUEST,
      error: "Bad Request",
      message: "Invalid input data provided",
      description: "Validation failed - Invalid input data",
    },
    Unauthorized: {
      status: HttpStatus.UNAUTHORIZED,
      error: "Unauthorized",
      message: "Authentication required",
      description:
        "Authentication failed - Invalid credentials or missing token",
    },
    Forbidden: {
      status: HttpStatus.FORBIDDEN,
      error: "Forbidden",
      message: "Access denied",
      description: "Access denied - Insufficient permissions",
    },
    NotFound: {
      status: HttpStatus.NOT_FOUND,
      error: "Not Found",
      message: "Resource not found",
      description: "Resource not found",
    },
    Conflict: {
      status: HttpStatus.CONFLICT,
      error: "Conflict",
      message: "Resource already exists",
      description: "Resource conflict - Data already exists",
    },
    UnprocessableEntity: {
      status: HttpStatus.UNPROCESSABLE_ENTITY,
      error: "Unprocessable Entity",
      message: "Business logic validation failed",
      description: "Business logic validation failed",
    },
    TooManyRequests: {
      status: HttpStatus.TOO_MANY_REQUESTS,
      error: "Too Many Requests",
      message: "Rate limit exceeded",
      description: "Rate limit exceeded",
    },
    InternalServerError: {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      error: "Internal Server Error",
      message: "An unexpected error occurred",
      description: "Internal server error",
    },
  };

  return (
    configs[errorType as keyof typeof configs] || configs.InternalServerError
  );
}
