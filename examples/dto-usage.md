# DTO Usage with ICriteria

This guide shows how to create clean, validated DTOs that auto-transform to ICriteria for universal query handling.

## Base DTO Structure

### Universal Base Query DTO

```typescript
import { IsOptional, IsNumber, IsString, IsArray, IsEnum, Min, Max } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Base Query DTO - Universal for all entities
 * Auto-transforms to ICriteria format
 */
export class BaseQueryDto {
  @ApiPropertyOptional({ example: 1, description: 'Page number (1-based)' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ example: 20, description: 'Items per page', minimum: 1, maximum: 100 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 20;

  @ApiPropertyOptional({
    example: 'id,name,email,profile,business',
    description: 'Fields and relations to include in response (comma-separated)'
  })
  @IsOptional()
  @IsString()
  include?: string;

  @ApiPropertyOptional({
    example: 'createdAt:DESC,name:ASC',
    description: 'Sort fields with direction (field:ASC/DESC)'
  })
  @IsOptional()
  @IsString()
  sort?: string;

  @ApiPropertyOptional({ example: 'john doe', description: 'Search term' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    example: 'name,email',
    description: 'Fields to search in (comma-separated)'
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => typeof value === 'string' ? value.split(',').map(s => s.trim()) : value)
  searchFields?: string[];

  @ApiPropertyOptional({
    example: 'active',
    enum: ['active', 'inactive', 'deleted'],
    description: 'Entity status'
  })
  @IsOptional()
  @IsEnum(['active', 'inactive', 'deleted'])
  status?: 'active' | 'inactive' | 'deleted';

  /**
   * Auto-transform DTO to ICriteria with unified include handling
   */
  toICriteria(): ICriteria<any> {
    const includeFields = this.parseInclude(this.include);

    return {
      page: this.page,
      limit: this.limit,
      relations: includeFields.relations,
      select: includeFields.fields,
      sort: this.parseSortString(this.sort),
      search: this.search ? {
        term: this.search,
        fields: this.searchFields || ['name']
      } : undefined,
      where: this.buildWhereClause()
    };
  }

  /**
   * Parse unified include parameter into relations and fields
   * Auto-detects whether each item is a relation or field
   */
  protected parseInclude(includeStr?: string): { relations: string[], fields: string[] } {
    if (!includeStr) return { relations: [], fields: [] };

    const items = includeStr.split(',').map(s => s.trim());
    const relations: string[] = [];
    const fields: string[] = [];

    // Define known relations for this entity (override in subclasses)
    const knownRelations = this.getKnownRelations();

    items.forEach(item => {
      if (knownRelations.includes(item)) {
        relations.push(item);
      } else {
        fields.push(item);
      }
    });

    return { relations, fields };
  }

  /**
   * Override in entity-specific DTOs to define known relations
   * Base implementation returns common relations
   */
  protected getKnownRelations(): string[] {
    return ['createdBy', 'updatedBy']; // Common audit relations
  }

  protected parseSortString(sortStr?: string): Record<string, 'ASC' | 'DESC'> | undefined {
    if (!sortStr) return undefined;

    const sortObj: Record<string, 'ASC' | 'DESC'> = {};
    sortStr.split(',').forEach(item => {
      const [field, direction = 'ASC'] = item.split(':');
      sortObj[field.trim()] = (direction.toUpperCase() as 'ASC' | 'DESC');
    });

    return sortObj;
  }

  protected buildWhereClause(): any {
    const where: any = {};

    if (this.status) {
      where.status = this.status;
    }

    return Object.keys(where).length > 0 ? where : undefined;
  }
}
```

### FindMany DTO

```typescript
/**
 * Find Many DTO - For paginated list endpoints
 * Extends BaseQueryDto with list-specific features
 */
export class FindManyDto extends BaseQueryDto {
  @ApiPropertyOptional({ example: 50, description: 'Maximum items per page', maximum: 100 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 20;

  @ApiPropertyOptional({ example: true, description: 'Include total count for pagination' })
  @IsOptional()
  @Type(() => Boolean)
  includeTotalCount?: boolean = true;
}
```

