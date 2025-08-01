/**
 * BLAZING FAST Enhanced Aggregation Algorithms
 *
 * Next-generation aggregation engine with advanced optimization:
 * - Adaptive query planning based on data size
 * - Memory-efficient streaming for large datasets
 * - Intelligent index utilization
 * - Parallel processing for multi-step aggregations
 * - Query result caching with smart invalidation
 * - Performance analytics and auto-tuning
 */

import * as os from 'os';
import * as crypto from 'crypto';
import { ComplexQueryConfig, PaginatedResult, PaginationDto } from '../repositories/base-aggregate.repository';

// ============================================================================
// PERFORMANCE OPTIMIZATION ENUMS
// ============================================================================

export enum AggregationStrategy {
  /** Small datasets (<1K records) - Memory-based processing */
  MEMORY_OPTIMIZED = 'memory_optimized',

  /** Medium datasets (1K-100K records) - Hybrid approach */
  HYBRID = 'hybrid',

  /** Large datasets (>100K records) - Streaming + chunked processing */
  STREAMING = 'streaming',

  /** Very large datasets (>1M records) - Distributed processing */
  DISTRIBUTED = 'distributed'
}

export enum QueryOptimizationLevel {
  /** Basic optimization - Standard indexes */
  BASIC = 'basic',

  /** Advanced optimization - Compound indexes + query hints */
  ADVANCED = 'advanced',

  /** Enterprise optimization - Partitioning + materialized views */
  ENTERPRISE = 'enterprise'
}

export enum AggregationStepType {
  // Memory-optimized strategy steps
  /** Standard filtering operation */
  FILTER = 'FILTER',

  /** Standard join operation */
  JOIN = 'JOIN',

  /** Standard aggregation operation */
  AGGREGATE = 'AGGREGATE',

  /** Standard sorting operation */
  SORT = 'SORT',

  // Streaming strategy steps
  /** Streaming-based filtering */
  STREAM_FILTER = 'STREAM_FILTER',

  /** Chunked join operation for large datasets */
  CHUNK_JOIN = 'CHUNK_JOIN',

  /** Streaming aggregation for memory efficiency */
  STREAMING_AGGREGATE = 'STREAMING_AGGREGATE',

  /** Merge sort for streaming results */
  MERGE_SORT = 'MERGE_SORT',

  // Distributed strategy steps
  /** Data partitioning for distributed processing */
  PARTITION = 'PARTITION',

  /** Distributed filtering across partitions */
  DISTRIBUTED_FILTER = 'DISTRIBUTED_FILTER',

  /** Map-reduce style join operation */
  MAP_REDUCE_JOIN = 'MAP_REDUCE_JOIN',

  /** Distributed aggregation across partitions */
  DISTRIBUTED_AGGREGATE = 'DISTRIBUTED_AGGREGATE',

  /** Merge results from distributed operations */
  MERGE_RESULTS = 'MERGE_RESULTS'
}

// ============================================================================
// ENHANCED QUERY CONFIGURATION
// ============================================================================

export interface EnhancedQueryConfig extends ComplexQueryConfig {
  /** Strategy override (auto-detected if not specified) */
  strategy?: AggregationStrategy;

  /** Optimization level */
  optimization?: QueryOptimizationLevel;

  /** Enable query result caching */
  enableCaching?: boolean;

  /** Cache TTL in seconds (default: 300) */
  cacheTTL?: number;

  /** Maximum memory usage in MB (default: 512) */
  maxMemoryMB?: number;

  /** Enable parallel processing for multi-step aggregations */
  enableParallel?: boolean;

  /** Query timeout in milliseconds (default: 30000) */
  timeoutMs?: number;

  /** Enable performance metrics collection */
  enableMetrics?: boolean;

  /** Index hints for query optimization */
  indexHints?: string[];

  /** Chunk size for streaming aggregations (default: 1000) */
  chunkSize?: number;
}

