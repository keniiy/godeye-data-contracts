# API Reference - @kenniy/godeye-data-contracts v1.2.5

Complete API reference for the GOD-EYE Data Contracts package.

## Table of Contents

- [Repository Classes](#repository-classes)
- [Response Factory](#response-factory)
- [DTO Classes](#dto-classes)
- [Validation System](#validation-system)
- [Authentication](#authentication)
- [Swagger Integration](#swagger-integration)
- [Bootstrap System](#bootstrap-system)
- [Types & Interfaces](#types--interfaces)

## Repository Classes

### BaseTypeORMRepository<T>

Enterprise-grade TypeORM repository with zero runtime overhead.

#### Constructor
```typescript
constructor(
  protected readonly repository: Repository<T>,
  protected readonly entityTarget: EntityTarget<T>
)
```

#### Core Methods

##### findWithPagination()
```typescript
async findWithPagination<R = T>(
  whereConfig: IWhereConfig,
  queryDto: FindManyDto
): Promise<IPaginatedResult<R>>
```

**Parameters:**
- `whereConfig`: Backend-controlled search configuration
- `queryDto`: Frontend pagination and relation parameters

**Returns:** Paginated result with items, total count, and metadata

**Example:**
```typescript
const whereConfig: IWhereConfig = {
  conditions: { status: 'active', isDeleted: false },
  searchConfig: [
    {
      fields: ["firstName", "lastName"],
      defaultStrategy: SearchStrategy.FUZZY,
      strategies: [SearchStrategy.FUZZY, SearchStrategy.EXACT],
      priority: 10,
      weight: 1.0
    }
  ]
};

const result = await userRepository.findWithPagination(whereConfig, queryDto);
```

##### findById()
```typescript
async findById<R = T>(
  id: string | number,
  whereConfig: IWhereConfig,
  queryDto?: FindOneDto
): Promise<R | null>
```

##### find()
```typescript
async find<R = T>(
  whereConfig: IWhereConfig,
  queryDto: FindManyDto
): Promise<R[]>
```

##### create()
```typescript
async create(data: Partial<T>): Promise<T>
```

##### updateById()
```typescript
async updateById<R = T>(
  id: string | number,
  data: Partial<T>
): Promise<R | null>
```

##### deleteById()
```typescript
async deleteById(id: string | number): Promise<boolean>
```

##### bulkOperations()
```typescript
async bulkOperations<R = T>(
  operations: IBulkOperation<T>[]
): Promise<IBulkResult<R>>
```

### BaseMongooseRepository<T>

MongoDB repository with identical interface to TypeORM repository.

#### Constructor
```typescript
constructor(protected readonly model: Model<T>)
```

**Methods:** Same interface as BaseTypeORMRepository

### TypeORMAggregateRepository<T>

Advanced SQL aggregations with JOIN optimization.

#### aggregateWithJoins()
```typescript
async aggregateWithJoins<R = any>(
  config: ComplexQueryConfig
): Promise<PaginatedResult<R>>
```

**Parameters:**
- `config.joins`: Array of join configurations
- `config.aggregations`: Aggregation operations (COUNT, SUM, AVG, etc.)
- `config.groupBy`: Fields to group by
- `config.having`: HAVING clause conditions
- `config.pagination`: Page and limit settings

### MongooseAggregateRepository<T>

MongoDB pipeline aggregations with $facet optimization.

#### aggregateWithPipeline()
```typescript
async aggregateWithPipeline<R = any>(
  config: ComplexQueryConfig
): Promise<PaginatedResult<R>>
```

### EnhancedMongooseRepository<T>

Next-generation algorithms with adaptive query planning.

#### findWithEnhancedPagination()
```typescript
async findWithEnhancedPagination<R = T>(
  config: EnhancedQueryConfig
): Promise<EnhancedPaginatedResult<R>>
```

**Features:**
- Adaptive query planning based on data size
- Intelligent index utilization
- Memory-efficient streaming for large datasets
- Performance analytics and auto-tuning

## Response Factory

### ResponseFactory.success()

Auto-detects response format and creates standardized responses.

```typescript
static success<T>(
  data: T,
  message?: string,
  metadata?: Partial<IResponseMetadata>,
  start_time?: number
): IResponse<T>
```

**Auto-Detection:**
- Pagination data → Pagination response
- Single entity → Entity response
- Array data → Array response

**Example:**
```typescript
// Automatically detects pagination format
return ResponseFactory.success(result);

// Returns:
{
  "success": true,
  "data": {
    "items": [...],
    "total": 147,
    "page": 1,
    "limit": 20,
    "totalPages": 8,
    "hasNext": true,
    "hasPrev": false
  },
  "message": "Operation successful",
  "status_code": 200,
  "time_ms": 34,
  "timestamp": "2025-08-01T10:30:00.000Z",
  "trace_id": "trace_1722164200000_abc123",
  "metadata": {
    "queryTime": "34ms",
    "searchAlgorithms": ["fuzzy", "exact"],
    "relationsLoaded": ["profile", "business"]
  }
}
```

### ResponseFactory.error()

```typescript
static error(
  message: string,
  status_code?: number,
  errors?: any,
  metadata?: Partial<IResponseMetadata>
): IResponse<null>
```

### ResponseFactory.paginated()

```typescript
static paginated<T>(
  items: T[],
  total: number,
  page: number,
  limit: number,
  message?: string,
  metadata?: Partial<IResponseMetadata>
): IResponse<IPaginatedData<T>>
```

## DTO Classes

### FindManyDto

Standard pagination DTO with search and relations.

```typescript
class FindManyDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({value}) => parseInt(value))
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({value}) => parseInt(value))
  @IsInt()
  @Min(1)
  @Max(1000)
  limit?: number = 20;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  include?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sort?: string;
}
```

**Conversion to ICriteria:**
```typescript
const criteria = queryDto.toICriteria();
// Automatically converts:
// - include: "profile,business" → relations: ["profile", "business"]
// - sort: "createdAt:DESC" → sort: { createdAt: "DESC" }
// - page/limit → offset calculation
```

### FindOneDto

Single entity retrieval with relations.

```typescript
class FindOneDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  include?: string;
}
```

### BaseQueryDto

Foundation for custom query DTOs.

```typescript
abstract class BaseQueryDto {
  abstract toICriteria(): ICriteria<any>;
  
  protected parseInclude(include?: string): string[] {
    return include ? include.split(',').map(s => s.trim()) : [];
  }
  
  protected parseSort(sort?: string): Record<string, "ASC" | "DESC"> {
    // Implementation
  }
}
```

## Validation System

### ValidationPipe

Enhanced validation pipe with enterprise error handling.

```typescript
@Injectable()
export class ValidationPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata): any {
    // Custom validation logic with GOD-EYE standards
  }
}
```

### Custom Validators

#### @IsValidId
```typescript
@IsValidId()
userId: string;
```

#### @IsRequiredEmail / @IsOptionalEmail
```typescript
@IsRequiredEmail()
email: string;

@IsOptionalEmail()
optionalEmail?: string;
```

#### @IsPhoneNumber
```typescript
@IsPhoneNumber()
phone: string;
```

#### @IsValidPagination
```typescript
@IsValidPagination()
pagination: PaginationDto;
```

### Transform Decorators

#### @ToLowerCase
```typescript
@ToLowerCase()
@IsString()
username: string;
```

#### @Trim
```typescript
@Trim()
@IsString()
name: string;
```

#### @TransformDate
```typescript
@TransformDate()
@IsDate()
birthDate: Date;
```

## Authentication

### Kong Gateway Integration

#### KongAuthGuard
```typescript
@UseGuards(KongAuthGuard)
@Controller('users')
export class UsersController {
  @Get('profile')
  getProfile(@KongUser() user: IKongUserContext) {
    return this.userService.getProfile(user.id);
  }
}
```

#### @RequireRoles
```typescript
@RequireRoles(['admin', 'manager'])
@Get('admin-data')
getAdminData() {
  // Only accessible to admin/manager roles
}
```

#### IKongUserContext Interface
```typescript
interface IKongUserContext {
  id: string;
  email: string;
  userType: string;
  roles: string[];
  permissions: IUserPermissions;
  businessId?: string;
  metadata: Record<string, any>;
}
```

## Swagger Integration

### @Api Decorator

Smart decorator that handles everything automatically.

```typescript
@Api(UserResponseDto, {
  message: "User retrieved successfully",
  paginated: true,
  errors: [404, 500],
  description: "Get user with profile and business data"
})
@Get()
async getUsers(@Query() queryDto: FindManyDto) {
  const result = await this.userRepository.findWithPagination(whereConfig, queryDto);
  return ResponseFactory.success(result);
}
```

**Auto-Detection:**
- HTTP method → Status code
- Method name → Pagination detection
- Response DTO → Schema generation
- Common errors → Error responses

### ApiResponseWithOptimizedDescription

Enhanced decorator with smart description truncation.

```typescript
@ApiResponseWithOptimizedDescription(UserDto, {
  description: "Very long description that will be truncated...",
  descriptionConfig: {
    maxLength: 500,
    truncateAt: 'sentence',
    addTruncationNotice: true
  }
})
```

## Bootstrap System

### bootstrap()

One-line service setup with full configuration.

```typescript
async function bootstrap(
  AppModule: any,
  config: BootstrapConfig
): Promise<INestApplication>
```

#### BootstrapConfig Interface
```typescript
interface BootstrapConfig {
  serviceName: string;
  port: number;
  enableSwagger?: boolean;
  swaggerConfig?: {
    title?: string;
    description?: string;
    version?: string;
    maxDisplayRequestSize?: number;
    maxDisplayResponseSize?: number;
    docUrl?: string;
  };
  corsConfig?: {
    origin?: string | string[];
    credentials?: boolean;
    exposedHeaders?: string[];
  };
  validationPipe?: ValidationPipeOptions;
  globalPrefix?: string;
}
```

**Example:**
```typescript
const app = await bootstrap(AppModule, {
  serviceName: 'user-service',
  port: 3001,
  enableSwagger: true,
  swaggerConfig: {
    title: 'User Service API',
    description: 'GOD-EYE User Management Service',
    docUrl: 'https://docs.godeye.com/user-service'
  }
});
```

## Types & Interfaces

### IWhereConfig

Backend search configuration interface.

```typescript
interface IWhereConfig {
  conditions?: any;
  searchConfig?: ISearchFieldConfig[];
  dynamicConditions?: (criteria: ICriteria<any>) => any;
}
```

### ISearchFieldConfig

Search field configuration for intelligent searching.

```typescript
interface ISearchFieldConfig {
  field?: string;
  fields?: string[];
  isArray?: boolean;
  strategies: SearchStrategy[];
  defaultStrategy: SearchStrategy;
  priority: number;
  weight?: number;
}
```

### SearchStrategy Enum

```typescript
enum SearchStrategy {
  EXACT = "exact",           // kenniy = kenniy
  FUZZY = "fuzzy",           // kenniy ≈ Kenny
  CONTAINS = "contains",     // kenniy in "kenniy@email.com"
  STARTS_WITH = "startsWith", // kenniy in "kenniy123"
  ENDS_WITH = "endsWith",    // kenniy in "mikekenniy"
  SOUNDEX = "soundex",       // phonetic matching
  SKIP = "skip"              // exclude field
}
```

### ICriteria<T>

ORM-agnostic query criteria interface.

```typescript
interface ICriteria<T> {
  where?: Partial<T> | Record<string, any>;
  include?: string[] | string;
  relations?: string[];
  select?: string[];
  sort?: Record<string, "ASC" | "DESC" | 1 | -1>;
  limit?: number;
  offset?: number;
  page?: number;
  search?: ISearchCriteria;
}
```

### IPaginatedResult<T>

Standardized pagination result format.

```typescript
interface IPaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  metadata?: IQueryMetrics;
}
```

### IResponse<T>

Standardized API response format.

```typescript
interface IResponse<T> {
  success: boolean;
  data: T;
  message: string;
  status_code: number;
  time_ms: number;
  timestamp: string;
  trace_id: string;
  metadata?: IResponseMetadata;
  pagination?: IPagination;
}
```

## Performance Constants

### PAGINATION_CONSTANTS
```typescript
const PAGINATION_CONSTANTS = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 1000,
  MIN_LIMIT: 1,
} as const;
```

### PERFORMANCE_THRESHOLDS
```typescript
const PERFORMANCE_THRESHOLDS = {
  FAST_QUERY: 10,        // < 10ms - Excellent
  ACCEPTABLE_QUERY: 50,  // < 50ms - Good
  SLOW_QUERY: 100,       // < 100ms - Needs optimization
  CRITICAL_QUERY: 500,   // > 500ms - Critical issue
  TIMEOUT_QUERY: 30000,  // 30s - Timeout threshold
} as const;
```

## Error Handling

### RepositoryErrorType Enum
```typescript
enum RepositoryErrorType {
  VALIDATION_ERROR = "VALIDATION_ERROR",
  DUPLICATE_ERROR = "DUPLICATE_ERROR",
  NOT_FOUND_ERROR = "NOT_FOUND_ERROR",
  CONNECTION_ERROR = "CONNECTION_ERROR",
  TIMEOUT_ERROR = "TIMEOUT_ERROR",
  TRANSACTION_ERROR = "TRANSACTION_ERROR",
  PERMISSION_ERROR = "PERMISSION_ERROR",
  QUERY_ERROR = "QUERY_ERROR",
  NETWORK_ERROR = "NETWORK_ERROR",
  RESOURCE_EXHAUSTED = "RESOURCE_EXHAUSTED",
}
```

### Entity Status Constants
```typescript
enum EntityStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  DELETED = "deleted",
  PENDING = "pending",
  ARCHIVED = "archived",
}

enum VerificationStatus {
  PENDING = "pending",
  VERIFIED = "verified",
  REJECTED = "rejected",
  UNDER_REVIEW = "under_review",
  SUSPENDED = "suspended",
}
```

This API reference provides complete documentation for all classes, methods, interfaces, and constants in the GOD-EYE Data Contracts package v1.2.5.