### FindOne DTO

```typescript
/**
 * Find One DTO - For single entity endpoints
 * Uses unified include parameter for both fields and relations
 */
export class FindOneDto {
  @ApiPropertyOptional({
    example: 'id,name,email,profile,business',
    description: 'Fields and relations to include in response (comma-separated)'
  })
  @IsOptional()
  @IsString()
  include?: string;

  /**
   * Convert to ICriteria for single entity lookup
   */
  toICriteria(id: string | number): ICriteria<any> {
    const includeFields = this.parseInclude(this.include);

    return {
      where: { id },
      relations: includeFields.relations,
      select: includeFields.fields
    };
  }

  /**
   * Parse unified include parameter - override in entity-specific DTOs
   */
  protected parseInclude(includeStr?: string): { relations: string[], fields: string[] } {
    if (!includeStr) return { relations: [], fields: [] };

    const items = includeStr.split(',').map(s => s.trim());
    const relations: string[] = [];
    const fields: string[] = [];

    // Base implementation treats all as fields (override in subclasses)
    const knownRelations = this.getKnownRelations();

    items.forEach(item => {
      if (knownRelations.includes(item)) {
        relations.push(item);
      } else {
        fields.push(item);
      }
    });

    return { relations, fields };
  }

  protected getKnownRelations(): string[] {
    return []; // Override in entity-specific DTOs
  }
}
```

## Entity-Specific DTOs

### User Query DTO

```typescript
/**
 * User-specific Query DTO
 * Extends base with User entity fields and relations
 */
export class UserQueryDto extends BaseQueryDto {
  @ApiPropertyOptional({
    example: 'business',
    enum: ['business', 'individual'],
    description: 'User type filter'
  })
  @IsOptional()
  @IsEnum(['business', 'individual'])
  userType?: 'business' | 'individual';

  @ApiPropertyOptional({ example: 'john@example.com', description: 'Filter by email' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({ example: true, description: 'Filter by verification status' })
  @IsOptional()
  @Type(() => Boolean)
  verified?: boolean;

  @ApiPropertyOptional({
    example: '2023-01-01',
    description: 'Created after date (ISO string)'
  })
  @IsOptional()
  @IsString()
  createdAfter?: string;

  @ApiPropertyOptional({
    example: '2023-12-31',
    description: 'Created before date (ISO string)'
  })
  @IsOptional()
  @IsString()
  createdBefore?: string;

  /**
   * Define User entity relations for smart include parsing
   */
  protected getKnownRelations(): string[] {
    return ['profile', 'business', 'posts', 'files', 'createdBy', 'updatedBy'];
  }

  protected buildWhereClause(): any {
    const where = super.buildWhereClause() || {};

    if (this.userType) where.userType = this.userType;
    if (this.email) where.email = this.email;
    if (this.verified !== undefined) where.verified = this.verified;

    // Date range filters
    if (this.createdAfter || this.createdBefore) {
      where.createdAt = {};
      if (this.createdAfter) where.createdAt.$gte = new Date(this.createdAfter);
      if (this.createdBefore) where.createdAt.$lte = new Date(this.createdBefore);
    }

    return where;
  }
}
```

### File Query DTO

```typescript
/**
 * File-specific Query DTO
 * Extends base with File entity fields and relations
 */
export class FileQueryDto extends BaseQueryDto {
  @ApiPropertyOptional({ example: 'user123', description: 'Filter by user ID' })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({
    example: 'image',
    enum: ['image', 'document', 'video', 'audio'],
    description: 'File type filter'
  })
  @IsOptional()
  @IsEnum(['image', 'document', 'video', 'audio'])
  fileType?: string;

  @ApiPropertyOptional({ example: 'image/jpeg', description: 'MIME type filter' })
  @IsOptional()
  @IsString()
  mimeType?: string;

  @ApiPropertyOptional({ example: 1000, description: 'Minimum file size in bytes' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  minSize?: number;

  @ApiPropertyOptional({ example: 5000000, description: 'Maximum file size in bytes' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  maxSize?: number;

  /**
   * Define File entity relations for smart include parsing
   */
  protected getKnownRelations(): string[] {
    return ['user', 'folder', 'tags', 'metadata', 'createdBy', 'updatedBy'];
  }

  protected buildWhereClause(): any {
    const where = super.buildWhereClause() || {};

    if (this.userId) where.userId = this.userId;
    if (this.fileType) where.fileType = this.fileType;
    if (this.mimeType) where.mimeType = this.mimeType;

    // Size range
    if (this.minSize || this.maxSize) {
      where.size = {};
      if (this.minSize) where.size.$gte = this.minSize;
      if (this.maxSize) where.size.$lte = this.maxSize;
    }

    return where;
  }
}
```

