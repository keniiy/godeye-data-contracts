# Simple Response Factory Usage

The ResponseFactory automatically detects pagination and provides detailed responses with minimal parameters.

## 🎯 Auto-Detection Magic

Just use `ResponseFactory.success()` - it automatically detects if your data is paginated!

### ✅ Before (Manual & Complex)

```typescript
// Old way - too many parameters!
return ResponseFactory.paginated(
  users.items,
  users.total,
  users.page,
  users.limit,
  'Users retrieved successfully',
  { ms_speed: 89, cache_hit: false },
  start
);
```

### 🌟 After (Auto & Simple)

```typescript
// New way - just 1-2 parameters!
const users = await this.userService.findMany(criteria);
return ResponseFactory.success(users, 'Users retrieved successfully');
// ↑ Auto-detects pagination, auto-adds timing, auto-generates metadata!
```

## 📊 Supported Pagination Formats

The ResponseFactory auto-detects these common pagination formats:

### Format 1: Standard (items/total)

```typescript
const result = {
  items: [{ id: 1, name: 'John' }, { id: 2, name: 'Jane' }],
  total: 50,
  page: 1,    // optional
  limit: 20   // optional
};

return ResponseFactory.success(result, 'Users found');
// ✅ Auto-detected as paginated!
```

### Format 2: Data/Total

```typescript
const result = {
  data: [{ id: 1, name: 'John' }],
  total: 25,
  page: 2,
  limit: 10
};

return ResponseFactory.success(result, 'Data retrieved');
// ✅ Auto-detected as paginated!
```

### Format 3: Results/Count

```typescript
const result = {
  results: [{ id: 1, name: 'John' }],
  count: 100,
  page: 1,
  limit: 20
};

return ResponseFactory.success(result, 'Search completed');
// ✅ Auto-detected as paginated!
```

### Format 4: Rows/TotalCount

```typescript
const result = {
  rows: [{ id: 1, name: 'John' }],
  totalCount: 75,
  page: 3,
  limit: 25
};

return ResponseFactory.success(result, 'Query executed');
// ✅ Auto-detected as paginated!
```

## 🎮 Controller Examples

### Simple List Endpoint

```typescript
@Controller('users')
export class UserController {
  @Get()
  async getUsers(@Query() query: UserQueryDto) {
    // Your repository returns paginated data
    const result = await this.userService.findMany(query.toICriteria());

    // Just call success - everything else is automatic!
    return ResponseFactory.success(result, 'Users retrieved successfully');
  }

  // Output:
  // {
  //   "success": true,
  //   "data": [{ "id": 1, "name": "John" }],
  //   "message": "Users retrieved successfully",
  //   "status_code": 200,
  //   "time_ms": 45,
  //   "timestamp": "2024-01-15T10:30:00.000Z",
  //   "trace_id": "trace_1705312200000_abc123",
  //   "pagination": {
  //     "total": 50,
  //     "page": 1,
  //     "limit": 20,
  //     "total_pages": 3,
  //     "has_next": true,
  //     "has_prev": false
  //   }
  // }
}
```

### Single Item Endpoint

```typescript
@Get(':id')
async getUser(@Param('id') id: string) {
  const user = await this.userService.findById(id);

  return user
    ? ResponseFactory.success(user, 'User found')
    : ResponseFactory.error('User not found', 404);
}

// Single item output:
// {
//   "success": true,
//   "data": { "id": "123", "name": "John Doe" },
//   "message": "User found",
//   "status_code": 200,
//   "time_ms": 25,
//   "timestamp": "2024-01-15T10:30:00.000Z",
//   "trace_id": "trace_1705312200000_xyz789"
// }
```

### Create Endpoint

```typescript
@Post()
async createUser(@Body() createDto: CreateUserDto) {
  try {
    const user = await this.userService.create(createDto);
    return ResponseFactory.success(user, 'User created successfully');
  } catch (error) {
    return ResponseFactory.error('Failed to create user', 500);
  }
}
```

## 🔧 Repository Setup

Make sure your repository returns data in one of the supported formats:

### TypeORM Example (PostgreSQL)

```typescript
@Injectable()
export class UserRepository {
  async findMany(criteria: ICriteria): Promise<{ items: User[]; total: number; page: number; limit: number }> {
    const [items, total] = await this.userRepository.findAndCount({
      where: criteria.where,
      relations: criteria.relations,
      select: criteria.select,
      skip: (criteria.page - 1) * criteria.limit,
      take: criteria.limit,
      order: criteria.sort
    });

    return {
      items,        // ✅ Key word: "items"
      total,        // ✅ Key word: "total"
      page: criteria.page || 1,
      limit: criteria.limit || 20
    };
  }
}
```

### Mongoose Example (MongoDB)

```typescript
@Injectable()
export class FileRepository {
  async findMany(criteria: ICriteria): Promise<{ items: File[]; total: number; page: number; limit: number }> {
    const skip = (criteria.page - 1) * criteria.limit;

    const [items, total] = await Promise.all([
      this.fileModel
        .find(criteria.where)
        .populate(criteria.relations)
        .select(criteria.select)
        .sort(criteria.sort)
        .skip(skip)
        .limit(criteria.limit)
        .exec(),
      this.fileModel.countDocuments(criteria.where)
    ]);

    return {
      items,        // ✅ Auto-detected format
      total,
      page: criteria.page || 1,
      limit: criteria.limit || 20
    };
  }
}
```

## ✅ Summary

### Simple Interface

```typescript
// Success (auto-detects pagination)
ResponseFactory.success(data, message?, metadata?, start_time?)

// Error
ResponseFactory.error(error, message, status_code?, metadata?, start_time?)

// With performance metrics
ResponseFactory.successWithMetrics(data, message?, metadata?, start_time?)
```

### Auto-Magic Features

- ✅ **Auto-detects** 4 common pagination formats
- ✅ **Auto-generates** timing data (time_ms)
- ✅ **Auto-creates** trace IDs for request tracking
- ✅ **Auto-includes** timestamps
- ✅ **Auto-calculates** pagination metadata (total_pages, has_next, has_prev)
- ✅ **Auto-formats** responses consistently

### Benefits

- 🧠 **Simple to use** - Just 1-2 parameters
- 📊 **Rich output** - Detailed response structure
- 🎯 **Consistent** - Same format across all services
- ⚡ **Flexible** - Supports multiple pagination formats
- 🛡️ **Production ready** - Full monitoring capabilities

**Just return your paginated data and call `ResponseFactory.success()` - everything else is automatic!**
