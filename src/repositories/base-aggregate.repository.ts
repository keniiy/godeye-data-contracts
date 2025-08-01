/**
 * Base Aggregate Repository Interface - Unified MongoDB & SQL Aggregation
 *
 * Enterprise-grade aggregation layer that provides consistent API for both:
 * - Mongoose (MongoDB aggregation pipelines) 
 * - TypeORM (SQL query builder with joins)
 *
 * Key Features:
 * - Single aggregation query replaces multiple separate queries
 * - Consistent API across both ORMs
 * - Built-in pagination support
 * - Complex joins and aggregations
 * - Performance monitoring and optimization
 * - Natural data flow without reshaping
 */

import { IPaginationResult } from '../types';

// ============================================================================
// CORE AGGREGATION TYPES
// ============================================================================

/**
 * MongoDB aggregation pipeline (array of stage objects)
 * Used directly by Mongoose, converted to SQL by TypeORM implementation
 */
export type AggregationPipeline = any[];

/**
 * TypeORM query builder function
 * Accepts SelectQueryBuilder and returns configured builder
 */
export type QueryBuilderFunction = (qb: any) => any;

/**
 * Join configuration for cross-collection/table relationships
 */
export interface JoinConfig {
  /** Collection/table to join with */
  collection?: string;    // MongoDB collection name
  table?: string;         // SQL table name
  
  /** Local field to join on */
  localField: string;
  
  /** Foreign field to join on */
  foreignField: string;
  
  /** Alias for joined data */
  as: string;
  
  /** Join type (SQL only) */
  type?: 'INNER' | 'LEFT' | 'RIGHT' | 'FULL';
  
  /** Additional join condition (SQL only) */
  condition?: string;
}

/**
 * Aggregation operation configuration
 */
export interface AggregationConfig {
  /** Aggregation operation type */
  operation: 'COUNT' | 'SUM' | 'AVG' | 'MIN' | 'MAX' | 'GROUP_CONCAT';
  
  /** Field to aggregate */
  field: string;
  
  /** Alias for aggregated result */
  alias: string;
  
  /** Group by fields (for GROUP operations) */
  groupBy?: string[];
  
  /** Additional conditions for this aggregation */
  conditions?: Record<string, any>;
}

/**
 * Where conditions (works for both ORMs)
 */
export interface WhereConfig {
  [field: string]: any;
}

/**
 * Pagination configuration
 */
export interface PaginationDto {
  page: number;
  limit: number;
}

/**
 * Complex query configuration that unifies MongoDB and SQL patterns
 * This is the core abstraction that makes both ORMs work the same way
 */
export interface ComplexQueryConfig {
  /** JOIN operations (converted to $lookup for MongoDB) */
  joins?: JoinConfig[];
  
  /** Aggregation operations (SUM, COUNT, etc.) */
  aggregations?: AggregationConfig[];
  
  /** WHERE conditions (converted to $match for MongoDB) */
  conditions?: WhereConfig;
  
  /** Pagination settings */
  pagination?: PaginationDto;
  
  /** Sort configuration */
  sort?: Record<string, 'ASC' | 'DESC' | 1 | -1>;
  
  /** Field selection/projection */
  select?: string[];
  
  /** Group by fields */
  groupBy?: string[];
}

/**
 * Paginated result with metadata
 */
export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// ============================================================================
// UNIFIED AGGREGATE REPOSITORY INTERFACE
// ============================================================================

/**
 * Abstract base repository interface for unified aggregation
 * Works with both Mongoose (MongoDB) and TypeORM (SQL databases)
 *
 * Key benefit: Write once, works with both MongoDB and PostgreSQL/MySQL
 */
export interface IAggregateRepository<T> {
  // ========================================================================
  // CORE AGGREGATION METHODS
  // ========================================================================
  
  /**
   * Execute MongoDB aggregation pipeline or equivalent SQL query
   * 
   * MongoDB: Executes pipeline directly
   * TypeORM: Converts pipeline concepts to SQL with JOINs
   * 
   * Performance: Single query replaces multiple database roundtrips
   */
  aggregate(pipeline: AggregationPipeline): Promise<any[]>;
  
  /**
   * Execute aggregation with pagination
   * Uses MongoDB's $facet for parallel data+count execution
   * Uses SQL subqueries for TypeORM
   */
  aggregateWithPagination(
    pipeline: AggregationPipeline, 
    pagination: PaginationDto
  ): Promise<PaginatedResult<any>>;
  
  // ========================================================================
  // TYPEORM QUERY BUILDER METHODS
  // ========================================================================
  
  /**
   * Execute TypeORM query builder function
   * For SQL-specific optimizations when needed
   * 
   * MongoDB: Converts query builder concepts to aggregation pipeline
   */
  query(builder: QueryBuilderFunction): Promise<any[]>;
  
  /**
   * Execute query builder with pagination
   * Optimized with parallel query+count execution
   */
  queryWithPagination(
    builder: QueryBuilderFunction, 
    pagination: PaginationDto
  ): Promise<PaginatedResult<any>>;
  
  // ========================================================================
  // UNIVERSAL METHOD (WORKS WITH BOTH ORMS)
  // ========================================================================
  
  /**
   * Universal complex query that works with both ORMs
   * 
   * This is the main method that replaces multiple separate queries:
   * - Handles JOINs (converted to $lookup for MongoDB)
   * - Handles aggregations (SUM, COUNT, etc.)
   * - Handles WHERE conditions
   * - Handles pagination
   * - Single database query instead of 3+ separate queries
   * 
   * Example usage:
   * ```typescript
   * const result = await repository.complexQuery({
   *   joins: [
   *     { 
   *       collection: 'business_entities', 
   *       localField: 'business_entity_id',
   *       foreignField: '_id', 
   *       as: 'business' 
   *     }
   *   ],
   *   aggregations: [
   *     { operation: 'COUNT', field: 'status', alias: 'active_count', conditions: { status: 'ACTIVE' } },
   *     { operation: 'COUNT', field: 'status', alias: 'pending_count', conditions: { status: 'INVITED' } }
   *   ],
   *   conditions: { status: { $in: ['ACTIVE', 'INVITED'] } },
   *   pagination: { page: 1, limit: 20 }
   * });
   * ```
   */
  complexQuery(config: ComplexQueryConfig): Promise<PaginatedResult<any>>;
}

// ============================================================================
// HELPER INTERFACES FOR IMPLEMENTATION
// ============================================================================

/**
 * Aggregation result metadata for monitoring
 */
export interface AggregationMetadata {
  queryTime: string;
  pipelineStages?: number;
  joinCount?: number;
  aggregationCount?: number;
  optimizations?: string[];
}

/**
 * Performance metrics for aggregation queries
 */
export interface AggregationMetrics {
  operation: string;
  duration: number;
  resultCount: number;
  stages: number;
  isOptimized: boolean;
}