## Controller Usage Examples

### Users Controller with DTOs

```typescript
import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Users')
@Controller('users')
export class UserController {
  constructor(private readonly userRepository: UserRepository) {}

  @Get()
  @ApiOperation({ summary: 'Get paginated list of users' })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  async getUsers(@Query() queryDto: UserQueryDto) {
    // DTO auto-transforms to ICriteria
    const criteria = queryDto.toICriteria();

    // Repository receives clean ICriteria object
    const result = await this.userRepository.findWithPagination(criteria);

    // Just call success() - system auto-detects pagination!
    return ResponseFactory.success(result, 'Users retrieved successfully');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, description: 'User found' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUser(
    @Param('id') id: string,
    @Query() queryDto: FindOneDto
  ) {
    const criteria = queryDto.toICriteria(id);

    const user = await this.userRepository.findOne(criteria);

    return user
      ? ResponseFactory.success(user, 'User found')
      : ResponseFactory.notFound('User not found');
  }

  @Get('search')
  @ApiOperation({ summary: 'Search users' })
  async searchUsers(@Query() queryDto: UserQueryDto) {
    // Ensure search fields are set for users
    if (queryDto.search && !queryDto.searchFields) {
      queryDto.searchFields = ['name', 'email'];
    }

    const criteria = queryDto.toICriteria();
    const result = await this.userRepository.findWithPagination(criteria);

    // Auto-detects paginated data and formats accordingly
    return ResponseFactory.success(result, 'Search completed');
  }
}
```

### Files Controller with DTOs

```typescript
@ApiTags('Files')
@Controller('files')
export class FileController {
  constructor(private readonly fileRepository: FileRepository) {}

  @Get()
  @ApiOperation({ summary: 'Get files with filtering' })
  async getFiles(@Query() queryDto: FileQueryDto) {
    const criteria = queryDto.toICriteria();

    const result = await this.fileRepository.findWithPagination(criteria);

    // Unified success() auto-detects response type
    return ResponseFactory.success(result, 'Files retrieved successfully');
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get files for specific user' })
  async getUserFiles(
    @Param('userId') userId: string,
    @Query() queryDto: FindManyDto
  ) {
    const criteria = queryDto.toICriteria();
    criteria.where = { ...criteria.where, userId };

    const result = await this.fileRepository.findWithPagination(criteria);

    // Smart response - auto-detects pagination from result structure
    return ResponseFactory.success(result, 'User files retrieved');
  }
}
```

## HTTP Request Examples

### Basic User List

```bash
GET /users?page=1&limit=10&status=active&userType=business
```

**Generated ICriteria:**

```typescript
{
  page: 1,
  limit: 10,
  where: {
    status: 'active',
    userType: 'business'
  }
}
```

### User List with Relations and Sorting

```bash
GET /users?include=id,name,email,profile,business&sort=createdAt:DESC,name:ASC&verified=true
```

**Generated ICriteria:**

```typescript
{
  relations: ['profile', 'business'],  // Auto-detected as relations
  select: ['id', 'name', 'email'],     // Auto-detected as fields
  sort: {
    createdAt: 'DESC',
    name: 'ASC'
  },
  where: { verified: true }
}
```

### User Search with Unified Include

```bash
GET /users?search=john&searchFields=name,email&include=id,name,email,verified,profile&limit=5
```

