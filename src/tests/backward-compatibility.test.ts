/**
 * Backward Compatibility Tests
 *
 * Ensures all breaking changes are avoided and existing APIs remain functional
 * Tests migration path from old response structure to new standardized format
 */

import { ResponseFactory } from "../core/response";
import { MongooseAggregateRepository } from "../repositories/mongoose-aggregate.repository";
import { Model, Document } from "mongoose";
import {
  ComplexQueryConfig,
  PaginatedResult,
} from "../repositories/base-aggregate.repository";

// Mock entity for testing
interface TestEntity extends Document {
  _id: string;
  name: string;
  status: string;
}

class TestBackwardCompatRepository extends MongooseAggregateRepository<TestEntity> {
  constructor(model: Model<TestEntity>) {
    super(model);
  }
}

describe("Backward Compatibility Tests", () => {
  let mockModel: jest.Mocked<Model<TestEntity>>;
  let repository: TestBackwardCompatRepository;

  beforeEach(() => {
    const mockPaginatedResult = [
      {
        data: [
          { _id: "1", name: "Test 1", status: "ACTIVE" },
          { _id: "2", name: "Test 2", status: "ACTIVE" },
        ],
        totalCount: [{ count: 2 }],
      },
    ];

    const mockExec = jest.fn().mockResolvedValue(mockPaginatedResult);
    const mockAggregate = jest.fn().mockReturnValue({ exec: mockExec });

    mockModel = {
      aggregate: mockAggregate,
      collection: { name: "test_entities" },
    } as any;

    repository = new TestBackwardCompatRepository(mockModel);
  });

  describe("Response Structure Backward Compatibility", () => {
    it("should auto-detect old pagination format and convert to new format", () => {
      // Old format - separate pagination object (deprecated but still supported)
      const oldFormatData = {
        data: [{ id: "1", name: "Test" }],
        pagination: {
          total: 100,
          page: 2,
          limit: 20,
          totalPages: 5,
          hasNext: true,
          hasPrev: true,
        },
      };

      const response = ResponseFactory.success(oldFormatData);

      // Should convert to new standardized format
      expect(response.success).toBe(true);
      expect((response.data as any).items).toEqual([{ id: "1", name: "Test" }]);
      expect((response.data as any).total).toBe(100);
      expect((response.data as any).page).toBe(2);
      expect((response.data as any).limit).toBe(20);
      expect((response.data as any).totalPages).toBe(5);
      expect((response.data as any).hasNext).toBe(true);
      expect((response.data as any).hasPrev).toBe(true);
    });

    it("should handle new items format correctly", () => {
      // New standardized format
      const newFormatData = {
        items: [{ id: "1", name: "Test" }],
        total: 50,
        page: 1,
        limit: 10,
      };

      const response = ResponseFactory.success(newFormatData);

      expect(response.success).toBe(true);
      expect((response.data as any).items).toEqual([{ id: "1", name: "Test" }]);
      expect((response.data as any).total).toBe(50);
      expect((response.data as any).totalPages).toBe(5);
    });

    it("should handle non-paginated data without modification", () => {
      const simpleData = {
        id: "1",
        name: "Test User",
        email: "test@example.com",
      };
      const response = ResponseFactory.success(simpleData);

      expect(response.success).toBe(true);
      expect(response.data).toEqual(simpleData);
      // Should not add pagination properties to non-paginated data
      expect((response.data as any).items).toBeUndefined();
      expect((response.data as any).total).toBeUndefined();
    });

    it("should preserve metadata from repository results", () => {
      const dataWithMetadata = {
        items: [{ id: "1" }],
        total: 1,
        page: 1,
        limit: 10,
        metadata: {
          queryTime: 45,
          searchAlgorithms: ["btree_index"],
          backendConditions: { status: "ACTIVE" },
        },
      };

      const response = ResponseFactory.success(dataWithMetadata);

      expect(response.metadata).toBeDefined();
      expect(response.metadata?.queryTime).toBe(45);
      expect(response.metadata?.searchAlgorithms).toEqual(["btree_index"]);
      expect(response.metadata?.backendConditions).toEqual({
        status: "ACTIVE",
      });
    });
  });

  describe("Repository Method Backward Compatibility", () => {
    it("should maintain original complexQuery method behavior", async () => {
      const config: ComplexQueryConfig = {
        conditions: { status: "ACTIVE" },
        joins: [
          {
            collection: "users",
            localField: "user_id",
            foreignField: "_id",
            as: "user",
          },
        ],
        aggregations: [
          {
            operation: "COUNT",
            field: "_id",
            alias: "total_count",
          },
        ],
        pagination: { page: 1, limit: 10 },
      };

      const result = await repository.complexQuery(config);

      // Original interface should be preserved
      expect(result).toHaveProperty("items");
      expect(result).toHaveProperty("total");
      expect(result).toHaveProperty("page");
      expect(result).toHaveProperty("limit");
      expect(result).toHaveProperty("totalPages");
      expect(result).toHaveProperty("hasNext");
      expect(result).toHaveProperty("hasPrev");

      // Should NOT have enhanced features in original method
      expect(result).not.toHaveProperty("metrics");
      expect(result).not.toHaveProperty("suggestions");
      expect(result).not.toHaveProperty("cacheInfo");
    });

    it("should maintain original aggregateWithPagination method behavior", async () => {
      const pipeline = [
        { $match: { status: "ACTIVE" } },
        {
          $lookup: {
            from: "users",
            localField: "user_id",
            foreignField: "_id",
            as: "user",
          },
        },
      ];
      const pagination = { page: 2, limit: 5 };

      const result = await repository.aggregateWithPagination(
        pipeline,
        pagination
      );

      expect(result).toHaveProperty("items");
      expect(result).toHaveProperty("total");
      expect(result.page).toBe(2);
      expect(result.limit).toBe(5);
      expect(typeof result.totalPages).toBe("number");
      expect(typeof result.hasNext).toBe("boolean");
      expect(typeof result.hasPrev).toBe("boolean");
    });

    it("should maintain original aggregate method behavior", async () => {
      const pipeline = [
        { $match: { status: "ACTIVE" } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ];

      const result = await repository.aggregate(pipeline);

      expect(Array.isArray(result)).toBe(true);
      expect(mockModel.aggregate).toHaveBeenCalledWith(
        pipeline,
        expect.any(Object)
      );
    });
  });

  describe("Type Safety Backward Compatibility", () => {
    it("should maintain PaginatedResult interface compatibility", () => {
      const result: PaginatedResult<TestEntity> = {
        items: [{ _id: "1", name: "Test", status: "ACTIVE" } as any],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      };

      // This should compile without errors
      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it("should maintain ComplexQueryConfig interface compatibility", () => {
      const config: ComplexQueryConfig = {
        conditions: { status: "ACTIVE" },
        joins: [
          {
            collection: "users",
            localField: "user_id",
            foreignField: "_id",
            as: "user",
          },
        ],
        aggregations: [
          {
            operation: "COUNT",
            field: "_id",
            alias: "count",
          },
        ],
        groupBy: ["status"],
        sort: { created_at: -1 },
        select: ["name", "status"],
        pagination: { page: 1, limit: 10 },
      };

      // This should compile without errors and work with original methods
      expect(config.conditions).toBeDefined();
      expect(config.joins).toHaveLength(1);
      expect(config.aggregations).toHaveLength(1);
    });
  });

  describe("Error Handling Backward Compatibility", () => {
    it("should maintain original error response format", () => {
      const errorResponse = ResponseFactory.error(
        "Validation failed",
        "Invalid user data",
        400
      );

      expect(errorResponse.success).toBe(false);
      expect(errorResponse.error).toBe("Validation failed");
      expect(errorResponse.message).toBe("Invalid user data");
      expect(errorResponse.status_code).toBe(400);
      expect(errorResponse.timestamp).toBeDefined();
      expect(errorResponse.trace_id).toBeDefined();
    });

    it("should handle repository errors without breaking existing error handling", async () => {
      const mockExecError = jest
        .fn()
        .mockRejectedValue(new Error("Database connection failed"));
      mockModel.aggregate.mockImplementationOnce(
        () =>
          ({
            exec: mockExecError,
          } as any)
      );

      const config: ComplexQueryConfig = {
        conditions: { status: "ACTIVE" },
      };

      await expect(repository.complexQuery(config)).rejects.toThrow(
        "Database connection failed"
      );
    });
  });

  describe("Export Compatibility", () => {
    it("should maintain all original exports", () => {
      // Test that we can import everything that was available before
      expect(ResponseFactory).toBeDefined();
      expect(MongooseAggregateRepository).toBeDefined();
      expect(typeof ResponseFactory.success).toBe("function");
      expect(typeof ResponseFactory.error).toBe("function");
      expect(typeof ResponseFactory.paginated).toBe("function");
    });
  });

  describe("Performance Backward Compatibility", () => {
    it("should not introduce performance regression in original methods", async () => {
      const startTime = Date.now();

      const config: ComplexQueryConfig = {
        conditions: { status: "ACTIVE" },
        pagination: { page: 1, limit: 10 },
      };

      await repository.complexQuery(config);

      const executionTime = Date.now() - startTime;

      // Should execute quickly (under 100ms for mocked calls)
      expect(executionTime).toBeLessThan(100);
    });
  });
});

describe("Migration Path Tests", () => {
  describe("Gradual Enhancement Adoption", () => {
    it("should allow gradual migration from old to new aggregation methods", async () => {
      const mockModel = {
        aggregate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue([
            {
              data: [{ _id: "1", name: "Test" }],
              totalCount: [{ count: 1 }],
            },
          ]),
        }),
        collection: { name: "test_entities" },
      } as any;

      const repository = new TestBackwardCompatRepository(mockModel);

      // Step 1: Use original method (still works)
      const oldResult = await repository.complexQuery({
        conditions: { status: "ACTIVE" },
        pagination: { page: 1, limit: 10 },
      });

      expect(oldResult).toHaveProperty("items");
      expect(oldResult).not.toHaveProperty("metrics");

      // Step 2: Can upgrade to enhanced repository later without breaking changes
      // (Enhanced repository extends the original, so all methods remain available)
    });
  });

  describe("Version Compatibility", () => {
    it("should work with existing package consumers", () => {
      // Simulate how existing consumers use the package
      const data = { items: [{ id: "1" }], total: 1, page: 1, limit: 10 };
      const response = ResponseFactory.success(data);

      // Existing consumers expect this structure
      expect(response.success).toBe(true);
      expect(response.data).toHaveProperty("items");
      expect(response.status_code).toBe(200);
      expect(response.timestamp).toBeDefined();
    });
  });
});
