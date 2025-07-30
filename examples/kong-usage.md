# Kong Gateway Usage

Simple guide for routing GOD-EYE microservices through Kong API Gateway.

## 🎯 Quick Setup

### 1. Add Service to Kong

```bash
# Register your microservice
curl -X POST http://localhost:8001/services \
  --data "name=user-service" \
  --data "url=http://localhost:3001"
```

### 2. Create Route

```bash
# Create route for the service
curl -X POST http://localhost:8001/services/user-service/routes \
  --data "paths[]=/api/users"
```

### 3. Test Route

```bash
# Access via Kong (port 8000)
curl http://localhost:8000/api/users

# Returns ResponseFactory format:
{
  "success": true,
  "data": [...],
  "message": "Users retrieved successfully",
  "status_code": 200
}
```

## 🏗️ Multiple Services Setup

### Register All GOD-EYE Services

```bash
# User Service
curl -X POST http://localhost:8001/services \
  --data "name=user-service" \
  --data "url=http://localhost:3001"

curl -X POST http://localhost:8001/services/user-service/routes \
  --data "paths[]=/api/users"

# Hospital Service
curl -X POST http://localhost:8001/services \
  --data "name=hospital-service" \
  --data "url=http://localhost:3002"

curl -X POST http://localhost:8001/services/hospital-service/routes \
  --data "paths[]=/api/hospitals"

# Notification Service
curl -X POST http://localhost:8001/services \
  --data "name=notification-service" \
  --data "url=http://localhost:3003"

curl -X POST http://localhost:8001/services/notification-service/routes \
  --data "paths[]=/api/notifications"
```

## 🔧 Add Authentication

### JWT Plugin

```bash
# Enable JWT for user service
curl -X POST http://localhost:8001/services/user-service/plugins \
  --data "name=jwt"
```

### Rate Limiting

```bash
# Add rate limiting (100 requests per hour)
curl -X POST http://localhost:8001/services/user-service/plugins \
  --data "name=rate-limiting" \
  --data "config.hour=100"
```

### CORS Headers

```bash
# Enable CORS
curl -X POST http://localhost:8001/services/user-service/plugins \
  --data "name=cors" \
  --data "config.origins=http://localhost:3000,https://myapp.com"
```

## 🔐 Kong Authentication Integration

### Using Kong Auth in Controllers

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Api, ResponseFactory, KongUser, KongAuthGuard, RequireRoles } from '@kenniy/godeye-data-contracts';
import { IKongUserContext } from '@kenniy/godeye-data-contracts';

@Controller('users')
@ApiTags('Users')
@UseGuards(KongAuthGuard) // Enable Kong auth for all routes
export class UserController {
  
  @Get('profile')
  @Api(UserResponseDto)
  async getProfile(@KongUser() user: IKongUserContext) {
    // Kong automatically injects user context from headers
    const profile = await this.userService.findById(user.id);
    return ResponseFactory.success(profile);
  }

  @Get('admin-only')
  @RequireRoles('admin') // Only admin users can access
  @Api(UserResponseDto)
  async adminEndpoint(@KongUser() user: IKongUserContext) {
    return ResponseFactory.success(user, 'Admin access granted');
  }
}
```

### Kong Headers Passed to Services

```bash
# Kong automatically adds these headers when forwarding requests:
curl http://localhost:8000/api/users/profile \
  -H "Authorization: Bearer jwt-token"

# Kong Gateway forwards with:
# x-user-id: "123"
# x-user-email: "user@example.com" 
# x-user-type: "patient,admin"
# x-user-profile-id: "profile-456"
```

## 📊 Access Patterns

### Via Kong Gateway (Authenticated)

```bash
# All requests go through Kong with JWT (port 8000)
curl -H "Authorization: Bearer your-jwt-token" http://localhost:8000/api/users
curl -H "Authorization: Bearer your-jwt-token" http://localhost:8000/api/hospitals  
curl -H "Authorization: Bearer your-jwt-token" http://localhost:8000/api/notifications
```

### Direct Service Access (Internal)

```bash
# Still works for internal calls (no auth needed)
curl http://localhost:3001/api/users
curl http://localhost:3002/api/hospitals
curl http://localhost:3003/api/notifications
```

## 🎮 Health Checks

### Add Health Check Plugin

```bash
curl -X POST http://localhost:8001/services/user-service/plugins \
  --data "name=http-log" \
  --data "config.http_endpoint=http://monitoring-service:3000/health"
```

### Service Discovery

```bash
# List all registered services
curl http://localhost:8001/services

# Check service health
curl http://localhost:8001/services/user-service
```

## ✅ Benefits

### 🛡️ **Security**

- ✅ Centralized authentication
- ✅ Rate limiting per service
- ✅ CORS management

### 📊 **Routing**

- ✅ Single entry point (port 8000)
- ✅ Service discovery
- ✅ Load balancing

### 🎯 **Monitoring**

- ✅ Request logging
- ✅ Service health checks
- ✅ Traffic analytics

## 🚀 Summary

```bash
# 1. Register service
curl -X POST http://localhost:8001/services \
  --data "name=my-service" \
  --data "url=http://localhost:3001"

# 2. Create route
curl -X POST http://localhost:8001/services/my-service/routes \
  --data "paths[]=/api/my-path"

# 3. Access via Kong
curl http://localhost:8000/api/my-path
```

**Kong handles routing, auth, and rate limiting. Your GOD-EYE services focus on business logic with ResponseFactory patterns!**
