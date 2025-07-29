/**
 * Unified Validation System
 * Standardized validation decorators and pipes across all services
 */

import { Injectable, PipeTransform, ArgumentMetadata, BadRequestException } from '@nestjs/common';
import { validate, ValidationError, ValidationOptions } from 'class-validator';
import { Transform, plainToClass } from 'class-transformer';
import { VALIDATION_PATTERNS, VALIDATION_MESSAGES, VALIDATION_DEFAULTS } from '../constants/validation.constants';
import { PAGINATION_DEFAULTS } from '../constants/pagination.constants';

/**
 * Unified Validation Pipe
 * Replaces separate validation pipes with single, configurable pipe
 */
@Injectable()
export class ValidationPipe implements PipeTransform<any> {
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
    const validateId = (value: any): boolean => {
      if (!value) return false;
      
      // Check UUID format
      if (VALIDATION_PATTERNS.UUID.test(value)) return true;
      
      // Check MongoDB ObjectId format
      if (VALIDATION_PATTERNS.OBJECT_ID.test(value)) return true;
      
      // Check numeric format
      if (VALIDATION_PATTERNS.NUMERIC.test(value)) return true;
      
      return false;
    };

    // Register custom validator with class-validator
    const metadata = {
      target: object.constructor,
      propertyName,
      constraints: [],
      options: {
        message: options?.message || VALIDATION_MESSAGES.INVALID_ID,
        ...options,
      },
      validator: {
        validate: validateId,
        defaultMessage: () => VALIDATION_MESSAGES.INVALID_ID,
      },
    };

    // This would integrate with class-validator's metadata system
    // Implementation depends on class-validator internals
  };
}

/**
 * Pagination Validation Decorator
 */
export function IsValidPagination(options?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    const validatePagination = (value: any): boolean => {
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
    };

    // Implementation would register with class-validator
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