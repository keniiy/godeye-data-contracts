# Smart API Documentation Usage

One intelligent decorator that handles all response documentation automatically.

## 📚 Import

```typescript
import { Api } from '@kenniy/godeye-data-contracts';
```

## 🎯 Basic Usage

### Simple Endpoints

```typescript
@Controller('users')
@ApiTags('Users')
export class UserController {
  // Just one decorator per endpoint!
  @Get()
  @Api(UserResponseDto)  // Auto-detects: paginated response + common errors + 200 status
  async getUsers(@Query() query: UserQueryDto) {
    const result = await this.userService.findMany(query.toICriteria());
    return ResponseFactory.success(result, 'Users retrieved successfully');
  }

  @Get(':id')
  @Api(UserResponseDto)  // Auto-detects: single response + common errors + 200 status
  async getUser(@Param('id') id: string) {
    const user = await this.userService.findById(id);
    return user
      ? ResponseFactory.success(user, 'User found')
      : ResponseFactory.notFound('User not found');
  }

  @Post()
  @Api(UserResponseDto)  // Auto-detects: single response + common errors + 201 status
  async createUser(@Body() createDto: CreateUserDto) {
    const user = await this.userService.create(createDto);
    return ResponseFactory.success(user, 'User created successfully');
  }

  @Put(':id')
  @Api(UserResponseDto)  // Auto-detects: single response + common errors + 200 status
  async updateUser(@Param('id') id: string, @Body() updateDto: UpdateUserDto) {
    const user = await this.userService.update(id, updateDto);
    return ResponseFactory.success(user, 'User updated successfully');
  }

  @Delete(':id')
  @Api(UserResponseDto)  // Auto-detects: single response + common errors + 200 status
  async deleteUser(@Param('id') id: string) {
    await this.userService.delete(id);
    return ResponseFactory.success(null, 'User deleted successfully');
  }
}
```

## 🧠 Auto-Detection Features

### Pagination Detection

```typescript
// These method names auto-detect as PAGINATED responses:
@Get()
@Api(UserDto)  // getUsers() → Auto-detects as paginated
async getUsers() {}

@Get('search')
@Api(UserDto)  // search() → Auto-detects as paginated
async searchUsers() {}

@Get('list')
@Api(UserDto)  // list() → Auto-detects as paginated
async listUsers() {}

// These method names auto-detect as SINGLE responses:
@Get(':id')
@Api(UserDto)  // getUser() → Auto-detects as single
async getUser() {}

@Get('profile')
@Api(UserDto)  // getProfile() → Auto-detects as single
async getUserProfile() {}
```

### Status Code Detection

```typescript
// Auto-detects status codes from method names:
@Post()
@Api(UserDto)  // createUser() → Auto-detects 201 status
async createUser() {}

@Put(':id')
@Api(UserDto)  // updateUser() → Auto-detects 200 status
async updateUser() {}

@Delete(':id')
@Api(UserDto)  // deleteUser() → Auto-detects 200 status
async deleteUser() {}

@Get(':id')
@Api(UserDto)  // getUser() → Auto-detects 200 status
async getUser() {}
```

### Message Generation

```typescript
// Auto-generates messages from DTO name + method:
@Api(UserResponseDto)  // → "User found" (for GET single)
@Api(UserResponseDto)  // → "Users retrieved successfully" (for GET paginated)
@Api(UserResponseDto)  // → "User created successfully" (for POST)
@Api(UserResponseDto)  // → "User updated successfully" (for PUT)
@Api(UserResponseDto)  // → "User deleted successfully" (for DELETE)
```

## 🔧 Custom Options

### Override Defaults

```typescript
@Controller('users')
export class UserController {
  // Custom message
  @Get(':id')
  @Api(UserResponseDto, { message: 'User details retrieved' })
  async getUser() {}

  // Custom status code
  @Post()
  @Api(UserResponseDto, { status: 202 })  // Accepted instead of 201
  async createUserAsync() {}

  // Force pagination detection
  @Get('profile')
  @Api(UserResponseDto, { paginated: true })  // Force paginated even though method name suggests single
  async getUserProfile() {}

  // Force single response
  @Get()
  @Api(UserResponseDto, { paginated: false })  // Force single even though method name suggests paginated
  async getUsers() {}

  // Custom description
  @Get(':id')
  @Api(UserResponseDto, { description: 'Retrieves detailed user information including profile' })
  async getUser() {}
}
```

### Add Custom Errors

```typescript
@Controller('files')
export class FileController {
  // Add custom error codes
  @Post('upload')
  @Api(FileResponseDto, { errors: [413, 415] })  // Adds File Too Large + Unsupported Media Type
  async uploadFile() {}

  // Multiple custom errors
  @Post('process')
  @Api(FileResponseDto, { errors: [413, 415, 429] })  // File Too Large + Unsupported + Rate Limited
  async processFile() {}

  // Exclude common errors (rare use case)
  @Get('public/:id')
  @Api(FileResponseDto, { excludeCommonErrors: true })  // No 404, 409, 422, 500 errors
  async getPublicFile() {}
}
```

## 📊 Different Response DTOs

### Flexible DTO Structures

