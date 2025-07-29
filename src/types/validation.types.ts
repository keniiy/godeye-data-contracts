/**
 * Validation interfaces for unified validation across all services
 * Replaces service-specific validation patterns with standardized ones
 */

/**
 * Validation options for decorators
 */
export interface IValidationOptions {
  /** Custom error message */
  message?: string;
  
  /** Skip validation if value is undefined */
  optional?: boolean;
  
  /** Custom validation function */
  custom_validator?: (value: any) => boolean | Promise<boolean>;
  
  /** Context for validation (e.g., entity type) */
  context?: Record<string, any>;
}

/**
 * Pagination validation configuration
 */
export interface IPaginationValidation {
  /** Minimum page number */
  min_page?: number;
  
  /** Maximum page number */
  max_page?: number;
  
  /** Minimum limit */
  min_limit?: number;
  
  /** Maximum limit */
  max_limit?: number;
  
  /** Default limit when not provided */
  default_limit?: number;
}

/**
 * Search validation configuration
 */
export interface ISearchValidation {
  /** Minimum search term length */
  min_length?: number;
  
  /** Maximum search term length */
  max_length?: number;
  
  /** Allowed search fields */
  allowed_fields?: string[];
  
  /** Regex pattern for search term */
  pattern?: RegExp;
}

/**
 * ID validation configuration
 */
export interface IIdValidation {
  /** ID format type */
  format?: 'uuid' | 'objectid' | 'numeric' | 'custom';
  
  /** Custom regex for validation */
  custom_pattern?: RegExp;
  
  /** Whether to allow arrays of IDs */
  allow_array?: boolean;
}

/**
 * Entity validation configuration
 */
export interface IEntityValidation {
  /** Entity type for context */
  entity_type: string;
  
  /** Required fields for the entity */
  required_fields?: string[];
  
  /** Optional fields for the entity */
  optional_fields?: string[];
  
  /** Field-specific validations */
  field_validations?: Record<string, IValidationOptions>;
}

/**
 * Bulk validation result
 */
export interface IBulkValidationResult {
  /** Whether all validations passed */
  is_valid: boolean;
  
  /** Validation errors by field */
  field_errors: Record<string, string[]>;
  
  /** Global validation errors */
  global_errors: string[];
  
  /** Number of valid items */
  valid_count: number;
  
  /** Number of invalid items */
  error_count: number;
}