# Validation Pipeline Usage

How to use the unified validation pipeline with custom decorators and transformations across all GOD-EYE microservices.

## 🎯 Core Philosophy

**One validation system, all ORMs.** Use the same validation decorators whether you're working with TypeORM (PostgreSQL) or Mongoose (MongoDB).

## 📚 Import Validation Utilities

```typescript
import {
  @IsValidId,
  @IsOptionalEmail,
  @IsPhoneNumber,
  ValidationPipe,
  TransformPipe,
  ValidatedDTO
} from '@kenniy/godeye-data-contracts';
```

## 🔧 Basic Validation Usage

### Universal ID Validation

```typescript
import { IsValidId } from '@kenniy/godeye-data-contracts';

export class FindUserDto {
  @IsValidId()  // Works with both UUID (PostgreSQL) and ObjectId (MongoDB)
  userId: string;
}

// In PostgreSQL service:
// ✅ Validates UUID format: "550e8400-e29b-41d4-a716-446655440000"

// In MongoDB service:
// ✅ Validates ObjectId format: "507f1f77bcf86cd799439011"
```

### Email Validation with Options

```typescript
import { IsOptionalEmail, IsRequiredEmail } from '@kenniy/godeye-data-contracts';

export class CreateUserDto {
  @IsRequiredEmail()
  email: string;

  @IsOptionalEmail()  // Can be null/undefined
  alternateEmail?: string;

  @IsOptionalEmail({ allowEmpty: true })  // Can be empty string
  backupEmail?: string;
}
```

### Phone Number Validation

```typescript
import { IsPhoneNumber } from '@kenniy/godeye-data-contracts';

export class ContactDto {
  @IsPhoneNumber()  // Auto-detects format
  phone: string;

  @IsPhoneNumber('NG')  // Nigeria format validation
  nigerianPhone: string;

  @IsPhoneNumber(['US', 'NG', 'GB'])  // Multiple country support
  internationalPhone: string;
}
```

## 🎮 Advanced Validation Patterns

### Conditional Validation

```typescript
import { ValidateIf, IsValidId, IsString } from '@kenniy/godeye-data-contracts';

export class UpdateUserDto {
  @IsValidId()
  id: string;

  @IsString()
  @ValidateIf(o => o.updateName === true)  // Only validate if updateName is true
  name?: string;

  @IsOptionalEmail()
  @ValidateIf(o => o.updateEmail === true)
  email?: string;

  updateName?: boolean;
  updateEmail?: boolean;
}
```

### Custom Validation with Pipeline

```typescript
import { ValidatedDTO, CustomValidator } from '@kenniy/godeye-data-contracts';

@CustomValidator('isUniqueEmail')
export function isUniqueEmail(value: string, args: any[]) {
  // Custom validation logic
  return !existingEmails.includes(value);
}

export class CreateUserDto extends ValidatedDTO {
  @IsRequiredEmail()
  @CustomValidator('isUniqueEmail', ['user'])
  email: string;

  @IsString({ minLength: 2, maxLength: 50 })
  name: string;
}
```

### Nested Object Validation

```typescript
import { ValidateNested, Type, IsValidId } from '@kenniy/godeye-data-contracts';

export class AddressDto {
  @IsString()
  street: string;

  @IsString()
  city: string;

  @IsString()
  country: string;
}

export class CreateUserDto {
  @IsString()
  name: string;

  @ValidateNested()
  @Type(() => AddressDto)
  address: AddressDto;

  @ValidateNested({ each: true })  // Validate array of objects
  @Type(() => AddressDto)
  addresses?: AddressDto[];
}
```

## 🔄 Transformation Pipeline

### Auto-Transform Input Data

