/**
 * TypeORM Aggregate Repository Tests
 * 
 * Tests the SQL implementation of unified aggregation  
 * Validates query building, JOINs, aggregations, and pagination
 */

// import { Test, TestingModule } from '@nestjs/testing'; // Not needed for these tests
import { Repository, SelectQueryBuilder } from 'typeorm';
import { TypeORMAggregateRepository } from '../repositories/typeorm-aggregate.repository';
import { ComplexQueryConfig } from '../repositories/base-aggregate.repository';

// Mock entity for testing
class TestEntity {
  id: string = '';
  name: string = '';
  status: 'ACTIVE' | 'INACTIVE' = 'ACTIVE';
  business_id: string = '';
  created_at: Date = new Date();
}

// Test repository implementation
class TestTypeORMAggregateRepository extends TypeORMAggregateRepository<TestEntity> {
  constructor(repository: Repository<TestEntity>) {
    super(repository, TestEntity);
  }

  // Expose protected methods for testing
  public buildTypeORMQueryPublic(config: ComplexQueryConfig) {
    return this.buildTypeORMQuery(config);
  }

  public applyWhereConditionsPublic(qb: SelectQueryBuilder<TestEntity>, conditions: any) {
    return this.applyWhereConditions(qb, conditions);
  }

  public applyJoinPublic(qb: SelectQueryBuilder<TestEntity>, join: any, index: number) {
    return this.applyJoin(qb, join, index);
  }

  public applyAggregationsPublic(qb: SelectQueryBuilder<TestEntity>, aggregations: any[]) {
    return this.applyAggregations(qb, aggregations);
  }
}

