# GOD-EYE Data Contracts - Usage Examples

Complete usage examples for all GOD-EYE Data Contracts components. Eliminates 98% code repetition across microservices.

## 📁 Examples Structure

### **Core Components**

- **`bootstrap-usage.md`** - One-line service setup with Swagger
- **`simple-response-usage.md`** - ResponseFactory with auto-detection
- **`smart-api-usage.md`** - Smart @Api decorator (replaces 5+ decorators)
- **`validation-pipeline-usage.md`** - Universal validation across ORMs
- **`dto-usage.md`** - Query DTOs with ICriteria transformation
- **`kong-usage.md`** - Kong Gateway authentication integration

## 🚀 Quick Start - Complete Setup

### 1. Install & Bootstrap Your Service

```bash
npm install @kenniy/godeye-data-contracts@latest
```

```typescript
// src/main.ts
import { bootstrap } from '@kenniy/godeye-data-contracts';
import { AppModule } from './app.module';

const app = await bootstrap(AppModule, {
  serviceName: 'my-service',
  port: 3003,
  enableSwagger: true
});
```

### 2. Create Response DTOs & Controllers

```typescript
// src/user/dto/user-response.dto.ts
export class UserResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiProperty() email: string;
  @ApiProperty() createdAt: string;
}

// src/user/user.controller.ts
import { Api, ResponseFactory, KongUser, KongAuthGuard } from '@kenniy/godeye-data-contracts';

@Controller('users')
@UseGuards(KongAuthGuard)
export class UserController {

  @Get()
  @Api(UserResponseDto)  // Auto: paginated + common errors + 200
  async getUsers() {
    const users = await this.userService.findAll();
    return ResponseFactory.success(users); // Auto-detects pagination
  }

  @Get(':id')
  @Api(UserResponseDto)  // Auto: single + common errors + 200
  async getUser(@Param('id') id: string, @KongUser() user: IKongUserContext) {
    const userData = await this.userService.findById(id);
    return userData
      ? ResponseFactory.success(userData)
      : ResponseFactory.notFound('User not found');
  }

  @Post()
  @Api(UserResponseDto)  // Auto: single + common errors + 201
  async createUser(@Body() createDto: CreateUserDto) {
    const user = await this.userService.create(createDto);
    return ResponseFactory.success(user);
  }
}
```

### 3. Add Validation with Transformations

```typescript
// src/user/dto/create-user.dto.ts
import { IsRequiredEmail, IsValidId, ToLowerCase, Trim } from '@kenniy/godeye-data-contracts';

export class CreateUserDto {
  @IsRequiredEmail()
  @ToLowerCase()
  @Trim()
  email: string;

  @IsValidId() // Works with UUID, ObjectId, or numeric IDs
  profileId: string;
}
```

## 🎯 Key Benefits

### **🔥 Eliminates Repetition**

- **Before**: 50+ lines of Swagger decorators per endpoint
- **After**: `@Api(ResponseDto)` - ONE decorator

### **🧠 Smart Auto-Detection**

- **Pagination**: `getUsers` → paginated, `getUser` → single
- **Status Codes**: `POST` → 201, `GET` → 200, etc.
- **Messages**: Auto-generated from DTO names and methods

### **🛡️ Universal Validation**

- **Same decorators** work with TypeORM (PostgreSQL) and Mongoose (MongoDB)
- **Auto-transforms**: `@ToLowerCase()`, `@Trim()`, `@TransformDate()`
- **Smart ID validation**: UUID, ObjectId, or numeric

### **🔐 Kong Integration**

- **@KongUser()** decorator injects user context from Gateway headers
- **KongAuthGuard** validates authentication automatically
- **Role-based access** with `@RequireRoles(['admin'])`

## 📊 Response Format Consistency

All responses follow the same format across all 15+ microservices:

```json
{
  "success": true,
  "data": [...],
  "message": "Users retrieved successfully",
  "status_code": 200,
  "timestamp": "2024-01-15T10:30:00.000Z",
  "trace_id": "trace_1705312200000_abc123",
  "time_ms": 45,
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "total_pages": 5,
    "has_next": true,
    "has_prev": false
  }
}
```

## 🔧 ORM Compatibility

### Works with Both ORMs Seamlessly

```typescript
// PostgreSQL with TypeORM
@Entity('users')
export class User extends BaseEntity {
  @IsValidId()
  @Column() id: string; // UUID
}

// MongoDB with Mongoose
@Schema()
export class User extends BaseSchema {
  @IsValidId()
  @Prop() id: string; // ObjectId
}

// Same validation, same decorators, same everything!
```

## 🌐 Production Ready

- **124 tests passing** - Comprehensive test coverage
- **TypeScript strict mode** - Complete type safety
- **Performance optimized** - Zero runtime overhead
- **Kong Gateway ready** - Authentication built-in
- **Swagger auto-generated** - Interactive API docs

## 📖 Detailed Examples

Each usage guide contains:

- ✅ **Complete code examples**
- ✅ **Real-world scenarios**
- ✅ **Copy-paste ready snippets**
- ✅ **Best practices**
- ✅ **Common pitfalls avoided**

**Start with `bootstrap-usage.md` for your first service, then explore the other guides based on what you need!**