```typescript
import { Transform, Type, ToLowerCase, Trim } from '@kenniy/godeye-data-contracts';

export class CreateUserDto {
  @Trim()  // Remove whitespace
  @ToLowerCase()  // Convert to lowercase
  @IsRequiredEmail()
  email: string;

  @Trim()
  @Transform(({ value }) => value.charAt(0).toUpperCase() + value.slice(1))  // Capitalize
  name: string;

  @Type(() => Number)  // Convert string to number
  @IsNumber()
  age: number;

  @Type(() => Boolean)  // Convert string to boolean
  @IsBoolean()
  verified: boolean;
}
```

### Date Transformation

```typescript
import { TransformDate, IsDateRange } from '@kenniy/godeye-data-contracts';

export class EventDto {
  @TransformDate()  // Auto-converts string to Date
  @IsDateRange({ after: new Date() })  // Must be future date
  eventDate: Date;

  @TransformDate()
  @IsDateRange({
    after: new Date('2020-01-01'),
    before: new Date('2030-12-31')
  })
  registrationDate: Date;
}
```

### Array Transformation

```typescript
import { TransformArray, IsArrayUnique } from '@kenniy/godeye-data-contracts';

export class TagsDto {
  @TransformArray()  // Converts "tag1,tag2,tag3" to ["tag1", "tag2", "tag3"]
  @IsArrayUnique()  // Ensures no duplicate tags
  @IsString({ each: true })  // Validates each array item
  tags: string[];

  @TransformArray({ separator: ';' })  // Custom separator
  categories: string[];
}
```

## 🎯 Controller Integration

### Basic Validation Pipeline

```typescript
import { Controller, Post, Body, ValidationPipe } from '@nestjs/common';
import { Api, ResponseFactory } from '@kenniy/godeye-data-contracts';

@Controller('users')
export class UserController {
  @Post()
  @Api(UserResponseDto)
  async createUser(
    @Body(ValidationPipe) createDto: CreateUserDto  // Auto-validates with custom decorators
  ) {
    try {
      const user = await this.userService.create(createDto);
      return ResponseFactory.success(user);
    } catch (error) {
      if (error.name === 'ValidationError') {
        return ResponseFactory.validationError(
          'User validation failed',
          error.details
        );
      }
      return ResponseFactory.serverError('Failed to create user');
    }
  }
}
```

### Advanced Validation with Custom Messages

```typescript
@Controller('users')
export class UserController {
  @Post()
  @Api(UserResponseDto)
  async createUser(
    @Body(ValidationPipe.with({
      customMessages: {
        'isValidId': 'Please provide a valid ID format',
        'isRequiredEmail': 'Email is required and must be valid',
        'isPhoneNumber': 'Please provide a valid phone number'
      },
      transform: true,
      whitelist: true
    })) createDto: CreateUserDto
  ) {
    const user = await this.userService.create(createDto);
    return ResponseFactory.success(user);
  }
}
```

## 🔍 Query Validation

### Search Query Validation

```typescript
import { BaseQueryDto, IsSearchFields, IsValidSortField } from '@kenniy/godeye-data-contracts';

export class UserQueryDto extends BaseQueryDto {
  @IsOptionalEmail()
  email?: string;

  @IsString({ minLength: 2 })
  @IsOptional()
  name?: string;

  @IsSearchFields(['name', 'email', 'bio'])  // Restricts searchable fields
  searchFields?: string[];

  @IsValidSortField(['name', 'email', 'createdAt'])  // Restricts sortable fields
  sort?: string;

  @Transform(({ value }) => value === 'true')  // Convert string to boolean
  @IsBoolean()
  @IsOptional()
  verified?: boolean;
}
```

### Pagination Validation

```typescript
import { PaginationDto } from '@kenniy/godeye-data-contracts';

export class UserListDto extends PaginationDto {
  @IsNumber({ min: 1, max: 100 })
  @Type(() => Number)
  @IsOptional()
  limit?: number = 20;

  @IsNumber({ min: 1 })
  @Type(() => Number)
  @IsOptional()
  page?: number = 1;

  @IsValidId()
  @IsOptional()
  userId?: string;  // Filter by user ID

  @IsEnum(['active', 'inactive', 'pending'])
  @IsOptional()
  status?: string;
}
```

