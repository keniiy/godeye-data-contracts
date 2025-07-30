# Bootstrap Usage Guide

How to quickly add Swagger documentation and ResponseFactory patterns to your existing GOD-EYE microservice.

## 🎯 Quick Start (30 seconds)

### 1. Install Package

```bash
npm install @kenniy/godeye-data-contracts@latest
```

### 2. Bootstrap Your API Documentation

```typescript
// src/main.ts
import { bootstrap } from '@kenniy/godeye-data-contracts';
import { AppModule } from './app.module';

async function startService() {
  const app = await bootstrap(AppModule, {
    serviceName: 'my-service',
    port: 3003,
    enableSwagger: true
  });

  console.log('🚀 Service running on port 3003');
  console.log('📚 Swagger: http://localhost:3003/docs');
}

startService();
```

**That's it! Your service now has:**

- ✅ ResponseFactory integration
- ✅ Smart @Api decorators available
- ✅ Auto-generated Swagger documentation
- ✅ Global validation pipes
- ✅ Consistent error responses

## 🔧 Configuration Options

### Basic Configuration

```typescript
// src/main.ts
import { bootstrap } from '@kenniy/godeye-data-contracts';
import { AppModule } from './app.module';

const app = await bootstrap(AppModule, {
  serviceName: 'my-service',
  port: 3003,
  globalPrefix: 'api',
  enableSwagger: true,
  corsEnabled: true
});
```

### Advanced Configuration

```typescript
// src/main.ts
const app = await bootstrap(AppModule, {
  serviceName: 'my-service',
  port: parseInt(process.env.PORT) || 3003,
  globalPrefix: 'api',

  // Swagger options
  swagger: {
    enabled: true,
    title: 'My Service API',
    description: 'API documentation with ResponseFactory patterns',
    version: '1.0.0',
    path: 'docs'
  },

  // CORS options
  cors: {
    enabled: true,
    origins: ['http://localhost:3000'],
    credentials: true
  },

  // Validation options
  validation: {
    whitelist: true,
    transform: true
  }
});
```

## 🎮 Using Bootstrap in Your Controllers

### Step 1: Create Response DTO

```typescript
// src/user/dto/user-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  email: string;

  @ApiProperty({ required: false })
  avatar?: string;

  @ApiProperty()
  verified: boolean;

  @ApiProperty()
  createdAt: string;
}
```

### Step 2: Use Smart API Decorator

```typescript
// src/user/user.controller.ts
import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Api, ResponseFactory } from '@kenniy/godeye-data-contracts';
import { UserResponseDto } from './dto/user-response.dto';

@Controller('users')
@ApiTags('Users')
export class UserController {

  @Get()
  @Api(UserResponseDto)  // Auto: paginated + common errors + 200
  async getUsers() {
    const users = await this.userService.findAll();
    return ResponseFactory.success(users);
  }

  @Get(':id')
  @Api(UserResponseDto)  // Auto: single + common errors + 200
  async getUser(@Param('id') id: string) {
    const user = await this.userService.findById(id);
    return user
      ? ResponseFactory.success(user)
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

## 🔧 Environment Configuration

### Environment Variables

```bash
# .env
NODE_ENV=development
PORT=3003
SERVICE_NAME=my-service

# Swagger
SWAGGER_ENABLED=true
SWAGGER_PATH=docs

# CORS
CORS_ORIGINS=http://localhost:3000,https://myapp.com
```

### Package.json Scripts

```json
{
  "name": "my-service",
  "version": "1.0.0",
  "scripts": {
    "start": "node dist/main.js",
    "start:dev": "nodemon --exec ts-node src/main.ts",
    "build": "tsc",
    "contracts:update": "npm update @kenniy/godeye-data-contracts"
  },
  "dependencies": {
    "@nestjs/common": "^10.0.0",
    "@nestjs/core": "^10.0.0",
    "@nestjs/platform-express": "^10.0.0",
    "@nestjs/swagger": "^7.0.0",
    "class-validator": "^0.14.0",
    "class-transformer": "^0.5.0",
    "@kenniy/godeye-data-contracts": "^1.0.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "@types/node": "^20.0.0",
    "ts-node": "^10.0.0",
    "nodemon": "^3.0.0"
  }
}
```

## 🚀 Advanced Bootstrap Options

### Custom Swagger Configuration

```typescript
// src/main.ts
import { bootstrap } from '@kenniy/godeye-data-contracts';
import { AppModule } from './app.module';

