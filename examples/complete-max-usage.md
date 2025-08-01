# Complete Max Usage Example

**From DTO to ResponseFactory Auto-Detection**

This example shows the complete flow with:
- Frontend simple DTO
- Backend whereConfig with search algorithms
- Repository intelligent processing
- ResponseFactory auto-detection

## 1. Entity Setup (TypeORM)

```typescript
import { Entity, PrimaryGeneratedColumn, Column, OneToOne, ManyToOne } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column()
  email: string;

  @Column()
  phone: string;

  @Column({ type: 'simple-array', nullable: true })
  skills: string[];

  @Column()
  city: string;

  @Column()
  status: string;

  @Column({ default: false })
  isDeleted: boolean;

  @Column({ default: true })
  isVerified: boolean;

  @OneToOne(() => Profile)
  profile: Profile;

  @ManyToOne(() => Business)
  business: Business;
}
```

## 2. Repository Setup

### TypeORM Setup
```typescript
import { BaseTypeORMRepository } from '@kenniy/godeye-data-contracts';

export class UserRepository extends BaseTypeORMRepository<User> {
  // Repository automatically inherits all intelligent functionality
  // Supports advanced whereConfig pattern with searchConfig and dynamicConditions
}
```

### Mongoose Setup
```typescript
import { BaseMongooseRepository } from '@kenniy/godeye-data-contracts';

export class UserRepository extends BaseMongooseRepository<User> {
  // Same interface as TypeORM - supports whereConfig pattern
  // Auto-converts relations to populate, where to match conditions
}
```

### Custom Enhanced Repository (Recommended)
```typescript
// For projects using our enhanced repositories with advanced search
import { BaseTypeORMRepository } from './libs/dal/repositories/base'; // Our enhanced version
// or
import { BaseMongooseRepository } from './libs/dal/repositories/base'; // Our enhanced version

export class UserRepository extends BaseTypeORMRepository<User> {
  // Enhanced with complete whereConfig support:
  // - Advanced searchConfig with multiple strategies
  // - Dynamic conditions based on query context
  // - Backward compatibility with package interface
}
```

## 3. Controller Implementation

```typescript
import { Controller, Get, Query, Param } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import {
  FindManyDto,
  FindOneDto,
  IWhereConfig,
  SearchStrategy,
  ResponseFactory
} from '@kenniy/godeye-data-contracts';

@Controller('users')
export class UsersController {
  constructor(private readonly userRepository: UserRepository) {}

  @Get()
  @ApiOperation({ summary: 'Search users with intelligent algorithms' })
  async getUsers(@Query() queryDto: FindManyDto) {
    // Backend defines sophisticated whereConfig
    const whereConfig: IWhereConfig = {
      // Backend-controlled conditions (always applied)
      conditions: {
        status: 'active',
        isDeleted: false,
        isVerified: true
      },

      // Backend-defined search algorithms
      searchConfig: [
        {
          // Name fields group (fuzzy search for typos)
          fields: ["firstName", "lastName"],
          strategies: [SearchStrategy.FUZZY, SearchStrategy.EXACT],
          defaultStrategy: SearchStrategy.FUZZY, // "kenniy" → "Kenny"
          priority: 10,
          weight: 1.0
        },
        {
          // Contact fields group (exact matching)
          fields: ["email", "phone"],
          strategies: [SearchStrategy.EXACT, SearchStrategy.CONTAINS],
          defaultStrategy: SearchStrategy.EXACT,
          priority: 8,
          weight: 0.8
        },
        {
          // Skills array field (contains matching)
          field: "skills",
          isArray: true,
          strategies: [SearchStrategy.CONTAINS],
          defaultStrategy: SearchStrategy.CONTAINS,
          priority: 7,
          weight: 0.7
        }
      ],

      // Dynamic conditions based on context
      dynamicConditions: (criteria) => {
        const dynamic: any = {};

        // If searching, only show complete profiles
        if (criteria.search?.term) {
          dynamic.profileComplete = true;
        }

        return dynamic;
      }
    };

    // Execute with clean separation: whereConfig + queryDto
    const result = await this.userRepository.findWithPagination(whereConfig, queryDto);

    // ResponseFactory auto-detects pagination and formats response
    return ResponseFactory.success(result);
  }

  @Get(':id')
  async getUser(@Param('id') id: string, @Query() queryDto: FindOneDto) {
    const whereConfig: IWhereConfig = {
      conditions: { status: 'active', isDeleted: false }
    };

    const result = await this.userRepository.findById(id, whereConfig, queryDto);

    // ResponseFactory auto-detects single entity format
    return ResponseFactory.success(result);
  }
}
```