## 🏗️ Entity Validation

### PostgreSQL Entity with Validation

```typescript
import { Entity, Column } from 'typeorm';
import { BaseEntity, IsRequiredEmail, IsPhoneNumber } from '@kenniy/godeye-data-contracts';

@Entity('users')
export class User extends BaseEntity {
  @Column()
  @IsString({ minLength: 2, maxLength: 50 })
  name: string;

  @Column({ unique: true })
  @IsRequiredEmail()
  email: string;

  @Column({ nullable: true })
  @IsPhoneNumber()
  @IsOptional()
  phone?: string;

  @Column({ default: false })
  @IsBoolean()
  verified: boolean;
}
```

### MongoDB Schema with Validation

```typescript
import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { BaseSchema, IsRequiredEmail, IsValidId } from '@kenniy/godeye-data-contracts';

@Schema()
export class User extends BaseSchema {
  @Prop({ required: true })
  @IsString({ minLength: 2, maxLength: 50 })
  name: string;

  @Prop({ required: true, unique: true })
  @IsRequiredEmail()
  email: string;

  @Prop()
  @IsPhoneNumber()
  @IsOptional()
  phone?: string;

  @Prop({ default: false })
  @IsBoolean()
  verified: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);
```

## 🎨 Custom Validators

### Create Reusable Validators

```typescript
// src/validators/business.validators.ts
import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

export function IsValidBusinessType(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isValidBusinessType',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const validTypes = ['hospital', 'clinic', 'diagnostic', 'pharmacy'];
          return validTypes.includes(value);
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be one of: hospital, clinic, diagnostic, pharmacy`;
        }
      }
    });
  };
}

