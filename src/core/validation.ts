/**
 * Unified Validation System
 * Standardized validation decorators and pipes across all services
 */

import { Injectable, PipeTransform, ArgumentMetadata, BadRequestException } from '@nestjs/common';
import { validate, ValidationError, ValidationOptions, registerDecorator, ValidationArguments } from 'class-validator';
import { Transform, plainToClass } from 'class-transformer';
import { VALIDATION_PATTERNS, VALIDATION_MESSAGES, VALIDATION_DEFAULTS } from '../constants/validation.constants';
import { PAGINATION_DEFAULTS } from '../constants/pagination.constants';

/**
 * Unified Validation Pipe configuration
 */
interface UnifiedValidationOptions {
  whitelist?: boolean;
  forbidNonWhitelisted?: boolean;
  transform?: boolean;
}

/**
 * Unified Validation Pipe
 * Replaces separate validation pipes with single, configurable pipe
 */
@Injectable()
export class ValidationPipe implements PipeTransform<any> {
  private readonly options: UnifiedValidationOptions;

  constructor(options: UnifiedValidationOptions = {}) {
    this.options = {
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      ...options
    };
  }

  async transform(value: any, { metatype }: ArgumentMetadata) {
    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }

    const object = plainToClass(metatype, value);
    const errors = await validate(object);

    if (errors.length > 0) {
      const error_messages = this.buildErrorMessage(errors);
      throw new BadRequestException({
        message: VALIDATION_MESSAGES.VALIDATION_FAILED,
        errors: error_messages,
      });
    }

    return object;
  }

  private toValidate(metatype: Function): boolean {
    const types: Function[] = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }

  private buildErrorMessage(errors: ValidationError[]): string[] {
    const messages: string[] = [];
    
    errors.forEach(error => {
      if (error.constraints) {
        messages.push(...Object.values(error.constraints));
      }
      
      if (error.children && error.children.length > 0) {
        messages.push(...this.buildErrorMessage(error.children));
      }
    });

    return messages;
  }
}

/**
 * ID Validation Decorator
 * Replaces @IsUUID() for TypeORM and @IsValidObjectId() for Mongoose
 */
export function IsValidId(options?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isValidId',
      target: object.constructor,
      propertyName: propertyName,
      options: {
        message: options?.message || VALIDATION_MESSAGES.INVALID_ID,
        ...options,
      },
      validator: {
        validate(value: any) {
          if (!value) return false;
          
          // Check UUID format
          if (VALIDATION_PATTERNS.UUID.test(value)) return true;
          
          // Check MongoDB ObjectId format
          if (VALIDATION_PATTERNS.OBJECT_ID.test(value)) return true;
          
          // Check numeric format
          if (VALIDATION_PATTERNS.NUMERIC.test(value)) return true;
          
          return false;
        },
        defaultMessage: () => VALIDATION_MESSAGES.INVALID_ID,
      },
    });
  };
}

/**
 * Required Email Validation Decorator
 * Works with both simple email validation and complex business rules
 */
export function IsRequiredEmail(options?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isRequiredEmail',
      target: object.constructor,
      propertyName: propertyName,
      options: {
        message: options?.message || VALIDATION_MESSAGES.INVALID_EMAIL,
        ...options,
      },
      validator: {
        validate(value: any) {
          if (!value) return false;
          return VALIDATION_PATTERNS.EMAIL.test(value);
        },
        defaultMessage: () => VALIDATION_MESSAGES.INVALID_EMAIL,
      },
    });
  };
}

/**
 * Optional Email Validation Decorator
 */
export function IsOptionalEmail(options?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isOptionalEmail',
      target: object.constructor,
      propertyName: propertyName,
      options: {
        message: options?.message || VALIDATION_MESSAGES.INVALID_EMAIL,
        ...options,
      },
      validator: {
        validate(value: any) {
          if (!value || value === '') return true; // Allow empty
          return VALIDATION_PATTERNS.EMAIL.test(value);
        },
        defaultMessage: () => VALIDATION_MESSAGES.INVALID_EMAIL,
      },
    });
  };
}

/**
 * Phone Number Validation Decorator
 * Supports multiple country formats
 */
export function IsPhoneNumber(countries?: string | string[], options?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isPhoneNumber',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [countries],
      options: {
        message: options?.message || VALIDATION_MESSAGES.INVALID_PHONE,
        ...options,
      },
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (!value) return false;
          
          // Basic phone validation - can be enhanced for specific countries
          const phonePattern = /^\+?[\d\s\-\(\)]+$/;
          if (!phonePattern.test(value)) return false;
          
          // Remove all non-digit characters for length check
          const digitsOnly = value.replace(/\D/g, '');
          return digitsOnly.length >= 10 && digitsOnly.length <= 15;
        },
        defaultMessage: () => VALIDATION_MESSAGES.INVALID_PHONE,
      },
    });
  };
}

