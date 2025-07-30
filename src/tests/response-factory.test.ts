/**
 * ResponseFactory Tests
 * Tests the response factory functionality including auto-detection
 */

import { ResponseFactory } from '../core/response';
import { IResponse } from '../types/response.types';

describe('ResponseFactory', () => {
  describe('success method', () => {
    it('should create a standard success response', () => {
      const data = { id: '1', name: 'Test User' };
      const response = ResponseFactory.success(data, 'User found');

      expect(response.success).toBe(true);
      expect(response.data).toEqual(data);
      expect(response.message).toBe('User found');
      expect(response.status_code).toBe(200);
      expect(response.timestamp).toBeDefined();
      expect(response.trace_id).toBeDefined();
    });

    it('should auto-detect paginated data (items format)', () => {
      const paginatedData = {
        items: [{ id: '1' }, { id: '2' }],
        total: 2,
        page: 1,
        limit: 10
      };

      const response = ResponseFactory.success(paginatedData);

      expect(response.success).toBe(true);
      expect(response.data).toEqual([{ id: '1' }, { id: '2' }]);
      expect(response.pagination).toBeDefined();
      expect(response.pagination?.total).toBe(2);
      expect(response.pagination?.page).toBe(1);
      expect(response.pagination?.limit).toBe(10);
    });

    it('should auto-detect paginated data (data format)', () => {
      const paginatedData = {
        data: [{ id: '1' }, { id: '2' }],
        total: 5,
        page: 2,
        limit: 2
      };

      const response = ResponseFactory.success(paginatedData);

      expect(response.data).toEqual([{ id: '1' }, { id: '2' }]);
      expect(response.pagination?.total).toBe(5);
      expect(response.pagination?.total_pages).toBe(3); // Math.ceil(5/2)
      expect(response.pagination?.has_next).toBe(true);
      expect(response.pagination?.has_prev).toBe(true);
    });

    it('should auto-detect paginated data (results format)', () => {
      const paginatedData = {
        results: [{ id: '1' }],
        count: 1
      };

      const response = ResponseFactory.success(paginatedData);

      expect(response.data).toEqual([{ id: '1' }]);
      expect(response.pagination?.total).toBe(1);
      expect(response.pagination?.page).toBe(1); // Default
      expect(response.pagination?.limit).toBe(20); // Default
    });

    it('should handle non-paginated data correctly', () => {
      const regularData = { id: '1', name: 'Test' };
      const response = ResponseFactory.success(regularData);

      expect(response.data).toEqual(regularData);
      expect(response.pagination).toBeUndefined();
    });
  });

  describe('paginated method', () => {
    it('should create paginated response correctly', () => {
      const items = [{ id: '1' }, { id: '2' }];
      const response = ResponseFactory.paginated(items, 10, 2, 5);

      expect(response.success).toBe(true);
      expect(response.data).toEqual(items);
      expect(response.pagination?.total).toBe(10);
      expect(response.pagination?.page).toBe(2);
      expect(response.pagination?.limit).toBe(5);
      expect(response.pagination?.total_pages).toBe(2);
      expect(response.pagination?.has_next).toBe(false);
      expect(response.pagination?.has_prev).toBe(true);
    });
  });

  describe('error methods', () => {
    it('should create error response', () => {
      const response = ResponseFactory.error('Not Found', 'User not found', 404);

      expect(response.success).toBe(false);
      expect(response.error).toBe('Not Found');
      expect(response.message).toBe('User not found');
      expect(response.status_code).toBe(404);
    });

    it('should create notFound response', () => {
      const response = ResponseFactory.notFound('User not found');

      expect(response.success).toBe(false);
      expect(response.error).toBe('Not Found');
      expect(response.message).toBe('User not found');
      expect(response.status_code).toBe(404);
    });

    it('should create validationError response', () => {
      const errors = ['Email is required', 'Phone is invalid'];
      const response = ResponseFactory.validationError('Validation failed', errors);

      expect(response.success).toBe(false);
      expect(response.error).toBe('Validation Error');
      expect(response.status_code).toBe(422);
      expect(response.metadata?.validation_errors).toEqual(errors);
    });

    it('should create serverError response', () => {
      const response = ResponseFactory.serverError('Something went wrong');

      expect(response.success).toBe(false);
      expect(response.error).toBe('Internal Server Error');
      expect(response.message).toBe('Something went wrong');
      expect(response.status_code).toBe(500);
    });
  });

  describe('utility methods', () => {
    it('should get performance metrics', () => {
      const metrics = ResponseFactory.getPerformanceMetrics();

      if (typeof process !== 'undefined' && typeof process.memoryUsage === 'function') {
        expect(metrics.heap_used_mb).toBeDefined();
        expect(metrics.heap_total_mb).toBeDefined();
        expect(metrics.memory_used_mb).toBeDefined();
      } else {
        expect(metrics).toEqual({});
      }
    });

    it('should create success response with metrics', () => {
      const data = { id: '1' };
      const response = ResponseFactory.successWithMetrics(data, 'Success');

      expect(response.success).toBe(true);
      expect(response.data).toEqual(data);
      expect(response.message).toBe('Success');
      
      // Performance metrics should be included
      if (typeof process !== 'undefined' && typeof process.memoryUsage === 'function') {
        expect(response.metadata?.heap_used_mb).toBeDefined();
      }
    });
  });
});