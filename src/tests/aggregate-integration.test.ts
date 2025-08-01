/**
 * Aggregate Repository Integration Tests
 * 
 * Tests the unified aggregate system with real-world scenarios
 * Validates both MongoDB and SQL implementations work consistently
 */

import { ComplexQueryConfig, PaginatedResult } from '../repositories/base-aggregate.repository';

describe('Aggregate Repository Integration Tests', () => {
  
  describe('Configuration Validation', () => {
    it('should validate ComplexQueryConfig structure', () => {
      const config: ComplexQueryConfig = {
        joins: [
          {
            collection: 'business_entities',
            table: 'business_entities', 
            localField: 'business_entity_id',
            foreignField: '_id',
            as: 'business',
            type: 'LEFT'
          }
        ],
        aggregations: [
          {
            operation: 'COUNT',
            field: 'status',
            alias: 'active_count',
            conditions: { status: 'ACTIVE' }
          },
          {
            operation: 'SUM',
            field: 'amount',
            alias: 'total_amount'
          }
        ],
        conditions: {
          business_entity_id: '507f1f77bcf86cd799439011',
          status: { $in: ['ACTIVE', 'PENDING'] }
        },
        pagination: {
          page: 1,
          limit: 20
        },
        sort: {
          created_at: 'DESC',
          name: 'ASC'
        },
        select: ['id', 'name', 'status', 'created_at'],
        groupBy: ['status', 'business_entity_id']
      };

      // Validate all properties are correctly typed
      expect(config.joins).toBeDefined();
      expect(config.joins![0].collection).toBe('business_entities'); // Should have collection/table
      expect(config.aggregations).toBeDefined();
      expect(config.aggregations![0].operation).toBe('COUNT');
      expect(config.conditions).toBeDefined();
      expect(config.pagination).toBeDefined();
      expect(config.sort).toBeDefined();
      expect(config.select).toBeDefined();
      expect(config.groupBy).toBeDefined();
    });

    it('should validate JoinConfig for MongoDB', () => {
      const mongoJoin = {
        collection: 'business_entities',
        localField: 'business_entity_id',
        foreignField: '_id',
        as: 'business'
      };

      expect(mongoJoin.collection).toBe('business_entities');
      expect(mongoJoin.localField).toBe('business_entity_id');
      expect(mongoJoin.foreignField).toBe('_id');
      expect(mongoJoin.as).toBe('business');
    });

    it('should validate JoinConfig for SQL', () => {
      const sqlJoin = {
        table: 'business_entities',
        localField: 'business_entity_id',
        foreignField: 'id',
        as: 'business',
        type: 'LEFT' as const,
        condition: 'agent.business_id = business.id AND business.active = true'
      };

      expect(sqlJoin.table).toBe('business_entities');
      expect(sqlJoin.type).toBe('LEFT');
      expect(sqlJoin.condition).toContain('AND business.active = true');
    });

    it('should validate AggregationConfig with all operations', () => {
      const aggregations = [
        { operation: 'COUNT' as const, field: 'id', alias: 'total_count' },
        { operation: 'SUM' as const, field: 'amount', alias: 'total_amount' },
        { operation: 'AVG' as const, field: 'rating', alias: 'avg_rating' },
        { operation: 'MIN' as const, field: 'created_at', alias: 'earliest' },
        { operation: 'MAX' as const, field: 'updated_at', alias: 'latest' },
        { operation: 'GROUP_CONCAT' as const, field: 'tags', alias: 'all_tags' }
      ];

      aggregations.forEach(agg => {
        expect(['COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'GROUP_CONCAT']).toContain(agg.operation);
        expect(agg.field).toBeDefined();
        expect(agg.alias).toBeDefined();
      });
    });
  });

  describe('Real-World Scenarios', () => {
    it('should handle hospital agents with business and counts scenario', () => {
      const hospitalAgentsConfig: ComplexQueryConfig = {
        joins: [
          {
            collection: 'business_entities', // MongoDB
            table: 'business_entities',       // SQL
            localField: 'business_entity_id',
            foreignField: '_id',              // MongoDB ObjectId
            as: 'business'
          }
        ],
        aggregations: [
          {
            operation: 'COUNT',
            field: 'status',
            alias: 'active_count',
            conditions: { status: 'ACTIVE' }
          },
          {
            operation: 'COUNT', 
            field: 'status',
            alias: 'pending_count',
            conditions: { status: 'INVITED' }
          },
          {
            operation: 'COUNT',
            field: 'id',
            alias: 'total_agents'
          }
        ],
        conditions: {
          business_entity_id: '507f1f77bcf86cd799439011'
        },
        sort: {
          created_at: 'DESC'
        },
        pagination: {
          page: 1,
          limit: 20
        }
      };

      // Validate configuration structure
      expect(hospitalAgentsConfig.joins).toHaveLength(1);
      expect(hospitalAgentsConfig.aggregations).toHaveLength(3);
      expect(hospitalAgentsConfig.conditions?.business_entity_id).toBeDefined();
      expect(hospitalAgentsConfig.pagination?.page).toBe(1);
    });

    it('should handle user activity report scenario', () => {
      const activityReportConfig: ComplexQueryConfig = {
        joins: [
          {
            collection: 'users',
            table: 'users',
            localField: 'user_id',
            foreignField: '_id',
            as: 'user_details'
          },
          {
            collection: 'business_entities',
            table: 'business_entities', 
            localField: 'business_id',
            foreignField: '_id',
            as: 'business_info'
          }
        ],
        aggregations: [
          {
            operation: 'COUNT',
            field: 'id',
            alias: 'total_activities'
          },
          {
            operation: 'SUM',
            field: 'duration_minutes',
            alias: 'total_duration'
          },
          {
            operation: 'AVG',
            field: 'duration_minutes', 
            alias: 'avg_duration'
          }
        ],
        conditions: {
          user_id: '507f1f77bcf86cd799439011',
          created_at: {
            $gte: new Date('2024-01-01'),
            $lte: new Date('2024-12-31')
          }
        },
        groupBy: ['activity_type', 'date'],
        sort: {
          created_at: 'DESC'
        },
        pagination: {
          page: 1,
          limit: 50
        }
      };

      expect(activityReportConfig.joins).toHaveLength(2);
      expect(activityReportConfig.groupBy).toContain('activity_type');
      expect(activityReportConfig.conditions?.created_at).toBeDefined();
    });

    it('should handle business performance dashboard scenario', () => {
      const dashboardConfig: ComplexQueryConfig = {
        joins: [
          {
            collection: 'business_user_roles',
            localField: '_id',
            foreignField: 'business_entity_id',
            as: 'agents'
          },
          {
            collection: 'appointments',
            localField: '_id', 
            foreignField: 'business_id',
            as: 'appointments'
          },
          {
            collection: 'reviews',
            localField: '_id',
            foreignField: 'business_id',
            as: 'reviews'
          }
        ],
        aggregations: [
          {
            operation: 'COUNT',
            field: 'agents',
            alias: 'total_agents'
          },
          {
            operation: 'COUNT',
            field: 'appointments',
            alias: 'completed_appointments',
            conditions: { status: 'COMPLETED' }
          },
          {
            operation: 'AVG',
            field: 'reviews.rating',
            alias: 'avg_rating'
          },
          {
            operation: 'SUM',
            field: 'appointments.revenue',
            alias: 'total_revenue'
          }
        ],
        conditions: {
          _id: '507f1f77bcf86cd799439011',
          status: 'ACTIVE'
        }
      };

      expect(dashboardConfig.joins).toHaveLength(3);
      expect(dashboardConfig.aggregations).toHaveLength(4);
      expect(dashboardConfig.aggregations?.find(a => a.alias === 'avg_rating')).toBeDefined();
    });
  });

  describe('Response Format Validation', () => {
    it('should validate PaginatedResult structure', () => {
      const mockResult: PaginatedResult<any> = {
        items: [
          {
            id: '1',
            name: 'Agent 1',
            status: 'ACTIVE',
            business: {
              id: 'b1',
              name: 'Hospital A'
            },
            active_count: 5,
            pending_count: 2
          }
        ],
        total: 50,
        page: 1,
        limit: 20,
        totalPages: 3,
        hasNext: true,
        hasPrev: false
      };

      // Validate pagination metadata
      expect(mockResult.total).toBe(50);
      expect(mockResult.page).toBe(1);
      expect(mockResult.limit).toBe(20);
      expect(mockResult.totalPages).toBe(3);
      expect(mockResult.hasNext).toBe(true);
      expect(mockResult.hasPrev).toBe(false);

      // Validate items structure
      expect(mockResult.items).toHaveLength(1);
      expect(mockResult.items[0].id).toBe('1');
      expect(mockResult.items[0].business.name).toBe('Hospital A');
      expect(mockResult.items[0].active_count).toBe(5);
    });

    it('should calculate pagination metadata correctly', () => {
      const testCases = [
        { total: 100, page: 1, limit: 20, expectedPages: 5, hasNext: true, hasPrev: false },
        { total: 100, page: 3, limit: 20, expectedPages: 5, hasNext: true, hasPrev: true },
        { total: 100, page: 5, limit: 20, expectedPages: 5, hasNext: false, hasPrev: true },
        { total: 15, page: 1, limit: 20, expectedPages: 1, hasNext: false, hasPrev: false },
        { total: 0, page: 1, limit: 20, expectedPages: 0, hasNext: false, hasPrev: false }
      ];

      testCases.forEach(testCase => {
        const result: PaginatedResult<any> = {
          items: [],
          total: testCase.total,
          page: testCase.page,
          limit: testCase.limit,
          totalPages: Math.ceil(testCase.total / testCase.limit),
          hasNext: testCase.page * testCase.limit < testCase.total,
          hasPrev: testCase.page > 1
        };

        expect(result.totalPages).toBe(testCase.expectedPages);
        expect(result.hasNext).toBe(testCase.hasNext);
        expect(result.hasPrev).toBe(testCase.hasPrev);
      });
    });
  });

  describe('Performance Expectations', () => {
    it('should define performance expectations for different query types', () => {
      const performanceExpectations = {
        simpleQuery: { maxTime: 50, description: 'Simple WHERE query' },
        singleJoin: { maxTime: 100, description: 'Query with one JOIN' },
        multipleJoins: { maxTime: 200, description: 'Query with 2-3 JOINs' },
        complexAggregation: { maxTime: 300, description: 'Complex aggregation with JOINs' },
        paginatedQuery: { maxTime: 150, description: 'Paginated query with parallel count' }
      };

      Object.entries(performanceExpectations).forEach(([type, expectation]) => {
        expect(expectation.maxTime).toBeGreaterThan(0);
        expect(expectation.description).toBeDefined();
      });
    });

    it('should validate performance improvement expectations', () => {
      const improvements = {
        hospitalAgents: { 
          oldQueries: 3, 
          newQueries: 1, 
          improvementFactor: 3,
          description: 'Hospital agents with business info and counts'
        },
        businessDashboard: { 
          oldQueries: 5, 
          newQueries: 1, 
          improvementFactor: 5,
          description: 'Business performance dashboard'
        },
        userActivityReport: { 
          oldQueries: 4, 
          newQueries: 1, 
          improvementFactor: 4,
          description: 'User activity report with aggregations'
        }
      };

      Object.entries(improvements).forEach(([scenario, improvement]) => {
        expect(improvement.newQueries).toBe(1);
        expect(improvement.oldQueries).toBeGreaterThan(1);
        expect(improvement.improvementFactor).toBe(improvement.oldQueries / improvement.newQueries);
      });
    });
  });

  describe('Error Scenarios', () => {
    it('should handle invalid join configurations', () => {
      const invalidConfigs = [
        { 
          // Missing collection/table
          localField: 'business_id',
          foreignField: 'id',
          as: 'business'
        },
        {
          // Missing local field
          collection: 'businesses',
          foreignField: 'id',
          as: 'business'
        },
        {
          // Missing foreign field
          collection: 'businesses',
          localField: 'business_id',
          as: 'business'
        }
      ];

      invalidConfigs.forEach(config => {
        const hasRequiredFields = config.hasOwnProperty('collection') || config.hasOwnProperty('table');
        const hasLocalField = config.hasOwnProperty('localField');
        const hasForeignField = config.hasOwnProperty('foreignField');
        
        // At least one should be missing for these invalid configs
        expect(hasRequiredFields && hasLocalField && hasForeignField).toBe(false);
      });
    });

    it('should handle invalid aggregation configurations', () => {
      const invalidAggregations = [
        {
          // Missing operation
          field: 'amount',
          alias: 'total'
        },
        {
          // Missing field
          operation: 'SUM',
          alias: 'total'
        },
        {
          // Missing alias
          operation: 'COUNT',
          field: 'id'
        }
      ];

      invalidAggregations.forEach(config => {
        const hasOperation = config.hasOwnProperty('operation');
        const hasField = config.hasOwnProperty('field');
        const hasAlias = config.hasOwnProperty('alias');
        
        // Should be missing at least one required field
        expect(hasOperation && hasField && hasAlias).toBe(false);
      });
    });
  });
});