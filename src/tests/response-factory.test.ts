/**
 * ResponseFactory Tests
 * Tests the response factory functionality including auto-detection
 */

import { ResponseFactory } from "../core/response";
import { IResponse } from "../types/response.types";

describe("ResponseFactory", () => {
  describe("success method", () => {
    it("should create a standard success response", () => {
      const data = { id: "1", name: "Test User" };
      const response = ResponseFactory.success(data, "User found");

      expect(response.success).toBe(true);
      expect(response.data).toEqual(data);
      expect(response.message).toBe("User found");
      expect(response.status_code).toBe(200);
      expect(response.timestamp).toBeDefined();
      expect(response.trace_id).toBeDefined();
    });

    it("should auto-detect paginated data (items format)", () => {
      const paginatedData = {
        items: [{ id: "1" }, { id: "2" }],
        total: 2,
        page: 1,
        limit: 10,
      };

      const response = ResponseFactory.success(paginatedData);

      expect(response.success).toBe(true);
      expect((response.data as any).items).toEqual([{ id: "1" }, { id: "2" }]);
      expect((response.data as any).total).toBe(2);
      expect((response.data as any).page).toBe(1);
      expect((response.data as any).limit).toBe(10);
      expect((response.data as any).totalPages).toBe(1);
      expect((response.data as any).hasNext).toBe(false);
      expect((response.data as any).hasPrev).toBe(false);
    });

    it("should auto-detect paginated data (data format)", () => {
      const paginatedData = {
        data: [{ id: "1" }, { id: "2" }],
        total: 5,
        page: 2,
        limit: 2,
      };

      const response = ResponseFactory.success(paginatedData);

      expect((response.data as any).items).toEqual([{ id: "1" }, { id: "2" }]);
      expect((response.data as any).total).toBe(5);
      expect((response.data as any).page).toBe(2);
      expect((response.data as any).limit).toBe(2);
      expect((response.data as any).totalPages).toBe(3);
      expect((response.data as any).hasNext).toBe(true);
      expect((response.data as any).hasPrev).toBe(true);
    });

    it("should auto-detect paginated data (results format)", () => {
      const paginatedData = {
        results: [{ id: "1" }],
        count: 1,
      };

      const response = ResponseFactory.success(paginatedData);

      expect((response.data as any).items).toEqual([{ id: "1" }]);
      expect((response.data as any).total).toBe(1);
      expect((response.data as any).page).toBe(1);
      expect((response.data as any).limit).toBe(20);
      expect((response.data as any).totalPages).toBe(1);
      expect((response.data as any).hasNext).toBe(false);
      expect((response.data as any).hasPrev).toBe(false);
    });

    it("should handle non-paginated data correctly", () => {
      const regularData = { id: "1", name: "Test" };
      const response = ResponseFactory.success(regularData);

      expect(response.data).toEqual(regularData);
      // Non-paginated data shouldn't have pagination properties in data
    });
  });

  describe("paginated method", () => {
    it("should create paginated response correctly", () => {
      const items = [{ id: "1" }, { id: "2" }];
      const response = ResponseFactory.paginated(items, 10, 2, 5);

      expect(response.success).toBe(true);
      expect((response.data as any).items).toEqual(items);
      expect((response.data as any).total).toBe(10);
      expect((response.data as any).page).toBe(2);
      expect((response.data as any).limit).toBe(5);
      expect((response.data as any).totalPages).toBe(2);
      expect((response.data as any).hasNext).toBe(false);
      expect((response.data as any).hasPrev).toBe(true);
    });
  });

  describe("error methods", () => {
    it("should create error response", () => {
      const response = ResponseFactory.error(
        "Not Found",
        "User not found",
        404
      );

      expect(response.success).toBe(false);
      expect(response.error).toBe("Not Found");
      expect(response.message).toBe("User not found");
      expect(response.status_code).toBe(404);
    });

    it("should create notFound response", () => {
      const response = ResponseFactory.notFound("User not found");

      expect(response.success).toBe(false);
      expect(response.error).toBe("Not Found");
      expect(response.message).toBe("User not found");
      expect(response.status_code).toBe(404);
    });

    it("should create validationError response", () => {
      const errors = ["Email is required", "Phone is invalid"];
      const response = ResponseFactory.validationError(
        "Validation failed",
        errors
      );

      expect(response.success).toBe(false);
      expect(response.error).toBe("Validation Error");
      expect(response.status_code).toBe(422);
      expect(response.metadata?.validation_errors).toEqual(errors);
    });

    it("should create serverError response", () => {
      const response = ResponseFactory.serverError("Something went wrong");

      expect(response.success).toBe(false);
      expect(response.error).toBe("Internal Server Error");
      expect(response.message).toBe("Something went wrong");
      expect(response.status_code).toBe(500);
    });
  });

  describe("utility methods", () => {
    it("should get performance metrics", () => {
      const metrics = ResponseFactory.getPerformanceMetrics();

      if (
        typeof process !== "undefined" &&
        typeof process.memoryUsage === "function"
      ) {
        expect(metrics.heap_used_mb).toBeDefined();
        expect(metrics.heap_total_mb).toBeDefined();
        expect(metrics.memory_used_mb).toBeDefined();
      } else {
        expect(metrics).toEqual({});
      }
    });

    it("should create success response with metrics", () => {
      const data = { id: "1" };
      const response = ResponseFactory.successWithMetrics(data, "Success");

      expect(response.success).toBe(true);
      expect(response.data).toEqual(data);
      expect(response.message).toBe("Success");

      // Performance metrics should be included
      if (
        typeof process !== "undefined" &&
        typeof process.memoryUsage === "function"
      ) {
        expect(response.metadata?.heap_used_mb).toBeDefined();
      }
    });
  });

  describe("Integration with Repository Results - WhereConfig Pattern", () => {
    it("should handle repository pagination result", () => {
      // Mock repository result with metadata (from our new pattern)
      const repositoryResult = {
        items: [
          { id: "user123", firstName: "Kenny", email: "kenny@test.com" },
          { id: "user124", firstName: "John", email: "john@test.com" },
        ],
        total: 147,
        page: 2,
        limit: 50,
        totalPages: 3,
        hasNext: true,
        hasPrev: true,
        metadata: {
          queryTime: "34ms",
          searchAlgorithms: ["fuzzy", "exact"],
          backendConditions: ["status", "isDeleted", "isVerified"],
          relationsLoaded: ["profile", "business.owner"],
          relationErrors: [],
        },
      };

      const response = ResponseFactory.success(repositoryResult);

      expect(response.success).toBe(true);
      expect(response.data).toBeDefined();
      expect(response.metadata).toBeDefined();
    });

    it("should handle single entity result with metadata", () => {
      const repositoryResult = {
        data: {
          id: "user123",
          firstName: "Kenny",
          profile: { bio: "Developer..." },
        },
        metadata: {
          queryTime: "12ms",
          backendConditions: ["status", "isDeleted"],
          relationsLoaded: ["profile"],
        },
      };

      const response = ResponseFactory.success(repositoryResult);

      expect(response.success).toBe(true);
      expect(response.data).toBeDefined();
      expect(response.metadata).toBeDefined();
    });

    it("should handle array result with metadata", () => {
      const repositoryResult = {
        items: [
          { id: "user123", firstName: "John" },
          { id: "user124", firstName: "Jane" },
        ],
        metadata: {
          queryTime: "18ms",
          searchAlgorithms: ["fuzzy"],
          relationsLoaded: ["profile"],
        },
      };

      const response = ResponseFactory.success(repositoryResult);

      expect(response.success).toBe(true);
      expect(response.data).toBeDefined();
      expect(response.metadata).toBeDefined();
    });

    it("should handle relation errors gracefully in metadata", () => {
      const repositoryResult = {
        items: [{ id: "user123", firstName: "Kenny" }],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
        metadata: {
          queryTime: "25ms",
          searchAlgorithms: ["fuzzy"],
          backendConditions: ["status"],
          relationsLoaded: ["profile"],
          relationErrors: [
            {
              relation: "business.owner",
              error: "Referenced user not found",
              severity: "warning",
            },
          ],
        },
      };

      const response = ResponseFactory.success(repositoryResult);

      expect(response.success).toBe(true);
      expect(response.data).toBeDefined();
      expect(response.metadata).toBeDefined();
    });
  });
});