const app = await bootstrap(AppModule, {
  serviceName: 'my-service',
  port: 3003,

  // Advanced Swagger setup
  swagger: {
    enabled: true,
    title: 'My Service API',
    description: 'API with ResponseFactory patterns',
    version: '1.0.0',
    path: 'docs',
    customOptions: {
      explorer: true,
      swaggerOptions: {
        filter: true,
        showRequestHeaders: true
      }
    }
  },

  // Custom middleware setup
  beforeStart: async (nestApp) => {
    // Add custom health check
    nestApp.getHttpAdapter().get('/health', (req, res) => {
      res.json({ status: 'healthy', service: 'my-service' });
    });
  }
});
```

### Multiple Service Setup

```typescript
// Different services with different configurations

// User service
const userApp = await bootstrap(UserModule, {
  serviceName: 'user-service',
  port: 3001,
  swagger: { title: 'User Service API' }
});

// Notification service
const notificationApp = await bootstrap(NotificationModule, {
  serviceName: 'notification-service',
  port: 3002,
  swagger: { title: 'Notification Service API' }
});
```

## 🎯 Testing Your Bootstrap

### Start the Service

```bash
npm run start:dev
```

### Check Swagger Documentation

Visit: `http://localhost:3003/docs`

You should see:

- ✅ All endpoints documented with @Api decorator
- ✅ Response schemas matching ResponseFactory format
- ✅ Auto-generated pagination schemas
- ✅ Common error responses (404, 409, 422, 500)
- ✅ Interactive API testing interface

### Test ResponseFactory Integration

```bash
# Test your endpoints return ResponseFactory format
curl http://localhost:3003/api/users

# Expected response format:
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "total": 100,
      "page": 1,
      "limit": 20
    }
  },
  "message": "Users retrieved successfully",
  "status_code": 200
}
```

## ✅ What Bootstrap Provides

### 🔧 **API Documentation Setup**

- ✅ **ResponseFactory** integrated globally
- ✅ **Smart @Api decorators** available
- ✅ **Auto-generated Swagger** documentation
- ✅ **Validation pipes** configured
- ✅ **Exception filters** for consistent errors
- ✅ **CORS** support when needed

### 🎮 **Development Experience**

- ✅ **Hot reload** support
- ✅ **Type checking** integration
- ✅ **Auto-imports** for ResponseFactory and @Api
- ✅ **Environment configuration** support
- ✅ **Health check endpoint**

### 🚀 **Production Ready**

- ✅ **Consistent error responses**
- ✅ **Request validation** enabled
- ✅ **Security headers** configured
- ✅ **Graceful startup/shutdown**

## 🎉 Summary

### **Add Documentation to Existing Service:**

```bash
# 1. Install contracts package
npm install @kenniy/godeye-data-contracts@latest

# 2. Update your main.ts
import { bootstrap } from '@kenniy/godeye-data-contracts';
const app = await bootstrap(AppModule, {
  serviceName: 'my-service',
  port: 3003,
  enableSwagger: true
});

# 3. Use @Api decorator in controllers
@Api(ResponseDto)
async myEndpoint() {}

# 4. Start and see documentation
npm run start:dev
# Visit: http://localhost:3003/docs
```

**That's it! You now have:**

- 📚 **Auto-generated Swagger** documentation
- 🎯 **Consistent ResponseFactory** format
- 🛡️ **Smart @Api decorators** with auto-detection
- 📊 **Standard error responses** across all endpoints

**Bootstrap adds documentation patterns to your existing service without changing your database or business logic!**
