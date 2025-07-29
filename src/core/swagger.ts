/**
 * Unified Swagger Documentation System
 * Standardized API documentation across all services
 */

import { applyDecorators, Type, HttpStatus } from '@nestjs/common';
import { ApiResponse as NestApiResponse, getSchemaPath, ApiExtraModels } from '@nestjs/swagger';

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
 * Create success response schema
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
        $ref: getSchemaPath(dataType),
        description: 'Response data payload',
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
          ms_speed: { type: 'number', example: 45 },
          cpu_usage_percent: { type: 'number', example: 23.5 },
          memory_used_mb: { type: 'number', example: 128.4 },
          heap_used_mb: { type: 'number', example: 64.2 },
          cache_hit: { type: 'boolean', example: true },
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
        items: { $ref: getSchemaPath(dataType) },
        description: 'Array of data items',
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