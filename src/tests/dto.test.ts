/**
 * DTO Tests
 * Tests the query DTOs and their ICriteria transformation
 */

import { BaseQueryDto, FindOneDto, FindManyDto, UserQueryDto, FileQueryDto } from '../core/dto';

describe('DTO System', () => {
  describe('BaseQueryDto', () => {
    it('should transform to basic ICriteria', () => {
      const dto = new BaseQueryDto();
      dto.page = 1;
      dto.limit = 20;
      dto.status = 'active';

      const criteria = dto.toICriteria();

      expect(criteria.page).toBe(1);
      expect(criteria.limit).toBe(20);
      expect(criteria.where?.status).toBe('active');
    });

    it('should parse include parameter into relations and fields', () => {
      const dto = new BaseQueryDto();
      dto.include = 'id,name,email,createdBy,updatedBy';

      const criteria = dto.toICriteria();

      expect(criteria.relations).toContain('createdBy');
      expect(criteria.relations).toContain('updatedBy');
      expect(criteria.select).toContain('id');
      expect(criteria.select).toContain('name');
      expect(criteria.select).toContain('email');
    });

    it('should parse sort string correctly', () => {
      const dto = new BaseQueryDto();
      dto.sort = 'createdAt:DESC,name:ASC';

      const criteria = dto.toICriteria();

      expect(criteria.sort?.createdAt).toBe('DESC');
      expect(criteria.sort?.name).toBe('ASC');
    });

    it('should handle search configuration', () => {
      const dto = new BaseQueryDto();
      dto.search = 'john doe';

      const criteria = dto.toICriteria();

      expect(criteria.search?.term).toBe('john doe');
      // Backend determines fields automatically - no frontend control
    });
  });

  describe('FindOneDto', () => {
    it('should transform to ICriteria with ID', () => {
      const dto = new FindOneDto();
      dto.include = 'id,name,email';

      const criteria = dto.toICriteria('123');

      expect(criteria.where?.id).toBe('123');
      expect(criteria.select).toContain('id');
      expect(criteria.select).toContain('name');
      expect(criteria.select).toContain('email');
    });

    it('should handle empty include parameter', () => {
      const dto = new FindOneDto();

      const criteria = dto.toICriteria('123');

      expect(criteria.where?.id).toBe('123');
      expect(criteria.relations).toEqual([]);
      expect(criteria.select).toEqual([]);
    });
  });

  describe('FindManyDto', () => {
    it('should extend BaseQueryDto with additional properties', () => {
      const dto = new FindManyDto();
      dto.limit = 50;
      dto.includeTotalCount = false;

      expect(dto.limit).toBe(50);
      expect(dto.includeTotalCount).toBe(false);

      const criteria = dto.toICriteria();
      expect(criteria.limit).toBe(50);
    });
  });

  describe('UserQueryDto', () => {
    it('should handle user-specific filters', () => {
      const dto = new UserQueryDto();
      dto.userType = 'business';
      dto.email = 'test@example.com';
      dto.verified = true;
      dto.status = 'active';

      const criteria = dto.toICriteria();

      expect(criteria.where?.userType).toBe('business');
      expect(criteria.where?.email).toBe('test@example.com');
      expect(criteria.where?.verified).toBe(true);
      expect(criteria.where?.status).toBe('active');
    });

    it('should handle date range filters', () => {
      const dto = new UserQueryDto();
      dto.createdAfter = '2023-01-01';
      dto.createdBefore = '2023-12-31';

      const criteria = dto.toICriteria();

      expect(criteria.where?.createdAt?.$gte).toEqual(new Date('2023-01-01'));
      expect(criteria.where?.createdAt?.$lte).toEqual(new Date('2023-12-31'));
    });

    it('should define user-specific known relations', () => {
      const dto = new UserQueryDto();
      dto.include = 'id,name,profile,business,posts';

      const criteria = dto.toICriteria();

      expect(criteria.relations).toContain('profile');
      expect(criteria.relations).toContain('business');
      expect(criteria.relations).toContain('posts');
      expect(criteria.select).toContain('id');
      expect(criteria.select).toContain('name');
    });
  });

  describe('FileQueryDto', () => {
    it('should handle file-specific filters', () => {
      const dto = new FileQueryDto();
      dto.userId = 'user123';
      dto.fileType = 'image';
      dto.mimeType = 'image/jpeg';

      const criteria = dto.toICriteria();

      expect(criteria.where?.userId).toBe('user123');
      expect(criteria.where?.fileType).toBe('image');
      expect(criteria.where?.mimeType).toBe('image/jpeg');
    });

    it('should handle size range filters', () => {
      const dto = new FileQueryDto();
      dto.minSize = 1000;
      dto.maxSize = 5000000;

      const criteria = dto.toICriteria();

      expect(criteria.where?.size?.$gte).toBe(1000);
      expect(criteria.where?.size?.$lte).toBe(5000000);
    });

    it('should define file-specific known relations', () => {
      const dto = new FileQueryDto();
      dto.include = 'id,name,user,folder,tags';

      const criteria = dto.toICriteria();

      expect(criteria.relations).toContain('user');
      expect(criteria.relations).toContain('folder');
      expect(criteria.relations).toContain('tags');
      expect(criteria.select).toContain('id');
      expect(criteria.select).toContain('name');
    });
  });

  describe('DTO Integration Tests', () => {
    it('should work with complex query scenarios', () => {
      const dto = new UserQueryDto();
      dto.page = 2;
      dto.limit = 10;
      dto.userType = 'business';
      dto.verified = true;
      dto.search = 'john';
      // searchFields removed - backend handles field selection
      dto.include = 'id,name,email,profile,business';
      dto.sort = 'createdAt:DESC,name:ASC';
      dto.createdAfter = '2023-01-01';

      const criteria = dto.toICriteria();

      // Pagination
      expect(criteria.page).toBe(2);
      expect(criteria.limit).toBe(10);

      // Filters
      expect(criteria.where?.userType).toBe('business');
      expect(criteria.where?.verified).toBe(true);
      expect(criteria.where?.createdAt?.$gte).toEqual(new Date('2023-01-01'));

      // Search
      expect(criteria.search?.term).toBe('john');
      // Backend determines fields automatically

      // Include parsing
      expect(criteria.relations).toEqual(['profile', 'business']);
      expect(criteria.select).toEqual(['id', 'name', 'email']);

      // Sorting
      expect(criteria.sort?.createdAt).toBe('DESC');
      expect(criteria.sort?.name).toBe('ASC');
    });

    it('should handle minimal query parameters', () => {
      const dto = new BaseQueryDto();
      
      const criteria = dto.toICriteria();

      expect(criteria.page).toBe(1);
      expect(criteria.limit).toBe(20);
      expect(criteria.relations).toEqual([]);
      expect(criteria.select).toEqual([]);
      expect(criteria.where).toBeUndefined();
      expect(criteria.search).toBeUndefined();
      expect(criteria.sort).toBeUndefined();
    });

  });
});