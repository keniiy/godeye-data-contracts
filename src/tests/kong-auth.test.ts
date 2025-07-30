/**
 * Kong Authentication Tests
 * Tests the Kong Gateway authentication integration
 */

import { ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { 
  KongAuthGuard, 
  extractKongUserContext, 
  normalizeHeaders,
  createKongAuthGuard 
} from '../core/auth';
import { IKongUserContext } from '../types/auth.types';
import { KONG_HEADERS } from '../constants/auth.constants';

describe('Kong Authentication System', () => {
  describe('normalizeHeaders utility', () => {
    it('should normalize string headers', () => {
      const rawHeaders = {
        'x-user-id': '123',
        'x-user-email': 'test@example.com'
      };

      const normalized = normalizeHeaders(rawHeaders);
      
      expect(normalized['x-user-id']).toBe('123');
      expect(normalized['x-user-email']).toBe('test@example.com');
    });

    it('should normalize array headers to comma-separated string', () => {
      const rawHeaders = {
        'x-user-type': ['admin', 'user']
      };

      const normalized = normalizeHeaders(rawHeaders);
      
      expect(normalized['x-user-type']).toBe('admin,user');
    });

    it('should handle mixed header types', () => {
      const rawHeaders = {
        'x-user-id': '123',
        'x-user-type': ['admin', 'user'],
        'x-user-email': 'test@example.com'
      };

      const normalized = normalizeHeaders(rawHeaders);
      
      expect(normalized['x-user-id']).toBe('123');
      expect(normalized['x-user-type']).toBe('admin,user');
      expect(normalized['x-user-email']).toBe('test@example.com');
    });
  });

  describe('extractKongUserContext utility', () => {
    it('should extract complete user context', () => {
      const headers = {
        [KONG_HEADERS.USER_ID]: '123',
        [KONG_HEADERS.USER_EMAIL]: 'test@example.com',
        [KONG_HEADERS.USER_TYPE]: 'admin,user',
        [KONG_HEADERS.PROFILE_ID]: 'profile-456',
        [KONG_HEADERS.PROFILE_KIND]: 'doctor',
        [KONG_HEADERS.PHONE]: '+1234567890',
        [KONG_HEADERS.FIRST_NAME]: 'John',
        [KONG_HEADERS.LAST_NAME]: 'Doe'
      };

      const context = extractKongUserContext(headers);

      expect(context.id).toBe('123');
      expect(context.email).toBe('test@example.com');
      expect(context.type).toEqual(['admin', 'user']);
      expect(context.profile_id).toBe('profile-456');
      expect(context.profile_kind).toBe('doctor');
      expect(context.phone).toBe('+1234567890');
      expect(context.first_name).toBe('John');
      expect(context.last_name).toBe('Doe');
    });

    it('should extract minimal user context', () => {
      const headers = {
        [KONG_HEADERS.USER_ID]: '123',
        [KONG_HEADERS.USER_EMAIL]: 'test@example.com'
      };

      const context = extractKongUserContext(headers);

      expect(context.id).toBe('123');
      expect(context.email).toBe('test@example.com');
      expect(context.type).toEqual([]);
      expect(context.profile_id).toBeUndefined();
    });

    it('should throw error when user ID is missing', () => {
      const headers = {
        [KONG_HEADERS.USER_EMAIL]: 'test@example.com'
      };

      expect(() => extractKongUserContext(headers)).toThrow(HttpException);
    });

    it('should throw error when user email is missing', () => {
      const headers = {
        [KONG_HEADERS.USER_ID]: '123'
      };

      expect(() => extractKongUserContext(headers)).toThrow(HttpException);
    });

    it('should parse comma-separated user types', () => {
      const headers = {
        [KONG_HEADERS.USER_ID]: '123',
        [KONG_HEADERS.USER_EMAIL]: 'test@example.com',
        [KONG_HEADERS.USER_TYPE]: 'admin, user, doctor'
      };

      const context = extractKongUserContext(headers);

      expect(context.type).toEqual(['admin', 'user', 'doctor']);
    });
  });

  describe('KongAuthGuard', () => {
    let guard: KongAuthGuard;
    let mockExecutionContext: jest.Mocked<ExecutionContext>;
    let mockRequest: any;

    beforeEach(() => {
      guard = new KongAuthGuard();
      
      mockRequest = {
        headers: {},
        url: '/api/users',
        route: { path: '/api/users' }
      };

      mockExecutionContext = {
        switchToHttp: jest.fn(() => ({
          getRequest: jest.fn(() => mockRequest),
          getResponse: jest.fn()
        }))
      } as any;
    });

    it('should allow access with valid Kong headers', () => {
      mockRequest.headers = {
        [KONG_HEADERS.USER_ID]: '123',
        [KONG_HEADERS.USER_EMAIL]: 'test@example.com',
        [KONG_HEADERS.USER_TYPE]: 'user'
      };

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
      expect(mockRequest.user).toBeDefined();
      expect(mockRequest.user.id).toBe('123');
    });

    it('should reject access with missing headers', () => {
      mockRequest.headers = {}; // No Kong headers

      expect(() => guard.canActivate(mockExecutionContext)).toThrow(HttpException);
    });

    it('should validate required roles', () => {
      const guardWithRoles = new KongAuthGuard(['admin']);
      
      mockRequest.headers = {
        [KONG_HEADERS.USER_ID]: '123',
        [KONG_HEADERS.USER_EMAIL]: 'test@example.com',
        [KONG_HEADERS.USER_TYPE]: 'user' // Not admin
      };

      expect(() => guardWithRoles.canActivate(mockExecutionContext)).toThrow(HttpException);
    });

    it('should allow access when user has required role', () => {
      const guardWithRoles = new KongAuthGuard(['admin', 'user']);
      
      mockRequest.headers = {
        [KONG_HEADERS.USER_ID]: '123',
        [KONG_HEADERS.USER_EMAIL]: 'test@example.com',
        [KONG_HEADERS.USER_TYPE]: 'user,admin' // Has admin role
      };

      const result = guardWithRoles.canActivate(mockExecutionContext);

      expect(result).toBe(true);
    });

    it('should skip authentication for specified routes', () => {
      const guardWithSkipRoutes = new KongAuthGuard([], ['/api/health']);
      
      mockRequest.url = '/api/health';
      mockRequest.route.path = '/api/health';
      mockRequest.headers = {}; // No headers needed for skipped routes

      const result = guardWithSkipRoutes.canActivate(mockExecutionContext);

      expect(result).toBe(true);
    });
  });

  describe('createKongAuthGuard factory', () => {
    it('should create guard with specified configuration', () => {
      const GuardClass = createKongAuthGuard({
        required_roles: ['admin'],
        skip_routes: ['/health']
      });

      const guard = new GuardClass();

      expect(guard).toBeInstanceOf(KongAuthGuard);
    });

    it('should create guard without configuration', () => {
      const GuardClass = createKongAuthGuard();
      const guard = new GuardClass();

      expect(guard).toBeInstanceOf(KongAuthGuard);
    });
  });
});