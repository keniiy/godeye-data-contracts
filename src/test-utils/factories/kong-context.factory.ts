/**
 * Kong Authentication Context Factory
 * Provides consistent Kong user context generation for auth testing
 */

import { ExecutionContext } from '@nestjs/common';
import { IKongUserContext } from '../../types/auth.types';
import { KONG_HEADERS } from '../../constants/auth.constants';

export interface MockKongHeaders {
  [key: string]: string | string[];
}

export interface MockRequest {
  headers: MockKongHeaders;
  url?: string;
  route?: { path: string };
  user?: IKongUserContext;
}

export interface MockHttpContext {
  getRequest: jest.MockedFunction<() => MockRequest>;
  getResponse: jest.MockedFunction<() => any>;
}

/**
 * Kong Context Factory - Creates Kong authentication contexts and headers
 */
export class KongContextFactory {
  private static userIdCounter = 1000;

  private static generateUserId(): string {
    return `kong_user_${this.userIdCounter++}`;
  }

  /**
   * Creates basic Kong headers with required fields
   */
  static createBasicHeaders(overrides: Partial<MockKongHeaders> = {}): MockKongHeaders {
    const userId = this.generateUserId();
    
    return {
      [KONG_HEADERS.USER_ID]: userId,
      [KONG_HEADERS.USER_EMAIL]: `user${userId}@example.com`,
      ...overrides,
    };
  }

  /**
   * Creates complete Kong headers with all optional fields
   */
  static createCompleteHeaders(overrides: Partial<MockKongHeaders> = {}): MockKongHeaders {
    const userId = this.generateUserId();
    
    return {
      [KONG_HEADERS.USER_ID]: userId,
      [KONG_HEADERS.USER_EMAIL]: `user${userId}@example.com`,
      [KONG_HEADERS.USER_TYPE]: 'user',
      [KONG_HEADERS.PROFILE_ID]: `profile_${userId}`,
      [KONG_HEADERS.PROFILE_KIND]: 'patient',
      [KONG_HEADERS.PHONE]: '+1234567890',
      [KONG_HEADERS.FIRST_NAME]: 'Test',
      [KONG_HEADERS.LAST_NAME]: 'User',
      ...overrides,
    };
  }

  /**
   * Creates Kong user context object (extracted from headers)
   */
  static createUserContext(overrides: Partial<IKongUserContext> = {}): IKongUserContext {
    const userId = this.generateUserId();
    
    return {
      id: userId,
      email: `user${userId}@example.com`,
      type: [],
      ...overrides,
    };
  }

  /**
   * Creates user context with multiple roles
   */
  static createUserContextWithRoles(
    roles: string[] = ['user'],
    overrides: Partial<IKongUserContext> = {}
  ): IKongUserContext {
    const userId = this.generateUserId();
    
    return {
      id: userId,
      email: `user${userId}@example.com`,
      type: roles,
      profile_id: `profile_${userId}`,
      profile_kind: 'patient',
      phone: '+1234567890',
      first_name: 'Test',
      last_name: 'User',
      ...overrides,
    };
  }

  /**
   * Creates mock request object with Kong headers
   */
  static createMockRequest(
    headers: MockKongHeaders = {},
    overrides: Partial<MockRequest> = {}
  ): MockRequest {
    const defaultHeaders = this.createBasicHeaders();
    
    return {
      headers: { ...defaultHeaders, ...headers },
      url: '/api/test',
      route: { path: '/api/test' },
      ...overrides,
    };
  }

  /**
   * Creates mock execution context for guard testing
   */
  static createMockExecutionContext(
    request?: Partial<MockRequest>,
    response: any = {}
  ): jest.Mocked<ExecutionContext> {
    const mockRequest = this.createMockRequest(request?.headers, request);
    
    const mockHttpContext: MockHttpContext = {
      getRequest: jest.fn().mockReturnValue(mockRequest),
      getResponse: jest.fn().mockReturnValue(response),
    };

    return {
      switchToHttp: jest.fn().mockReturnValue(mockHttpContext),
    } as any;
  }

  /**
   * Creates headers for specific user types
   */
  static createAdminHeaders(overrides: Partial<MockKongHeaders> = {}): MockKongHeaders {
    return this.createCompleteHeaders({
      [KONG_HEADERS.USER_TYPE]: 'admin,user',
      [KONG_HEADERS.USER_EMAIL]: 'admin@system.com',
      [KONG_HEADERS.FIRST_NAME]: 'System',
      [KONG_HEADERS.LAST_NAME]: 'Administrator',
      [KONG_HEADERS.PROFILE_KIND]: 'admin',
      ...overrides,
    });
  }

  static createDoctorHeaders(overrides: Partial<MockKongHeaders> = {}): MockKongHeaders {
    const userId = this.generateUserId();
    
    return this.createCompleteHeaders({
      [KONG_HEADERS.USER_TYPE]: 'doctor,user',
      [KONG_HEADERS.USER_EMAIL]: `doctor${userId}@clinic.com`,
      [KONG_HEADERS.FIRST_NAME]: 'Dr. John',
      [KONG_HEADERS.LAST_NAME]: 'Smith',
      [KONG_HEADERS.PROFILE_KIND]: 'doctor',
      ...overrides,
    });
  }

  static createBusinessHeaders(overrides: Partial<MockKongHeaders> = {}): MockKongHeaders {
    const userId = this.generateUserId();
    
    return this.createCompleteHeaders({
      [KONG_HEADERS.USER_TYPE]: 'business,user',
      [KONG_HEADERS.USER_EMAIL]: `business${userId}@company.com`,
      [KONG_HEADERS.FIRST_NAME]: 'Business',
      [KONG_HEADERS.LAST_NAME]: 'Owner',
      [KONG_HEADERS.PROFILE_KIND]: 'business',
      ...overrides,
    });
  }