export interface QueryMetrics {
  executionTimeMs: number;
  memoryUsedMB: number;
  cpuUsagePercent: number;
  cacheHit: boolean;
  strategy: AggregationStrategy;
  indexesUsed: string[];
  totalRows: number;
  processedChunks?: number;
  parallelOperations?: number;
  optimizationLevel: QueryOptimizationLevel;
}

export interface EnhancedPaginatedResult<T> extends PaginatedResult<T> {
  /** Performance metadata */
  metrics: QueryMetrics;

  /** Query suggestions for optimization */
  suggestions?: string[];

  /** Cache information */
  cacheInfo?: {
    hit: boolean;
    key: string;
    ttl: number;
  };
}

// ============================================================================
// ADAPTIVE QUERY PLANNER
// ============================================================================

export class AdaptiveQueryPlanner {
  /**
   * Analyze query and dataset to determine optimal strategy
   */
  static determineStrategy(
    config: EnhancedQueryConfig,
    estimatedRows: number
  ): AggregationStrategy {
    if (config.strategy) {
      return config.strategy;
    }

    // Auto-detect based on estimated dataset size
    if (estimatedRows < 1000) {
      return AggregationStrategy.MEMORY_OPTIMIZED;
    } else if (estimatedRows < 100000) {
      return AggregationStrategy.HYBRID;
    } else if (estimatedRows < 1000000) {
      return AggregationStrategy.STREAMING;
    } else {
      return AggregationStrategy.DISTRIBUTED;
    }
  }

  /**
   * Generate optimized query plan based on strategy
   */
  static createQueryPlan(
    config: EnhancedQueryConfig,
    strategy: AggregationStrategy
  ): QueryPlan {
    return {
      strategy,
      steps: this.generateQuerySteps(config, strategy),
      indexHints: this.suggestIndexes(config),
      memoryLimits: this.calculateMemoryLimits(config),
      parallelization: this.determineParallelization(config, strategy),
    };
  }

  private static generateQuerySteps(
    config: EnhancedQueryConfig,
    strategy: AggregationStrategy
  ): QueryStep[] {
    const steps: QueryStep[] = [];

    switch (strategy) {
      case AggregationStrategy.MEMORY_OPTIMIZED:
        steps.push(
          { type: AggregationStepType.FILTER, priority: 1, parallel: false },
          { type: AggregationStepType.JOIN, priority: 2, parallel: false },
          { type: AggregationStepType.AGGREGATE, priority: 3, parallel: false },
          { type: AggregationStepType.SORT, priority: 4, parallel: false }
        );
        break;

      case AggregationStrategy.HYBRID:
        steps.push(
          { type: AggregationStepType.FILTER, priority: 1, parallel: false },
          { type: AggregationStepType.JOIN, priority: 2, parallel: true },
          { type: AggregationStepType.AGGREGATE, priority: 3, parallel: true },
          { type: AggregationStepType.SORT, priority: 4, parallel: false }
        );
        break;

      case AggregationStrategy.STREAMING:
        steps.push(
          { type: AggregationStepType.STREAM_FILTER, priority: 1, parallel: false },
          { type: AggregationStepType.CHUNK_JOIN, priority: 2, parallel: true },
          { type: AggregationStepType.STREAMING_AGGREGATE, priority: 3, parallel: true },
          { type: AggregationStepType.MERGE_SORT, priority: 4, parallel: true }
        );
        break;

      case AggregationStrategy.DISTRIBUTED:
        steps.push(
          { type: AggregationStepType.PARTITION, priority: 1, parallel: true },
          { type: AggregationStepType.DISTRIBUTED_FILTER, priority: 2, parallel: true },
          { type: AggregationStepType.MAP_REDUCE_JOIN, priority: 3, parallel: true },
          { type: AggregationStepType.DISTRIBUTED_AGGREGATE, priority: 4, parallel: true },
          { type: AggregationStepType.MERGE_RESULTS, priority: 5, parallel: false }
        );
        break;
    }

    return steps;
  }

