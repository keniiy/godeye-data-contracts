# Changelog

All notable changes to `@kenniy/godeye-data-contracts` will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.1] - 2025-08-01

### 🚀 Swagger UI Enhancements & OpenAPI Optimization

#### Enhanced Swagger UI Configuration
- **Increased Response Limits**: Set `maxDisplayRequestSize: 10000` and `maxDisplayResponseSize: 10000`
- **Better UX**: Added filter, deep linking, request duration display, and enhanced navigation
- **Custom CSS**: Improved UI with better overflow handling and responsive design
- **Custom Site Title**: Dynamic titles based on service name

#### Description Optimization System
- **Smart Truncation**: Implemented intelligent description truncation (max 500 chars)
- **Sentence-Aware**: Truncation respects sentence boundaries for better readability
- **Truncation Notices**: Clear indicators when content is truncated with external doc references
- **Configurable Limits**: Customizable `DescriptionConfig` for different truncation strategies

#### External Documentation Support
- **External Doc URLs**: Bootstrap config now supports `docUrl` for external documentation
- **Auto-Integration**: External docs automatically linked in Swagger UI
- **Verbose Doc Handling**: Long descriptions moved to external docs to keep Swagger clean

#### Deep Population Response Support
- **Enhanced Schemas**: Updated response schemas to handle deeply populated nested objects
- **Flexible Data Types**: `oneOf` schemas support both basic DTOs and complex populated responses
- **Rich Metadata**: Added `query_depth`, `relations_populated`, and `total_queries` tracking
- **Performance Monitoring**: Enhanced metadata for deeply nested query performance analysis

#### New Utilities & Decorators
- **`optimizeDescription()`**: Utility function for smart description truncation
- **`ApiResponseWithOptimizedDescription`**: Enhanced decorator with built-in optimization
- **`DescriptionConfig`**: Configuration interface for customizing truncation behavior
- **Enhanced `@Api` decorator**: Now supports description optimization and external docs

### 🔧 Configuration Enhancements
- Updated `BootstrapConfig` interface with new Swagger options
- Added support for custom display sizes and external documentation URLs
- Backward compatible - all existing configurations continue to work

### 📚 Developer Experience
- Better Swagger UI performance with large API specifications
- Cleaner documentation with smart truncation
- External documentation integration for comprehensive API docs
- Enhanced support for complex, deeply nested API responses

## [1.1.0] - 2025-07-30

### 🚀 Major Features Added

#### Deep Relations Support
- **TypeORM Deep Relations**: Added support for nested JOIN operations using dot notation
  - `relations: ['business.owner', 'posts.comments.author']`
  - Automatically generates optimized nested JOINs
  - Prevents duplicate JOINs for overlapping relation paths
  
- **Mongoose Deep Population**: Added support for nested populate operations
  - `relations: ['user.profile', 'folder.parent.permissions']`
  - Automatically builds nested populate objects
  - Supports unlimited nesting depth

### ✨ Implementation Details

#### TypeORM Enhancements
- Added `applyDeepRelations()` method for parsing nested relation paths
- Added `applyNestedRelation()` for building JOIN chains
- Added `generateRelationAlias()` for consistent alias naming
- Relations like `'business.owner.profile'` generate optimized SQL JOINs

#### Mongoose Enhancements  
- Added `buildDeepPopulateOptions()` for parsing relation arrays
- Added `buildNestedPopulateObject()` for creating nested populate structures
- Relations like `'user.profile.avatar'` generate nested populate objects

### 🧪 Testing & Documentation
- Added comprehensive test coverage for deep relations (167 tests passing)
- Created `deep-relations-usage.md` guide with examples
- HTTP API usage examples and performance considerations
- Migration guide from manual to deep relations

### 🔄 API Changes (Backward Compatible)
- All existing relation patterns still work: `relations: ['profile', 'business']`
- New deep relations are additive: `relations: ['profile', 'business.owner']`
- No breaking changes to existing DTOs or repositories

## [1.0.0] - 2024-01-15

### 🎉 Initial Release

**Complete unified data contracts system for GOD-EYE microservices eliminating 98% of repetition across TypeORM and Mongoose services.**

### ✨ Added

#### Core Repository System

- **ORM-Agnostic Repository** - Unified interface for TypeORM (PostgreSQL) and Mongoose (MongoDB)
- **Auto-Detection** - Automatic ORM detection and repository creation via `RepositoryFactory`
- **CRUD Operations** - Standard create, read, update, delete with consistent API
- **Advanced Queries** - Pagination, bulk operations, search, filtering, sorting
- **Population/Relations** - Unified `include` field auto-converts to `relations`/`populate`

#### Transaction Management

- **Automatic Transactions** - `withTransaction()` with automatic rollback on errors
- **Manual Transactions** - `beginTransaction()` for explicit transaction control
- **ACID Compliance** - Full transaction support for both PostgreSQL and MongoDB
- **Transaction Options** - Isolation levels, timeouts, retry policies, read/write concerns
- **Cross-Entity Operations** - Atomic operations across multiple repositories

