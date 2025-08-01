# Migration Guide - @kenniy/godeye-data-contracts

Complete migration guide for upgrading to the latest version and adopting new patterns.

## Table of Contents

- [Version Migrations](#version-migrations)
- [Pattern Migrations](#pattern-migrations)
- [Breaking Changes](#breaking-changes)
- [Best Practices](#best-practices)

## Version Migrations

### Migrating to v1.2.5 (Latest)

**New Features:**
- Enhanced Swagger UI configuration
- Description optimization system
- External documentation support
- Deep population response support
- Enhanced @Api decorator

**Migration Steps:**

#### 1. Update Package
```bash
npm install @kenniy/godeye-data-contracts@1.2.5
```

#### 2. Update Bootstrap Configuration (Optional)
```typescript
// OLD
const app = await bootstrap(AppModule, {
  serviceName: 'my-service',
  port: 3003,
  enableSwagger: true
});

// NEW - Enhanced Swagger Configuration
const app = await bootstrap(AppModule, {
  serviceName: 'my-service',
  port: 3003,
  enableSwagger: true,
  swaggerConfig: {
    title: 'My Service API',
    description: 'Comprehensive API for my service',
    maxDisplayRequestSize: 10000,
    maxDisplayResponseSize: 10000,
    docUrl: 'https://docs.mycompany.com/my-service' // External docs
  }
});
```

#### 3. Update @Api Decorators (Optional)
```typescript
// OLD
@Api(UserDto, {
  message: "User retrieved successfully",
  description: "Very long description that might clutter Swagger UI..."
})

// NEW - With Description Optimization
@Api(UserDto, {
  message: "User retrieved successfully",
  description: "Very long description that might clutter Swagger UI...",
  optimizeDescription: true,
  descriptionConfig: {
    maxLength: 500,
    truncateAt: 'sentence',
    addTruncationNotice: true
  }
})
```

**No Breaking Changes** - All existing code continues to work.

### Migrating from v1.1.x to v1.2.x

**New Features:**
- Swagger UI enhancements
- Performance optimizations
- Enhanced metadata tracking

**Migration Steps:**
1. Update package: `npm install @kenniy/godeye-data-contracts@latest`
2. All existing code works without changes
3. Optionally adopt new Swagger configurations

### Migrating from v1.0.x to v1.1.x

**New Features:**
- Deep relations support
- Enhanced performance monitoring
- Improved error handling

**Migration Steps:**

#### 1. Update Deep Relations (Optional Enhancement)
```typescript
// OLD - Manual nested queries
const users = await userRepository.find(whereConfig, {
  include: "profile"
});
const businesses = await Promise.all(
  users.map(user => businessRepository.findById(user.businessId, {}, {
    include: "owner"
  }))
);

// NEW - Deep Relations (Single Query)
const users = await userRepository.find(whereConfig, {
  include: "profile,business.owner"
});
```

#### 2. Enhanced Metadata Usage (Automatic)
```typescript
// Automatically enhanced metadata in v1.1.x+
const result = await userRepository.findWithPagination(whereConfig, queryDto);
// Now includes:
// - query_depth
// - relations_populated  
// - total_queries
// - performance metrics
```

## Pattern Migrations

### WhereConfig Pattern (Recommended)

**From:** ICriteria Pattern
**To:** WhereConfig Pattern

#### Before (ICriteria Pattern)
```typescript
// OLD: Frontend controls everything
@Get()
async getUsers(@Query() queryDto: FindManyDto) {
  const criteria = queryDto.toICriteria();
  // Frontend can search any field, no backend control
  const result = await this.userRepository.findWithPagination(criteria);
  return ResponseFactory.success(result);
}
```

#### After (WhereConfig Pattern)
```typescript
// NEW: Backend controls search, frontend provides input
@Get()
async getUsers(@Query() queryDto: FindManyDto) {
  const whereConfig: IWhereConfig = {
    // Backend-controlled conditions (security)
    conditions: {
      status: 'active',
      isDeleted: false
    },
    
    // Backend-defined search intelligence
    searchConfig: [
      {
        fields: ["firstName", "lastName"],
        defaultStrategy: SearchStrategy.FUZZY, // Typo tolerance
        strategies: [SearchStrategy.FUZZY, SearchStrategy.EXACT],
        priority: 10,
        weight: 1.0
      },
      {
        fields: ["email", "phone"],
        defaultStrategy: SearchStrategy.EXACT,
        strategies: [SearchStrategy.EXACT, SearchStrategy.CONTAINS],
        priority: 8,
        weight: 0.8
      }
    ]
  };
  
  // Clean separation: backend config + frontend input
  const result = await this.userRepository.findWithPagination(whereConfig, queryDto);
  return ResponseFactory.success(result);
}
```

**Benefits:**
- Backend controls security and business logic
- Frontend provides simple search input
- Intelligent search with typo tolerance
- Graceful error handling for relations
- Performance monitoring and optimization

### Aggregate Repository Pattern

**From:** Multiple Repository Calls
**To:** Single Aggregate Query

#### Before (Multiple Queries)
```typescript
// OLD: 3+ database calls
async getDashboardData(businessId: string) {
  const agents = await this.agentRepository.find({
    where: { businessId, status: 'active' }
  });
  
  const agentCount = await this.agentRepository.count({
    where: { businessId }
  });
  
  const pendingCount = await this.agentRepository.count({
    where: { businessId, status: 'pending' }
  });
  
  return { agents, agentCount, pendingCount };
}
```

#### After (Single Aggregate Query)
```typescript
// NEW: Single optimized query
async getDashboardData(businessId: string) {
  const config: ComplexQueryConfig = {
    match: { businessId },
    joins: [
      {
        table: 'businesses',
        localField: 'businessId',
        foreignField: 'id',
        as: 'business'
      }
    ],
    aggregations: [
      {
        field: 'id',
        operation: 'COUNT',
        as: 'totalAgents'
      },
      {
        field: 'id',
        operation: 'COUNT',
        condition: { status: 'pending' },
        as: 'pendingAgents'
      }
    ],
    pagination: { page: 1, limit: 20 }
  };
  
  const result = await this.agentRepository.aggregateWithJoins(config);
  return ResponseFactory.success(result);
}
```

**Performance Improvement:** 3x faster (single query vs multiple)

### Response Factory Auto-Detection

**From:** Manual Response Formatting
**To:** Auto-Detection

#### Before (Manual)
```typescript
// OLD: Manual response formatting
@Get()
async getUsers(@Query() queryDto: FindManyDto) {
  const result = await this.userRepository.findWithPagination(whereConfig, queryDto);
  
  return {
    success: true,
    data: {
      items: result.items,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: Math.ceil(result.total / result.limit),
      hasNext: result.page < Math.ceil(result.total / result.limit),
      hasPrev: result.page > 1
    },
    message: "Users retrieved successfully",
    timestamp: new Date().toISOString()
  };
}
```

#### After (Auto-Detection)
```typescript
// NEW: Auto-detection handles everything
@Get()
async getUsers(@Query() queryDto: FindManyDto) {
  const result = await this.userRepository.findWithPagination(whereConfig, queryDto);
  
  // Automatically detects pagination format and creates proper response
  return ResponseFactory.success(result);
}
```

### Enhanced Aggregation Pattern

**From:** Basic MongoDB Aggregation
**To:** Enhanced Algorithms

#### Before (Basic)
```typescript
// OLD: Basic aggregation
async getReports() {
  return this.userRepository.aggregate([
    { $match: { status: 'active' } },
    { $group: { _id: '$type', count: { $sum: 1 } } }
  ]);
}
```

#### After (Enhanced)
```typescript
// NEW: Enhanced with adaptive optimization
async getReports() {
  const config: EnhancedQueryConfig = {
    match: { status: 'active' },
    groupBy: { type: '$type' },
    aggregations: [{ operation: 'COUNT', as: 'count' }],
    
    // Automatic optimization based on data size
    strategy: AggregationStrategy.HYBRID,
    optimization: QueryOptimizationLevel.ADVANCED,
    
    // Performance monitoring
    enableAnalytics: true,
    cacheResults: true,
    cacheTimeout: 300
  };
  
  const result = await this.userRepository.findWithEnhancedPagination(config);
  return ResponseFactory.success(result);
}
```

## Breaking Changes

### None in v1.2.x

Version 1.2.x maintains complete backward compatibility. All existing code continues to work without modification.

### None in v1.1.x

Version 1.1.x introduced new features but maintained backward compatibility.

### v1.0.x to v1.1.x (No Breaking Changes)

All v1.0.x code continues to work in v1.1.x. New features are additive:
- Deep relations are optional enhancements
- Enhanced metadata is automatically included
- All existing DTOs and repositories work unchanged

## Best Practices

### 1. Adopt WhereConfig Pattern Gradually

**Recommended Migration Order:**
1. Start with new endpoints using WhereConfig
2. Migrate high-traffic endpoints for performance benefits
3. Gradually migrate remaining endpoints
4. Keep ICriteria for internal/admin endpoints if needed

### 2. Use Deep Relations for Performance

**When to Use:**
```typescript
// GOOD: Replace multiple queries
// OLD: 3 queries
const user = await userRepository.findById(id);
const profile = await profileRepository.findById(user.profileId);
const business = await businessRepository.findById(user.businessId);

// NEW: 1 query
const user = await userRepository.findById(id, whereConfig, {
  include: "profile,business.owner"
});
```

### 3. Leverage Aggregate Repositories

**Use Cases:**
- Dashboard data requiring multiple counts/sums
- Reports with joins and aggregations  
- Analytics requiring complex calculations
- Any scenario with 3+ related queries

### 4. Implement Progressive Enhancement

**Adoption Strategy:**
```typescript
// Phase 1: Basic implementation
class UserService {
  async getUsers(queryDto: FindManyDto) {
    const criteria = queryDto.toICriteria();
    return this.userRepository.findWithPagination(criteria);
  }
}

// Phase 2: Add WhereConfig
class UserService {
  async getUsers(queryDto: FindManyDto) {
    const whereConfig: IWhereConfig = {
      conditions: { status: 'active' }
    };
    return this.userRepository.findWithPagination(whereConfig, queryDto);
  }
}

// Phase 3: Add Intelligent Search
class UserService {
  async getUsers(queryDto: FindManyDto) {
    const whereConfig: IWhereConfig = {
      conditions: { status: 'active' },
      searchConfig: [
        {
          fields: ["firstName", "lastName"],
          defaultStrategy: SearchStrategy.FUZZY,
          strategies: [SearchStrategy.FUZZY, SearchStrategy.EXACT],
          priority: 10
        }
      ]
    };
    return this.userRepository.findWithPagination(whereConfig, queryDto);
  }
}
```

### 5. Monitor Performance

**Implementation:**
```typescript
// Enable performance monitoring
const result = await this.userRepository.findWithPagination(whereConfig, queryDto);

// Check metadata for performance insights
console.log('Query Time:', result.metadata?.queryTime);
console.log('Relations Loaded:', result.metadata?.relationsLoaded);
console.log('Search Algorithms:', result.metadata?.searchAlgorithms);

// Set up alerts for slow queries
if (result.metadata?.queryTimeMs > 100) {
  // Alert or log slow query
}
```

### 6. Use Bootstrap for New Services

**New Service Setup:**
```typescript
// main.ts
import { bootstrap } from '@kenniy/godeye-data-contracts';
import { AppModule } from './app.module';

async function startService() {
  const app = await bootstrap(AppModule, {
    serviceName: 'new-service',
    port: 3004,
    enableSwagger: true,
    swaggerConfig: {
      title: 'New Service API',
      description: 'Complete API documentation',
      docUrl: 'https://docs.company.com/new-service'
    }
  });
  
  console.log('Service running with full GOD-EYE integration');
}
```

## Migration Timeline Recommendations

### Immediate (Week 1)
- Update to latest version
- Apply Bootstrap to new services
- Start using ResponseFactory auto-detection

### Short Term (Month 1)
- Migrate high-traffic endpoints to WhereConfig pattern
- Implement deep relations for complex queries
- Set up performance monitoring

### Medium Term (Month 2-3)
- Migrate remaining endpoints to WhereConfig
- Implement aggregate repositories for dashboards
- Optimize search configurations based on usage

### Long Term (Month 3+)
- Full ecosystem consistency
- Advanced performance optimizations
- Custom search strategies for specific use cases

This migration guide ensures smooth adoption of new features while maintaining system stability and performance.