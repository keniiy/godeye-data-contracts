/**
 * Smart API Response Decorator
 * 
 * One intelligent decorator that handles everything:
 * - Auto-detects pagination vs single response
 * - Auto-detects HTTP status codes from method
 * - Auto-includes common errors
 * - Allows custom error additions
 */

import { applyDecorators, Type } from '@nestjs/common';
import { 
  ApiResponse, 
  ApiOkResponse,
  ApiCreatedResponse,
  ApiOperation,
  ApiExtraModels,
  getSchemaPath
} from '@nestjs/swagger';
import { DescriptionConfig } from './swagger';

// Interface for decorator options
interface ApiOptions {
  message?: string;
  status?: number;
  errors?: number[];
  excludeCommonErrors?: boolean;
  description?: string;
  paginated?: boolean; // Force pagination detection
  externalDocUrl?: string;
  descriptionConfig?: DescriptionConfig;
  optimizeDescription?: boolean; // Enable/disable description optimization
}

/**
 * Smart API Decorator - One decorator to rule them all!
 * Auto-detects everything and applies appropriate documentation
 */
export function Api<T>(
  responseDto: Type<T>, 
  options: ApiOptions = {}
) {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    // Auto-detect HTTP method and status
    const httpMethod = getHttpMethodFromDecorators(target, propertyKey);
    const defaultStatus = getDefaultStatusCode(httpMethod);
    const status = options.status || defaultStatus;
    
    // Auto-detect if this is likely a paginated response
    const isPaginated = options.paginated !== undefined 
      ? options.paginated 
      : isPaginatedEndpoint(propertyKey);
    
    // Auto-generate message
    const defaultMessage = generateDefaultMessage(httpMethod, responseDto.name, isPaginated);
    const message = options.message || defaultMessage;
    
    // Keep full description - don't truncate for @Api decorator
    const finalDescription = options.description;

    // Build decorators array
    const decorators = [];
    
    // Add the DTO to extra models for proper schema generation
    decorators.push(ApiExtraModels(responseDto));
    
    // Add operation description at the operation level (not in response)
    if (finalDescription) {
      decorators.push(
        ApiOperation({
          summary: message,
          description: finalDescription
        })
      );
    }
    
    // Success response (with simple message, not full description)
    decorators.push(buildSuccessResponse(responseDto, message, status, isPaginated));
    
    // Common errors (unless excluded)
    if (!options.excludeCommonErrors) {
      decorators.push(buildCommonErrors());
    }
    
    // Custom errors
    if (options.errors) {
      decorators.push(...options.errors.map(errorCode => buildCustomError(errorCode)));
    }
    
    return applyDecorators(...decorators)(target, propertyKey, descriptor);
  };
}

/**
 * Auto-detect HTTP method from NestJS decorators
 */
function getHttpMethodFromDecorators(target: any, propertyKey: string): string {
  const metadata = Reflect.getMetadata('method', target[propertyKey]) ||
                   Reflect.getMetadata('path', target[propertyKey]);
  
  // Check for common HTTP method decorators
  if (Reflect.getMetadata('__httpCode__', target[propertyKey]) === 201) return 'POST';
  
  // Analyze method name patterns
  const methodName = propertyKey.toLowerCase();
  if (methodName.startsWith('create') || methodName.startsWith('add')) return 'POST';
  if (methodName.startsWith('update') || methodName.startsWith('edit')) return 'PUT';
  if (methodName.startsWith('delete') || methodName.startsWith('remove')) return 'DELETE';
  if (methodName.startsWith('get') || methodName.startsWith('find') || methodName.startsWith('fetch')) return 'GET';
  
  return 'GET'; // Default fallback
}

/**
 * Get default status code based on HTTP method
 */
function getDefaultStatusCode(httpMethod: string): number {
  const statusMap: Record<string, number> = {
    'POST': 201,
    'PUT': 200,
    'DELETE': 200,
    'GET': 200,
    'PATCH': 200
  };
  
  return statusMap[httpMethod] || 200;
}

/**
 * Auto-detect if endpoint is paginated based on method name
 */
function isPaginatedEndpoint(methodName: string): boolean {
  const paginatedPatterns = [
    'getall', 'findall', 'fetchall',
    'list', 'search', 'filter',
    'getmany', 'findmany', 'fetchmany',
    'get' + 's', 'find' + 's' // getUsers, findUsers, etc.
  ];
  
  const lowerName = methodName.toLowerCase();
  return paginatedPatterns.some(pattern => 
    lowerName.includes(pattern) || 
    lowerName.endsWith('s') || 
    lowerName.includes('list') ||
    lowerName.includes('search')
  );
}

/**
 * Generate smart default message
 */
function generateDefaultMessage(httpMethod: string, dtoName: string, isPaginated: boolean): string {
  const entityName = dtoName.replace('ResponseDto', '').replace('Dto', '');
  const entityPlural = entityName.toLowerCase() + 's';
  const entitySingular = entityName.toLowerCase();
  
  switch (httpMethod) {
    case 'POST':
      return `${entityName} created successfully`;
    case 'PUT':
    case 'PATCH':
      return `${entityName} updated successfully`;
    case 'DELETE':
      return `${entityName} deleted successfully`;
    case 'GET':
    default:
      return isPaginated 
        ? `${entityPlural} retrieved successfully`
        : `${entityName} found`;
  }
}

/**
 * Build success response decorator
 */