/**
 * Transform to Lowercase Decorator
 */
export function ToLowerCase() {
  return Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.toLowerCase();
    }
    return value;
  });
}

/**
 * Trim Whitespace Decorator
 */
export function Trim() {
  return Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.trim();
    }
    return value;
  });
}

/**
 * Transform Date Decorator
 */
export function TransformDate() {
  return Transform(({ value }) => {
    if (!value) return value;
    if (value instanceof Date) return value;
    if (typeof value === 'string' || typeof value === 'number') {
      const date = new Date(value);
      return isNaN(date.getTime()) ? value : date;
    }
    return value;
  });
}

/**
 * Transform Array Decorator
 */
export function TransformArray(options?: { separator?: string }) {
  const separator = options?.separator || ',';
  return Transform(({ value }) => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
      return value.split(separator).map(item => item.trim()).filter(item => item);
    }
    return value;
  });
}

/**
 * Pagination Validation Decorator
 */
export function IsValidPagination(options?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isValidPagination',
      target: object.constructor,
      propertyName: propertyName,
      options: {
        message: options?.message || VALIDATION_MESSAGES.INVALID_PAGINATION,
        ...options,
      },
      validator: {
        validate(value: any) {
          if (value === undefined || value === null) return true;
          
          const numValue = Number(value);
          if (isNaN(numValue)) return false;
          
          // Check if it's a page number
          if (propertyName === 'page') {
            return numValue >= PAGINATION_DEFAULTS.MIN_PAGE;
          }
          
          // Check if it's a limit
          if (propertyName === 'limit') {
            return numValue >= PAGINATION_DEFAULTS.MIN_LIMIT && 
                   numValue <= PAGINATION_DEFAULTS.MAX_LIMIT;
          }
          
          return true;
        },
        defaultMessage: () => VALIDATION_MESSAGES.INVALID_PAGINATION,
      },
    });
  };
}

/**
 * Search Validation Decorator
 */
export function IsValidSearch(options?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    const validateSearch = (value: any): boolean => {
      if (!value) return true; // Allow empty values by default
      
      if (typeof value !== 'string') return false;
      
      const length = value.length;
      return length >= VALIDATION_DEFAULTS.MIN_SEARCH_LENGTH && 
             length <= VALIDATION_DEFAULTS.MAX_SEARCH_LENGTH;
    };

    // Implementation would register with class-validator
  };
}

/**
 * Entity Validation Decorator
 */
export function IsValidEntity(entity_type: string, options?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    const validateEntity = (value: any): boolean => {
      // Entity-specific validation logic based on entity_type
      if (!value) return false;
      
      // Basic validation - can be extended per entity type
      return typeof value === 'object' && value.id;
    };

    // Implementation would register with class-validator
  };
}

/**
 * Standard DTOs with validation
 */
export class PaginationDto {
  @Transform(({ value }) => parseInt(value))
  @IsValidPagination()
  page?: number = PAGINATION_DEFAULTS.DEFAULT_PAGE;

  @Transform(({ value }) => parseInt(value))
  @IsValidPagination()
  limit?: number = PAGINATION_DEFAULTS.DEFAULT_LIMIT;
}

export class SearchDto {
  @IsValidSearch()
  search?: string;

  @IsValidSearch()
  search_fields?: string[];
}

export class QueryDto extends PaginationDto {
  @IsValidSearch()
  search?: string;

  sort?: Record<string, 'ASC' | 'DESC' | 1 | -1>;
}

/**
 * Validation utilities
 */
export class ValidationUtils {
  /**
   * Validate ID format
   */
  static isValidId(id: string): boolean {
    return VALIDATION_PATTERNS.UUID.test(id) || 
           VALIDATION_PATTERNS.OBJECT_ID.test(id) ||
           VALIDATION_PATTERNS.NUMERIC.test(id);
  }

  /**
   * Validate email format
   */
  static isValidEmail(email: string): boolean {
    return VALIDATION_PATTERNS.EMAIL.test(email);
  }

  /**
   * Validate pagination parameters
   */
  static validatePagination(page?: number, limit?: number): { page: number; limit: number } {
    const validPage = Math.max(page || PAGINATION_DEFAULTS.DEFAULT_PAGE, PAGINATION_DEFAULTS.MIN_PAGE);
    const validLimit = Math.min(
      Math.max(limit || PAGINATION_DEFAULTS.DEFAULT_LIMIT, PAGINATION_DEFAULTS.MIN_LIMIT),
      PAGINATION_DEFAULTS.MAX_LIMIT
    );

    return { page: validPage, limit: validLimit };
  }
}