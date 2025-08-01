# @kenniy/godeye-data-contracts v1.2.6

[![npm version](https://badge.fury.io/js/@kenniy%2Fgodeye-data-contracts.svg)](https://badge.fury.io/js/@kenniy%2Fgodeye-data-contracts)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Enterprise Repository Architecture with Intelligent Search

**Zero runtime overhead. Maximum code reuse. Enterprise-ready performance.**

Eliminates 82.5% of repository repetition across TypeORM and Mongoose services with:

- **WhereConfig Pattern**: Clean separation of backend control and frontend requests
- **Intelligent Search**: Multi-algorithm fuzzy search with typo tolerance  
- **Auto-Response Detection**: ResponseFactory automatically formats pagination/array/single entity
- **Graceful Error Handling**: Relations fail silently with detailed metadata
- **Performance Monitoring**: Built-in query timing and metrics
- **Enhanced Swagger UI**: Smart documentation with description optimization
- **Deep Relations**: Nested population with dot notation support

## 📖 Quick Navigation

- [🚀 Quick Start](#-quick-start) - Get up and running in minutes
- [⚡ Core Pattern](#-core-pattern---whereconfig--querydto) - WhereConfig implementation  
- [🔍 Search Features](#-intelligent-search-features) - Multi-algorithm search strategies
- [📚 Complete Documentation](#-complete-documentation) - All docs, examples, and guides
- [🔄 What's New](#-whats-new-in-v126) - Latest v1.2.6 features

## 🚀 Quick Start

```bash
npm install @kenniy/godeye-data-contracts@1.2.6
# or
pnpm add @kenniy/godeye-data-contracts@1.2.6
```

```typescript
import {
  BaseTypeORMRepository,
  FindManyDto,
  IWhereConfig,
  SearchStrategy,
  ResponseFactory,
  bootstrap
} from '@kenniy/godeye-data-contracts';
```

### Bootstrap Your Service

```typescript
// One-line service setup with enhanced Swagger
const app = await bootstrap(AppModule, {
  serviceName: 'my-service',
  port: 3003,
  enableSwagger: true,
  swaggerConfig: {
    title: 'My Service API',
    description: 'Complete API documentation',
    maxDisplayRequestSize: 10000,
    maxDisplayResponseSize: 10000
  }
});
```

## ⚡ Core Pattern - WhereConfig + QueryDto

**The cleanest way to handle complex search with backend control:**

```typescript
@Controller('users')
export class UsersController {
  @Get()
  async getUsers(@Query() queryDto: FindManyDto) {
    // Backend defines search intelligence and conditions
    const whereConfig: IWhereConfig = {
      conditions: {
        status: 'active',
        isDeleted: false
      },
      searchConfig: [
        {
          fields: ["firstName", "lastName"],
          defaultStrategy: SearchStrategy.FUZZY, // Handles typos
          priority: 10,
          weight: 1.0
        }
      ]
    };

    // Clean separation: backend config + frontend request
    const result = await this.userRepository.findWithPagination(whereConfig, queryDto);

    // Auto-detects format (pagination/array/single)
    return ResponseFactory.success(result);
  }
}
```

**Frontend sends simple request:**
```http
GET /users?search=kenniy&include=profile,business&page=1&limit=20
```

**Gets back sophisticated response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "firstName": "Kenny",  // Fuzzy matched "kenniy"
        "profile": { ... },
        "business": { ... }
      }
    ],
    "total": 147,
    "page": 1,
    "limit": 20
  },
  "metadata": {
    "queryTime": "23ms",
    "searchAlgorithms": ["fuzzy"],
    "relationsLoaded": ["profile", "business"]
  }
}
```

## 🔍 Intelligent Search Features

### Search Strategies
| Strategy | Example | Use Case |
|----------|---------|----------|
| `EXACT` | `john` = `john` | IDs, emails |
| `FUZZY` | `kenniy` ≈ `Kenny` | Names (typo tolerance) |
| `CONTAINS` | `java` in `javascript` | Skills, descriptions |
| `STARTS_WITH` | `john` in `john123` | Prefix matching |

### Field Groups
```typescript
{
  // Multiple fields, same algorithm
  fields: ["firstName", "lastName", "displayName"],
  defaultStrategy: SearchStrategy.FUZZY,
  priority: 10,
  weight: 1.0
}
```

### Array Fields
```typescript
{
  // Database array field
  field: "skills",
  isArray: true,
  defaultStrategy: SearchStrategy.CONTAINS,
  priority: 7,
  weight: 0.7
}
```

## 📚 Repository Methods

### 1. Pagination Search
```typescript
const result = await userRepository.findWithPagination(whereConfig, queryDto);
// Returns: { items: [...], total: 147, page: 1, metadata: {...} }
```

### 2. Single Entity
```typescript
const user = await userRepository.findById(id, whereConfig, queryDto);
// Returns: { data: {...}, metadata: {...} }
```

### 3. Array Search
```typescript
const users = await userRepository.find(whereConfig, queryDto);
// Returns: { items: [...], metadata: {...} }
```

## 🏗️ Entity Setup

### TypeORM
```typescript
import { BaseTypeORMRepository } from '@kenniy/godeye-data-contracts';

@Injectable()
export class UserRepository extends BaseTypeORMRepository<User> {
  // Inherits all intelligent functionality
}
```

### Mongoose
```typescript
import { BaseMongooseRepository } from '@kenniy/godeye-data-contracts';

@Injectable()
export class UserRepository extends BaseMongooseRepository<User> {
  // Works with MongoDB too!
}
```

## 📋 Quick Examples

See comprehensive examples in the [Implementation Examples](#implementation-examples-examples) section below, or jump directly to:

- [Complete Max Usage](./examples/complete-max-usage.md) for full feature demonstration
- [Bootstrap Usage](./examples/bootstrap-usage.md) for quick service setup
- [Complete Documentation](#-complete-documentation) for all guides

## 🚦 Response Factory Auto-Detection

The ResponseFactory automatically detects your data format:

```typescript
// Pagination data → Pagination response
ResponseFactory.success({
  items: [...],
  total: 100,
  page: 1,
  limit: 20
});

// Single entity → Entity response
ResponseFactory.success({
  data: { id: "123", name: "John" },
  metadata: { queryTime: "12ms" }
});

// Array data → Array response
ResponseFactory.success({
  items: [...],
  metadata: { count: 5 }
});
```

## 🎯 Key Benefits

- **Frontend Simplicity**: Just `search`, `include`, `page`, `limit`  
- **Backend Control**: Full algorithm and condition control
- **Auto-Population**: Deep relations with graceful error handling
- **Performance**: Optimized queries with monitoring
- **Type Safety**: Full TypeScript support
- **Universal**: Works with TypeORM and Mongoose
- **Enterprise Ready**: Error handling, logging, metrics
- **Enhanced Swagger**: Smart documentation with description optimization
- **Aggregate Queries**: Replace 3-5 database calls with single optimized query

## 📊 Performance

- **Query Optimization**: ~10-20ms for complex searches
- **Parallel Execution**: Count and data queries run in parallel
- **Relation Validation**: Auto-discovery prevents invalid JOINs
- **Memory Efficient**: Optimized query builders
- **Monitoring**: Built-in performance tracking

## 🛠️ Advanced Configuration

### Dynamic Conditions
```typescript
const whereConfig: IWhereConfig = {
  conditions: { status: 'active' },
  dynamicConditions: (criteria) => {
    // Add conditions based on search context
    if (criteria.search?.term) {
      return { profileComplete: true };
    }
    return {};
  }
};
```

### Custom Search Fields
```typescript
searchConfig: [
  {
    fields: ["firstName", "lastName"],
    defaultStrategy: SearchStrategy.FUZZY,
    priority: 10,
    weight: 1.0
  },
  {
    field: "skills",
    isArray: true,
    defaultStrategy: SearchStrategy.CONTAINS,
    priority: 7,
    weight: 0.7
  }
]
```

## 📝 Migration from Old Pattern

**Old Way:**
```typescript
const criteria = queryDto.toICriteria();
return repository.findWithPagination(criteria);
```

**New Way:**
```typescript
const whereConfig = { conditions: { status: 'active' } };
return repository.findWithPagination(whereConfig, queryDto);
```

## 📚 Complete Documentation

### Core Documentation (`/docs`)

- **[Documentation Overview](./docs/README.md)** - Complete documentation index
- **[API Reference](./docs/API-REFERENCE.md)** - All classes, methods, interfaces, and types
- **[Migration Guide](./docs/MIGRATION-GUIDE.md)** - Version upgrades and pattern migrations  
- **[Best Practices](./docs/BEST-PRACTICES.md)** - Enterprise implementation patterns
- **[Troubleshooting](./docs/TROUBLESHOOTING.md)** - Solutions for common issues

### Implementation Examples (`/examples`)

- **[Complete Max Usage](./examples/complete-max-usage.md)** - Full flow with all features
- **[Aggregate Usage](./examples/aggregate-usage.md)** - Replace multiple queries with single aggregation
- **[Bootstrap Usage](./examples/bootstrap-usage.md)** - 30-second service setup guide
- **[Kong Gateway Usage](./examples/kong-usage.md)** - API Gateway integration patterns
- **[Smart API Usage](./examples/smart-api-usage.md)** - Automated Swagger documentation
- **[DTO Usage](./examples/dto-usage.md)** - Frontend integration patterns
- **[Validation Pipeline Usage](./examples/validation-pipeline-usage.md)** - Input validation strategies

### Performance & Testing

- **[Performance Benchmarks](./performance/benchmark-results.md)** - Enterprise-grade performance analysis
- **[Test Documentation](./src/tests/README.md)** - 167 comprehensive tests coverage

## 🧪 Testing

The package includes comprehensive tests demonstrating all functionality:

```bash
npm test
```

## 🔄 What's New in v1.2.6

### Complete Documentation Suite

- **NEW**: Comprehensive documentation in `/docs` directory
- **NEW**: API Reference with all classes, methods, and interfaces
- **NEW**: Migration Guide for version upgrades and pattern transitions
- **NEW**: Best Practices Guide for enterprise implementation
- **NEW**: Troubleshooting Guide with solutions for common issues
- Updated README with navigation and comprehensive linking

### Enhanced Swagger UI

- Smart description truncation with external doc linking
- Custom CSS and responsive design improvements  
- Dynamic service titles and enhanced navigation
- Configurable display limits for better performance

### Deep Population Support

- Enhanced schemas for deeply nested objects
- Rich metadata tracking for performance analysis
- Support for complex populated responses

### Description Optimization

- Intelligent truncation respects sentence boundaries
- External documentation integration
- Cleaner API documentation

## 📄 License

MIT © [kenniy](https://github.com/kenniy)

---

**Ready to use in production!** This architecture powers high-performance microservices with intelligent search capabilities.
