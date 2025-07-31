import {
  IResponse,
  IPagination,
  IResponseMetadata,
} from "../types/response.types";
import { buildBaseResponseMetadata, generateTraceId } from '../utils/response-builder.utils';

/**
 * ResponseFactory - Standardized response creation across all services
 *
 * This factory ensures consistent response format throughout the entire
 * microservices ecosystem while providing performance monitoring capabilities.
 */
export class ResponseFactory {
  /**
   * Create a successful response with auto-detection
   * Automatically detects if data is paginated and formats accordingly
   */
  static success<T>(
    data: T,
    message: string = "Operation successful",
    metadata?: Partial<IResponseMetadata>,
    start_time?: number
  ): IResponse<T> {
    // Auto-detect if this is paginated data
    if (this.isPaginatedData(data)) {
      const paginatedData = data as any;
      
      // Extract pagination data from various formats
      const { items, total, page, limit } = this.extractPaginationData(paginatedData);
      
      // Extract embedded metadata from repository result
      const embeddedMetadata = paginatedData.metadata || {};
      const combinedMetadata = { ...embeddedMetadata, ...metadata };
      
      return this.paginated(
        items,
        total,
        page,
        limit,
        message,
        combinedMetadata,
        start_time
      ) as IResponse<T>;
    }

    // Standard success response (single entity or array with embedded metadata)
    const baseMetadata = buildBaseResponseMetadata(start_time);
    
    // Extract embedded metadata for single entity results
    let embeddedMetadata = {};
    let actualData = data;
    if (data && typeof data === 'object' && 'data' in data && 'metadata' in data) {
      embeddedMetadata = (data as any).metadata || {};
      actualData = (data as any).data;
    } else if (data && typeof data === 'object' && 'metadata' in data && !('items' in data)) {
      // Handle case where metadata is at root level but not pagination
      embeddedMetadata = (data as any).metadata || {};
      const { metadata: _, ...dataWithoutMetadata } = data as any;
      actualData = dataWithoutMetadata;
    }
    
    const combinedMetadata = { ...embeddedMetadata, ...metadata };

    return {
      success: true,
      data: actualData,
      message,
      status_code: 200,
      ...baseMetadata,
      metadata: combinedMetadata,
    };
  }

  /**
   * Create a paginated response
   */
  static paginated<T>(
    items: T[],
    total: number,
    page: number,
    limit: number,
    message: string = "Data retrieved successfully",
    metadata?: Partial<IResponseMetadata>,
    start_time?: number
  ): IResponse<T[]> {
    const total_pages = Math.ceil(total / limit);
    const baseMetadata = buildBaseResponseMetadata(start_time);

    const pagination: IPagination = {
      total,
      page,
      limit,
      total_pages,
      has_next: page < total_pages,
      has_prev: page > 1,
    };

    return {
      success: true,
      data: items,
      message,
      status_code: 200,
      ...baseMetadata,
      pagination,
      metadata,
    };
  }

  /**
   * Create an error response
   */
  static error(
    error: string,
    message: string,
    status_code: number = 400,
    metadata?: Partial<IResponseMetadata>,
    start_time?: number
  ): IResponse<never> {
    const baseMetadata = buildBaseResponseMetadata(start_time);

    return {
      success: false,
      error,
      message,
      status_code,
      ...baseMetadata,
      metadata,
    };
  }

  // ============================================================================
  // COMMON ERROR TYPES - Convenient methods for standard HTTP errors
  // ============================================================================

  /**
   * 400 Bad Request
   */
  static badRequest(
    message: string,
    error: string = "Bad Request",
    metadata?: Partial<IResponseMetadata>,
    start_time?: number
  ): IResponse<never> {
    return this.error(error, message, 400, metadata, start_time);
  }

  /**
   * 401 Unauthorized
   */
  static unauthorized(
    message: string = "Unauthorized access",
    metadata?: Partial<IResponseMetadata>,
    start_time?: number
  ): IResponse<never> {
    return this.error("Unauthorized", message, 401, metadata, start_time);
  }

  /**
   * 403 Forbidden
   */
  static forbidden(
    message: string = "Access forbidden",
    metadata?: Partial<IResponseMetadata>,
    start_time?: number
  ): IResponse<never> {
    return this.error("Forbidden", message, 403, metadata, start_time);
  }

  /**
   * 404 Not Found
   */
  static notFound(
    message: string = "Resource not found",
    metadata?: Partial<IResponseMetadata>,
    start_time?: number
  ): IResponse<never> {
    return this.error("Not Found", message, 404, metadata, start_time);
  }

  /**
   * 422 Validation Error
   */
  static validationError(
    message: string,
    validation_errors: string[],
    metadata?: Partial<IResponseMetadata>,
    start_time?: number
  ): IResponse<never> {
    const enhanced_metadata = {
      ...metadata,
      validation_errors,
    };

    return this.error(
      "Validation Error",
      message,
      422,
      enhanced_metadata,
      start_time
    );
  }

