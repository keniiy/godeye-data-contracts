/**
 * Validation System Tests
 * Tests the unified validation decorators and transformations
 */

import { validate } from 'class-validator';
import { plainToClass, Transform } from 'class-transformer';
import { 
  IsValidId, 
  IsRequiredEmail, 
  IsOptionalEmail, 
  IsPhoneNumber,
  ToLowerCase,
  Trim,
  TransformDate,
  TransformArray,
  ValidationUtils 
} from '../core/validation';

// Test DTOs
class TestUserDto {
  @IsValidId()
  id!: string;

  @IsRequiredEmail()
  @ToLowerCase()
  @Trim()
  email!: string;

  @IsOptionalEmail()
  alternateEmail?: string;

  @IsPhoneNumber()
  phone!: string;

  @TransformDate()
  birthDate!: Date;

  @TransformArray()
  tags!: string[];
}

class TestOptionalDto {
  @IsOptionalEmail()
  email?: string;

  @IsPhoneNumber(['US', 'NG'])
  phone!: string;
}

describe('Validation System', () => {
  describe('IsValidId decorator', () => {
    it('should validate UUID format', async () => {
      const dto = new TestUserDto();
      dto.id = '550e8400-e29b-41d4-a716-446655440000';
      dto.email = 'test@example.com';
      dto.phone = '+1234567890';
      dto.birthDate = new Date();
      dto.tags = ['tag1'];

      const errors = await validate(dto);
      const idErrors = errors.filter(e => e.property === 'id');
      expect(idErrors).toHaveLength(0);
    });

    it('should validate MongoDB ObjectId format', async () => {
      const dto = new TestUserDto();
      dto.id = '507f1f77bcf86cd799439011';
      dto.email = 'test@example.com';
      dto.phone = '+1234567890';
      dto.birthDate = new Date();
      dto.tags = ['tag1'];

      const errors = await validate(dto);
      const idErrors = errors.filter(e => e.property === 'id');
      expect(idErrors).toHaveLength(0);
    });

    it('should validate numeric ID format', async () => {
      const dto = new TestUserDto();
      dto.id = '12345';
      dto.email = 'test@example.com';
      dto.phone = '+1234567890';
      dto.birthDate = new Date();
      dto.tags = ['tag1'];

      const errors = await validate(dto);
      const idErrors = errors.filter(e => e.property === 'id');
      expect(idErrors).toHaveLength(0);
    });

    it('should reject invalid ID formats', async () => {
      const dto = new TestUserDto();
      dto.id = 'invalid-id';
      dto.email = 'test@example.com';
      dto.phone = '+1234567890';
      dto.birthDate = new Date();
      dto.tags = ['tag1'];

      const errors = await validate(dto);
      const idErrors = errors.filter(e => e.property === 'id');
      expect(idErrors.length).toBeGreaterThan(0);
    });
  });

  describe('Email validation decorators', () => {
    it('should validate required email', async () => {
      const dto = new TestUserDto();
      dto.id = '123';
      dto.email = 'valid@example.com';
      dto.phone = '+1234567890';
      dto.birthDate = new Date();
      dto.tags = ['tag1'];

      const errors = await validate(dto);
      const emailErrors = errors.filter(e => e.property === 'email');
      expect(emailErrors).toHaveLength(0);
    });

    it('should reject invalid email format', async () => {
      const dto = new TestUserDto();
      dto.id = '123';
      dto.email = 'invalid-email';
      dto.phone = '+1234567890';
      dto.birthDate = new Date();
      dto.tags = ['tag1'];

      const errors = await validate(dto);
      const emailErrors = errors.filter(e => e.property === 'email');
      expect(emailErrors.length).toBeGreaterThan(0);
    });

    it('should allow empty optional email', async () => {
      const dto = new TestOptionalDto();
      dto.phone = '+1234567890';
      // email is undefined - should be valid

      const errors = await validate(dto);
      const emailErrors = errors.filter(e => e.property === 'email');
      expect(emailErrors).toHaveLength(0);
    });
  });

  describe('Phone validation decorator', () => {
    it('should validate basic phone number', async () => {
      const dto = new TestUserDto();
      dto.id = '123';
      dto.email = 'test@example.com';
      dto.phone = '+1-234-567-8900';
      dto.birthDate = new Date();
      dto.tags = ['tag1'];

      const errors = await validate(dto);
      const phoneErrors = errors.filter(e => e.property === 'phone');
      expect(phoneErrors).toHaveLength(0);
    });

    it('should validate phone with spaces and parentheses', async () => {
      const dto = new TestUserDto();
      dto.id = '123';
      dto.email = 'test@example.com';
      dto.phone = '+1 (234) 567-8900';
      dto.birthDate = new Date();
      dto.tags = ['tag1'];

      const errors = await validate(dto);
      const phoneErrors = errors.filter(e => e.property === 'phone');
      expect(phoneErrors).toHaveLength(0);
    });

    it('should reject invalid phone format', async () => {
      const dto = new TestUserDto();
      dto.id = '123';
      dto.email = 'test@example.com';
      dto.phone = 'abc123'; // Invalid characters
      dto.birthDate = new Date();
      dto.tags = ['tag1'];

      const errors = await validate(dto);
      const phoneErrors = errors.filter(e => e.property === 'phone');
      expect(phoneErrors.length).toBeGreaterThan(0);
    });
  });

  describe('Transform decorators', () => {
    it('should transform email to lowercase and trim', () => {
      const input = { email: '  TEST@EXAMPLE.COM  ' };
      const dto = plainToClass(TestUserDto, input);
      
      expect(dto.email).toBe('test@example.com');
    });

    it('should transform string date to Date object', () => {
      const input = { birthDate: '2024-01-15T10:00:00Z' };
      const dto = plainToClass(TestUserDto, input);
      
      expect(dto.birthDate).toBeInstanceOf(Date);
      expect(dto.birthDate.getFullYear()).toBe(2024);
    });

    it('should transform comma-separated string to array', () => {
      const input = { tags: 'tag1,tag2,tag3' };
      const dto = plainToClass(TestUserDto, input);
      
      expect(Array.isArray(dto.tags)).toBe(true);
      expect(dto.tags).toEqual(['tag1', 'tag2', 'tag3']);
    });

    it('should handle array input for TransformArray', () => {
      const input = { tags: ['tag1', 'tag2'] };
      const dto = plainToClass(TestUserDto, input);
      
      expect(Array.isArray(dto.tags)).toBe(true);
      expect(dto.tags).toEqual(['tag1', 'tag2']);
    });
  });

  describe('ValidationUtils', () => {
    it('should validate UUID ID', () => {
      expect(ValidationUtils.isValidId('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
      expect(ValidationUtils.isValidId('invalid-id')).toBe(false);
    });

    it('should validate ObjectId', () => {
      expect(ValidationUtils.isValidId('507f1f77bcf86cd799439011')).toBe(true);
      expect(ValidationUtils.isValidId('invalid-objectid')).toBe(false);
    });

    it('should validate numeric ID', () => {
      expect(ValidationUtils.isValidId('12345')).toBe(true);
      expect(ValidationUtils.isValidId('abc123')).toBe(false);
    });

    it('should validate email format', () => {
      expect(ValidationUtils.isValidEmail('test@example.com')).toBe(true);
      expect(ValidationUtils.isValidEmail('invalid-email')).toBe(false);
    });

    it('should validate pagination parameters', () => {
      const result = ValidationUtils.validatePagination(2, 10);
      expect(result.page).toBe(2);
      expect(result.limit).toBe(10);
    });

    it('should correct invalid pagination parameters', () => {
      const result = ValidationUtils.validatePagination(-1, 1000);
      expect(result.page).toBe(1); // Min page
      expect(result.limit).toBe(100); // Max limit (assuming MAX_LIMIT = 100)
    });
  });
});