describe('TypeORMAggregateRepository', () => {
  let repository: TestTypeORMAggregateRepository;
  let mockRepository: jest.Mocked<Repository<TestEntity>>;
  let mockQueryBuilder: jest.Mocked<SelectQueryBuilder<TestEntity>>;

  beforeEach(async () => {
    // Create mock query builder with all necessary methods
    mockQueryBuilder = {
      alias: 'testEntity',
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      leftJoin: jest.fn().mockReturnThis(),
      innerJoin: jest.fn().mockReturnThis(),
      rightJoin: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      addGroupBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue([]),
      getCount: jest.fn().mockResolvedValue(0),
      getSql: jest.fn().mockReturnValue('SELECT * FROM test_entity'),
    } as any;

    // Create mock repository
    mockRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
      metadata: { name: 'TestEntity' }
    } as any;

    repository = new TestTypeORMAggregateRepository(mockRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Query Building', () => {
    it('should build basic query with WHERE conditions', () => {
      const config: ComplexQueryConfig = {
        conditions: { status: 'ACTIVE', business_id: '123' }
      };

      const queryBuilder = repository.buildTypeORMQueryPublic(config);

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'testEntity.status = :condition_status_0',
        { condition_status_0: 'ACTIVE' }
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'testEntity.business_id = :condition_business_id_1',
        { condition_business_id_1: '123' }
      );
    });

    it('should build query with LEFT JOIN', () => {
      const config: ComplexQueryConfig = {
        conditions: { status: 'ACTIVE' },
        joins: [{
          table: 'businesses',
          localField: 'business_id',
          foreignField: 'id',
          as: 'business',
          type: 'LEFT'
        }]
      };

      const queryBuilder = repository.buildTypeORMQueryPublic(config);

      expect(mockQueryBuilder.leftJoin).toHaveBeenCalledWith(
        'businesses',
        'business',
        'testEntity.business_id = business.id'
      );
      expect(mockQueryBuilder.addSelect).toHaveBeenCalledWith('business.*');
    });

    it('should build query with INNER JOIN', () => {
      const config: ComplexQueryConfig = {
        joins: [{
          table: 'users',
          localField: 'user_id',
          foreignField: 'id',
          as: 'user',
          type: 'INNER'
        }]
      };

      repository.buildTypeORMQueryPublic(config);

      expect(mockQueryBuilder.innerJoin).toHaveBeenCalledWith(
        'users',
        'user',
        'testEntity.user_id = user.id'
      );
    });

    it('should build query with aggregations', () => {
      const config: ComplexQueryConfig = {
        aggregations: [
          { operation: 'COUNT', field: 'id', alias: 'total_count' },
          { operation: 'SUM', field: 'amount', alias: 'total_amount' },
          { operation: 'AVG', field: 'rating', alias: 'avg_rating' }
        ]
      };

      repository.buildTypeORMQueryPublic(config);

      expect(mockQueryBuilder.addSelect).toHaveBeenCalledWith('COUNT(testEntity.id) as total_count');
      expect(mockQueryBuilder.addSelect).toHaveBeenCalledWith('SUM(testEntity.amount) as total_amount');
      expect(mockQueryBuilder.addSelect).toHaveBeenCalledWith('AVG(testEntity.rating) as avg_rating');
    });

    it('should build query with conditional COUNT aggregation', () => {
      const config: ComplexQueryConfig = {
        aggregations: [
          { 
            operation: 'COUNT', 
            field: 'status', 
            alias: 'active_count', 
            conditions: { status: 'ACTIVE' } 
          }
        ]
      };

      repository.buildTypeORMQueryPublic(config);

      expect(mockQueryBuilder.addSelect).toHaveBeenCalledWith(
        "COUNT(CASE WHEN testEntity.status = 'ACTIVE' THEN 1 END) as active_count"
      );
    });

    it('should build query with GROUP BY', () => {
      const config: ComplexQueryConfig = {
        groupBy: ['status', 'business_id'],
        aggregations: [
          { operation: 'COUNT', field: 'id', alias: 'count_per_group' }
        ]
      };

      repository.buildTypeORMQueryPublic(config);

      expect(mockQueryBuilder.addGroupBy).toHaveBeenCalledWith('testEntity.status');
      expect(mockQueryBuilder.addGroupBy).toHaveBeenCalledWith('testEntity.business_id');
    });

    it('should build query with ORDER BY', () => {
      const config: ComplexQueryConfig = {
        sort: { created_at: 'DESC', name: 'ASC' }
      };

      repository.buildTypeORMQueryPublic(config);

      expect(mockQueryBuilder.addOrderBy).toHaveBeenCalledWith('testEntity.created_at', 'DESC');
      expect(mockQueryBuilder.addOrderBy).toHaveBeenCalledWith('testEntity.name', 'ASC');
    });

    it('should build query with field selection', () => {
      const config: ComplexQueryConfig = {
        select: ['id', 'name', 'status']
      };

      repository.buildTypeORMQueryPublic(config);

      expect(mockQueryBuilder.select).toHaveBeenCalledWith([
        'testEntity.id',
        'testEntity.name', 
        'testEntity.status'
      ]);
    });
  });

  describe('WHERE Conditions', () => {
    it('should apply single condition', () => {
      const conditions = { status: 'ACTIVE' };

      repository.applyWhereConditionsPublic(mockQueryBuilder, conditions);

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'testEntity.status = :condition_status_0',
        { condition_status_0: 'ACTIVE' }
      );
    });

    it('should apply multiple conditions with AND', () => {
      const conditions = { status: 'ACTIVE', business_id: '123' };

      repository.applyWhereConditionsPublic(mockQueryBuilder, conditions);

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'testEntity.status = :condition_status_0',
        { condition_status_0: 'ACTIVE' }
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'testEntity.business_id = :condition_business_id_1',
        { condition_business_id_1: '123' }
      );
    });

    it('should skip undefined values', () => {
      const conditions = { status: 'ACTIVE', business_id: undefined };

      repository.applyWhereConditionsPublic(mockQueryBuilder, conditions);

      expect(mockQueryBuilder.where).toHaveBeenCalledTimes(1);
      expect(mockQueryBuilder.andWhere).not.toHaveBeenCalled();
    });
  });

  describe('JOIN Operations', () => {
    it('should apply LEFT JOIN with default type', () => {
      const join = {
        table: 'businesses',
        localField: 'business_id',
        foreignField: 'id',
        as: 'business'
      };

      repository.applyJoinPublic(mockQueryBuilder, join, 0);

      expect(mockQueryBuilder.leftJoin).toHaveBeenCalledWith(
        'businesses',
        'business',
        'testEntity.business_id = business.id'
      );
    });

    it('should apply custom join condition', () => {
      const join = {
        table: 'user_roles',
        localField: 'user_id',
        foreignField: 'user_id',
        as: 'roles',
        condition: 'testEntity.user_id = roles.user_id AND roles.active = true'
      };

      repository.applyJoinPublic(mockQueryBuilder, join, 0);

      expect(mockQueryBuilder.leftJoin).toHaveBeenCalledWith(
        'user_roles',
        'roles',
        'testEntity.user_id = roles.user_id AND roles.active = true'
      );
    });

    it('should handle missing table name gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      const join = {
        localField: 'business_id',
        foreignField: 'id',
        as: 'business'
      };

      repository.applyJoinPublic(mockQueryBuilder, join, 0);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Join configuration missing table/collection name for alias: business'
      );
      expect(mockQueryBuilder.leftJoin).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('Aggregation Operations', () => {
    it('should handle all aggregation types', () => {
      const aggregations = [
        { operation: 'COUNT', field: 'id', alias: 'total_count' },
        { operation: 'SUM', field: 'amount', alias: 'total_amount' },
        { operation: 'AVG', field: 'rating', alias: 'avg_rating' },
        { operation: 'MIN', field: 'created_at', alias: 'first_created' },
        { operation: 'MAX', field: 'updated_at', alias: 'last_updated' },
        { operation: 'GROUP_CONCAT', field: 'tags', alias: 'all_tags' }
      ];

      repository.applyAggregationsPublic(mockQueryBuilder, aggregations);

      expect(mockQueryBuilder.addSelect).toHaveBeenCalledWith('COUNT(testEntity.id) as total_count');
      expect(mockQueryBuilder.addSelect).toHaveBeenCalledWith('SUM(testEntity.amount) as total_amount');
      expect(mockQueryBuilder.addSelect).toHaveBeenCalledWith('AVG(testEntity.rating) as avg_rating');
      expect(mockQueryBuilder.addSelect).toHaveBeenCalledWith('MIN(testEntity.created_at) as first_created');
      expect(mockQueryBuilder.addSelect).toHaveBeenCalledWith('MAX(testEntity.updated_at) as last_updated');
      expect(mockQueryBuilder.addSelect).toHaveBeenCalledWith("STRING_AGG(testEntity.tags, ',') as all_tags");
    });
  });

  describe('Query Execution', () => {
    it('should execute simple query', async () => {
      const mockResults = [
        { id: '1', name: 'Test 1', status: 'ACTIVE' },
        { id: '2', name: 'Test 2', status: 'INACTIVE' }
      ];
      mockQueryBuilder.getRawMany.mockResolvedValue(mockResults);

      const builder = (qb: SelectQueryBuilder<TestEntity>) => qb.where('status = :status', { status: 'ACTIVE' });
      const results = await repository.query(builder);

      expect(results).toEqual(mockResults);
      expect(mockQueryBuilder.getRawMany).toHaveBeenCalled();
    });

    it('should execute query with pagination', async () => {
      const mockItems = [
        { id: '1', name: 'Test 1', status: 'ACTIVE' }
      ];
      const mockTotal = 10;

      mockQueryBuilder.getRawMany.mockResolvedValue(mockItems);
      mockQueryBuilder.getCount.mockResolvedValue(mockTotal);

      const builder = (qb: SelectQueryBuilder<TestEntity>) => qb.where('status = :status', { status: 'ACTIVE' });
      const pagination = { page: 2, limit: 5 };

      const result = await repository.queryWithPagination(builder, pagination);

      expect(result).toEqual({
        items: mockItems,
        total: mockTotal,
        page: 2,
        limit: 5,
        totalPages: 2,
        hasNext: false,
        hasPrev: true
      });

      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(5); // (page - 1) * limit
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(5);
    });
  });

  describe('Complex Query Integration', () => {
    it('should execute complex query with all features', async () => {
      const mockItems = [
        {
          id: '1',
          name: 'Agent 1',
          status: 'ACTIVE',
          business_name: 'Hospital A',
          active_count: 5,
          total_amount: 1000
        }
      ];
      const mockTotal = 1;

      mockQueryBuilder.getRawMany.mockResolvedValue(mockItems);
      mockQueryBuilder.getCount.mockResolvedValue(mockTotal);

      const config: ComplexQueryConfig = {
        joins: [{
          table: 'businesses',
          localField: 'business_id',
          foreignField: 'id',
          as: 'business',
          type: 'LEFT'
        }],
        aggregations: [
          { operation: 'COUNT', field: 'status', alias: 'active_count', conditions: { status: 'ACTIVE' } },
          { operation: 'SUM', field: 'amount', alias: 'total_amount' }
        ],
        conditions: { business_id: 'b1' },
        sort: { created_at: 'DESC' },
        pagination: { page: 1, limit: 10 }
      };

      const result = await repository.complexQuery(config);

      expect(result.items).toEqual(mockItems);
      expect(result.total).toBe(mockTotal);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.totalPages).toBe(1);
      expect(result.hasNext).toBe(false);
      expect(result.hasPrev).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle query execution errors', async () => {
      const error = new Error('Query execution failed');
      mockQueryBuilder.getRawMany.mockRejectedValue(error);

      const builder = (qb: SelectQueryBuilder<TestEntity>) => qb;

      await expect(repository.query(builder)).rejects.toThrow('Query execution failed');
    });

    it('should handle pagination errors', async () => {
      const error = new Error('Pagination failed');
      mockQueryBuilder.getRawMany.mockRejectedValue(error);

      const builder = (qb: SelectQueryBuilder<TestEntity>) => qb;
      const pagination = { page: 1, limit: 10 };

      await expect(repository.queryWithPagination(builder, pagination)).rejects.toThrow('Pagination failed');
    });
  });

  describe('Performance Metrics', () => {
    it('should log performance metrics for successful queries', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      mockQueryBuilder.getRawMany.mockResolvedValue([]);

      const builder = (qb: SelectQueryBuilder<TestEntity>) => qb;
      await repository.query(builder);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Query: typeormQuery on TestEntity')
      );

      consoleSpy.mockRestore();
    });
  });
});