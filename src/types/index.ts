// Response types
export * from "./response.types";

// Repository types
export * from "./repository.types";

// Authentication types
export * from "./auth.types";

// Validation types
export * from "./validation.types";

// Export enums and constants for easy consumption
export {
  ORMType,
  SortDirection,
  SearchStrategy,
  QueryOperation,
  RepositoryErrorType,
  EntityStatus,
  VerificationStatus,
  PAGINATION_CONSTANTS,
  PERFORMANCE_THRESHOLDS,
  DEFAULT_REPOSITORY_CONFIG,
  ENTITY_FIELDS
} from './repository.types';

// Export interfaces separately to follow repo pattern
export type { IWhereConfig } from './repository.types';

// Aliases for backwards compatibility and cleaner imports
export type { IPaginatedResult as IPaginationResult } from './response.types';
export type { ICriteria as IQueryOptions } from './repository.types';

// Additional types that repository files need
export interface IPaginationOptions {
  page?: number;
  limit?: number;
}

export interface IQueryMetrics {
  operation: string;
  entity: string;
  duration: number;
  criteria: string;
  metadata?: any;
  timestamp: string;
}

export interface ISortOptions {
  [field: string]: 'ASC' | 'DESC' | 1 | -1;
}
