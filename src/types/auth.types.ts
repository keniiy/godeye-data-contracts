/**
 * Authentication interfaces for Kong Gateway integration
 * Standardizes user context extraction across all services
 */

/**
 * Kong user context extracted from Gateway headers
 */
export interface IKongUserContext {
  /** User ID from Kong */
  id: string;
  
  /** User email */
  email: string;
  
  /** User types/roles */
  type: string[];
  
  /** Profile ID (optional) */
  profile_id?: string;
  
  /** Profile kind/type (optional) */
  profile_kind?: string;
  
  /** Phone number (optional) */
  phone?: string;
  
  /** First name (optional) */
  first_name?: string;
  
  /** Last name (optional) */
  last_name?: string;
}

/**
 * Kong authentication configuration
 */
export interface IKongAuthConfig {
  /** Whether authentication is required */
  required?: boolean;
  
  /** Roles that are allowed access */
  allowed_roles?: string[];
  
  /** Whether to cache user context */
  cache_context?: boolean;
  
  /** Cache TTL in seconds */
  cache_ttl?: number;
}

/**
 * User permissions for role-based access control
 */
export interface IUserPermissions {
  /** User ID */
  user_id: string;
  
  /** User roles */
  roles: string[];
  
  /** Specific permissions */
  permissions: string[];
  
  /** Resource-specific permissions */
  resource_permissions?: Record<string, string[]>;
}

/**
 * Authentication guard configuration
 */
export interface IAuthGuardConfig {
  /** Skip authentication for certain routes */
  skip_routes?: string[];
  
  /** Custom header mappings */
  header_mappings?: Record<string, string>;
  
  /** Error handling configuration */
  error_handling?: {
    throw_on_missing?: boolean;
    default_user?: Partial<IKongUserContext>;
  };
}