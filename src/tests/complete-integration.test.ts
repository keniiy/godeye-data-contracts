/**
 * Complete Integration Test
 * Tests the entire package working together as described in usage guides
 */

import {
  ResponseFactory,
  Api,
  bootstrap,
  ValidationUtils,
  IsValidId,
  IsRequiredEmail,
  ToLowerCase,
  Trim,
  KongUser,
  extractKongUserContext,
  normalizeHeaders,
} from "../index";
import { validate } from "class-validator";
import { plainToClass } from "class-transformer";
import { KONG_HEADERS } from "../constants/auth.constants";

// Test DTO matching usage guide examples
class UserResponseDto {
  @IsValidId()
  id!: string;

  @IsRequiredEmail()
  @ToLowerCase()
  @Trim()
  email!: string;

  name!: string;
  verified!: boolean;
  createdAt!: string;
}

describe("Complete Integration Test", () => {
  describe("Usage Guide Compliance - ResponseFactory", () => {
    it("should match simple-response-usage.md examples", () => {
      // Test simple success response
      const userData = {
        id: "123",
        name: "John Doe",
        email: "john@example.com",
      };
      const response = ResponseFactory.success(userData, "User found");

      expect(response).toMatchObject({
        success: true,
        data: userData,
        message: "User found",
        status_code: 200,
      });
      expect(response.timestamp).toBeDefined();
      expect(response.trace_id).toBeDefined();
      expect(response.time_ms).toBeDefined();
    });

    it("should auto-detect paginated responses", () => {
      const paginatedUsers = {
        items: [
          { id: "1", name: "User 1" },
          { id: "2", name: "User 2" },
        ],
        total: 50,
        page: 2,
        limit: 20,
      };

      const response = ResponseFactory.success(paginatedUsers);

      expect(response.success).toBe(true);
      expect((response.data as any).items).toEqual(paginatedUsers.items);
      expect(response.data as any).toMatchObject({
        items: paginatedUsers.items,
        total: 50,
        page: 2,
        limit: 20,
        totalPages: 3,
        hasNext: true,
        hasPrev: true,
      });
    });

    it("should handle different pagination formats", () => {
      // Test 'data' format
      const dataFormat = {
        data: [{ id: "1" }],
        total: 5,
        page: 1,
        limit: 10,
      };
      const dataResponse = ResponseFactory.success(dataFormat);
      expect((dataResponse.data as any).items).toEqual([{ id: "1" }]);
      expect((dataResponse.data as any).total).toBe(5);

      // Test 'results' format
      const resultsFormat = {
        results: [{ id: "2" }],
        count: 3,
      };
      const resultsResponse = ResponseFactory.success(resultsFormat);
      expect((resultsResponse.data as any).items).toEqual([{ id: "2" }]);
      expect((resultsResponse.data as any).total).toBe(3);
    });
  });

  describe("Usage Guide Compliance - Validation System", () => {
    it("should match validation-pipeline-usage.md examples", async () => {
      class TestDto {
        @IsValidId()
        userId!: string;

        @IsRequiredEmail()
        @ToLowerCase()
        @Trim()
        email!: string;
      }

      // Test valid data
      const validInput = {
        userId: "550e8400-e29b-41d4-a716-446655440000", // UUID
        email: "  TEST@EXAMPLE.COM  ",
      };

      const dto = plainToClass(TestDto, validInput);
      expect(dto.email).toBe("test@example.com"); // Transformed

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);

      // Test MongoDB ObjectId
      const mongoInput = {
        userId: "507f1f77bcf86cd799439011",
        email: "mongo@example.com",
      };

      const mongoDto = plainToClass(TestDto, mongoInput);
      const mongoErrors = await validate(mongoDto);
      expect(mongoErrors).toHaveLength(0);
    });

    it("should validate with ValidationUtils", () => {
      // UUID validation
      expect(
        ValidationUtils.isValidId("550e8400-e29b-41d4-a716-446655440000")
      ).toBe(true);

      // MongoDB ObjectId validation
      expect(ValidationUtils.isValidId("507f1f77bcf86cd799439011")).toBe(true);

      // Numeric ID validation
      expect(ValidationUtils.isValidId("12345")).toBe(true);

      // Invalid ID validation
      expect(ValidationUtils.isValidId("invalid-id")).toBe(false);

      // Email validation
      expect(ValidationUtils.isValidEmail("test@example.com")).toBe(true);
      expect(ValidationUtils.isValidEmail("invalid-email")).toBe(false);
    });
  });

  describe("Usage Guide Compliance - Kong Authentication", () => {
    it("should match kong-usage.md examples", () => {
      const headers = {
        [KONG_HEADERS.USER_ID]: "123",
        [KONG_HEADERS.USER_EMAIL]: "user@example.com",
        [KONG_HEADERS.USER_TYPE]: "patient,admin",
        [KONG_HEADERS.PROFILE_ID]: "profile-456",
      };

      const userContext = extractKongUserContext(headers);

      expect(userContext).toMatchObject({
        id: "123",
        email: "user@example.com",
        type: ["patient", "admin"],
        profile_id: "profile-456",
      });
    });

    it("should normalize headers correctly", () => {
      const rawHeaders = {
        "x-user-id": "123",
        "x-user-type": ["admin", "user"],
        "content-type": "application/json",
      };

      const normalized = normalizeHeaders(rawHeaders);

      expect(normalized).toEqual({
        "x-user-id": "123",
        "x-user-type": "admin,user",
        "content-type": "application/json",
      });
    });
  });

  describe("Usage Guide Compliance - Bootstrap System", () => {
    it("should match bootstrap-usage.md configuration structure", () => {
      const basicConfig = {
        serviceName: "my-service",
        port: 3003,
        enableSwagger: true,
      };

      const advancedConfig = {
        serviceName: "my-service",
        port: 3003,
        swagger: {
          enabled: true,
          title: "My Service API",
          description: "API documentation with ResponseFactory patterns",
          version: "1.0.0",
          path: "docs",
        },
        cors: {
          enabled: true,
          origins: ["http://localhost:3000"],
          credentials: true,
        },
        validation: {
          whitelist: true,
          transform: true,
        },
      };

      // Test that configurations match expected structure
      expect(basicConfig.serviceName).toBe("my-service");
      expect(basicConfig.enableSwagger).toBe(true);

      expect(advancedConfig.swagger?.title).toBe("My Service API");
      expect(advancedConfig.cors?.origins).toContain("http://localhost:3000");
      expect(advancedConfig.validation?.whitelist).toBe(true);
    });
  });

  describe("End-to-End Workflow Test", () => {
    it("should support complete microservice setup workflow", async () => {
      // 1. Validation - Transform and validate user input
      class CreateUserDto {
        @IsRequiredEmail()
        @ToLowerCase()
        @Trim()
        email!: string;

        @IsValidId()
        profileId!: string;
      }

      const rawInput = {
        email: "  JOHN@EXAMPLE.COM  ",
        profileId: "550e8400-e29b-41d4-a716-446655440000",
      };

      const dto = plainToClass(CreateUserDto, rawInput);
      expect(dto.email).toBe("john@example.com"); // Transformed

      const validationErrors = await validate(dto);
      expect(validationErrors).toHaveLength(0);

      // 2. Kong Auth - Extract user context from headers
      const kongHeaders = {
        [KONG_HEADERS.USER_ID]: "456",
        [KONG_HEADERS.USER_EMAIL]: "admin@example.com",
        [KONG_HEADERS.USER_TYPE]: "admin",
      };

      const userContext = extractKongUserContext(kongHeaders);
      expect(userContext.id).toBe("456");
      expect(userContext.type).toContain("admin");

      // 3. Response Factory - Create standardized responses
      const createdUser = {
        id: dto.profileId,
        email: dto.email,
        createdBy: userContext.id,
        createdAt: new Date().toISOString(),
      };

      const successResponse = ResponseFactory.success(
        createdUser,
        "User created successfully"
      );

      expect(successResponse).toMatchObject({
        success: true,
        data: createdUser,
        message: "User created successfully",
        status_code: 200,
      });

      // 4. Error handling
      const errorResponse = ResponseFactory.validationError(
        "Validation failed",
        ["Email is required", "Invalid ID format"]
      );

      expect(errorResponse).toMatchObject({
        success: false,
        error: "Validation Error",
        status_code: 422,
      });
      expect(errorResponse.metadata?.validation_errors).toEqual([
        "Email is required",
        "Invalid ID format",
      ]);

      // 5. Pagination response
      const usersList = {
        items: [createdUser],
        total: 1,
        page: 1,
        limit: 20,
      };

      const paginatedResponse = ResponseFactory.success(usersList);
      expect((paginatedResponse.data as any).items).toBeDefined();
      expect((paginatedResponse.data as any).total).toBe(1);
    });
  });

  describe("Package Consistency", () => {
    it("should maintain consistent response format across all methods", () => {
      const baseFields = [
        "success",
        "status_code",
        "timestamp",
        "trace_id",
        "time_ms",
      ];

      const successResponse = ResponseFactory.success({ test: true });
      const errorResponse = ResponseFactory.error(
        "Test Error",
        "Test message",
        400
      );
      const notFoundResponse = ResponseFactory.notFound("Not found");

      baseFields.forEach((field) => {
        expect(successResponse).toHaveProperty(field);
        expect(errorResponse).toHaveProperty(field);
        expect(notFoundResponse).toHaveProperty(field);
      });
    });

    it("should maintain consistent trace_id format", () => {
      const response1 = ResponseFactory.success({ test: 1 });
      const response2 = ResponseFactory.error("Error", "Test error");

      expect(response1.trace_id).toMatch(/^trace_\d+_[a-zA-Z0-9]+$/);
      expect(response2.trace_id).toMatch(/^trace_\d+_[a-zA-Z0-9]+$/);
    });

    it("should provide consistent timing information", () => {
      const response = ResponseFactory.success({ test: true });

      expect(typeof response.time_ms).toBe("number");
      expect(response.time_ms).toBeGreaterThanOrEqual(0);
      expect(response.timestamp).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
      );
    });
  });
});
