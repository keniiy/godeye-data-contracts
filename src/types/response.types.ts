/**
 * Core response interfaces for standardized API responses across all services
 */

export interface IResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message: string;
  status_code: number;
  time_ms: number;
  timestamp: string;
  trace_id: string;
  pagination?: IPagination;
  metadata?: IResponseMetadata;
}

export interface IPagination {
  total: number; // Total items available
  page: number; // Current page (1-based)
  limit: number; // Items per page
  total_pages: number; // Total pages available
  has_next: boolean; // Has next page
  has_prev: boolean; // Has previous page
}

export interface IPaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/**
 * Specific metadata contexts - No more vague metadata!
 */
export interface IResponseMetadata {
  // Database operation context
  ms_speed?: number; // Query execution time in milliseconds
  affected_rows?: number; // Rows affected by operation
  cache_hit?: boolean; // Whether result came from cache

  // System performance data
  cpu_usage_percent?: number; // Current CPU usage percentage
  memory_used_mb?: number; // Memory used in MB
  memory_available_mb?: number; // Available memory in MB
  heap_used_mb?: number; // Node.js heap usage in MB
  heap_total_mb?: number; // Total heap size in MB

  // Validation context
  validation_errors?: string[]; // List of validation errors
  updated_fields?: string[]; // Fields that were updated
  skipped_fields?: string[]; // Fields that were skipped

  // Authentication context
  user_permissions?: string[]; // User's permissions
  rate_limit_remaining?: number; // API rate limit remaining

  // File operation context
  file_size_bytes?: number; // File size in bytes
  file_type?: string; // MIME type of file
  processed_count?: number; // Number of items processed

  // Business operation context
  workflow_stage?: string; // Current workflow stage
  notification_sent?: boolean; // Whether notification was sent
  external_api_calls?: number; // Number of external API calls made

  // Debug context
  service_version?: string; // Service version
  environment?: string; // Environment (dev, staging, prod)
  request_id?: string; // Unique request identifier
}

/**
 * Bulk operation enums and interfaces
 */
export enum BulkOperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete'
}

export interface IBulkOperation<T> {
  operation: BulkOperationType;
  data: Partial<T>;
  where?: Partial<T>;
}

export interface IBulkResult<T> {
  success_count: number;
  error_count: number;
  results: T[];
  errors: string[];
}