```typescript
// Full user details DTO
export class UserDetailResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiProperty() email: string;
  @ApiProperty({ required: false }) avatar?: string;
  @ApiProperty({ required: false }) bio?: string;
  @ApiProperty({ required: false }) profile?: ProfileDto;
  @ApiProperty({ required: false }) permissions?: string[];
  @ApiProperty() createdAt: string;
}

// Minimal user list DTO
export class UserListResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiProperty() email: string;
  @ApiProperty() verified: boolean;
}

// Public profile DTO
export class UserPublicResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiProperty({ required: false }) avatar?: string;
  @ApiProperty({ required: false }) bio?: string;
}

@Controller('users')
export class UserController {
  // Different DTOs for different use cases
  @Get()
  @Api(UserListResponseDto)  // Optimized for lists
  async getUsers() {}

  @Get(':id')
  @Api(UserDetailResponseDto)  // Full details
  async getUser() {}

  @Get(':id/public')
  @Api(UserPublicResponseDto)  // Public info only
  async getPublicProfile() {}
}
```

## 🎮 Real-World Examples

### Hospital Management

```typescript
export class HospitalResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiProperty() type: string;
  @ApiProperty({ required: false }) description?: string;
  @ApiProperty({ required: false }) services?: string[];
  @ApiProperty({ required: false }) contact?: ContactDto;
  @ApiProperty({ required: false }) location?: LocationDto;
}

@Controller('hospitals')
@ApiTags('Hospitals')
export class HospitalController {
  @Get()
  @Api(HospitalResponseDto)  // Auto: paginated + common errors + 200
  async getHospitals(@Query() query: HospitalQueryDto) {
    const result = await this.hospitalService.findMany(query.toICriteria());
    return ResponseFactory.success(result);
  }

  @Get(':id')
  @Api(HospitalResponseDto)  // Auto: single + common errors + 200
  async getHospital(@Param('id') id: string) {
    const hospital = await this.hospitalService.findById(id);
    return hospital
      ? ResponseFactory.success(hospital)
      : ResponseFactory.notFound('Hospital not found');
  }

  @Post()
  @Api(HospitalResponseDto)  // Auto: single + common errors + 201
  async createHospital(@Body() createDto: CreateHospitalDto) {
    const hospital = await this.hospitalService.create(createDto);
    return ResponseFactory.success(hospital);
  }
}
```

### File Management with Custom Errors

```typescript
export class FileResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() filename: string;
  @ApiProperty() size: number;
  @ApiProperty() mimeType: string;
  @ApiProperty() url: string;
  @ApiProperty({ required: false }) thumbnail?: string;
}

@Controller('files')
@ApiTags('Files')
export class FileController {
  @Get()
  @Api(FileResponseDto)  // Auto: paginated + common errors
  async getFiles(@Query() query: FileQueryDto) {
    const result = await this.fileService.findMany(query.toICriteria());
    return ResponseFactory.success(result);
  }

  @Post('upload')
  @Api(FileResponseDto, {
    errors: [413, 415],  // File Too Large + Unsupported Media Type
    message: 'File uploaded and processed successfully'
  })
  async uploadFile(@Body() uploadDto: FileUploadDto) {
    try {
      const file = await this.fileService.upload(uploadDto);
      return ResponseFactory.success(file);
    } catch (error) {
      if (error.code === 'FILE_TOO_LARGE') {
        return ResponseFactory.error('Payload Too Large', 'File exceeds 10MB limit', 413);
      }
      if (error.code === 'UNSUPPORTED_TYPE') {
        return ResponseFactory.error('Unsupported Media Type', 'Only JPG, PNG, PDF allowed', 415);
      }
      return ResponseFactory.serverError('Upload failed');
    }
  }

  @Delete(':id')
  @Api(FileResponseDto, { message: 'File deleted and removed from storage' })
  async deleteFile(@Param('id') id: string) {
    await this.fileService.delete(id);
    return ResponseFactory.success(null);
  }
}
```

## ✅ Benefits

### 🎯 Ultra Simple

```typescript
// Before: 50+ lines of schema + 2 decorators per endpoint
// After: 1 decorator per endpoint
@Api(ResponseDto)  // That's it!
```

### 🧠 Smart Auto-Detection

- ✅ **Pagination** - Auto-detects from method names (getUsers, searchUsers, etc.)
- ✅ **Status Codes** - Auto-detects from HTTP methods (POST=201, GET=200, etc.)
- ✅ **Messages** - Auto-generates from DTO names and methods
- ✅ **Common Errors** - Always includes 404, 409, 422, 500

### 🔧 Flexible When Needed

- ✅ **Custom messages** - Override when needed
- ✅ **Custom status codes** - For special cases
- ✅ **Custom errors** - Add file upload errors, rate limiting, etc.
- ✅ **Force detection** - Override auto-detection when needed

### 📊 Perfect with ResponseFactory

- ✅ **Matches exactly** - Generated schemas match ResponseFactory output
- ✅ **Auto-pagination** - Works with ResponseFactory auto-detection
- ✅ **Consistent errors** - Error schemas match ResponseFactory.error() format

## 🚀 Summary

```typescript
// 95% of endpoints just need this:
@Api(YourCustomDto)
async yourMethod() { }

// 5% need custom options:
@Api(YourCustomDto, { errors: [413, 415], message: 'Custom message' })
async specialMethod() { }
```

**One decorator. Everything automatic. Override when needed. Perfect alignment with ResponseFactory.**
