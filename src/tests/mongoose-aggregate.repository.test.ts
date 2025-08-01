/**
 * Mongoose Aggregate Repository Tests
 * 
 * Tests the MongoDB implementation of unified aggregation
 * Validates pipeline building, aggregations, and pagination
 */

// import { Test, TestingModule } from '@nestjs/testing'; // Not needed for these tests
import { Model } from 'mongoose';
import { MongooseAggregateRepository } from '../repositories/mongoose-aggregate.repository';
import { ComplexQueryConfig } from '../repositories/base-aggregate.repository';

// Mock entity for testing - extends Document for Mongoose compatibility
import { Document as MongooseDocument } from 'mongoose';

interface TestEntity extends MongooseDocument {
  _id: string;
  name: string;
  status: 'ACTIVE' | 'INACTIVE';
  business_id: string;
  created_at: Date;
}

// Test repository implementation
class TestMongooseAggregateRepository extends MongooseAggregateRepository<TestEntity> {
  constructor(model: Model<TestEntity>) {
    super(model);
  }

  // Expose protected methods for testing
  public buildMongoosePipelinePublic(config: ComplexQueryConfig) {
    return this.buildMongoosePipeline(config);
  }

  public buildLookupStagePublic(join: any) {
    return this.buildLookupStage(join);
  }

  public buildGroupStagePublic(aggregations: any[], groupBy?: string[]) {
    return this.buildGroupStage(aggregations, groupBy);
  }
}

