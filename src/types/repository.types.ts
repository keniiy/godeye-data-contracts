/**
 * Repository Types - Microsoft-Grade Type Safety
 * 
 * Comprehensive type definitions for the base repository architecture
 * Supports both TypeORM (PostgreSQL) and Mongoose (MongoDB) patterns
 */

import { IPaginatedResult, IBulkOperation, IBulkResult } from './response.types';

// ============================================================================
// ENUMS - Standardized constants for type safety
// ============================================================================

/**
 * Supported ORM types in GOD-EYE ecosystem
 */
export enum ORMType {
  TYPEORM = 'typeorm',
  MONGOOSE = 'mongoose'
}

/**
 * Database sort directions
 * Unified across both ORMs
 */
export enum SortDirection {
  ASC = 'ASC',
  DESC = 'DESC',
  ASCENDING = 1,
  DESCENDING = -1
}

/**
 * Query operation types for monitoring and logging
 */
export enum QueryOperation {
  FIND_ONE = 'findOne',
  FIND = 'find', 
  FIND_WITH_PAGINATION = 'findWithPagination',
  CREATE = 'create',
  CREATE_MANY = 'createMany',
  UPDATE_BY_ID = 'updateById',
  UPDATE_MANY = 'updateMany',
  DELETE_BY_ID = 'deleteById',
  DELETE_MANY = 'deleteMany',
  COUNT = 'count',
  AGGREGATE = 'aggregate',
  TEXT_SEARCH = 'textSearch',
  RAW_QUERY = 'rawQuery',
  TRANSACTION = 'transaction'
}

/**
 * Repository error classification
 * Microsoft standard error categorization
 */
export enum RepositoryErrorType {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  DUPLICATE_ERROR = 'DUPLICATE_ERROR', 
  NOT_FOUND_ERROR = 'NOT_FOUND_ERROR',
  CONNECTION_ERROR = 'CONNECTION_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  TRANSACTION_ERROR = 'TRANSACTION_ERROR',
  PERMISSION_ERROR = 'PERMISSION_ERROR',
  QUERY_ERROR = 'QUERY_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  RESOURCE_EXHAUSTED = 'RESOURCE_EXHAUSTED'
}

/**
 * Entity status constants
 * Common across all GOD-EYE entities
 */
export enum EntityStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  DELETED = 'deleted',
  PENDING = 'pending',
  ARCHIVED = 'archived'
}

/**
 * Verification status for GOD-EYE business entities
 */
export enum VerificationStatus {
  PENDING = 'pending',
  VERIFIED = 'verified',
  REJECTED = 'rejected',
  UNDER_REVIEW = 'under_review',
  SUSPENDED = 'suspended'
}

// ============================================================================
// CONSTANTS - Performance and configuration defaults
// ============================================================================

/**
 * Default pagination settings
 * Microsoft-recommended defaults for enterprise applications
 */
export const PAGINATION_CONSTANTS = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 1000,
  MIN_LIMIT: 1
} as const;

/**
 * Performance monitoring thresholds (milliseconds)
 * Microsoft-grade performance standards
 */
export const PERFORMANCE_THRESHOLDS = {
  FAST_QUERY: 10,        // < 10ms - Excellent performance
  ACCEPTABLE_QUERY: 50,   // < 50ms - Good performance  
  SLOW_QUERY: 100,       // < 100ms - Needs optimization
  CRITICAL_QUERY: 500,   // > 500ms - Critical performance issue
  TIMEOUT_QUERY: 30000   // 30s - Query timeout threshold
} as const;

/**
 * Default repository configuration
 * Production-ready defaults for GOD-EYE services
 */
export const DEFAULT_REPOSITORY_CONFIG = {
  DEFAULT_LIMIT: PAGINATION_CONSTANTS.DEFAULT_LIMIT,
  MAX_LIMIT: PAGINATION_CONSTANTS.MAX_LIMIT,
  ENABLE_QUERY_LOGGING: true,
  SLOW_QUERY_THRESHOLD: PERFORMANCE_THRESHOLDS.SLOW_QUERY,
  ENABLE_PERFORMANCE_MONITORING: true,
  ENABLE_CACHING: false, // Disabled by default, enable per service
  CACHE_TIMEOUT: 300,    // 5 minutes default cache
  CONNECTION_TIMEOUT: 30000, // 30 seconds
  MAX_RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000     // 1 second initial delay
} as const;

/**
 * GOD-EYE specific entity field names
 * Standardized field naming across all services
 */
export const ENTITY_FIELDS = {
  ID: 'id',
  CREATED_AT: 'createdAt',
  UPDATED_AT: 'updatedAt',
  DELETED_AT: 'deletedAt',
  CREATED_BY: 'createdBy',
  UPDATED_BY: 'updatedBy',
  STATUS: 'status',
  VERIFICATION_STATUS: 'verificationStatus',
  USER_ID: 'userId',
  EMAIL: 'email',
  PHONE: 'phone'
} as const;

