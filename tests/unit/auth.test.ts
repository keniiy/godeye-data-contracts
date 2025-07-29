/**
 * Kong Authentication Unit Tests
 */

import { extractKongUserContext } from '../../src/core/auth';
import { KONG_HEADERS, AUTH_MESSAGES } from '../../src/constants/auth.constants';
import { HttpException } from '@nestjs/common';

describe('Kong Authentication', () => {
  describe('extractKongUserContext', () => {
    it('should extract user context from Kong headers', () => {
      const headers = {
        [KONG_HEADERS.USER_ID]: 'user123',
        [KONG_HEADERS.USER_EMAIL]: 'user@example.com',
        [KONG_HEADERS.USER_TYPE]: 'admin,user',
        [KONG_HEADERS.PROFILE_ID]: 'profile456',
        [KONG_HEADERS.PROFILE_KIND]: 'individual',
        [KONG_HEADERS.PHONE]: '+1234567890',
        [KONG_HEADERS.FIRST_NAME]: 'John',
        [KONG_HEADERS.LAST_NAME]: 'Doe',
      };

      const userContext = extractKongUserContext(headers);

      expect(userContext).toEqual({
        id: 'user123',
        email: 'user@example.com',
        type: ['admin', 'user'],
        profile_id: 'profile456',
        profile_kind: 'individual',
        phone: '+1234567890',
        first_name: 'John',
        last_name: 'Doe',
      });
    });

    it('should handle single user type', () => {
      const headers = {
        [KONG_HEADERS.USER_ID]: 'user123',
        [KONG_HEADERS.USER_EMAIL]: 'user@example.com',
        [KONG_HEADERS.USER_TYPE]: 'user',
      };

      const userContext = extractKongUserContext(headers);

      expect(userContext.type).toEqual(['user']);
    });

    it('should handle missing optional fields', () => {
      const headers = {
        [KONG_HEADERS.USER_ID]: 'user123',
        [KONG_HEADERS.USER_EMAIL]: 'user@example.com',
      };

      const userContext = extractKongUserContext(headers);

      expect(userContext).toEqual({
        id: 'user123',
        email: 'user@example.com',
        type: [],
        profile_id: undefined,
        profile_kind: undefined,
        phone: undefined,
        first_name: undefined,
        last_name: undefined,
      });
    });

    it('should throw error when user ID is missing', () => {
      const headers = {
        [KONG_HEADERS.USER_EMAIL]: 'user@example.com',
      };

      expect(() => {
        extractKongUserContext(headers);
      }).toThrow(AUTH_MESSAGES.USER_CONTEXT_MISSING);
    });

    it('should throw error when user email is missing', () => {
      const headers = {
        [KONG_HEADERS.USER_ID]: 'user123',
      };

      expect(() => {
        extractKongUserContext(headers);
      }).toThrow(AUTH_MESSAGES.USER_CONTEXT_MISSING);
    });

    it('should handle empty user type gracefully', () => {
      const headers = {
        [KONG_HEADERS.USER_ID]: 'user123',
        [KONG_HEADERS.USER_EMAIL]: 'user@example.com',
        [KONG_HEADERS.USER_TYPE]: '',
      };

      const userContext = extractKongUserContext(headers);

      expect(userContext.type).toEqual([]);
    });

    it('should trim whitespace from user types', () => {
      const headers = {
        [KONG_HEADERS.USER_ID]: 'user123',
        [KONG_HEADERS.USER_EMAIL]: 'user@example.com',
        [KONG_HEADERS.USER_TYPE]: ' admin , user , manager ',
      };

      const userContext = extractKongUserContext(headers);

      expect(userContext.type).toEqual(['admin', 'user', 'manager']);
    });
  });

  describe('Kong Headers Constants', () => {
    it('should have correct header names', () => {
      expect(KONG_HEADERS.USER_ID).toBe('x-user-id');
      expect(KONG_HEADERS.USER_EMAIL).toBe('x-user-email');
      expect(KONG_HEADERS.USER_TYPE).toBe('x-user-type');
      expect(KONG_HEADERS.PROFILE_ID).toBe('x-user-profile-id');
      expect(KONG_HEADERS.PROFILE_KIND).toBe('x-user-profile-kind');
      expect(KONG_HEADERS.PHONE).toBe('x-user-phone');
      expect(KONG_HEADERS.FIRST_NAME).toBe('x-user-first-name');
      expect(KONG_HEADERS.LAST_NAME).toBe('x-user-last-name');
    });
  });

  describe('Auth Messages Constants', () => {
    it('should have appropriate error messages', () => {
      expect(AUTH_MESSAGES.USER_CONTEXT_MISSING).toBe('User context not found in headers - Kong Gateway auth required');
      expect(AUTH_MESSAGES.UNAUTHORIZED).toBe('Authentication required to access this resource');
      expect(AUTH_MESSAGES.ROLE_NOT_ALLOWED).toBe('User role is not allowed to access this resource');
    });
  });
});