describe('MongooseAggregateRepository', () => {
  let repository: TestMongooseAggregateRepository;
  let mockModel: jest.Mocked<Model<TestEntity>>;
  let mockAggregate: jest.Mock;
  let mockExec: jest.Mock;

  beforeEach(async () => {
    // Create mock aggregation chain
    mockExec = jest.fn();
    mockAggregate = jest.fn().mockReturnValue({ exec: mockExec });

    // Create mock model
    mockModel = {
      aggregate: mockAggregate,
      collection: { name: 'test_entities' }
    } as any;

    repository = new TestMongooseAggregateRepository(mockModel);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Pipeline Building', () => {
    it('should build basic match pipeline', () => {
      const config: ComplexQueryConfig = {
        conditions: { status: 'ACTIVE', business_id: '123' }
      };

      const pipeline = repository.buildMongoosePipelinePublic(config);

      expect(pipeline).toEqual([
        { $match: { status: 'ACTIVE', business_id: '123' } }
      ]);
    });

    it('should build pipeline with joins (lookups)', () => {
      const config: ComplexQueryConfig = {
        conditions: { status: 'ACTIVE' },
        joins: [
          {
            collection: 'businesses',
            localField: 'business_id',
            foreignField: '_id',
            as: 'business'
          }
        ]
      };

      const pipeline = repository.buildMongoosePipelinePublic(config);

      expect(pipeline).toEqual([
        { $match: { status: 'ACTIVE' } },
        {
          $lookup: {
            from: 'businesses',
            localField: 'business_id',
            foreignField: '_id',
            as: 'business'
          }
        },
        {
          $unwind: {
            path: '$business',
            preserveNullAndEmptyArrays: true
          }
        }
      ]);
    });

    it('should build pipeline with aggregations', () => {
      const config: ComplexQueryConfig = {
        conditions: { business_id: '123' },
        aggregations: [
          { operation: 'COUNT', field: 'status', alias: 'active_count', conditions: { status: 'ACTIVE' } },
          { operation: 'SUM', field: 'amount', alias: 'total_amount' }
        ]
      };

      const pipeline = repository.buildMongoosePipelinePublic(config);

      expect(pipeline).toContainEqual({ $match: { business_id: '123' } });
      expect(pipeline).toContainEqual({
        $group: {
          _id: null,
          active_count: { $sum: { $cond: [{ $eq: ['$status', 'ACTIVE'] }, 1, 0] } },
          total_amount: { $sum: '$amount' }
        }
      });
    });

    it('should build pipeline with sorting', () => {
      const config: ComplexQueryConfig = {
        conditions: { status: 'ACTIVE' },
        sort: { created_at: 'DESC', name: 'ASC' }
      };

      const pipeline = repository.buildMongoosePipelinePublic(config);

      expect(pipeline).toContainEqual({
        $sort: { created_at: -1, name: 1 }
      });
    });

    it('should build pipeline with field selection', () => {
      const config: ComplexQueryConfig = {
        conditions: { status: 'ACTIVE' },
        select: ['name', 'status', 'created_at']
      };

      const pipeline = repository.buildMongoosePipelinePublic(config);

      expect(pipeline).toContainEqual({
        $project: { name: 1, status: 1, created_at: 1 }
      });
    });
  });

  describe('Lookup Stage Building', () => {
    it('should build correct lookup stage', () => {
      const join = {
        collection: 'businesses',
        localField: 'business_id',
        foreignField: '_id',
        as: 'business_data'
      };

      const lookupStage = repository.buildLookupStagePublic(join);

      expect(lookupStage).toEqual({
        $lookup: {
          from: 'businesses',
          localField: 'business_id',
          foreignField: '_id',
          as: 'business_data'
        }
      });
    });
  });

  describe('Group Stage Building', () => {
    it('should build group stage with simple count', () => {
      const aggregations = [
        { operation: 'COUNT', field: '*', alias: 'total_count' }
      ];

      const groupStage = repository.buildGroupStagePublic(aggregations);

      expect(groupStage).toEqual({
        $group: {
          _id: null,
          total_count: { $sum: 1 }
        }
      });
    });

    it('should build group stage with conditional count', () => {
      const aggregations = [
        { operation: 'COUNT', field: 'status', alias: 'active_count', conditions: { status: 'ACTIVE' } }
      ];

      const groupStage = repository.buildGroupStagePublic(aggregations);

      expect(groupStage).toEqual({
        $group: {
          _id: null,
          active_count: { $sum: { $cond: [{ $eq: ['$status', 'ACTIVE'] }, 1, 0] } }
        }
      });
    });

    it('should build group stage with multiple aggregations', () => {
      const aggregations = [
        { operation: 'COUNT', field: '*', alias: 'total_count' },
        { operation: 'SUM', field: 'amount', alias: 'total_amount' },
        { operation: 'AVG', field: 'rating', alias: 'avg_rating' },
        { operation: 'MIN', field: 'created_at', alias: 'first_created' },
        { operation: 'MAX', field: 'updated_at', alias: 'last_updated' }
      ];

      const groupStage = repository.buildGroupStagePublic(aggregations);

      expect(groupStage).toEqual({
        $group: {
          _id: null,
          total_count: { $sum: 1 },
          total_amount: { $sum: '$amount' },
          avg_rating: { $avg: '$rating' },
          first_created: { $min: '$created_at' },
          last_updated: { $max: '$updated_at' }
        }
      });
    });

    it('should build group stage with group by fields', () => {
      const aggregations = [
        { operation: 'COUNT', field: '*', alias: 'count_per_status' }
      ];
      const groupBy = ['status', 'business_id'];

      const groupStage = repository.buildGroupStagePublic(aggregations, groupBy);

      expect(groupStage).toEqual({
        $group: {
          _id: { status: '$status', business_id: '$business_id' },
          count_per_status: { $sum: 1 }
        }
      });
    });
  });

  describe('Aggregate Execution', () => {
    it('should execute simple aggregation', async () => {
      const mockResults = [
        { _id: '1', name: 'Test 1', status: 'ACTIVE' },
        { _id: '2', name: 'Test 2', status: 'INACTIVE' }
      ];
      mockExec.mockResolvedValue(mockResults);

      const pipeline = [{ $match: { status: 'ACTIVE' } }];
      const results = await repository.aggregate(pipeline);

      expect(mockModel.aggregate).toHaveBeenCalledWith(pipeline, {
        allowDiskUse: true,
        maxTimeMS: 30000
      });
      expect(results).toEqual(mockResults);
    });

    it('should execute aggregation with pagination', async () => {
      const mockResults = [{
        data: [
          { _id: '1', name: 'Test 1', status: 'ACTIVE' },
          { _id: '2', name: 'Test 2', status: 'ACTIVE' }
        ],
        totalCount: [{ count: 10 }]
      }];
      mockExec.mockResolvedValue(mockResults);

      const pipeline = [{ $match: { status: 'ACTIVE' } }];
      const pagination = { page: 1, limit: 2 };
      
      const result = await repository.aggregateWithPagination(pipeline, pagination);

      expect(result).toEqual({
        items: mockResults[0].data,
        total: 10,
        page: 1,
        limit: 2,
        totalPages: 5,
        hasNext: true,
        hasPrev: false
      });

      // Verify the pagination pipeline structure
      const calledPipeline = mockModel.aggregate.mock.calls[0][0];
      expect(calledPipeline).toContainEqual({ $match: { status: 'ACTIVE' } });
      expect(calledPipeline).toContainEqual({
        $facet: {
          data: [{ $skip: 0 }, { $limit: 2 }],
          totalCount: [{ $count: 'count' }]
        }
      });
    });
  });

  describe('Complex Query Integration', () => {
    it('should execute complex query with all features', async () => {
      const mockResults = [{
        data: [
          {
            _id: '1',
            name: 'Agent 1',
            status: 'ACTIVE',
            business: { _id: 'b1', name: 'Hospital A' },
            active_count: 5,
            pending_count: 2
          }
        ],
        totalCount: [{ count: 1 }]
      }];
      mockExec.mockResolvedValue(mockResults);

      const config: ComplexQueryConfig = {
        joins: [{
          collection: 'businesses',
          localField: 'business_id',
          foreignField: '_id',
          as: 'business'
        }],
        aggregations: [
          { operation: 'COUNT', field: 'status', alias: 'active_count', conditions: { status: 'ACTIVE' } },
          { operation: 'COUNT', field: 'status', alias: 'pending_count', conditions: { status: 'PENDING' } }
        ],
        conditions: { business_id: 'b1' },
        sort: { created_at: 'DESC' },
        pagination: { page: 1, limit: 10 }
      };

      const result = await repository.complexQuery(config);

      expect(result.items).toEqual(mockResults[0].data);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
    });
  });

  describe('Error Handling', () => {
    it('should handle aggregation errors gracefully', async () => {
      const error = new Error('Aggregation failed');
      mockExec.mockRejectedValue(error);

      const pipeline = [{ $match: { status: 'ACTIVE' } }];

      await expect(repository.aggregate(pipeline)).rejects.toThrow('Aggregation failed');
    });

    it('should handle pagination errors gracefully', async () => {
      const error = new Error('Pagination failed');
      mockExec.mockRejectedValue(error);

      const pipeline = [{ $match: { status: 'ACTIVE' } }];
      const pagination = { page: 1, limit: 10 };

      await expect(repository.aggregateWithPagination(pipeline, pagination)).rejects.toThrow('Pagination failed');
    });
  });

  describe('Performance Metrics', () => {
    it('should log performance metrics for successful queries', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      mockExec.mockResolvedValue([]);

      const pipeline = [{ $match: { status: 'ACTIVE' } }];
      await repository.aggregate(pipeline);

      // Should log performance metrics in development
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('MongoDB Query: mongooseAggregate on test_entities')
      );

      consoleSpy.mockRestore();
    });
  });
});