/**
 * ORM-agnostic query criteria interface
 * The 'include' field auto-converts to 'relations' for TypeORM or 'populate' for Mongoose
 */
export interface ICriteria<T> {
  /** Query conditions - works like SQL WHERE for both ORMs */
  where?: Partial<T> | Record<string, any>;
  
  /** Load related data - auto-converts to relations/populate internally */
  include?: string[] | string;
  
  /** Relations to load (TypeORM) - alias for include */
  relations?: string[];
  
  /** Fields to select/project */
  select?: string[];
  
  /** Sort order */
  sort?: Record<string, 'ASC' | 'DESC' | 1 | -1>;
  
  /** Maximum number of results */
  limit?: number;
  
  /** Number of results to skip */
  offset?: number;
  
  /** Page number (1-based) for pagination */
  page?: number;
  
  /** Search configuration */
  search?: {
    fields: string[];
    term: string;
  };
}

/**
 * Unified repository interface that works with both TypeORM entities and Mongoose documents
 */
export interface IRepository<T> {
  // Basic CRUD operations
  find<R = T>(criteria: ICriteria<T>): Promise<R[]>;
  findOne<R = T>(criteria: ICriteria<T>): Promise<R | null>;
  create(data: Partial<T>): Promise<T>;
  update(criteria: ICriteria<T>, data: Partial<T>): Promise<T>;
  delete(criteria: ICriteria<T>): Promise<boolean>;
  
  // Advanced operations
  findWithPagination<R = T>(criteria: ICriteria<T>): Promise<IPaginatedResult<R>>;
  bulkOperations<R = T>(operations: IBulkOperation<T>[]): Promise<IBulkResult<R>>;
  
  // EMRO-inspired methods (DRY - no redundant wrappers)
  findById<R = T>(id: string, include?: string[]): Promise<R | null>;
  updateById<R = T>(id: string, data: Partial<T>): Promise<R | null>;
  updateMany(criteria: ICriteria<T>, data: Partial<T>): Promise<{ modifiedCount: number }>;
  findOneAndUpdate<R = T>(criteria: ICriteria<T>, data: Partial<T>, options?: { populate?: string[] }): Promise<R | null>;
  deleteById(id: string): Promise<boolean>;
  deleteMany(criteria: ICriteria<T>): Promise<{ deletedCount: number }>;
  existsByFilters(criteria: ICriteria<T>): Promise<boolean>;
  createMany(data: Partial<T>[]): Promise<T[]>;
  
  // NOTE: Removed redundant wrapper methods:
  // - findByIdWithPopulate → use findById(id, include)
  // - findOneWithPopulate → use findOne({ ...criteria, include })  
  // - findManyWithPopulate → use find({ ...criteria, include })
  // - updateOneWithPopulate → use findOneAndUpdate(criteria, data, { populate })
  
  // Utility operations
  count(criteria: ICriteria<T>): Promise<number>;
  exists(criteria: ICriteria<T>): Promise<boolean>;
  
  // Aggregation operations (EMRO-inspired)
  aggregate<R = any>(pipeline: any[]): Promise<R[]>;
  aggregateCount(pipeline: any[]): Promise<number>;
  aggregateWithPagination<R = any>(
    pipeline: any[],
    options: { page: number; limit: number; }
  ): Promise<IPaginatedResult<R>>;
  
  // Aggregation builder pattern
  aggregationBuilder(): IAggregationBuilder<T>;
  
  // Advanced aggregation shortcuts
  aggregateGroup<R = any>(options: {
    groupBy: Record<string, any>;
    operations?: {
      count?: boolean;
      sum?: string[];
      avg?: string[];
      min?: string[];
      max?: string[];
    };
    match?: Partial<T>;
    sort?: Record<string, 1 | -1>;
    limit?: number;
  }): Promise<R[]>;
  
  aggregateLookup<R = any>(options: {
    from: string;
    localField: string;
    foreignField: string;
    as: string;
    pipeline?: any[];
    match?: Partial<T>;
    sort?: Record<string, 1 | -1>;
    limit?: number;
  }): Promise<R[]>;
  
  aggregateTimeSeries<R = any>(options: {
    dateField: string;
    granularity: 'hour' | 'day' | 'week' | 'month' | 'year';
    timezone?: string;
    match?: Partial<T>;
    startDate?: Date;
    endDate?: Date;
    operations?: {
      count?: boolean;
      sum?: string[];
      avg?: string[];
    };
  }): Promise<R[]>;
  
  distinct<R = any>(field: string, filters?: Partial<T>): Promise<R[]>;
  
  // Transaction management (EMRO-inspired)
  withTransaction<R = any>(callback: (transaction: ITransaction) => Promise<R>): Promise<R>;
  beginTransaction(): Promise<ITransaction>;
}

/**
 * Repository configuration for ORM detection and setup
 */
export interface IRepositoryConfig {
  /** ORM type - auto-detected from connection */
  orm_type?: 'typeorm' | 'mongoose';
  