#### Aggregation System

- **MongoDB Pipelines** - Full native aggregation pipeline support
- **TypeORM Equivalents** - SQL-based aggregation with helpful error messages
- **Fluent Builder** - Chainable aggregation API: `match()`, `group()`, `sort()`, `limit()`
- **Advanced Operations** - Time-series analysis, statistical grouping, lookups
- **Pagination Support** - `aggregateWithPagination()` for large result sets

#### Response Factory

- **Standardized Responses** - Consistent API response format across all services
- **Snake Case Data** - `snake_case` for data properties, `camelCase` for functions
- **Performance Metadata** - Built-in CPU/memory usage tracking
- **Trace IDs** - Automatic request tracing for debugging
- **Multiple Formats** - Success, error, paginated, validation error responses

#### Kong Authentication

- **Header Extraction** - Automatic Kong Gateway header parsing
- **User Context** - Complete user information from Kong (`id`, `email`, `type`, etc.)
- **NestJS Decorators** - `@KongUser()` parameter decorator for controllers
- **Auth Guards** - Role-based access control with `KongAuthGuard`
- **Type Safety** - Full TypeScript support for user context

#### Validation System

- **NestJS Integration** - Enhanced `ValidationPipe` with GOD-EYE standards
- **Class Validator** - Full `class-validator` and `class-transformer` support
- **Error Formatting** - Consistent validation error responses
- **Automatic Transformation** - Request payload transformation and sanitization

#### Swagger Integration

- **API Documentation** - Automatic OpenAPI/Swagger documentation generation
- **Response Decorators** - `@ApiResponse()` with standardized response schemas
- **Kong Auth Support** - Bearer token and Kong header documentation
- **Type Generation** - Automatic DTO and response type generation

#### Bootstrap System

- **One-Line Setup** - `bootstrapGodsEyeApp()` for instant microservice configuration
- **DataModule** - Automatic repository and validation setup
- **CORS Configuration** - Production-ready CORS with Kong headers
- **Swagger Setup** - Automatic API documentation deployment

### 🏗️ Architecture

#### DRY Principle Implementation

- **Base Classes** - Shared logic in abstract base classes eliminates repetition
- **Common Methods** - `findWithPagination()`, `bulkOperations()`, `createMany()` shared across ORMs
- **Transaction Base** - `BaseTransactionRepository` eliminates transaction code duplication
- **Factory Pattern** - Single `RepositoryFactory` handles both ORM types

#### Type Safety

- **Generic Interfaces** - Full TypeScript generics throughout the system
- **ORM-Specific Types** - Proper typing for TypeORM entities and Mongoose documents
- **Response Types** - Strongly typed API responses with inference
- **Criteria Interface** - Type-safe query building with `ICriteria<T>`

#### Performance Optimizations

- **Database-Specific** - Optimized bulk operations for each database type
- **Connection Pooling** - Proper connection management and cleanup
- **Query Optimization** - Efficient pagination and aggregation queries
- **Memory Management** - Transaction cleanup and resource management

### 📦 Package Structure

```plaintext
src/
├── constants/          # Centralized configuration constants
├── core/              # Main implementation classes
├── enums/             # Enumeration definitions
├── types/             # TypeScript interface definitions
├── utils/             # Helper utilities
└── index.ts           # Main exports

setup/                 # Bootstrap and configuration modules
tests/                 # Unit and integration tests
```

### 🎯 Benefits Delivered

- **98% Less Repetition** - Single codebase works with PostgreSQL and MongoDB
- **Type Safety** - Full TypeScript support prevents runtime errors
- **Enterprise Ready** - Transactions, monitoring, error handling, documentation
- **Developer Experience** - Consistent patterns across all GOD-EYE microservices
- **Performance** - Database-specific optimizations under unified API
- **Maintainability** - Single source of truth for data access patterns

### 📋 Requirements

- Node.js >= 18.0.0
- TypeScript >= 5.0.0
- NestJS >= 10.0.0
- TypeORM >= 0.3.0 (for PostgreSQL services)
- Mongoose >= 7.0.0 (for MongoDB services)

### 🤝 Peer Dependencies

```json
{
  "@nestjs/common": "^10.0.0",
  "@nestjs/core": "^10.0.0",
  "@nestjs/swagger": "^7.0.0",
  "class-validator": "^0.14.0",
  "class-transformer": "^0.5.0",
  "typeorm": "^0.3.0",
  "mongoose": "^7.0.0"
}
```

### 🚀 Migration Guide

For existing GOD-EYE microservices, see the [Migration Guide](./docs/MIGRATION.md) for step-by-step instructions on adopting the unified data contracts system.

### 📚 Documentation

- [README.md](./README.md) - Complete usage guide with examples
- [API Documentation](./docs/API.md) - Detailed API reference
- [Migration Guide](./docs/MIGRATION.md) - Upgrade existing services

---

## Built with ❤️ for the GOD-EYE microservices ecosystem

## [0.1.0] - 2023-10-01
