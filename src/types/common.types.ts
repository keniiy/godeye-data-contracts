/**
 * Common types shared across all modules
 */

// Common configuration type
export interface IDataConfig {
  service_name?: string;
  version?: string;
  environment?: string;
  pagination?: {
    default_limit?: number;
    max_limit?: number;
  };
  auth?: {
    required?: boolean;
    cache_context?: boolean;
  };
  swagger?: {
    enabled?: boolean;
    path?: string;
  };
}

// Generic key-value pair
export interface IKeyValue<T = any> {
  key: string;
  value: T;
}

// Generic filter interface
export interface IFilter {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'nin' | 'like';
  value: any;
}