  /**
   * 429 Rate Limited
   */
  static rateLimited(
    message: string = "Rate limit exceeded",
    rate_limit_remaining: number = 0,
    metadata?: Partial<IResponseMetadata>,
    start_time?: number
  ): IResponse<never> {
    const enhanced_metadata = {
      ...metadata,
      rate_limit_remaining,
    };

    return this.error(
      "Rate Limited",
      message,
      429,
      enhanced_metadata,
      start_time
    );
  }

  /**
   * 500 Internal Server Error
   */
  static serverError(
    message: string = "Internal server error",
    metadata?: Partial<IResponseMetadata>,
    start_time?: number
  ): IResponse<never> {
    return this.error(
      "Internal Server Error",
      message,
      500,
      metadata,
      start_time
    );
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Auto-detect if data is paginated by checking for various pagination formats
   * Supports multiple common pagination patterns
   */
  private static isPaginatedData(data: any): boolean {
    if (!data || typeof data !== 'object') return false;
    
    // Format 1: { items: [...], total: 50, page?: 1, limit?: 20 }
    if ('items' in data && 'total' in data && 
        Array.isArray(data.items) && typeof data.total === 'number') {
      return true;
    }
    
    // Format 2: { data: [...], total: 50, page?: 1, limit?: 20 }
    if ('data' in data && 'total' in data && 
        Array.isArray(data.data) && typeof data.total === 'number') {
      return true;
    }
    
    // Format 3: { results: [...], count: 50, page?: 1, limit?: 20 }
    if ('results' in data && 'count' in data && 
        Array.isArray(data.results) && typeof data.count === 'number') {
      return true;
    }
    
    // Format 4: { rows: [...], totalCount: 50, page?: 1, limit?: 20 }
    if ('rows' in data && 'totalCount' in data && 
        Array.isArray(data.rows) && typeof data.totalCount === 'number') {
      return true;
    }
    
    return false;
  }

  /**
   * Extract pagination data from various formats
   * Normalizes different pagination structures to standard format
   */
  private static extractPaginationData(data: any): {
    items: any[];
    total: number;
    page: number;
    limit: number;
  } {
    // Format 1: { items: [...], total: 50, page?: 1, limit?: 20 }
    if ('items' in data && 'total' in data) {
      return {
        items: data.items,
        total: data.total,
        page: data.page || 1,
        limit: data.limit || 20
      };
    }
    
    // Format 2: { data: [...], total: 50, page?: 1, limit?: 20 }
    if ('data' in data && 'total' in data) {
      return {
        items: data.data,
        total: data.total,
        page: data.page || 1,
        limit: data.limit || 20
      };
    }
    
    // Format 3: { results: [...], count: 50, page?: 1, limit?: 20 }
    if ('results' in data && 'count' in data) {
      return {
        items: data.results,
        total: data.count,
        page: data.page || 1,
        limit: data.limit || 20
      };
    }
    
    // Format 4: { rows: [...], totalCount: 50, page?: 1, limit?: 20 }
    if ('rows' in data && 'totalCount' in data) {
      return {
        items: data.rows,
        total: data.totalCount,
        page: data.page || 1,
        limit: data.limit || 20
      };
    }
    
    // Fallback (shouldn't happen if isPaginatedData works correctly)
    return {
      items: [],
      total: 0,
      page: 1,
      limit: 20
    };
  }

  /**
   * Get current system performance metrics
   * Call this to automatically populate performance metadata
   */
  static getPerformanceMetrics(): Partial<IResponseMetadata> {
    if (typeof process !== "undefined" && process.memoryUsage) {
      const memUsage = process.memoryUsage();
      const cpuUsage = process.cpuUsage ? process.cpuUsage() : null;

      return {
        heap_used_mb: Math.round((memUsage.heapUsed / 1024 / 1024) * 100) / 100,
        heap_total_mb:
          Math.round((memUsage.heapTotal / 1024 / 1024) * 100) / 100,
        memory_used_mb: Math.round((memUsage.rss / 1024 / 1024) * 100) / 100,
        // Note: CPU usage calculation would need additional implementation
        // for accurate real-time values
      };
    }

    return {};
  }

  /**
   * Create response with automatic performance monitoring
   */
  static successWithMetrics<T>(
    data: T,
    message: string = "Operation successful",
    custom_metadata?: Partial<IResponseMetadata>,
    start_time?: number
  ): IResponse<T> {
    const performance_metrics = this.getPerformanceMetrics();
    const metadata = { ...performance_metrics, ...custom_metadata };

    return this.success(data, message, metadata, start_time);
  }
}
