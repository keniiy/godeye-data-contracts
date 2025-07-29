/**
 * Kong Gateway Authentication System
 * Unified authentication across all GOD-EYE microservices
 */

import { Injectable, CanActivate, ExecutionContext, createParamDecorator, HttpException, HttpStatus } from '@nestjs/common';
import { IKongUserContext } from '../types/auth.types';
import { KONG_HEADERS, AUTH_MESSAGES } from '../constants/auth.constants';

/**
 * Normalize request headers to string dictionary (DRY utility)
 * @param requestHeaders - Raw request headers
 * @returns Normalized headers as string dictionary
 */
export function normalizeHeaders(requestHeaders: any): Record<string, string> {
  const headers: Record<string, string> = {};
  for (const [key, value] of Object.entries(requestHeaders)) {
    if (typeof value === 'string') {
      headers[key] = value;
    } else if (Array.isArray(value)) {
      headers[key] = value.join(',');
    }
  }
  return headers;
}

/**
 * Extract Kong user context from Gateway headers
 * @param headers - HTTP headers from Kong Gateway 
 * @returns Kong user context with all available user information
 */
export function extractKongUserContext(headers: Record<string, string>): IKongUserContext {
  const userId = headers[KONG_HEADERS.USER_ID];
  const userEmail = headers[KONG_HEADERS.USER_EMAIL];
  const userType = headers[KONG_HEADERS.USER_TYPE];

  if (!userId || !userEmail) {
    throw new HttpException(
      AUTH_MESSAGES.USER_CONTEXT_MISSING,
      HttpStatus.UNAUTHORIZED,
    );
  }

  // Parse user types (Kong sends comma-separated string)
  const userTypes = userType ? userType.split(',').map((t) => t.trim()) : [];

  return {
    id: userId,
    email: userEmail,
    type: userTypes,
    profile_id: headers[KONG_HEADERS.PROFILE_ID],
    profile_kind: headers[KONG_HEADERS.PROFILE_KIND],
    phone: headers[KONG_HEADERS.PHONE],
    first_name: headers[KONG_HEADERS.FIRST_NAME],
    last_name: headers[KONG_HEADERS.LAST_NAME],
  };
}

/**
 * Kong User Parameter Decorator
 * Usage: async method(@KongUser() user: IKongUserContext)
 */
export const KongUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): IKongUserContext => {
    const request = ctx.switchToHttp().getRequest();
    const headers = normalizeHeaders(request.headers);
    return extractKongUserContext(headers);
  },
);

/**
 * Kong Authentication Guard
 * Automatically validates Kong user context on protected routes
 */
@Injectable()
export class KongAuthGuard implements CanActivate {
  constructor(
    private readonly required_roles?: string[],
    private readonly skip_routes?: string[],
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const route = request.route?.path || request.url;

    // Skip authentication for certain routes
    if (this.skip_routes?.includes(route)) {
      return true;
    }

    try {
      // Extract user context using shared utility
      const headers = normalizeHeaders(request.headers);
      const userContext = extractKongUserContext(headers);

      // Check role requirements
      if (this.required_roles && this.required_roles.length > 0) {
        const hasRequiredRole = this.required_roles.some(role => 
          userContext.type.includes(role)
        );

        if (!hasRequiredRole) {
          throw new HttpException(
            AUTH_MESSAGES.ROLE_NOT_ALLOWED,
            HttpStatus.FORBIDDEN,
          );
        }
      }

      // Attach user context to request for later use
      request.user = userContext;
      return true;

    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        AUTH_MESSAGES.UNAUTHORIZED,
        HttpStatus.UNAUTHORIZED,
      );
    }
  }
}

/**
 * Create Kong Auth Guard with specific configuration
 */
export function createKongAuthGuard(options?: {
  required_roles?: string[];
  skip_routes?: string[];
}): typeof KongAuthGuard {
  return class extends KongAuthGuard {
    constructor() {
      super(options?.required_roles, options?.skip_routes);
    }
  };
}

/**
 * Role-based access control decorator
 * Usage: @RequireRoles(['admin', 'manager'])
 */
export function RequireRoles(...roles: string[]) {
  return (target: any, propertyName: string, descriptor: PropertyDescriptor) => {
    // Implementation would integrate with NestJS guards system
    Reflect.defineMetadata('required_roles', roles, descriptor.value);
  };
}