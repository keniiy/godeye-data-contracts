/**
 * Response Factory Unit Tests
 */

import { ResponseFactory } from '../../src/core/response';

describe('ResponseFactory', () => {
  beforeEach(() => {
    // Mock Date.now for consistent timestamps
    jest.spyOn(Date, 'now').mockReturnValue(1640995200000); // 2022-01-01T00:00:00.000Z
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('success', () => {
    it('should create success response with data', () => {
      const data = { id: '1', name: 'Test' };
      const message = 'Operation successful';

      const response = ResponseFactory.success(data, message);

      expect(response).toEqual({
        success: true,
        data: { id: '1', name: 'Test' },
        message: 'Operation successful',
        status_code: 200,
        time_ms: expect.any(Number),
        timestamp: expect.any(String),
        trace_id: expect.any(String),
        metadata: {},
      });
    });

    it('should create success response with metadata', () => {
      const data = { id: '1', name: 'Test' };
      const message = 'Success';
      const metadata = {
        request_id: 'req_123',
        version: '1.0.0',
      };

      const response = ResponseFactory.success(data, message, metadata);

      expect(response.metadata).toEqual(metadata);
    });

    it('should create success response without data', () => {
      const response = ResponseFactory.success(null, 'Success');

      expect(response.success).toBe(true);
      expect(response.data).toBeNull();
    });
  });

  describe('error', () => {
    it('should create error response', () => {
      const code = 'USER_NOT_FOUND';
      const message = 'User not found';
      const statusCode = 404;

      const response = ResponseFactory.error(code, message, statusCode);

      expect(response).toEqual({
        success: false,
        error: 'USER_NOT_FOUND',
        message: 'User not found',
        status_code: 404,
        time_ms: expect.any(Number),
        timestamp: expect.any(String),
        trace_id: expect.any(String),
        metadata: undefined
      });
    });

    it('should create error response with metadata', () => {
      const metadata = { request_id: 'req_123', service: 'user-service' };

      const response = ResponseFactory.error('ERROR', 'Error occurred', 500, metadata);

      expect(response.metadata).toMatchObject(metadata);
    });
  });

  describe('paginated', () => {
    it('should create paginated response', () => {
      const items = [{ id: '1' }, { id: '2' }];
      const total = 10;
      const page = 1;
      const limit = 2;
      const message = 'Items retrieved';

      const response = ResponseFactory.paginated(items, total, page, limit, message);

      expect(response).toEqual({
        success: true,
        data: items,
        message: 'Items retrieved',
        status_code: 200,
        time_ms: expect.any(Number),
        timestamp: expect.any(String),
        trace_id: expect.any(String),
        pagination: {
          page: 1,
          limit: 2,
          total: 10,
          total_pages: 5,
          has_next: true,
          has_prev: false,
        },
      });
    });

    it('should calculate pagination metadata correctly', () => {
      const response = ResponseFactory.paginated([], 25, 3, 5, 'Success');

      expect(response.pagination).toEqual({
        page: 3,
        limit: 5,
        total: 25,
        total_pages: 5,
        has_next: true,
        has_prev: true,
      });
    });

    it('should handle last page correctly', () => {
      const response = ResponseFactory.paginated([], 10, 5, 2, 'Success');

      expect(response.pagination).toEqual({
        page: 5,
        limit: 2,
        total: 10,
        total_pages: 5,
        has_next: false,
        has_prev: true,
      });
    });
  });

  describe('validation error', () => {
    it('should create validation error response', () => {
      const message = 'Validation failed';
      const errors = ['Email is required', 'Name must be longer than 2 characters'];

      const response = ResponseFactory.validationError(message, errors);

      expect(response).toEqual({
        success: false,
        error: 'Validation Error',
        message: 'Validation failed',
        status_code: 422,
        time_ms: expect.any(Number),
        timestamp: expect.any(String),
        trace_id: expect.any(String),
        metadata: expect.objectContaining({
          validation_errors: errors,
        }),
      });
    });
  });

  describe('not found', () => {
    it('should create not found response', () => {
      const resource = 'User';

      const response = ResponseFactory.notFound(resource);

      expect(response.success).toBe(false);
      expect(response.status_code).toBe(404);
      expect(response.error).toContain('Not Found');
      expect(response.message).toContain('User');
    });
  });

  describe('unauthorized', () => {
    it('should create unauthorized response', () => {
      const response = ResponseFactory.unauthorized();

      expect(response.success).toBe(false);
      expect(response.status_code).toBe(401);
      expect(response.error).toContain('Unauthorized');
    });

    it('should create unauthorized response with custom message', () => {
      const message = 'Invalid token';

      const response = ResponseFactory.unauthorized(message);

      expect(response.message).toBe('Invalid token');
    });
  });

  describe('trace ID generation', () => {
    it('should generate unique trace IDs', () => {
      const response1 = ResponseFactory.success(null, 'Test 1');
      const response2 = ResponseFactory.success(null, 'Test 2');

      expect(response1.trace_id).not.toBe(response2.trace_id);
      expect(response1.trace_id).toMatch(/^trace_\d+_[a-z0-9]+$/);
      expect(response2.trace_id).toMatch(/^trace_\d+_[a-z0-9]+$/);
    });
  });
});