export function IsNigerianCAC(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isNigerianCAC',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          // Nigerian CAC number format: RC + 6-7 digits
          const cacRegex = /^RC\d{6,7}$/;
          return typeof value === 'string' && cacRegex.test(value);
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a valid Nigerian CAC number (e.g., RC123456)`;
        }
      }
    });
  };
}
```

### Use Custom Validators

```typescript
import { IsValidBusinessType, IsNigerianCAC } from '../validators/business.validators';

export class CreateBusinessDto {
  @IsString()
  name: string;

  @IsValidBusinessType()
  businessType: string;

  @IsNigerianCAC()
  cacNumber: string;

  @IsRequiredEmail()
  email: string;
}
```

## 🔄 Async Validation

### Database Validation

```typescript
import { ValidateBy, ValidationOptions } from 'class-validator';

export function IsEmailUnique(validationOptions?: ValidationOptions) {
  return ValidateBy(
    {
      name: 'isEmailUnique',
      async: true,
      validator: {
        validate: async (value: string) => {
          const userService = Container.get(UserService);
          const existingUser = await userService.findByEmail(value);
          return !existingUser;
        },
        defaultMessage: () => 'Email already exists'
      }
    },
    validationOptions
  );
}

export class CreateUserDto {
  @IsRequiredEmail()
  @IsEmailUnique()  // Async validation against database
  email: string;
}
```

### External API Validation

```typescript
export function IsValidNIN(validationOptions?: ValidationOptions) {
  return ValidateBy(
    {
      name: 'isValidNIN',
      async: true,
      validator: {
        validate: async (value: string) => {
          // Validate Nigerian National Identification Number with external API
          try {
            const response = await fetch(`/api/verify-nin/${value}`);
            return response.ok;
          } catch {
            return false;
          }
        },
        defaultMessage: () => 'Invalid Nigerian National Identification Number'
      }
    },
    validationOptions
  );
}
```

## 🎯 Error Handling

### Validation Error Response

```typescript
@Controller('users')
export class UserController {
  @Post()
  @Api(UserResponseDto)
  async createUser(@Body() createDto: CreateUserDto) {
    try {
      const user = await this.userService.create(createDto);
      return ResponseFactory.success(user);
    } catch (error) {
      if (error instanceof ValidationError) {
        // Extract detailed validation errors
        const validationErrors = error.details.map(err => ({
          field: err.property,
          value: err.value,
          constraints: err.constraints
        }));

        return ResponseFactory.validationError(
          'Validation failed',
          validationErrors
        );
      }

      return ResponseFactory.serverError('Failed to create user');
    }
  }
}
```

### Global Validation Exception Filter

```typescript
// src/filters/validation-exception.filter.ts
import { ExceptionFilter, Catch, ArgumentsHost, BadRequestException } from '@nestjs/common';
import { ResponseFactory } from '@kenniy/godeye-data-contracts';

@Catch(BadRequestException)
export class ValidationExceptionFilter implements ExceptionFilter {
  catch(exception: BadRequestException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const exceptionResponse = exception.getResponse() as any;

    if (exceptionResponse.message && Array.isArray(exceptionResponse.message)) {
      // Handle class-validator errors
      const validationErrors = exceptionResponse.message;

      const errorResponse = ResponseFactory.validationError(
        'Request validation failed',
        validationErrors
      );

      return response.status(422).json(errorResponse);
    }

    // Handle other bad request errors
    const errorResponse = ResponseFactory.error(
      'Bad Request',
      exceptionResponse.message || 'Invalid request',
      400
    );

    return response.status(400).json(errorResponse);
  }
}
```

## ✅ Benefits of Unified Validation

### 🎯 **Consistency Across ORMs**

```typescript
// Same validation works in PostgreSQL and MongoDB services
@IsValidId()  // ✅ UUID in PostgreSQL, ObjectId in MongoDB
@IsRequiredEmail()  // ✅ Same email validation everywhere
@IsPhoneNumber()  // ✅ Same phone validation everywhere
```

### 🔧 **Smart Transformations**

```typescript
// Auto-transforms and validates
@TransformDate()  // "2024-01-15" → Date object
@TransformArray()  // "tag1,tag2" → ["tag1", "tag2"]
@ToLowerCase()  // "EMAIL@EXAMPLE.COM" → "email@example.com"
@Trim()  // "  John Doe  " → "John Doe"
```

### 🛡️ **Type Safety**

```typescript
// TypeScript integration with runtime validation
interface CreateUserDto {
  email: string;    // ✅ Compile-time type
  name: string;     // ✅ Compile-time type
}

@IsRequiredEmail()  // ✅ Runtime validation
email: string;

@IsString()         // ✅ Runtime validation
name: string;
```

### 📊 **Detailed Error Responses**

```typescript
// Automatic detailed validation errors
{
  "success": false,
  "error": "Validation Error",
  "message": "Request validation failed",
  "status_code": 422,
  "metadata": {
    "validation_errors": [
      {
        "field": "email",
        "value": "invalid-email",
        "constraints": ["must be a valid email address"]
      }
    ]
  }
}
```

## 🚀 Summary

### **One Pipeline, All Services:**

```typescript
// Same validation decorators work everywhere:
@IsValidId()        // ✅ PostgreSQL + MongoDB
@IsRequiredEmail()  // ✅ All services
@IsPhoneNumber()    // ✅ All services
@TransformDate()    // ✅ All services
```

### **Key Features:**

- 🎯 **Universal** - Same validators for all ORMs
- 🔄 **Auto-Transform** - Smart data transformation
- 🛡️ **Type Safe** - Runtime + compile-time validation
- 📊 **Detailed Errors** - Rich validation error responses
- 🔧 **Extensible** - Easy to add custom validators
- ⚡ **Performance** - Optimized validation pipeline

**The validation pipeline ensures all GOD-EYE services have consistent, type-safe, and detailed validation with zero duplication across PostgreSQL and MongoDB services!** 🎉