  private static suggestIndexes(config: EnhancedQueryConfig): string[] {
    const indexes: string[] = [];

    // Add indexes for WHERE conditions
    if (config.conditions) {
      Object.keys(config.conditions).forEach(field => {
        indexes.push(`idx_${field}`);
      });
    }

    // Add indexes for JOIN fields
    if (config.joins) {
      config.joins.forEach(join => {
        indexes.push(`idx_${join.localField}`);
        indexes.push(`idx_${join.foreignField}`);
      });
    }

    // Add indexes for GROUP BY fields
    if (config.groupBy) {
      config.groupBy.forEach(field => {
        indexes.push(`idx_${field}`);
      });
    }

    // Add compound indexes for common query patterns
    if (config.conditions && config.groupBy) {
      const compoundFields = [
        ...Object.keys(config.conditions),
        ...config.groupBy
      ].slice(0, 3); // Limit to 3 fields for compound index
      indexes.push(`idx_compound_${compoundFields.join('_')}`);
    }

    return [...new Set(indexes)]; // Remove duplicates
  }

  private static calculateMemoryLimits(config: EnhancedQueryConfig): MemoryLimits {
    const maxMemoryMB = config.maxMemoryMB || 512;

    return {
      totalMB: maxMemoryMB,
      bufferMB: Math.min(maxMemoryMB * 0.3, 128), // 30% or 128MB max for buffers
      cacheMB: Math.min(maxMemoryMB * 0.2, 64),   // 20% or 64MB max for cache
      workingMB: maxMemoryMB * 0.5,               // 50% for working memory
    };
  }

  private static determineParallelization(
    config: EnhancedQueryConfig,
    strategy: AggregationStrategy
  ): ParallelConfig {
    if (!config.enableParallel) {
      return { enabled: false, maxWorkers: 1 };
    }

    const maxCpuCores = os.cpus().length;

    switch (strategy) {
      case AggregationStrategy.MEMORY_OPTIMIZED:
        return { enabled: false, maxWorkers: 1 };

      case AggregationStrategy.HYBRID:
        return {
          enabled: true,
          maxWorkers: Math.min(2, maxCpuCores),
          chunkSize: config.chunkSize || 1000
        };

      case AggregationStrategy.STREAMING:
        return {
          enabled: true,
          maxWorkers: Math.min(4, maxCpuCores),
          chunkSize: config.chunkSize || 5000
        };

      case AggregationStrategy.DISTRIBUTED:
        return {
          enabled: true,
          maxWorkers: maxCpuCores,
          chunkSize: config.chunkSize || 10000
        };

      default:
        return { enabled: false, maxWorkers: 1 };
    }
  }
}

// ============================================================================
// SUPPORTING INTERFACES
// ============================================================================

interface QueryPlan {
  strategy: AggregationStrategy;
  steps: QueryStep[];
  indexHints: string[];
  memoryLimits: MemoryLimits;
  parallelization: ParallelConfig;
}

interface QueryStep {
  type: AggregationStepType;
  priority: number;
  parallel: boolean;
  estimatedTimeMs?: number;
  memoryRequiredMB?: number;
}

interface MemoryLimits {
  totalMB: number;
  bufferMB: number;
  cacheMB: number;
  workingMB: number;
}

interface ParallelConfig {
  enabled: boolean;
  maxWorkers: number;
  chunkSize?: number;
}

// ============================================================================
// SMART CACHING SYSTEM
// ============================================================================

export class SmartCache {
  private static cache = new Map<string, CacheEntry>();
  private static readonly DEFAULT_TTL = 300; // 5 minutes

  static generateCacheKey(config: EnhancedQueryConfig): string {
    // Create deterministic cache key from query config
    const keyData = {
      joins: config.joins || [],
      aggregations: config.aggregations || [],
      conditions: config.conditions || {},
      groupBy: config.groupBy || [],
      sort: config.sort || {},
      select: config.select || [],
    };

    return `aggregation_${this.hashObject(keyData)}`;
  }