**Generated ICriteria:**

```typescript
{
  search: {
    term: 'john',
    fields: ['name', 'email']
  },
  relations: ['profile'],                        // Auto-detected as relation
  select: ['id', 'name', 'email', 'verified'],  // Auto-detected as fields
  limit: 5
}
```

### Complex File Query

```bash
GET /files?userId=123&fileType=image&minSize=1000&maxSize=5000000&include=user&sort=createdAt:DESC
```

**Generated ICriteria:**

```typescript
{
  where: {
    userId: '123',
    fileType: 'image',
    size: { $gte: 1000, $lte: 5000000 }
  },
  relations: ['user'],
  sort: { createdAt: 'DESC' }
}
```

### Single User with Relations

```bash
GET /users/123?include=profile,business,posts&select=id,name,email,profile,business
```

**Generated ICriteria:**

```typescript
{
  where: { id: '123' },
  relations: ['profile', 'business', 'posts'],
  select: ['id', 'name', 'email', 'profile', 'business']
}
```

## Key Benefits

### ✅ Clean API Design

- **HTTP-friendly** - Simple URL parameters
- **Validated** - class-validator ensures data integrity
- **Documented** - Swagger auto-generates API docs
- **Type-safe** - Full TypeScript support

### ✅ Universal Pattern

- **Same DTOs** work across all entities
- **Consistent** API design across microservices
- **Extensible** - Easy to add entity-specific filters
- **Maintainable** - Single pattern to learn

### ✅ Auto-Transformation

- **No manual mapping** - DTO.toICriteria() handles everything
- **Repository ready** - ICriteria plugs directly into repositories
- **Performance optimized** - Only includes necessary fields
- **Clean separation** - HTTP layer vs data layer

### ✅ Swagger Integration

- **Auto-documented** - All parameters show in Swagger UI
- **Examples** - Clear usage examples for developers
- **Validation** - Parameter validation visible in docs
- **Interactive** - Test directly from Swagger UI

## Unified Response Handling

### ✨ Smart Response Detection

No more choosing between `.success()` and `.paginated()` - ResponseFactory automatically detects your data type!

```typescript
// OLD WAY (Manual decision required):
return ResponseFactory.paginated(result.items, result.total, page, limit, message);

// NEW WAY (Auto-detection):
return ResponseFactory.success(result, message);
```

### 🎯 How It Works

**ResponseFactory.success()** automatically detects your data structure:

```typescript
// Paginated data (has items, total properties)
const paginatedResult = {
  items: [{ id: 1, name: 'John' }],
  total: 100,
  page: 1,
  limit: 20
};
ResponseFactory.success(paginatedResult, 'Users found');
// → Automatically formats as paginated response

// Single object
const user = { id: 1, name: 'John', email: 'john@example.com' };
ResponseFactory.success(user, 'User found');
// → Standard success response

// Array of items
const users = [{ id: 1, name: 'John' }, { id: 2, name: 'Jane' }];
ResponseFactory.success(users, 'Users found');
// → Standard success response with array data
```

### 🚀 Controller Simplification

**Before:**

```typescript
async getUsers(@Query() query: UserQueryDto) {
  const result = await this.userService.findMany(query.toICriteria());

  // Developer must choose correct method
  return ResponseFactory.paginated(
    result.items,
    result.total,
    result.page,
    result.limit,
    'Users retrieved'
  );
}
```

**After:**

```typescript
async getUsers(@Query() query: UserQueryDto) {
  const result = await this.userService.findMany(query.toICriteria());

  // Just call success - system handles the rest!
  return ResponseFactory.success(result, 'Users retrieved');
}
```

### ✅ Benefits of Unified Approach

- **🎯 Single Method** - Just call `ResponseFactory.success()` for everything
- **⚡ Auto-Detection** - System figures out response format automatically
- **🛡️ Type Safe** - Full TypeScript support maintained
- **🔄 Backward Compatible** - Existing `.paginated()` method still works
- **🧠 Developer Friendly** - No need to remember multiple methods
- **📚 Consistent** - Same pattern across all controllers
