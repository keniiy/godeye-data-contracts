# Best Practices Guide - @kenniy/godeye-data-contracts

Comprehensive guide for implementing enterprise-grade patterns with GOD-EYE Data Contracts.

## Table of Contents

- [Repository Design Patterns](#repository-design-patterns)
- [Search Configuration](#search-configuration)
- [Performance Optimization](#performance-optimization)
- [Error Handling](#error-handling)
- [Security Practices](#security-practices)
- [Testing Strategies](#testing-strategies)
- [Production Deployment](#production-deployment)

## Repository Design Patterns

### WhereConfig Pattern Implementation

**Recommended Approach:**

```typescript
@Injectable()
export class UserService {
  constructor(private readonly userRepository: BaseTypeORMRepository<User>) {}

  async getUsers(queryDto: FindManyDto): Promise<IResponse<IPaginatedData<User>>> {
    // 1. Define backend-controlled security conditions
    const whereConfig: IWhereConfig = {
      conditions: {
        status: 'active',
        isDeleted: false,
        isVerified: true // Security: Only verified users
      },
      
      // 2. Configure intelligent search fields
      searchConfig: [
        {
          // High-priority fields (exact matches boost relevance)
          fields: ["email", "username"],
          strategies: [SearchStrategy.EXACT, SearchStrategy.CONTAINS],
          defaultStrategy: SearchStrategy.EXACT,
          priority: 10,
          weight: 1.0
        },
        {
          // Name fields (fuzzy matching for typos)
          fields: ["firstName", "lastName", "displayName"],
          strategies: [SearchStrategy.FUZZY, SearchStrategy.EXACT],
          defaultStrategy: SearchStrategy.FUZZY,
          priority: 8,
          weight: 0.9
        },
        {
          // Array fields (skills, tags, etc.)
          field: "skills",
          isArray: true,
          strategies: [SearchStrategy.CONTAINS],
          defaultStrategy: SearchStrategy.CONTAINS,
          priority: 6,
          weight: 0.7
        }
      ],
      
      // 3. Dynamic conditions based on search context
      dynamicConditions: (criteria) => {
        const dynamic: any = {};
        
        // Only show complete profiles when searching
        if (criteria.search?.term) {
          dynamic.profileComplete = true;
        }
        
        // Admin users can see more data
        if (this.isAdminUser()) {
          delete dynamic.isVerified; // Remove verification filter
        }
        
        return dynamic;
      }
    };

    const result = await this.userRepository.findWithPagination(whereConfig, queryDto);
    return ResponseFactory.success(result);
  }
}
```

**Benefits:**
- Security through backend-controlled conditions
- Intelligent search with typo tolerance
- Performance optimization through priority weighting
- Context-aware filtering

### Repository Inheritance Strategy

**Recommended Hierarchy:**

```typescript
// 1. Base Repository (from package)
abstract class BaseTypeORMRepository<T> {
  // Core functionality provided by package
}

// 2. Domain-Specific Base (per service)
abstract class GODEyeBaseRepository<T> extends BaseTypeORMRepository<T> {
  // Common GOD-EYE business logic
  protected readonly DEFAULT_CONDITIONS = {
    isDeleted: false
  };

  protected buildSecurityConditions(userContext: IKongUserContext): any {
    const conditions = { ...this.DEFAULT_CONDITIONS };
    
    if (userContext.userType === 'business') {
      conditions.businessId = userContext.businessId;
    }
    
    return conditions;
  }
}

// 3. Entity-Specific Repository
@Injectable()
export class UserRepository extends GODEyeBaseRepository<User> {
  constructor(
    @InjectRepository(User) repository: Repository<User>
  ) {
    super(repository, User);
  }

  // Entity-specific methods only
  async findActiveBusinessUsers(businessId: string): Promise<User[]> {
    const whereConfig: IWhereConfig = {
      conditions: {
        ...this.DEFAULT_CONDITIONS,
        businessId,
        userType: 'business',
        status: 'active'
      }
    };
    
    return this.find(whereConfig, {});
  }
}
```

### Aggregate Repository Usage

**When to Use Aggregates:**

```typescript
// GOOD: Replace multiple related queries
async getDashboardMetrics(businessId: string) {
  // OLD: 5+ separate queries
  // const agents = await this.agentRepository.count({businessId});
  // const activeAgents = await this.agentRepository.count({businessId, status: 'active'});
  // const appointments = await this.appointmentRepository.count({businessId});
  // ...
  
  // NEW: Single optimized query
  const config: ComplexQueryConfig = {
    match: { businessId },
    joins: [
      {
        table: 'appointments',
        localField: 'id',
        foreignField: 'agentId',
        as: 'appointments'
      }
    ],
    aggregations: [
      { field: 'id', operation: 'COUNT', as: 'totalAgents' },
      { field: 'id', operation: 'COUNT', condition: { status: 'active' }, as: 'activeAgents' },
      { field: 'appointments.id', operation: 'COUNT', as: 'totalAppointments' },
      { field: 'appointments.rating', operation: 'AVG', as: 'avgRating' }
    ]
  };
  
  return this.aggregateWithJoins(config);
}
```

## Search Configuration

### Field Priority Strategy

**Recommended Priority Levels:**

```typescript
const SEARCH_PRIORITIES = {
  EXACT_MATCH_CRITICAL: 10,    // IDs, email addresses
  EXACT_MATCH_IMPORTANT: 9,    // Usernames, phone numbers
  FUZZY_MATCH_NAMES: 8,        // First name, last name
  CONTAINS_DESCRIPTIVE: 7,     // Descriptions, bio
  ARRAY_FIELDS: 6,             // Skills, tags, categories
  METADATA_FIELDS: 5,          // Secondary information
  HISTORICAL_DATA: 3           // Archived or old data
} as const;

// Implementation
searchConfig: [
  {
    fields: ["email"],
    strategies: [SearchStrategy.EXACT],
    defaultStrategy: SearchStrategy.EXACT,
    priority: SEARCH_PRIORITIES.EXACT_MATCH_CRITICAL,
    weight: 1.0
  },
  {
    fields: ["firstName", "lastName"],
    strategies: [SearchStrategy.FUZZY, SearchStrategy.EXACT],
    defaultStrategy: SearchStrategy.FUZZY,
    priority: SEARCH_PRIORITIES.FUZZY_MATCH_NAMES,
    weight: 0.9
  }
]
```

### Context-Aware Search

**Adaptive Search Based on User Type:**

```typescript
private buildSearchConfig(userContext: IKongUserContext): ISearchFieldConfig[] {
  const baseConfig: ISearchFieldConfig[] = [
    {
      fields: ["firstName", "lastName"],
      defaultStrategy: SearchStrategy.FUZZY,
      strategies: [SearchStrategy.FUZZY, SearchStrategy.EXACT],
      priority: 8,
      weight: 1.0
    }
  ];

  // Admin users get enhanced search capabilities
  if (userContext.roles.includes('admin')) {
    baseConfig.push({
      fields: ["email", "phone", "internalId"],
      defaultStrategy: SearchStrategy.EXACT,
      strategies: [SearchStrategy.EXACT, SearchStrategy.CONTAINS],
      priority: 10,
      weight: 1.0
    });
  }

  // Business users search within their business scope
  if (userContext.userType === 'business') {
    baseConfig.forEach(config => {
      config.weight = config.weight * 0.8; // Reduce weight for scoped search
    });
  }

  return baseConfig;
}
```

## Performance Optimization

### Query Performance Monitoring

**Implementation:**

```typescript
@Injectable()
export class PerformanceMonitoringService {
  private readonly performanceThresholds = {
    FAST: 10,        // < 10ms
    ACCEPTABLE: 50,  // < 50ms  
    SLOW: 100,       // < 100ms
    CRITICAL: 500    // > 500ms
  };

  logQueryPerformance(
    operation: string,
    duration: number,
    entity: string,
    metadata: any
  ) {
    const level = this.getPerformanceLevel(duration);
    
    if (level === 'CRITICAL') {
      // Alert for critical performance issues
      this.alertingService.sendAlert({
        type: 'SLOW_QUERY',
        operation,
        duration,
        entity,
        metadata,
        threshold: this.performanceThresholds.CRITICAL
      });
    }
    
    // Log to application insights / monitoring
    this.telemetryClient.trackDependency({
      target: entity,
      name: operation,
      duration,
      success: level !== 'CRITICAL',
      properties: {
        performanceLevel: level,
        ...metadata
      }
    });
  }
}
```

### Index Strategy

**Database Index Recommendations:**

```typescript
// TypeORM Entity with Strategic Indexes
@Entity('users')
@Index(['status', 'isDeleted']) // Compound index for common filters
@Index(['businessId', 'userType']) // Business scope queries
@Index(['email']) // Unique email lookup
@Index(['createdAt']) // Sorting index
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index() // Individual index for frequent searches
  email: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ type: 'varchar', length: 20 })
  @Index() // Status filtering
  status: string;

  @Column({ default: false })
  @Index() // Soft delete filtering
  isDeleted: boolean;

  @Column()
  @Index() // Business scoping
  businessId: string;
}
```

### Caching Strategy

**Multi-Level Caching:**

```typescript
@Injectable()
export class CachedUserService {
  constructor(
    private readonly userRepository: BaseTypeORMRepository<User>,
    private readonly cacheService: CacheService
  ) {}

  async getUser(id: string): Promise<User | null> {
    // L1: In-memory cache (fastest)
    const memoryKey = `user:${id}`;
    let user = this.memoryCache.get(memoryKey);
    if (user) return user;

    // L2: Redis cache (fast)
    const redisKey = `user:${id}`;
    user = await this.cacheService.get(redisKey);
    if (user) {
      this.memoryCache.set(memoryKey, user, 60); // 1 minute memory cache
      return user;
    }

    // L3: Database (slowest, but source of truth)
    const whereConfig: IWhereConfig = {
      conditions: { isDeleted: false }
    };
    
    user = await this.userRepository.findById(id, whereConfig);
    if (user) {
      await this.cacheService.set(redisKey, user, 300); // 5 minute Redis cache
      this.memoryCache.set(memoryKey, user, 60); // 1 minute memory cache
    }

    return user;
  }

  async updateUser(id: string, data: Partial<User>): Promise<User | null> {
    const user = await this.userRepository.updateById(id, data);
    
    if (user) {
      // Invalidate all cache levels
      this.memoryCache.delete(`user:${id}`);
      await this.cacheService.delete(`user:${id}`);
    }
    
    return user;
  }
}
```

## Error Handling

### Comprehensive Error Strategy

**Layered Error Handling:**

```typescript
@Injectable()
export class UserService {
  async getUsers(queryDto: FindManyDto): Promise<IResponse<IPaginatedData<User>>> {
    try {
      const whereConfig: IWhereConfig = {
        conditions: { status: 'active' },
        searchConfig: [/* search config */]
      };

      const result = await this.userRepository.findWithPagination(whereConfig, queryDto);
      return ResponseFactory.success(result);
      
    } catch (error) {
      return this.handleRepositoryError(error);
    }
  }

  private handleRepositoryError(error: any): IResponse<null> {
    // 1. Log error with context
    this.logger.error('Repository operation failed', {
      error: error.message,
      stack: error.stack,
      operation: 'findWithPagination',
      timestamp: new Date().toISOString()
    });

    // 2. Classify error type
    const errorType = this.classifyError(error);
    
    // 3. Return appropriate response
    switch (errorType) {
      case RepositoryErrorType.CONNECTION_ERROR:
        return ResponseFactory.error(
          'Database connection failed. Please try again.',
          503,
          { code: 'DATABASE_UNAVAILABLE' }
        );
        
      case RepositoryErrorType.TIMEOUT_ERROR:
        return ResponseFactory.error(
          'Request timed out. Please try again with fewer filters.',
          408,
          { code: 'QUERY_TIMEOUT' }
        );
        
      case RepositoryErrorType.VALIDATION_ERROR:
        return ResponseFactory.error(
          'Invalid query parameters.',
          400,
          { code: 'VALIDATION_FAILED', details: error.details }
        );
        
      default:
        return ResponseFactory.error(
          'An unexpected error occurred.',
          500,
          { code: 'INTERNAL_ERROR' }
        );
    }
  }

  private classifyError(error: any): RepositoryErrorType {
    if (error.code === 'ECONNREFUSED') {
      return RepositoryErrorType.CONNECTION_ERROR;
    }
    if (error.message?.includes('timeout')) {
      return RepositoryErrorType.TIMEOUT_ERROR;
    }
    if (error.name === 'ValidationError') {
      return RepositoryErrorType.VALIDATION_ERROR;
    }
    return RepositoryErrorType.QUERY_ERROR;
  }
}
```

### Graceful Degradation

**Fallback Strategies:**

```typescript
async getUsers(queryDto: FindManyDto): Promise<IResponse<IPaginatedData<User>>> {
  try {
    // Primary: Full featured search
    return await this.getFullFeaturedUsers(queryDto);
  } catch (error) {
    this.logger.warn('Full search failed, falling back to basic search', { error });
    
    try {
      // Fallback: Basic search without complex features
      return await this.getBasicUsers(queryDto);
    } catch (fallbackError) {
      this.logger.error('All search methods failed', { fallbackError });
      
      // Last resort: Return empty result with error message
      return ResponseFactory.success({
        items: [],
        total: 0,
        page: queryDto.page || 1,
        limit: queryDto.limit || 20,
        totalPages: 0,
        hasNext: false,
        hasPrev: false
      }, 'Search temporarily unavailable. Please try again later.');
    }
  }
}
```

## Security Practices

### Input Validation & Sanitization

**Multi-Layer Validation:**

```typescript
@Injectable()
export class SecureUserService {
  async searchUsers(
    queryDto: FindManyDto,
    userContext: IKongUserContext
  ): Promise<IResponse<IPaginatedData<User>>> {
    // 1. Validate and sanitize input
    const sanitizedQuery = this.sanitizeQuery(queryDto);
    
    // 2. Apply security context
    const whereConfig: IWhereConfig = {
      conditions: this.buildSecurityConditions(userContext),
      searchConfig: this.buildSecureSearchConfig(userContext),
      dynamicConditions: (criteria) => this.applyDynamicSecurity(criteria, userContext)
    };

    const result = await this.userRepository.findWithPagination(whereConfig, sanitizedQuery);
    
    // 3. Filter response data based on permissions
    const filteredResult = this.filterResponseData(result, userContext);
    
    return ResponseFactory.success(filteredResult);
  }

  private sanitizeQuery(queryDto: FindManyDto): FindManyDto {
    return {
      ...queryDto,
      search: queryDto.search ? this.sanitizeSearchTerm(queryDto.search) : undefined,
      page: Math.max(1, Math.min(queryDto.page || 1, 1000)), // Limit page range
      limit: Math.max(1, Math.min(queryDto.limit || 20, 100)), // Limit page size
      include: queryDto.include ? this.sanitizeIncludes(queryDto.include) : undefined
    };
  }

  private sanitizeSearchTerm(term: string): string {
    // Remove potentially dangerous characters
    return term
      .replace(/[<>'"]/g, '') // Remove HTML/SQL injection chars
      .trim()
      .substring(0, 100); // Limit length
  }

  private buildSecurityConditions(userContext: IKongUserContext): any {
    const conditions: any = {
      isDeleted: false,
      status: 'active'
    };

    // Business users can only see their business users
    if (userContext.userType === 'business') {
      conditions.businessId = userContext.businessId;
    }

    // Non-admin users can't see admin accounts
    if (!userContext.roles.includes('admin')) {
      conditions.userType = { $ne: 'admin' };
    }

    return conditions;
  }
}
```

### SQL Injection Prevention

**Parameterized Queries:**

```typescript
// GOOD: Always use parameterized queries
async findUsersByCustomCriteria(filters: any): Promise<User[]> {
  const queryBuilder = this.repository.createQueryBuilder('user');
  
  if (filters.email) {
    queryBuilder.andWhere('user.email = :email', { email: filters.email });
  }
  
  if (filters.status) {
    queryBuilder.andWhere('user.status IN (:...statuses)', { statuses: filters.status });
  }
  
  if (filters.dateRange) {
    queryBuilder.andWhere('user.createdAt BETWEEN :startDate AND :endDate', {
      startDate: filters.dateRange.start,
      endDate: filters.dateRange.end
    });
  }
  
  return queryBuilder.getMany();
}

// BAD: Never use string concatenation
// async findUsers(email: string) {
//   return this.repository.query(`SELECT * FROM users WHERE email = '${email}'`);
// }
```

## Testing Strategies

### Unit Testing Best Practices

**Repository Testing:**

```typescript
describe('UserRepository', () => {
  let repository: UserRepository;
  let mockTypeOrmRepository: jest.Mocked<Repository<User>>;

  beforeEach(() => {
    mockTypeOrmRepository = createMockRepository();
    repository = new UserRepository(mockTypeOrmRepository);
  });

  describe('findWithPagination', () => {
    it('should apply whereConfig conditions correctly', async () => {
      // Arrange
      const whereConfig: IWhereConfig = {
        conditions: { status: 'active', isDeleted: false },
        searchConfig: [{
          fields: ['firstName', 'lastName'],
          defaultStrategy: SearchStrategy.FUZZY,
          strategies: [SearchStrategy.FUZZY],
          priority: 10
        }]
      };
      const queryDto: FindManyDto = { search: 'john', page: 1, limit: 20 };
      
      const expectedResult = {
        items: [createMockUser()],
        total: 1,
        page: 1,
        limit: 20
      };
      
      mockTypeOrmRepository.createQueryBuilder.mockReturnValue(
        createMockQueryBuilder(expectedResult)
      );

      // Act
      const result = await repository.findWithPagination(whereConfig, queryDto);

      // Assert
      expect(mockTypeOrmRepository.createQueryBuilder).toHaveBeenCalledWith('User');
      expect(result).toEqual(expectedResult);
      expect(result.metadata).toBeDefined();
      expect(result.metadata.queryTime).toBeDefined();
    });

    it('should handle search errors gracefully', async () => {
      // Arrange
      const whereConfig: IWhereConfig = { conditions: {} };
      const queryDto: FindManyDto = { search: 'invalid-search' };
      
      mockTypeOrmRepository.createQueryBuilder.mockImplementation(() => {
        throw new Error('Database connection failed');
      });

      // Act & Assert
      await expect(repository.findWithPagination(whereConfig, queryDto))
        .rejects.toThrow('Database connection failed');
    });
  });
});
```

### Integration Testing

**Service Integration Tests:**

```typescript
describe('UserService Integration', () => {
  let app: INestApplication;
  let userService: UserService;
  let testDatabase: TestDatabase;

  beforeAll(async () => {
    testDatabase = await createTestDatabase();
    
    const module = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot(testDatabase.getConfig()),
        TypeOrmModule.forFeature([User])
      ],
      providers: [UserService, UserRepository]
    }).compile();

    app = module.createNestApplication();
    userService = module.get<UserService>(UserService);
    
    await app.init();
  });

  afterAll(async () => {
    await testDatabase.cleanup();
    await app.close();
  });

  describe('getUsers', () => {
    it('should return paginated users with search', async () => {
      // Arrange
      await testDatabase.seed([
        { firstName: 'John', lastName: 'Doe', email: 'john@example.com', status: 'active' },
        { firstName: 'Jane', lastName: 'Smith', email: 'jane@example.com', status: 'active' },
        { firstName: 'Bob', lastName: 'Johnson', email: 'bob@example.com', status: 'inactive' }
      ]);

      const queryDto: FindManyDto = {
        search: 'john',
        page: 1,
        limit: 10
      };

      // Act
      const response = await userService.getUsers(queryDto);

      // Assert
      expect(response.success).toBe(true);
      expect(response.data.items).toHaveLength(2); // John Doe and Bob Johnson
      expect(response.data.total).toBe(2);
      expect(response.metadata.searchAlgorithms).toContain('fuzzy');
    });
  });
});
```

## Production Deployment

### Environment Configuration

**Production Settings:**

```typescript
// production.config.ts
export const productionConfig = {
  database: {
    typeorm: {
      type: 'postgres',
      synchronize: false, // Never auto-sync in production
      logging: ['error', 'warn'], // Minimal logging
      maxQueryExecutionTime: 1000, // 1 second timeout
      acquireTimeout: 60000,
      timeout: 60000,
      cache: {
        type: 'redis',
        options: {
          host: process.env.REDIS_HOST,
          port: parseInt(process.env.REDIS_PORT),
          password: process.env.REDIS_PASSWORD
        }
      },
      extra: {
        max: 100, // Connection pool size
        min: 10,  // Minimum connections
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000
      }
    },
    
    mongodb: {
      maxPoolSize: 100,
      minPoolSize: 10,
      maxIdleTimeMS: 30000,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      readPreference: 'secondaryPreferred',
      writeConcern: { w: 'majority', j: true }
    }
  },

  performance: {
    queryTimeoutMs: 30000,
    slowQueryThresholdMs: 100,
    enableQueryLogging: false, // Disable in high-traffic production
    enablePerformanceMonitoring: true
  },

  security: {
    validateAllInputs: true,
    enableSqlInjectionProtection: true,
    maxSearchTermLength: 100,
    maxPageSize: 100,
    maxIncludeDepth: 5
  }
};
```

### Health Check Implementation

**Comprehensive Health Monitoring:**

```typescript
@Controller('health')
export class HealthController {
  constructor(
    private readonly userRepository: BaseTypeORMRepository<User>,
    private readonly cacheService: CacheService
  ) {}

  @Get()
  async getHealth(): Promise<any> {
    const checks = await Promise.allSettled([
      this.checkDatabase(),
      this.checkCache(),
      this.checkRepositoryPerformance()
    ]);

    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      checks: {
        database: this.getCheckResult(checks[0]),
        cache: this.getCheckResult(checks[1]),
        repository: this.getCheckResult(checks[2])
      }
    };

    health.status = Object.values(health.checks).every(c => c.status === 'healthy')
      ? 'healthy'
      : 'degraded';

    return health;
  }

  private async checkDatabase(): Promise<{ status: string; responseTime: number }> {
    const start = Date.now();
    
    try {
      await this.userRepository.count({ where: {} });
      return {
        status: 'healthy',
        responseTime: Date.now() - start
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        responseTime: Date.now() - start,
        error: error.message
      };
    }
  }
}
```

### Monitoring and Alerting

**Production Monitoring Setup:**

```typescript
@Injectable()
export class ProductionMonitoringService {
  constructor(
    private readonly telemetryClient: TelemetryClient,
    private readonly alertingService: AlertingService
  ) {}

  trackRepositoryOperation(
    operation: string,
    entity: string,
    duration: number,
    success: boolean,
    metadata: any
  ) {
    // Track performance metrics
    this.telemetryClient.trackDependency({
      target: entity,
      name: operation,
      duration,
      success,
      properties: {
        entity,
        operation,
        ...metadata
      }
    });

    // Alert on performance issues
    if (duration > 500) {
      this.alertingService.sendAlert({
        type: 'SLOW_QUERY',
        severity: duration > 1000 ? 'critical' : 'warning',
        entity,
        operation,
        duration,
        metadata
      });
    }

    // Track error patterns
    if (!success) {
      this.telemetryClient.trackException({
        exception: new Error(`Repository operation failed: ${operation}`),
        properties: {
          entity,
          operation,
          ...metadata
        }
      });
    }
  }
}
```

This best practices guide ensures robust, performant, and secure implementation of the GOD-EYE Data Contracts in production environments.