  static async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    entry.hitCount++;
    entry.lastAccessed = Date.now();
    return entry.data as T;
  }

  static set<T>(key: string, data: T, ttlSeconds?: number): void {
    const ttl = (ttlSeconds || this.DEFAULT_TTL) * 1000;
    const entry: CacheEntry = {
      data,
      createdAt: Date.now(),
      expiresAt: Date.now() + ttl,
      lastAccessed: Date.now(),
      hitCount: 0,
      size: this.estimateSize(data),
    };

    this.cache.set(key, entry);
    this.evictIfNeeded();
  }

  static invalidate(pattern: string): void {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  private static hashObject(obj: any): string {
    return crypto
      .createHash('md5')
      .update(JSON.stringify(obj, Object.keys(obj).sort()))
      .digest('hex');
  }

  private static estimateSize(data: any): number {
    return JSON.stringify(data).length * 2; // Rough estimate in bytes
  }

  private static evictIfNeeded(): void {
    const MAX_CACHE_SIZE = 100 * 1024 * 1024; // 100MB
    const MAX_ENTRIES = 1000;

    if (this.cache.size <= MAX_ENTRIES) {
      const totalSize = Array.from(this.cache.values())
        .reduce((sum, entry) => sum + entry.size, 0);

      if (totalSize <= MAX_CACHE_SIZE) {
        return;
      }
    }

    // Evict least recently used entries
    const entries = Array.from(this.cache.entries())
      .sort(([,a], [,b]) => a.lastAccessed - b.lastAccessed);

    const toEvict = Math.max(1, Math.floor(entries.length * 0.2)); // Evict 20%

    for (let i = 0; i < toEvict; i++) {
      this.cache.delete(entries[i][0]);
    }
  }
}

interface CacheEntry {
  data: any;
  createdAt: number;
  expiresAt: number;
  lastAccessed: number;
  hitCount: number;
  size: number;
}

// ============================================================================
// PERFORMANCE MONITOR
// ============================================================================

export class PerformanceMonitor {
  static startQuery(queryId: string): QuerySession {
    const session: QuerySession = {
      queryId,
      startTime: Date.now(),
      startCpu: process.cpuUsage(),
      startMemory: process.memoryUsage(),
    };

    return session;
  }

  static endQuery(session: QuerySession, result: any): QueryMetrics {
    const endTime = Date.now();
    const endCpu = process.cpuUsage(session.startCpu);
    const endMemory = process.memoryUsage();

    const executionTimeMs = endTime - session.startTime;
    const cpuUsagePercent = (endCpu.user + endCpu.system) / (executionTimeMs * 1000) * 100;
    const memoryUsedMB = (endMemory.heapUsed - session.startMemory.heapUsed) / 1024 / 1024;

    return {
      executionTimeMs,
      memoryUsedMB,
      cpuUsagePercent,
      cacheHit: false, // Will be set by calling code
      strategy: AggregationStrategy.HYBRID, // Will be set by calling code
      indexesUsed: [], // Will be populated by database-specific implementation
      totalRows: Array.isArray(result) ? result.length : 1,
      optimizationLevel: QueryOptimizationLevel.BASIC,
    };
  }

  static analyzePerformance(metrics: QueryMetrics): string[] {
    const suggestions: string[] = [];

    if (metrics.executionTimeMs > 5000) {
      suggestions.push('Query execution time is high. Consider adding indexes or optimizing joins.');
    }

    if (metrics.memoryUsedMB > 100) {
      suggestions.push('Memory usage is high. Consider using streaming aggregation for large datasets.');
    }

    if (metrics.cpuUsagePercent > 80) {
      suggestions.push('CPU usage is high. Consider enabling parallel processing or reducing aggregation complexity.');
    }

    if (!metrics.cacheHit && metrics.executionTimeMs > 1000) {
      suggestions.push('Consider enabling query result caching for frequently accessed data.');
    }

    return suggestions;
  }
}

interface QuerySession {
  queryId: string;
  startTime: number;
  startCpu: NodeJS.CpuUsage;
  startMemory: NodeJS.MemoryUsage;
}