  /** Default pagination limit */
  default_limit?: number;
  
  /** Maximum pagination limit */
  max_limit?: number;
  
  /** Enable soft deletes */
  soft_delete?: boolean;
  
  /** Default sort field */
  default_sort?: string;
  
  /** Auto-populate fields (always include these relations) */
  auto_populate?: string[];
}

/**
 * Search configuration for text search operations
 */
export interface ISearchConfig {
  /** Fields to search in */
  fields: string[];
  
  /** Search term */
  term: string;
  
  /** Search mode */
  mode?: 'contains' | 'startsWith' | 'endsWith' | 'exact';
  
  /** Case sensitive search */
  case_sensitive?: boolean;
}

/**
 * Aggregation Builder Interface (EMRO-inspired fluent API)
 * Fluent interface for building aggregation pipelines across both ORMs
 */
export interface IAggregationBuilder<T = any> {
  match(filters: Record<string, any>): IAggregationBuilder<T>;
  group(groupBy: Record<string, any>): IAggregationBuilder<T>;
  sort(sort: Record<string, 1 | -1>): IAggregationBuilder<T>;
  limit(limit: number): IAggregationBuilder<T>;
  skip(skip: number): IAggregationBuilder<T>;
  project(fields: Record<string, any>): IAggregationBuilder<T>;
  lookup(options: {
    from: string;
    localField: string;
    foreignField: string;
    as: string;
    pipeline?: any[];
  }): IAggregationBuilder<T>;
  unwind(
    path: string,
    options?: {
      preserveNullAndEmptyArrays?: boolean;
      includeArrayIndex?: string;
    }
  ): IAggregationBuilder<T>;
  addFields(fields: Record<string, any>): IAggregationBuilder<T>;
  facet(facets: Record<string, any[]>): IAggregationBuilder<T>;
  
  // Execution methods
  exec<R = any>(): Promise<R[]>;
  count(): Promise<number>;
  paginate<R = any>(page: number, limit: number): Promise<IPaginatedResult<R>>;
  
  // Get raw pipeline (for debugging or custom execution)
  getPipeline(): any[];
}

/**
 * Transaction Interface (ORM-agnostic)
 * Unified transaction management for both TypeORM and Mongoose
 */
export interface ITransaction {
  /** Check if transaction is active */
  isActive(): boolean;
  
  /** Commit the transaction */
  commit(): Promise<void>;
  
  /** Rollback the transaction */
  rollback(): Promise<void>;
  
  /** Get the underlying transaction object (ORM-specific) */
  getTransaction(): any;
  
  /** Create repository instance bound to this transaction */
  getRepository<T>(entity: any): ITransactionRepository<T>;
}

/**
 * Transaction-bound Repository Interface
 * Repository operations within a transaction context
 */
export interface ITransactionRepository<T> {
  // Basic CRUD operations within transaction
  find<R = T>(criteria: ICriteria<T>): Promise<R[]>;
  findOne<R = T>(criteria: ICriteria<T>): Promise<R | null>;
  create(data: Partial<T>): Promise<T>;
  update(criteria: ICriteria<T>, data: Partial<T>): Promise<T>;
  delete(criteria: ICriteria<T>): Promise<boolean>;
  count(criteria: ICriteria<T>): Promise<number>;
  
  // Batch operations within transaction
  createMany(data: Partial<T>[]): Promise<T[]>;
  updateMany(criteria: ICriteria<T>, data: Partial<T>): Promise<{ modifiedCount: number }>;
  deleteMany(criteria: ICriteria<T>): Promise<{ deletedCount: number }>;
  
  // Advanced operations
  findWithPagination<R = T>(criteria: ICriteria<T>): Promise<IPaginatedResult<R>>;
  bulkOperations<R = T>(operations: IBulkOperation<T>[]): Promise<IBulkResult<R>>;
  
  // Aggregation within transaction (Mongoose only - TypeORM limitations noted)
  aggregate<R = any>(pipeline: any[]): Promise<R[]>;
  aggregateCount(pipeline: any[]): Promise<number>;
  distinct<R = any>(field: string, filters?: Partial<T>): Promise<R[]>;
}

/**
 * Transaction Options
 */
export interface ITransactionOptions {
  /** Transaction isolation level (database-specific) */
  isolation?: 'READ_UNCOMMITTED' | 'READ_COMMITTED' | 'REPEATABLE_READ' | 'SERIALIZABLE';
  
  /** Transaction timeout in milliseconds */
  timeout?: number;
  
  /** Auto-retry failed transactions */
  retry?: {
    attempts: number;
    delay: number;
  };
  
  /** Read preference for MongoDB (Mongoose only) */
  readPreference?: 'primary' | 'secondary' | 'primaryPreferred' | 'secondaryPreferred' | 'nearest';
  
  /** Write concern for MongoDB (Mongoose only) */
  writeConcern?: {
    w?: number | string;
    j?: boolean;
    wtimeout?: number;
  };
}