## 4. Frontend Usage

### Simple Request
```typescript
// GET /users?search=kenniy javascript&include=profile,business.owner&page=2&limit=50

const queryDto = {
  search: "kenniy javascript",     // Simple search term
  include: "profile,business.owner", // What data they want
  page: 2,
  limit: 50,
  sort: "createdAt:DESC"
};
```

### What Happens Behind the Scenes

1. **Frontend**: Sends simple request
2. **DTO**: Converts to `ICriteria` format
3. **Repository**: Applies whereConfig + intelligent search
4. **Database**: Executes optimized query with fuzzy matching
5. **ResponseFactory**: Auto-detects format and returns structured response

## 5. Generated Response

### Pagination Response (Auto-Detected)
```json
{
  "success": true,
  "message": "Data retrieved successfully",
  "data": {
    "items": [
      {
        "id": "user123",
        "firstName": "Kenny",        // Fuzzy matched "kenniy"
        "lastName": "Developer",
        "email": "kenny@example.com",
        "skills": ["javascript", "typescript"], // Contains matched
        "city": "New York",
        "status": "active",          // Backend applied
        "isDeleted": false,          // Backend applied
        "isVerified": true,          // Backend applied
        "profile": {
          "id": "profile456",
          "bio": "Full stack developer..."
        },
        "business": {
          "id": "business789",
          "name": "Tech Corp",
          "owner": {
            "id": "owner999",
            "firstName": "Business Owner"
          }
        }
      }
    ],
    "total": 147,
    "page": 2,
    "limit": 50,
    "totalPages": 3,
    "hasNext": true,
    "hasPrev": true
  },
  "pagination": {
    "total": 147,
    "page": 2,
    "limit": 50,
    "total_pages": 3
  },
  "metadata": {
    "queryTime": "34ms",
    "searchAlgorithms": ["fuzzy", "exact", "contains"],
    "backendConditions": ["status", "isDeleted", "isVerified"],
    "relationsLoaded": ["profile", "business.owner"],
    "relationErrors": []
  }
}
```

## 6. Key Benefits

✅ **Frontend Simplicity**: Just search + what data they want
✅ **Backend Control**: Full control over algorithms and conditions
✅ **Clean Separation**: whereConfig vs queryDto
✅ **Auto Response Format**: ResponseFactory detects and formats appropriately
✅ **Graceful Error Handling**: Relations fail silently with metadata
✅ **Performance Monitoring**: Query times and metrics included
✅ **Intelligent Search**: Multi-algorithm, multi-field with relevance
✅ **Deep Relations**: Supports nested population (`business.owner`)
✅ **TypeScript Safety**: Full type checking throughout
✅ **Consistent Responses**: Same format across all endpoints
✅ **Dual ORM Support**: Same interface for TypeORM and Mongoose
✅ **Database Agnostic**: Switch between PostgreSQL and MongoDB seamlessly
✅ **Enhanced Repositories**: Advanced whereConfig with backward compatibility

## 7. Search Algorithm Options

| Strategy | Example | Use Case |
|----------|---------|----------|
| `EXACT` | `kenniy` = `kenniy` | Email addresses, IDs |
| `FUZZY` | `kenniy` ≈ `Kenny` | Names (typo tolerance) |
| `CONTAINS` | `kenniy` in `kenniy@email.com` | Partial matching |
| `STARTS_WITH` | `kenniy` in `kenniy123` | Prefix search |
| `ENDS_WITH` | `kenniy` in `mikekenniy` | Suffix search |

## 8. Field Configuration Options

```typescript
{
  // Single field
  field: "firstName",

  // Multiple fields (same weight)
  fields: ["firstName", "lastName"],

  // Array field in database
  field: "skills",
  isArray: true,

  // Search configuration
  defaultStrategy: SearchStrategy.FUZZY,
  priority: 10,
  weight: 1.0
}
```

This pattern provides enterprise-grade search capabilities with frontend simplicity!