  /**
   * Creates headers with missing required fields (for error testing)
   */
  static createIncompleteHeaders(missingFields: string[] = []): MockKongHeaders {
    const headers = this.createCompleteHeaders();
    
    missingFields.forEach(field => {
      delete headers[field];
    });
    
    return headers;
  }

  /**
   * Creates headers with array values (for normalization testing)
   */
  static createArrayHeaders(overrides: Partial<MockKongHeaders> = {}): MockKongHeaders {
    return {
      [KONG_HEADERS.USER_ID]: this.generateUserId(),
      [KONG_HEADERS.USER_EMAIL]: 'test@example.com',
      [KONG_HEADERS.USER_TYPE]: ['admin', 'user'], // Array format
      [KONG_HEADERS.FIRST_NAME]: ['John'], // Single item array
      ...overrides,
    };
  }

  /**
   * Reset user ID counter for consistent test runs
   */
  static resetUserIdCounter(): void {
    this.userIdCounter = 1000;
  }
}

/**
 * Kong Context Builder - Fluent interface for complex context creation
 */
export class KongContextBuilder {
  private headers: MockKongHeaders = {};
  private request: Partial<MockRequest> = {};

  static create(): KongContextBuilder {
    return new KongContextBuilder();
  }

  withUserId(userId: string): KongContextBuilder {
    this.headers[KONG_HEADERS.USER_ID] = userId;
    return this;
  }

  withEmail(email: string): KongContextBuilder {
    this.headers[KONG_HEADERS.USER_EMAIL] = email;
    return this;
  }

  withRoles(roles: string[]): KongContextBuilder {
    this.headers[KONG_HEADERS.USER_TYPE] = roles.join(',');
    return this;
  }

  withProfile(profileId: string, kind: string): KongContextBuilder {
    this.headers[KONG_HEADERS.PROFILE_ID] = profileId;
    this.headers[KONG_HEADERS.PROFILE_KIND] = kind;
    return this;
  }

  withName(firstName: string, lastName: string): KongContextBuilder {
    this.headers[KONG_HEADERS.FIRST_NAME] = firstName;
    this.headers[KONG_HEADERS.LAST_NAME] = lastName;
    return this;
  }

  withPhone(phone: string): KongContextBuilder {
    this.headers[KONG_HEADERS.PHONE] = phone;
    return this;
  }

  withUrl(url: string): KongContextBuilder {
    this.request.url = url;
    this.request.route = { path: url };
    return this;
  }

  withExistingHeaders(existingHeaders: MockKongHeaders): KongContextBuilder {
    this.headers = { ...this.headers, ...existingHeaders };
    return this;
  }

  buildHeaders(): MockKongHeaders {
    // Ensure required fields have defaults
    if (!this.headers[KONG_HEADERS.USER_ID]) {
      this.headers[KONG_HEADERS.USER_ID] = KongContextFactory.generateUserId();
    }
    if (!this.headers[KONG_HEADERS.USER_EMAIL]) {
      this.headers[KONG_HEADERS.USER_EMAIL] = 'builder@example.com';
    }
    
    return this.headers;
  }

  buildRequest(): MockRequest {
    return KongContextFactory.createMockRequest(this.buildHeaders(), this.request);
  }

  buildExecutionContext(): jest.Mocked<ExecutionContext> {
    return KongContextFactory.createMockExecutionContext(this.buildRequest());
  }
}

/**
 * Auth Scenario Factory - Common authentication scenarios
 */
export class AuthScenarios {
  /**
   * Valid authenticated user scenario
   */
  static authenticatedUser(): jest.Mocked<ExecutionContext> {
    return KongContextFactory.createMockExecutionContext({
      headers: KongContextFactory.createCompleteHeaders(),
    });
  }

  /**
   * Admin user scenario
   */
  static adminUser(): jest.Mocked<ExecutionContext> {
    return KongContextFactory.createMockExecutionContext({
      headers: KongContextFactory.createAdminHeaders(),
    });
  }

  /**
   * Doctor user scenario
   */
  static doctorUser(): jest.Mocked<ExecutionContext> {
    return KongContextFactory.createMockExecutionContext({
      headers: KongContextFactory.createDoctorHeaders(),
    });
  }

  /**
   * Business user scenario
   */
  static businessUser(): jest.Mocked<ExecutionContext> {
    return KongContextFactory.createMockExecutionContext({
      headers: KongContextFactory.createBusinessHeaders(),
    });
  }

  /**
   * Unauthenticated user scenario (no headers)
   */
  static unauthenticatedUser(): jest.Mocked<ExecutionContext> {
    return KongContextFactory.createMockExecutionContext({
      headers: {},
    });
  }

  /**
   * Invalid user scenario (missing required fields)
   */
  static invalidUser(missingFields: string[] = [KONG_HEADERS.USER_EMAIL]): jest.Mocked<ExecutionContext> {
    return KongContextFactory.createMockExecutionContext({
      headers: KongContextFactory.createIncompleteHeaders(missingFields),
    });
  }

  /**
   * User accessing health check endpoint (should skip auth)
   */
  static healthCheckAccess(): jest.Mocked<ExecutionContext> {
    return KongContextFactory.createMockExecutionContext({
      headers: {},
      url: '/api/health',
      route: { path: '/api/health' },
    });
  }

  /**
   * User with insufficient roles
   */
  static userWithInsufficientRoles(): jest.Mocked<ExecutionContext> {
    return KongContextFactory.createMockExecutionContext({
      headers: KongContextFactory.createCompleteHeaders({
        [KONG_HEADERS.USER_TYPE]: 'user', // Only user role, no admin
      }),
    });
  }
}