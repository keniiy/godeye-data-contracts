/**
 * Quick Validation Test - Backward Compatibility
 *
 * Simple test to validate that all changes are backward compatible
 */

import { ResponseFactory } from "../core/response";

describe("Quick Backward Compatibility Validation", () => {
  it("should handle old pagination format and convert to new structure", () => {
    // Test data in old format (what existing services might send)
    const oldFormatData = {
      data: [
        { id: "1", name: "John" },
        { id: "2", name: "Jane" },
      ],
      pagination: {
        total: 50,
        page: 2,
        limit: 10,
        totalPages: 5,
        hasNext: true,
        hasPrev: true,
      },
    };

    const response = ResponseFactory.success(oldFormatData);

    // Verify it converts to new standardized format
    expect(response.success).toBe(true);
    expect((response.data as any).items).toEqual([
      { id: "1", name: "John" },
      { id: "2", name: "Jane" },
    ]);
    expect((response.data as any).total).toBe(50);
    expect((response.data as any).page).toBe(2);
    expect((response.data as any).limit).toBe(10);
    expect((response.data as any).totalPages).toBe(5);
    expect((response.data as any).hasNext).toBe(true);
    expect((response.data as any).hasPrev).toBe(true);
  });

  it("should handle new items format correctly", () => {
    // Test data in new standardized format
    const newFormatData = {
      items: [{ id: "1", name: "Test" }],
      total: 25,
      page: 1,
      limit: 5,
    };

    const response = ResponseFactory.success(newFormatData);

    expect(response.success).toBe(true);
    expect((response.data as any).items).toEqual([{ id: "1", name: "Test" }]);
    expect((response.data as any).total).toBe(25);
    expect((response.data as any).totalPages).toBe(5);
    expect((response.data as any).hasNext).toBe(true);
    expect((response.data as any).hasPrev).toBe(false);
  });

  it("should not modify non-paginated data", () => {
    const simpleData = { id: "1", name: "Test User" };
    const response = ResponseFactory.success(simpleData);

    expect(response.success).toBe(true);
    expect(response.data).toEqual(simpleData);
    expect((response.data as any).items).toBeUndefined();
    expect((response.data as any).total).toBeUndefined();
  });

  it("should maintain error response format", () => {
    const errorResponse = ResponseFactory.error(
      "Validation failed",
      "Invalid input",
      400
    );

    expect(errorResponse.success).toBe(false);
    expect(errorResponse.error).toBe("Validation failed");
    expect(errorResponse.message).toBe("Invalid input");
    expect(errorResponse.status_code).toBe(400);
  });
});
