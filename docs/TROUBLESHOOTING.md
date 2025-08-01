# Troubleshooting Guide - @kenniy/godeye-data-contracts

Solutions for common issues when using GOD-EYE Data Contracts.

## Table of Contents

- [Installation Issues](#installation-issues)
- [TypeORM Issues](#typeorm-issues)
- [Mongoose Issues](#mongoose-issues)
- [Search and Query Issues](#search-and-query-issues)
- [Performance Issues](#performance-issues)
- [Authentication Issues](#authentication-issues)
- [Response Factory Issues](#response-factory-issues)
- [Validation Issues](#validation-issues)

## Installation Issues

### Package Not Found
**Error:** `npm ERR! 404 Not Found - GET https://registry.npmjs.org/@kenniy%2fgodeye-data-contracts`

**Solution:**
```bash
# Check if you have access to the private registry
npm login --registry=https://your-private-registry.com

# Or install from specific registry
npm install @kenniy/godeye-data-contracts --registry=https://your-private-registry.com
```

### Peer Dependency Conflicts
**Error:** `npm WARN peerDependencies Warning: package has unmet peer dependency`

**Solution:**
```bash
# Install required peer dependencies
npm install @nestjs/common@^10.0.0 @nestjs/core@^10.0.0 @nestjs/swagger@^7.0.0
npm install class-transformer@^0.5.0 class-validator@^0.14.0
npm install typeorm@^0.3.0 mongoose@^7.0.0
```

### TypeScript Compilation Errors
**Error:** `Cannot find module '@kenniy/godeye-data-contracts' or its corresponding type declarations`

**Solution:**
```bash
# Ensure TypeScript can find the types
npm install --save-dev @types/node

# Add to tsconfig.json
{
  "compilerOptions": {
    "moduleResolution": "node",
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true
  }
}
```

## TypeORM Issues

### Repository Connection Issues
**Error:** `Repository not initialized` or `Connection not established`

**Solution:**
```typescript
// Ensure proper TypeORM module setup
@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'user',
      password: 'password',
      database: 'database',
      entities: [User, Business], // Include all entities
      synchronize: false // Never true in production
    }),
    TypeOrmModule.forFeature([User, Business]) // Register entities
  ],
  providers: [UserRepository, BusinessRepository]
})
export class UserModule {}

// Repository implementation
@Injectable()
export class UserRepository extends BaseTypeORMRepository<User> {
  constructor(
    @InjectRepository(User) repository: Repository<User>
  ) {
    super(repository, User); // Pass both repository and entity target
  }
}
```

### Relation Loading Failures
**Error:** `Cannot query across many-to-many for property` or `Relation not found`

**Solution:**
```typescript
// Check entity relationships are properly defined
@Entity('users')
export class User {
  @ManyToOne(() => Business, business => business.users)
  @JoinColumn({ name: 'business_id' })
  business: Business;

  @OneToOne(() => Profile, profile => profile.user)
  profile: Profile;
}

// Use correct relation names in queries
const whereConfig: IWhereConfig = {
  conditions: { status: 'active' }
};

const result = await userRepository.findWithPagination(whereConfig, {
  include: "business,profile" // Use entity property names, not table names
});
```

### Deep Relations Not Working
**Error:** `Cannot resolve relation path` or relations not populated

**Solution:**
```typescript
// Ensure all intermediate entities are properly defined
@Entity('users')
export class User {
  @ManyToOne(() => Business)
  business: Business;
}

@Entity('businesses')
export class Business {
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'owner_id' })
  owner: User;
}

// Use deep relations correctly
const result = await userRepository.findWithPagination(whereConfig, {
  include: "business.owner" // This will work if relations are defined
});
```

### Performance Issues with Large Datasets
**Error:** Slow queries or memory issues

**Solution:**
```typescript
// Use pagination for large datasets
const whereConfig: IWhereConfig = {
  conditions: { status: 'active' }
};

const result = await userRepository.findWithPagination(whereConfig, {
  page: 1,
  limit: 50, // Reasonable page size
  include: "profile" // Only include necessary relations
});

// For very large datasets, use streaming
const stream = await userRepository.createQueryBuilder('user')
  .where('user.status = :status', { status: 'active' })
  .stream();
```

## Mongoose Issues

### Connection String Problems
**Error:** `MongooseError: The uri parameter to openUri() must be a string`

**Solution:**
```typescript
// Ensure proper MongoDB connection
@Module({
  imports: [
    MongooseModule.forRoot('mongodb://localhost:27017/database', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 50,
      minPoolSize: 5
    }),
    MongooseModule.forFeature([
      { name: 'User', schema: UserSchema },
      { name: 'Business', schema: BusinessSchema }
    ])
  ]
})
export class UserModule {}

// Repository implementation
@Injectable()
export class UserRepository extends BaseMongooseRepository<User> {
  constructor(
    @InjectModel('User') userModel: Model<User>
  ) {
    super(userModel);
  }
}
```

### Population Issues
**Error:** `Cannot populate path` or population not working

**Solution:**
```typescript
// Ensure schema references are correct
const UserSchema = new Schema({
  businessId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Business' // Must match model name
  },
  profileId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Profile' 
  }
});

// Use correct field names for population
const result = await userRepository.findWithPagination(whereConfig, {
  include: "businessId,profileId" // Use field names from schema
});
```

### Aggregation Pipeline Errors
**Error:** `Invalid aggregation pipeline` or aggregation fails

**Solution:**
```typescript
// Check aggregation syntax
const config: ComplexQueryConfig = {
  match: { status: 'active' }, // MongoDB match syntax
  joins: [
    {
      from: 'businesses', // Collection name (plural)
      localField: 'businessId',
      foreignField: '_id',
      as: 'business'
    }
  ],
  aggregations: [
    { field: '_id', operation: 'COUNT', as: 'total' } // Use _id for count
  ]
};
```

## Search and Query Issues

### Search Not Working
**Error:** Search returns no results or incorrect results

**Solution:**
```typescript
// Check search configuration
const whereConfig: IWhereConfig = {
  conditions: { status: 'active' },
  searchConfig: [
    {
      fields: ["firstName", "lastName"], // Ensure these fields exist
      strategies: [SearchStrategy.FUZZY, SearchStrategy.EXACT],
      defaultStrategy: SearchStrategy.FUZZY,
      priority: 10,
      weight: 1.0
    }
  ]
};

// Debug search behavior
console.log('Search term:', queryDto.search);
console.log('Search config:', whereConfig.searchConfig);

const result = await userRepository.findWithPagination(whereConfig, queryDto);
console.log('Search metadata:', result.metadata);
```

### Fuzzy Search Not Finding Results
**Error:** Expected matches not found with fuzzy search

**Solution:**
```typescript
// Adjust fuzzy search sensitivity
const whereConfig: IWhereConfig = {
  searchConfig: [
    {
      fields: ["firstName", "lastName"],
      strategies: [
        SearchStrategy.FUZZY,   // Primary: fuzzy matching
        SearchStrategy.CONTAINS, // Fallback: substring matching
        SearchStrategy.STARTS_WITH // Fallback: prefix matching
      ],
      defaultStrategy: SearchStrategy.FUZZY,
      priority: 10,
      weight: 1.0
    }
  ]
};

// For very strict matching, use exact search
const strictConfig: IWhereConfig = {
  searchConfig: [
    {
      fields: ["email", "username"],
      strategies: [SearchStrategy.EXACT],
      defaultStrategy: SearchStrategy.EXACT,
      priority: 10
    }
  ]
};
```

### Dynamic Conditions Not Applied
**Error:** Dynamic conditions are ignored

**Solution:**
```typescript
const whereConfig: IWhereConfig = {
  conditions: { status: 'active' },
  dynamicConditions: (criteria) => {
    console.log('Dynamic conditions called with:', criteria); // Debug
    
    const dynamic: any = {};
    
    if (criteria.search?.term) {
      dynamic.profileComplete = true;
      console.log('Applied dynamic condition:', dynamic); // Debug
    }
    
    return dynamic;
  }
};
```

## Performance Issues

### Slow Query Performance
**Error:** Queries taking > 100ms consistently

**Solution:**
```typescript
// Check query metadata for performance insights
const result = await userRepository.findWithPagination(whereConfig, queryDto);
console.log('Query performance:', {
  queryTime: result.metadata?.queryTime,
  searchAlgorithms: result.metadata?.searchAlgorithms,
  relationsLoaded: result.metadata?.relationsLoaded
});

// Optimize queries
// 1. Add database indexes
CREATE INDEX idx_users_status_deleted ON users(status, is_deleted);
CREATE INDEX idx_users_search ON users(first_name, last_name);

// 2. Limit relations
const optimizedQuery = {
  include: "profile", // Only include necessary relations
  limit: 20 // Reasonable page size
};

// 3. Use aggregate queries for complex operations
const config: ComplexQueryConfig = {
  match: { businessId: '123' },
  aggregations: [
    { field: 'id', operation: 'COUNT', as: 'total' }
  ]
};
```

### Memory Issues with Large Results
**Error:** `JavaScript heap out of memory` or high memory usage

**Solution:**
```typescript
// Use streaming for large datasets
async function processLargeDataset() {
  const stream = userRepository.createQueryBuilder('user')
    .where('user.status = :status', { status: 'active' })
    .stream();

  for await (const user of stream) {
    // Process one user at a time
    await processUser(user);
  }
}

// Or use pagination with reasonable limits
async function getAllUsersWithPagination() {
  let page = 1;
  const limit = 100;
  let hasMore = true;

  while (hasMore) {
    const result = await userRepository.findWithPagination(whereConfig, {
      page,
      limit
    });

    // Process current page
    await processUsers(result.items);

    hasMore = result.hasNext;
    page++;
  }
}
```

## Authentication Issues

### Kong Headers Not Found
**Error:** `Cannot extract user context from Kong headers`

**Solution:**
```typescript
// Check header configuration
@Controller('users')
@UseGuards(KongAuthGuard)
export class UsersController {
  @Get()
  async getUsers(
    @KongUser() user: IKongUserContext, // This decorator extracts user
    @Query() queryDto: FindManyDto
  ) {
    console.log('Kong user context:', user); // Debug headers
    
    if (!user || !user.id) {
      throw new UnauthorizedException('User context not found');
    }

    return this.userService.getUsers(queryDto, user);
  }
}

// Debug Kong headers manually
@Get('debug-headers')
debugHeaders(@Headers() headers: any) {
  console.log('All headers:', headers);
  console.log('Kong headers:', {
    userId: headers['x-kong-user-id'],
    userEmail: headers['x-kong-user-email'],
    userType: headers['x-kong-user-type']
  });
}
```

### Role-Based Access Not Working
**Error:** `@RequireRoles` decorator not enforcing access

**Solution:**
```typescript
// Ensure guard is applied correctly
@UseGuards(KongAuthGuard) // Must be applied first
@RequireRoles(['admin', 'manager'])
@Get('admin-data')
async getAdminData(@KongUser() user: IKongUserContext) {
  console.log('User roles:', user.roles); // Debug roles
  return this.adminService.getData();
}

// Check role format in Kong headers
// Roles should be comma-separated: "admin,manager,user"
```

## Response Factory Issues

### Auto-Detection Not Working
**Error:** Response format is incorrect or auto-detection fails

**Solution:**
```typescript
// Check data format being passed to ResponseFactory
const result = await userRepository.findWithPagination(whereConfig, queryDto);
console.log('Repository result structure:', {
  hasItems: 'items' in result,
  hasTotal: 'total' in result,
  hasPage: 'page' in result,
  keys: Object.keys(result)
});

// Ensure correct format for auto-detection
if (result.items && result.total !== undefined) {
  // This will be detected as pagination
  return ResponseFactory.success(result);
}

// For manual control, use specific methods
return ResponseFactory.paginated(
  result.items,
  result.total,
  result.page,
  result.limit,
  'Users retrieved successfully'
);
```

### Metadata Missing
**Error:** Response metadata is empty or missing

**Solution:**
```typescript
// Pass metadata explicitly
const result = await userRepository.findWithPagination(whereConfig, queryDto);

return ResponseFactory.success(result, 'Users retrieved', {
  customField: 'customValue',
  queryTime: '45ms'
});

// Or check if repository is providing metadata
console.log('Repository metadata:', result.metadata);
```

## Validation Issues

### DTO Validation Not Working
**Error:** Invalid data passes validation

**Solution:**
```typescript
// Ensure ValidationPipe is applied globally
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true
  }));
  
  await app.listen(3000);
}

// Check DTO decorators
export class FindManyDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1000)
  @Transform(({ value }) => parseInt(value))
  page?: number = 1;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100) // Prevent very long search terms
  search?: string;
}
```

### Custom Validators Not Working
**Error:** `@IsValidId()` or other custom validators not validating

**Solution:**
```typescript
// Ensure custom validators are imported
import { IsValidId, IsRequiredEmail } from '@kenniy/godeye-data-contracts';

export class CreateUserDto {
  @IsRequiredEmail() // From package
  @IsNotEmpty()
  email: string;

  @IsValidId() // From package
  @IsOptional()
  businessId?: string;
}

// Register custom validators if needed
import { registerDecorator } from 'class-validator';

// The package validators should work automatically
```

## Getting Help

### Enable Debug Logging
```typescript
// Add to your service
private readonly logger = new Logger(UserService.name);

async getUsers(queryDto: FindManyDto) {
  this.logger.debug('Getting users with query:', queryDto);
  
  try {
    const result = await this.userRepository.findWithPagination(whereConfig, queryDto);
    this.logger.debug('Query result:', {
      itemCount: result.items.length,
      total: result.total,
      queryTime: result.metadata?.queryTime
    });
    
    return ResponseFactory.success(result);
  } catch (error) {
    this.logger.error('Failed to get users:', error);
    throw error;
  }
}
```

### Common Debug Patterns
```typescript
// 1. Check repository initialization
console.log('Repository initialized:', !!this.userRepository);

// 2. Verify entity relationships
console.log('Entity metadata:', this.userRepository.metadata);

// 3. Test query step by step
const basicQuery = await this.userRepository.find({ conditions: {} }, {});
console.log('Basic query works:', basicQuery.length);

// 4. Check database connection
try {
  await this.userRepository.count({ where: {} });
  console.log('Database connected');
} catch (error) {
  console.log('Database connection failed:', error);
}
```

### Contact Support
If issues persist:
1. Check the [GitHub Issues](https://github.com/kenniy/godeye-data-contracts/issues)
2. Create a minimal reproduction case
3. Include version information: `npm list @kenniy/godeye-data-contracts`
4. Include relevant logs and error messages