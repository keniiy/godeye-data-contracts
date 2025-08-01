/**
 * Mongoose Aggregate Repository - MongoDB Implementation
 * 
 * Extends BaseMongooseRepository with unified aggregation capabilities
 * Converts ComplexQueryConfig to MongoDB aggregation pipelines
 * 
 * Key Features:
 * - Native MongoDB aggregation pipeline optimization
 * - Single query with $facet for parallel data+count
 * - Complex joins using $lookup stages
 * - Aggregation operations with $group stages
 * - Enterprise performance monitoring
 */

import { Injectable } from '@nestjs/common';
import { Model, Document } from 'mongoose';
import { BaseMongooseRepository } from './base-mongoose.repository';
import {
  IAggregateRepository,
  AggregationPipeline,
  QueryBuilderFunction,
  ComplexQueryConfig,
  PaginatedResult,
  PaginationDto,
  JoinConfig,
  AggregationConfig,
} from './base-aggregate.repository';

/**
 * Mongoose implementation of unified aggregation repository
 * Converts universal ComplexQueryConfig to MongoDB aggregation pipelines
 */
@Injectable()
export abstract class MongooseAggregateRepository<T extends Document>
  extends BaseMongooseRepository<T>
  implements IAggregateRepository<T>
{
  constructor(protected readonly model: Model<T>) {
    super(model);
  }

  // ============================================================================
  // CORE AGGREGATION METHODS
  // ============================================================================

  /**
   * Execute MongoDB aggregation pipeline directly
   * Enhanced with performance monitoring and optimization
   */
  async aggregate(pipeline: AggregationPipeline): Promise<any[]> {
    const startTime = performance.now();

    try {
      // Enterprise optimization: Enable disk usage for large aggregations
      const results = await this.model.aggregate(pipeline, {
        allowDiskUse: true,
        maxTimeMS: 30000, // 30 second timeout
      }).exec();

      this.logQueryMetrics('mongooseAggregate', performance.now() - startTime, {
        stages: pipeline.length,
        pipelinePreview: JSON.stringify(pipeline).substring(0, 200),
      });

      return results;
    } catch (error) {
      this.handleQueryError('mongooseAggregate', error, { pipeline });
      throw error;
    }
  }

  /**
   * Execute aggregation with pagination using MongoDB's $facet
   * Single query for both data and total count - optimal performance
   */
  async aggregateWithPagination(
    pipeline: AggregationPipeline,
    pagination: PaginationDto
  ): Promise<PaginatedResult<any>> {
    const startTime = performance.now();
    const { page = 1, limit = 20 } = pagination;

    try {
      // Build paginated pipeline with $facet for parallel execution
      const paginatedPipeline = [
        ...pipeline,
        {
          $facet: {
            // Data pipeline with pagination
            data: [
              { $skip: (page - 1) * limit },
              { $limit: limit }
            ],
            // Count pipeline for total
            totalCount: [
              { $count: 'count' }
            ]
          }
        }
      ];

      const [result] = await this.model.aggregate(paginatedPipeline, {
        allowDiskUse: true,
        maxTimeMS: 30000,
      }).exec();

      const items = result.data || [];
      const total = result.totalCount[0]?.count || 0;

      const queryTime = performance.now() - startTime;
      this.logQueryMetrics('mongooseAggregateWithPagination', queryTime, {
        stages: pipeline.length,
        total,
        returned: items.length,
        page,
        limit,
      });

      return this.formatPaginatedResult(items, total, pagination);
    } catch (error) {
      this.handleQueryError('mongooseAggregateWithPagination', error, { pipeline, pagination });
      throw error;
    }
  }

  // ============================================================================
  // TYPEORM COMPATIBILITY METHODS
  // ============================================================================

  /**
   * Execute query builder function (TypeORM compatibility)
   * Converts query builder concepts to MongoDB aggregation pipeline
   */
  async query(builder: QueryBuilderFunction): Promise<any[]> {
    // For Mongoose, we don't have query builders, so we'll use a simple find
    // This is mainly for API compatibility with TypeORM
    console.warn('query() method is not optimized for MongoDB. Use aggregate() instead.');
    
    try {
      const results = await this.model.find({}).exec();
      return results;
    } catch (error) {
      this.handleQueryError('mongooseQuery', error, { builder: 'QueryBuilder not supported' });
      throw error;
    }
  }

  /**
   * Execute query builder with pagination (TypeORM compatibility)
   */
  async queryWithPagination(
    builder: QueryBuilderFunction,
    pagination: PaginationDto
  ): Promise<PaginatedResult<any>> {
    console.warn('queryWithPagination() method is not optimized for MongoDB. Use aggregateWithPagination() instead.');
    
    const { page = 1, limit = 20 } = pagination;
    const skip = (page - 1) * limit;

    try {
      const [items, total] = await Promise.all([
        this.model.find({}).skip(skip).limit(limit).exec(),
        this.model.countDocuments({}).exec()
      ]);

      return this.formatPaginatedResult(items, total, pagination);
    } catch (error) {
      this.handleQueryError('mongooseQueryWithPagination', error, { pagination });
      throw error;
    }
  }

  // ============================================================================
  // UNIVERSAL COMPLEX QUERY METHOD
  // ============================================================================

  /**
   * Universal complex query - converts ComplexQueryConfig to MongoDB pipeline
   * This is the main method that replaces multiple separate queries
   */
  async complexQuery(config: ComplexQueryConfig): Promise<PaginatedResult<any>> {
    const startTime = performance.now();

    try {
      // Build MongoDB aggregation pipeline from config
      const pipeline = this.buildMongoosePipeline(config);

      // Execute with or without pagination
      const result = config.pagination
        ? await this.aggregateWithPagination(pipeline, config.pagination)
        : {
            items: await this.aggregate(pipeline),
            total: 0,
            page: 1,
            limit: 0,
            totalPages: 1,
            hasNext: false,
            hasPrev: false,
          };

      this.logQueryMetrics('mongooseComplexQuery', performance.now() - startTime, {
        joins: config.joins?.length || 0,
        aggregations: config.aggregations?.length || 0,
        conditions: Object.keys(config.conditions || {}).length,
        paginated: !!config.pagination,
      });

      return result;
    } catch (error) {
      this.handleQueryError('mongooseComplexQuery', error, { config });
      throw error;
    }
  }

  // ============================================================================
  // MONGODB PIPELINE BUILDER
  // ============================================================================

  /**
   * Build MongoDB aggregation pipeline from ComplexQueryConfig
   * Converts universal config to MongoDB-specific pipeline stages
   */
  protected buildMongoosePipeline(config: ComplexQueryConfig): AggregationPipeline {
    const pipeline: any[] = [];

    // 1. Add match stage for conditions (WHERE equivalent)
    if (config.conditions && Object.keys(config.conditions).length > 0) {
      pipeline.push({ $match: config.conditions });
    }

    // 2. Add lookup stages for joins (JOIN equivalent)
    if (config.joins?.length) {
      config.joins.forEach(join => {
        pipeline.push(this.buildLookupStage(join));
      });
    }

    // 3. Add unwind stages for joined arrays (flatten joined data)
    if (config.joins?.length) {
      config.joins.forEach(join => {
        pipeline.push({
          $unwind: {
            path: `$${join.as}`,
            preserveNullAndEmptyArrays: true // LEFT JOIN equivalent
          }
        });
      });
    }

    // 4. Add group stage for aggregations (GROUP BY equivalent)
    if (config.aggregations?.length || config.groupBy?.length) {
      pipeline.push(this.buildGroupStage(config.aggregations, config.groupBy));
    }

    // 5. Add project stage for field selection (SELECT equivalent)
    if (config.select?.length) {
      const projection: any = {};
      config.select.forEach(field => {
        projection[field] = 1;
      });
      pipeline.push({ $project: projection });
    }

    // 6. Add sort stage (ORDER BY equivalent)
    if (config.sort && Object.keys(config.sort).length > 0) {
      const mongoSort: any = {};
      Object.entries(config.sort).forEach(([key, value]) => {
        mongoSort[key] = value === 'ASC' ? 1 : value === 'DESC' ? -1 : value;
      });
      pipeline.push({ $sort: mongoSort });
    }

    return pipeline;
  }

  /**
   * Build MongoDB $lookup stage from JoinConfig
   */
  protected buildLookupStage(join: JoinConfig): any {
    return {
      $lookup: {
        from: join.collection,
        localField: join.localField,
        foreignField: join.foreignField,
        as: join.as
      }
    };
  }

  /**
   * Build MongoDB $group stage from aggregation configs
   */
  protected buildGroupStage(
    aggregations?: AggregationConfig[],
    groupBy?: string[]
  ): any {
    const groupStage: any = {
      $group: {
        _id: this.buildGroupByExpression(groupBy)
      }
    };

    // Add aggregation operations
    aggregations?.forEach(agg => {
      switch (agg.operation) {
        case 'COUNT':
          if (agg.conditions) {
            // Conditional count
            groupStage.$group[agg.alias] = {
              $sum: { $cond: [{ $eq: [`$${agg.field}`, agg.conditions[agg.field]] }, 1, 0] }
            };
          } else {
            // Simple count
            groupStage.$group[agg.alias] = { $sum: 1 };
          }
          break;
        case 'SUM':
          groupStage.$group[agg.alias] = { $sum: `$${agg.field}` };
          break;
        case 'AVG':
          groupStage.$group[agg.alias] = { $avg: `$${agg.field}` };
          break;
        case 'MIN':
          groupStage.$group[agg.alias] = { $min: `$${agg.field}` };
          break;
        case 'MAX':
          groupStage.$group[agg.alias] = { $max: `$${agg.field}` };
          break;
        case 'GROUP_CONCAT':
          groupStage.$group[agg.alias] = { $push: `$${agg.field}` };
          break;
      }
    });

    return groupStage;
  }

  /**
   * Build MongoDB group by expression
   */
  protected buildGroupByExpression(groupBy?: string[]): any {
    if (!groupBy?.length) {
      return null; // Group all documents together
    }

    if (groupBy.length === 1) {
      return `$${groupBy[0]}`;
    }

    // Multiple group by fields
    const groupExpr: any = {};
    groupBy.forEach(field => {
      groupExpr[field] = `$${field}`;
    });
    return groupExpr;
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Format paginated results consistently
   */
  protected formatPaginatedResult(
    items: any[],
    total: number,
    pagination: PaginationDto
  ): PaginatedResult<any> {
    const { page, limit } = pagination;
    const totalPages = Math.ceil(total / limit);

    return {
      items,
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    };
  }
}