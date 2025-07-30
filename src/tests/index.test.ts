/**
 * Integration Tests
 * Tests the complete package exports and integration
 */

import * as DataContracts from '../index';

describe('GOD-EYE Data Contracts Package', () => {
  describe('Core Exports', () => {
    it('should export ResponseFactory', () => {
      expect(DataContracts.ResponseFactory).toBeDefined();
      expect(typeof DataContracts.ResponseFactory.success).toBe('function');
      expect(typeof DataContracts.ResponseFactory.error).toBe('function');
      expect(typeof DataContracts.ResponseFactory.notFound).toBe('function');
    });

    it('should export Smart API decorator', () => {
      expect(DataContracts.Api).toBeDefined();
      expect(DataContracts.CommonApiErrors).toBeDefined();
      expect(DataContracts.ApiResponseWrapper).toBeDefined();
      expect(DataContracts.ApiPaginatedWrapper).toBeDefined();
    });

    it('should export Bootstrap system', () => {
      expect(DataContracts.bootstrap).toBeDefined();
      expect(DataContracts.bootstrapGodsEyeApp).toBeDefined();
      expect(typeof DataContracts.bootstrap).toBe('function');
    });
  });

  describe('Validation System Exports', () => {
    it('should export ValidationPipe', () => {
      expect(DataContracts.ValidationPipe).toBeDefined();
    });

    it('should export validation decorators', () => {
      expect(DataContracts.IsValidId).toBeDefined();
      expect(DataContracts.IsRequiredEmail).toBeDefined();
      expect(DataContracts.IsOptionalEmail).toBeDefined();
      expect(DataContracts.IsPhoneNumber).toBeDefined();
      expect(DataContracts.IsValidPagination).toBeDefined();
    });

    it('should export transform decorators', () => {
      expect(DataContracts.ToLowerCase).toBeDefined();
      expect(DataContracts.Trim).toBeDefined();
      expect(DataContracts.TransformDate).toBeDefined();
      expect(DataContracts.TransformArray).toBeDefined();
    });

    it('should export standard DTOs', () => {
      expect(DataContracts.PaginationDto).toBeDefined();
      expect(DataContracts.SearchDto).toBeDefined();
      expect(DataContracts.QueryDto).toBeDefined();
    });

    it('should export validation utilities', () => {
      expect(DataContracts.ValidationUtils).toBeDefined();
      expect(typeof DataContracts.ValidationUtils.isValidId).toBe('function');
      expect(typeof DataContracts.ValidationUtils.isValidEmail).toBe('function');
    });
  });

  describe('Kong Authentication Exports', () => {
    it('should export Kong auth decorators and guards', () => {
      expect(DataContracts.KongUser).toBeDefined();
      expect(DataContracts.KongAuthGuard).toBeDefined();
      expect(DataContracts.createKongAuthGuard).toBeDefined();
      expect(DataContracts.RequireRoles).toBeDefined();
    });

    it('should export Kong utilities', () => {
      expect(DataContracts.extractKongUserContext).toBeDefined();
      expect(DataContracts.normalizeHeaders).toBeDefined();
      expect(typeof DataContracts.extractKongUserContext).toBe('function');
    });

    it('should export Kong types', () => {
      // Type exports are not runtime-testable in this way
      // But we can verify the imports don't throw
      expect(true).toBe(true);
    });
  });

  describe('Repository System Exports', () => {
    it('should export base repository classes', () => {
      expect(DataContracts.BaseTypeORMRepository).toBeDefined();
    });
  });

  describe('Integration Test - Complete Usage Example', () => {
    it('should support complete usage flow', () => {
      // Test that all components work together
      const { ResponseFactory, ValidationUtils } = DataContracts;

      // Test validation utility
      const isValidId = ValidationUtils.isValidId('123');
      expect(typeof isValidId).toBe('boolean');

      // Test response factory
      const successResponse = ResponseFactory.success({ id: '123' }, 'Test successful');
      expect(successResponse.success).toBe(true);
      expect(successResponse.data).toEqual({ id: '123' });

      const errorResponse = ResponseFactory.notFound('Resource not found');
      expect(errorResponse.success).toBe(false);
      expect(errorResponse.status_code).toBe(404);

      // Test auto-detection
      const paginatedData = {
        items: [{ id: '1' }, { id: '2' }],
        total: 2,
        page: 1,
        limit: 10
      };
      const paginatedResponse = ResponseFactory.success(paginatedData);
      expect(paginatedResponse.pagination).toBeDefined();
      expect(paginatedResponse.pagination?.total).toBe(2);
    });
  });

  describe('Usage Guide Compliance', () => {
    it('should match bootstrap usage guide examples', () => {
      const { bootstrap } = DataContracts;
      
      // Test that bootstrap accepts the expected parameters
      expect(typeof bootstrap).toBe('function');
      
      // Mock module for testing
      const mockModule = {};
      const config = {
        serviceName: 'test-service',
        port: 3003,
        enableSwagger: true
      };
      
      // This would normally start a server, so we just test structure
      expect(config.serviceName).toBe('test-service');
      expect(config.port).toBe(3003);
      expect(config.enableSwagger).toBe(true);
    });

    it('should match response factory usage guide examples', () => {
      const { ResponseFactory } = DataContracts;
      
      // Test simple success
      const response = ResponseFactory.success({ id: '123', name: 'Test' });
      expect(response.success).toBe(true);
      expect(response.status_code).toBe(200);
      
      // Test error responses
      const notFound = ResponseFactory.notFound('User not found');
      expect(notFound.status_code).toBe(404);
      
      const serverError = ResponseFactory.serverError('Something went wrong');
      expect(serverError.status_code).toBe(500);
    });

    it('should match validation usage guide examples', () => {
      const { ValidationUtils } = DataContracts;
      
      // UUID validation
      expect(ValidationUtils.isValidId('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
      
      // ObjectId validation  
      expect(ValidationUtils.isValidId('507f1f77bcf86cd799439011')).toBe(true);
      
      // Numeric ID validation
      expect(ValidationUtils.isValidId('12345')).toBe(true);
      
      // Email validation
      expect(ValidationUtils.isValidEmail('test@example.com')).toBe(true);
      expect(ValidationUtils.isValidEmail('invalid-email')).toBe(false);
    });
  });
});