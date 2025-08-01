/**
 * @kenniy/godeye-data-contracts v1.0.0
 *
 * GOD-EYE Data Contracts - Unified patterns for all microservices
 * Eliminates 98% code repetition across the ecosystem
 */

// ============================================================================
// CORE EXPORTS - Response & API Documentation
// ============================================================================

// Response Factory - Standardized responses with auto-detection
export { ResponseFactory } from "./core/response";

// Smart API Decorator - One decorator for all Swagger documentation
export {
  Api,
  CommonApiErrors,
  ApiResponseWrapper,
  ApiPaginatedWrapper,
} from "./core/swagger-decorators";

// Swagger Utilities - Description optimization and enhanced documentation
export {
  ApiResponse,
  ApiResponseWithOptimizedDescription,
  optimizeDescription,
  DescriptionConfig,
} from "./core/swagger";

// Bootstrap System - One-line service setup
export {
  bootstrap,
  bootstrapGodsEyeApp,
  BootstrapConfig,
} from "./setup/app.bootstrap";

// ============================================================================
// VALIDATION SYSTEM - Universal validation across ORMs
// ============================================================================

// Validation Pipe & Decorators
export {
  ValidationPipe,
  IsValidId,
  IsRequiredEmail,
  IsOptionalEmail,
  IsPhoneNumber,
  IsValidPagination,
  IsValidSearch,
  IsValidEntity,
  // Transform decorators
  ToLowerCase,
  Trim,
  TransformDate,
  TransformArray,
  // Standard DTOs
  PaginationDto,
  SearchDto,
  QueryDto,
  // Validation utilities
  ValidationUtils,
} from "./core/validation";

// ============================================================================
// KONG AUTHENTICATION - Gateway integration
// ============================================================================

// Kong Auth System
export {
  KongUser,
  KongAuthGuard,
  createKongAuthGuard,
  RequireRoles,
  extractKongUserContext,
  normalizeHeaders,
} from "./core/auth";

// Auth Types
export {
  IKongUserContext,
  IKongAuthConfig,
  IUserPermissions,
  IAuthGuardConfig,
} from "./types/auth.types";

// ============================================================================
// REPOSITORY SYSTEM - Base classes & DTOs
// ============================================================================

// Base Repository Classes
export { BaseTypeORMRepository } from "./repositories/base-typeorm.repository";
export { BaseMongooseRepository } from "./repositories/base-mongoose.repository";

// Aggregate Repository Classes - Unified aggregation for both ORMs
export { TypeORMAggregateRepository } from "./repositories/typeorm-aggregate.repository";
export { MongooseAggregateRepository } from "./repositories/mongoose-aggregate.repository";

// Enhanced Aggregation Repository - BLAZING FAST next-generation algorithms
export { EnhancedMongooseRepository } from "./repositories/enhanced-mongoose-aggregate.repository";

// Enhanced Aggregation Utils - Adaptive query planning and optimization
export {
  EnhancedQueryConfig,
  QueryMetrics,
  EnhancedPaginatedResult,
  AdaptiveQueryPlanner,
  SmartCache,
  PerformanceMonitor,
  AggregationStrategy,
  QueryOptimizationLevel,
  AggregationStepType,
} from "./utils/enhanced-aggregation.utils";

// Aggregate Repository Interface & Types
export {
  IAggregateRepository,
  ComplexQueryConfig,
  JoinConfig,
  AggregationConfig,
  PaginatedResult,
  AggregationPipeline,
  QueryBuilderFunction,
} from "./repositories/base-aggregate.repository";

// Query DTOs with ICriteria transformation
export {
  BaseQueryDto,
  FindOneDto,
  FindManyDto,
  UserQueryDto,
  FileQueryDto,
} from "./core/dto";

// ============================================================================
// TYPES & CONSTANTS - Complete type safety
// ============================================================================

// All types and interfaces
export * from "./types";

// All constants
export * from "./constants";
