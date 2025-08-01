/**
 * Unified Swagger Documentation System
 * Standardized API documentation across all services
 */

import { applyDecorators, Type, HttpStatus } from '@nestjs/common';
import { ApiResponse as NestApiResponse, getSchemaPath, ApiExtraModels } from '@nestjs/swagger';

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
  preserveFormatting: false
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
      originalLength 
    };
  }

  // Find a good truncation point (prefer end of sentence)
  let truncateAt = finalConfig.truncateAt;
  const truncationZone = description.substring(truncateAt - 50, truncateAt + 50);
  const sentenceEnd = truncationZone.match(/[.!?]\s/);
  
  if (sentenceEnd) {
    const sentenceEndIndex = truncationZone.indexOf(sentenceEnd[0]) + (truncateAt - 50);
    if (sentenceEndIndex > 0 && sentenceEndIndex < finalConfig.maxLength) {
      truncateAt = sentenceEndIndex + 1;
    }
  }

  let truncatedDescription = description.substring(0, truncateAt).trim();
  
  if (finalConfig.addEllipsis) {
    truncatedDescription += '...';
  }

  // Add truncation notice
  const remainingChars = originalLength - truncateAt;
  truncatedDescription += `\n\n*[Truncated: ${remainingChars} more characters. See external documentation for full details.]*`;

  return { 
    description: truncatedDescription, 
    isTruncated: true, 
    originalLength 
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
    errors?: Array<'BadRequest' | 'Unauthorized' | 'Forbidden' | 'NotFound' | 'Conflict' | 'UnprocessableEntity' | 'TooManyRequests' | 'InternalServerError'>;
    externalDocUrl?: string;
    descriptionConfig?: DescriptionConfig;
  }
): MethodDecorator {
  const optimizedDesc = optimizeDescription(options.description, options.descriptionConfig);
  
  return ApiResponse(dataType, {
    ...options,
    description: optimizedDesc.description
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
    errors?: Array<'BadRequest' | 'Unauthorized' | 'Forbidden' | 'NotFound' | 'Conflict' | 'UnprocessableEntity' | 'TooManyRequests' | 'InternalServerError'>;
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
    options.errors.forEach(errorType => {
      decorators.push(createErrorResponseDecorator(errorType));
    });
  }

  return applyDecorators(...decorators);
}

/**
 * Create success response schema with enhanced support for deeply populated responses
 */
function createSuccessResponseSchema<T>(dataType: Type<T>, description: string) {
  return {
    type: 'object',
    required: ['success', 'message', 'data', 'status_code', 'time_ms', 'timestamp', 'trace_id'],
    properties: {
      success: {
        type: 'boolean',
        example: true,
        description: 'Indicates if the operation was successful',
      },
      message: {
        type: 'string',
        example: description,
        description: 'Human-readable message describing the result',
      },
      data: {
        oneOf: [
          { $ref: getSchemaPath(dataType) },
          { 
            type: 'object',
            description: 'Deeply populated response with nested relations',
            additionalProperties: true
          }
        ],
        description: 'Response data payload with optional deep population of nested relations',
      },
      status_code: {
        type: 'number',
        example: 200,
        description: 'HTTP status code',
      },
      time_ms: {
        type: 'number',
        example: 150,
        description: 'Request processing time in milliseconds',
      },
      timestamp: {
        type: 'string',
        example: '2025-07-29T10:30:00.000Z',
        description: 'ISO 8601 timestamp of the response',
      },
      trace_id: {
        type: 'string',
        example: 'trace_1722164200000_abc123def',
        description: 'Unique trace identifier for request tracking',
      },
      metadata: {
        type: 'object',
        description: 'Performance and context metadata',
        nullable: true,
        properties: {
          ms_speed: { type: 'number', example: 45, description: 'Processing speed in milliseconds' },
          cpu_usage_percent: { type: 'number', example: 23.5, description: 'CPU usage percentage' },
          memory_used_mb: { type: 'number', example: 128.4, description: 'Memory usage in MB' },
          heap_used_mb: { type: 'number', example: 64.2, description: 'Heap memory usage in MB' },
          cache_hit: { type: 'boolean', example: true, description: 'Whether cache was hit' },
          query_depth: { type: 'number', example: 3, description: 'Depth of nested queries/populations' },
          relations_populated: { 
            type: 'array', 
            items: { type: 'string' }, 
            example: ['user', 'user.profile', 'comments.author'],
            description: 'List of populated relations in deeply nested responses'
          },
        },
      },
    },
  };
}

/**
 * Create paginated response schema
 */
function createPaginatedResponseSchema<T>(dataType: Type<T>, description: string) {
  return {
    type: 'object',
    required: ['success', 'message', 'data', 'status_code', 'time_ms', 'timestamp', 'trace_id'],
    properties: {
      success: {
        type: 'boolean',
        example: true,
        description: 'Indicates if the operation was successful',
      },
      message: {
        type: 'string',
        example: description,
        description: 'Human-readable message describing the result',
      },
      data: {
        type: 'array',
        items: {
          oneOf: [
            { $ref: getSchemaPath(dataType) },
            { 
              type: 'object',
              description: 'Deeply populated item with nested relations',
              additionalProperties: true
            }
          ]
        },
        description: 'Array of data items with optional deep population of nested relations',
      },
      status_code: {
        type: 'number',
        example: 200,
        description: 'HTTP status code',
      },
      time_ms: {
        type: 'number',
        example: 150,
        description: 'Request processing time in milliseconds',
      },
      timestamp: {
        type: 'string',
        example: '2025-07-29T10:30:00.000Z',
        description: 'ISO 8601 timestamp of the response',
      },
      trace_id: {
        type: 'string',
        example: 'trace_1722164200000_abc123def',
        description: 'Unique trace identifier for request tracking',
      },
      pagination: {
        type: 'object',
        required: ['total', 'page', 'limit', 'total_pages', 'has_next', 'has_prev'],
        properties: {
          total: {
            type: 'number',
            example: 100,
            description: 'Total number of items',
          },
          page: {
            type: 'number',
            example: 1,
            description: 'Current page number',
          },
          limit: {
            type: 'number',
            example: 10,
            description: 'Number of items per page',
          },
          total_pages: {
            type: 'number',
            example: 10,
            description: 'Total number of pages',
          },
          has_next: {
            type: 'boolean',
            example: true,
            description: 'Whether there is a next page',
          },
          has_prev: {
            type: 'boolean',
            example: false,
            description: 'Whether there is a previous page',
          },
        },
      },
      metadata: {
        type: 'object',
        description: 'Performance and context metadata',
        nullable: true,
        properties: {
          ms_speed: { type: 'number', example: 85, description: 'Processing speed in milliseconds' },
          cpu_usage_percent: { type: 'number', example: 34.2, description: 'CPU usage percentage' },
          memory_used_mb: { type: 'number', example: 156.7, description: 'Memory usage in MB' },
          heap_used_mb: { type: 'number', example: 78.3, description: 'Heap memory usage in MB' },
          cache_hit: { type: 'boolean', example: false, description: 'Whether cache was hit' },
          query_depth: { type: 'number', example: 2, description: 'Depth of nested queries/populations' },
          relations_populated: {
            type: 'array',
            items: { type: 'string' },
            example: ['category', 'author.profile'],
            description: 'List of populated relations in deeply nested responses'
          },
          total_queries: { type: 'number', example: 3, description: 'Total number of database queries executed' },
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
      type: 'object',
      required: ['success', 'error', 'message', 'status_code', 'time_ms', 'timestamp', 'trace_id'],
      properties: {
        success: {
          type: 'boolean',
          example: false,
          description: 'Indicates if the operation was successful',
        },
        error: {
          type: 'string',
          example: errorConfig.error,
          description: 'Error code or type',
        },
        message: {
          type: 'string',
          example: errorConfig.message,
          description: 'Human-readable error message',
        },
        status_code: {
          type: 'number',
          example: errorConfig.status,
          description: 'HTTP status code',
        },
        time_ms: {
          type: 'number',
          example: 25,
          description: 'Request processing time in milliseconds',
        },
        timestamp: {
          type: 'string',
          example: '2025-07-29T10:30:00.000Z',
          description: 'ISO 8601 timestamp of the response',
        },
        trace_id: {
          type: 'string',
          example: 'trace_1722164200000_abc123def',
          description: 'Unique trace identifier for request tracking',
        },
        metadata: {
          type: 'object',
          description: 'Additional error metadata',
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
      error: 'Bad Request',
      message: 'Invalid input data provided',
      description: 'Validation failed - Invalid input data',
    },
    Unauthorized: {
      status: HttpStatus.UNAUTHORIZED,
      error: 'Unauthorized',
      message: 'Authentication required',
      description: 'Authentication failed - Invalid credentials or missing token',
    },
    Forbidden: {
      status: HttpStatus.FORBIDDEN,
      error: 'Forbidden',
      message: 'Access denied',
      description: 'Access denied - Insufficient permissions',
    },
    NotFound: {
      status: HttpStatus.NOT_FOUND,
      error: 'Not Found',
      message: 'Resource not found',
      description: 'Resource not found',
    },
    Conflict: {
      status: HttpStatus.CONFLICT,
      error: 'Conflict',
      message: 'Resource already exists',
      description: 'Resource conflict - Data already exists',
    },
    UnprocessableEntity: {
      status: HttpStatus.UNPROCESSABLE_ENTITY,
      error: 'Unprocessable Entity',
      message: 'Business logic validation failed',
      description: 'Business logic validation failed',
    },
    TooManyRequests: {
      status: HttpStatus.TOO_MANY_REQUESTS,
      error: 'Too Many Requests',
      message: 'Rate limit exceeded',
      description: 'Rate limit exceeded',
    },
    InternalServerError: {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      error: 'Internal Server Error',
      message: 'An unexpected error occurred',
      description: 'Internal server error',
    },
  };

  return configs[errorType as keyof typeof configs] || configs.InternalServerError;
}