function buildSuccessResponse<T>(
  responseDto: Type<T>,
  message: string,
  status: number,
  isPaginated: boolean
) {
  const ResponseDecorator = status === 201 ? ApiCreatedResponse : ApiOkResponse;
  
  if (isPaginated) {
    return ResponseDecorator({
      description: message, // Use simple message, not full description
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: {
            type: 'array',
            items: { $ref: getSchemaPath(responseDto) }
          },
          message: { type: 'string', example: message },
          status_code: { type: 'number', example: status },
          time_ms: { type: 'number', example: 120 },
          timestamp: { type: 'string', example: '2024-01-15T10:30:00.000Z' },
          trace_id: { type: 'string', example: 'trace_1705312200000_abc123' },
          pagination: {
            type: 'object',
            properties: {
              total: { type: 'number', example: 50 },
              page: { type: 'number', example: 1 },
              limit: { type: 'number', example: 20 },
              total_pages: { type: 'number', example: 3 },
              has_next: { type: 'boolean', example: true },
              has_prev: { type: 'boolean', example: false }
            }
          }
        }
      }
    });
  }
  
  return ResponseDecorator({
    description: message, // Use simple message, not full description
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: { $ref: getSchemaPath(responseDto) }, // This should show DTO structure
        message: { type: 'string', example: message },
        status_code: { type: 'number', example: status },
        time_ms: { type: 'number', example: 45 },
        timestamp: { type: 'string', example: '2024-01-15T10:30:00.000Z' },
        trace_id: { type: 'string', example: 'trace_1705312200000_xyz789' }
      }
    }
  });
}

/**
 * Build common error responses
 */
function buildCommonErrors() {
  return applyDecorators(
    ApiResponse({
      status: 404,
      description: 'Resource not found',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: { type: 'string', example: 'Not Found' },
          message: { type: 'string', example: 'Resource not found' },
          status_code: { type: 'number', example: 404 },
          time_ms: { type: 'number', example: 25 },
          timestamp: { type: 'string', example: '2024-01-15T10:30:00.000Z' },
          trace_id: { type: 'string', example: 'trace_1705312200000_error456' }
        }
      }
    }),
    ApiResponse({
      status: 409,
      description: 'Conflict - Resource already exists',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: { type: 'string', example: 'Conflict' },
          message: { type: 'string', example: 'Resource already exists' },
          status_code: { type: 'number', example: 409 },
          time_ms: { type: 'number', example: 35 },
          timestamp: { type: 'string', example: '2024-01-15T10:30:00.000Z' },
          trace_id: { type: 'string', example: 'trace_1705312200000_conflict789' }
        }
      }
    }),
    ApiResponse({
      status: 422,
      description: 'Validation Error',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: { type: 'string', example: 'Validation Error' },
          message: { type: 'string', example: 'Validation failed' },
          status_code: { type: 'number', example: 422 },
          time_ms: { type: 'number', example: 45 },
          timestamp: { type: 'string', example: '2024-01-15T10:30:00.000Z' },
          trace_id: { type: 'string', example: 'trace_1705312200000_validation123' },
          metadata: {
            type: 'object',
            properties: {
              validation_errors: {
                type: 'array',
                items: { type: 'string' },
                example: ['field is required', 'invalid format']
              }
            }
          }
        }
      }
    }),
    ApiResponse({
      status: 500,
      description: 'Internal server error',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: { type: 'string', example: 'Internal Server Error' },
          message: { type: 'string', example: 'Something went wrong' },
          status_code: { type: 'number', example: 500 },
          time_ms: { type: 'number', example: 67 },
          timestamp: { type: 'string', example: '2024-01-15T10:30:00.000Z' },
          trace_id: { type: 'string', example: 'trace_1705312200000_error456' }
        }
      }
    })
  );
}

/**
 * Build custom error response
 */
function buildCustomError(statusCode: number) {
  const errorMessages: Record<number, { error: string; message: string }> = {
    400: { error: 'Bad Request', message: 'Invalid request data' },
    401: { error: 'Unauthorized', message: 'Authentication required' },
    403: { error: 'Forbidden', message: 'Access denied' },
    413: { error: 'Payload Too Large', message: 'Request payload too large' },
    415: { error: 'Unsupported Media Type', message: 'Media type not supported' },
    429: { error: 'Rate Limited', message: 'Rate limit exceeded' }
  };
  
  const errorInfo = errorMessages[statusCode] || { 
    error: 'Error', 
    message: 'An error occurred' 
  };
  
  return ApiResponse({
    status: statusCode,
    description: errorInfo.message,
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        error: { type: 'string', example: errorInfo.error },
        message: { type: 'string', example: errorInfo.message },
        status_code: { type: 'number', example: statusCode },
        time_ms: { type: 'number', example: 25 },
        timestamp: { type: 'string', example: '2024-01-15T10:30:00.000Z' },
        trace_id: { type: 'string', example: 'trace_1705312200000_custom456' }
      }
    }
  });
}

/**
 * Legacy decorators for backward compatibility
 */
export function CommonApiErrors() {
  return buildCommonErrors();
}

export function ApiResponseWrapper<T>(
  responseDto: Type<T>, 
  message: string = 'Operation successful',
  statusCode: number = 200,
  description?: string
) {
  return Api(responseDto, { message, status: statusCode, description });
}

export function ApiPaginatedWrapper<T>(
  responseDto: Type<T>,
  message: string = 'Data retrieved successfully',
  description?: string
) {
  return Api(responseDto, { message, description, paginated: true });
}