/**
 * DTO Test Factory
 * Provides factory methods for creating test DTOs with various configurations
 */

import { BaseQueryDto, FindOneDto, FindManyDto, UserQueryDto, FileQueryDto } from '../../core/dto';
import { ICriteria } from '../../types/repository.types';

/**
 * DTO Factory - Creates DTO instances with common test configurations
 */
export class DtoFactory {
  /**
   * Creates basic query DTO with default pagination
   */
  static createBaseQuery(overrides: Partial<BaseQueryDto> = {}): BaseQueryDto {
    const dto = new BaseQueryDto();
    dto.page = 1;
    dto.limit = 20;
    dto.status = 'active';
    
    return Object.assign(dto, overrides);
  }

  /**
   * Creates query DTO with search configuration
   */
  static createSearchQuery(
    searchTerm: string,
    overrides: Partial<BaseQueryDto> = {}
  ): BaseQueryDto {
    return this.createBaseQuery({
      search: searchTerm,
      ...overrides,
    });
  }

  /**
   * Creates query DTO with sorting
   */
  static createSortedQuery(
    sortConfig: string = 'createdAt:DESC',
    overrides: Partial<BaseQueryDto> = {}
  ): BaseQueryDto {
    return this.createBaseQuery({
      sort: sortConfig,
      ...overrides,
    });
  }

  /**
   * Creates query DTO with relations/includes
   */
  static createIncludeQuery(
    include: string = 'id,name,email',
    overrides: Partial<BaseQueryDto> = {}
  ): BaseQueryDto {
    return this.createBaseQuery({
      include,
      ...overrides,
    });
  }

  /**
   * Creates FindOne DTO
   */
  static createFindOneDto(overrides: Partial<FindOneDto> = {}): FindOneDto {
    const dto = new FindOneDto();
    dto.include = 'id,name,email';
    
    return Object.assign(dto, overrides);
  }

  /**
   * Creates FindMany DTO with pagination
   */
  static createFindManyDto(overrides: Partial<FindManyDto> = {}): FindManyDto {
    const dto = new FindManyDto();
    dto.page = 1;
    dto.limit = 50;
    dto.includeTotalCount = true;
    
    return Object.assign(dto, overrides);
  }

  /**
   * Creates User-specific query DTO
   */
  static createUserQuery(overrides: Partial<UserQueryDto> = {}): UserQueryDto {
    const dto = new UserQueryDto();
    dto.page = 1;
    dto.limit = 20;
    dto.userType = 'individual';
    dto.status = 'active';
    dto.verified = true;
    
    return Object.assign(dto, overrides);
  }

  /**
   * Creates business user query DTO
   */
  static createBusinessUserQuery(overrides: Partial<UserQueryDto> = {}): UserQueryDto {
    return this.createUserQuery({
      userType: 'business',
      include: 'id,name,email,profile,business',
      ...overrides,
    });
  }

  /**
   * Creates admin user query DTO
   */
  static createAdminUserQuery(overrides: Partial<UserQueryDto> = {}): UserQueryDto {
    return this.createUserQuery({
      userType: 'admin',
      include: 'id,name,email,profile,permissions',
      ...overrides,
    });
  }

  /**
   * Creates user query with date filtering
   */
  static createUserQueryWithDateRange(
    createdAfter?: string,
    createdBefore?: string,
    overrides: Partial<UserQueryDto> = {}
  ): UserQueryDto {
    return this.createUserQuery({
      createdAfter,
      createdBefore,
      ...overrides,
    });
  }

  /**
   * Creates File query DTO
   */
  static createFileQuery(overrides: Partial<FileQueryDto> = {}): FileQueryDto {
    const dto = new FileQueryDto();
    dto.page = 1;
    dto.limit = 20;
    dto.fileType = 'image';
    
    return Object.assign(dto, overrides);
  }

  /**
   * Creates file query for specific user
   */
  static createUserFileQuery(
    userId: string,
    overrides: Partial<FileQueryDto> = {}
  ): FileQueryDto {
    return this.createFileQuery({
      userId,
      include: 'id,name,originalName,size,user',
      ...overrides,
    });
  }

  /**
   * Creates file query with size filtering
   */
  static createFileSizeQuery(
    minSize?: number,
    maxSize?: number,
    overrides: Partial<FileQueryDto> = {}
  ): FileQueryDto {
    return this.createFileQuery({
      minSize,
      maxSize,
      ...overrides,
    });
  }

  /**
   * Creates file query for specific MIME type
   */
  static createFileTypeQuery(
    mimeType: string,
    fileType?: string,
    overrides: Partial<FileQueryDto> = {}
  ): FileQueryDto {
    return this.createFileQuery({
      mimeType,
      fileType,
      ...overrides,
    });
  }
}

/**
 * DTO Builder - Fluent interface for complex DTO construction
 */
export class DtoBuilder<T extends BaseQueryDto> {
  protected dto: T;

  constructor(dtoInstance: T) {
    this.dto = dtoInstance;
  }

  static forBaseQuery(): DtoBuilder<BaseQueryDto> {
    return new DtoBuilder(new BaseQueryDto());
  }

  static forUserQuery(): DtoBuilder<UserQueryDto> {
    return new DtoBuilder(new UserQueryDto());
  }

  static forFileQuery(): DtoBuilder<FileQueryDto> {
    return new DtoBuilder(new FileQueryDto());
  }

  static forFindOne(): DtoBuilder<FindOneDto> {
    return new DtoBuilder(new FindOneDto());
  }

  static forFindMany(): DtoBuilder<FindManyDto> {
    return new DtoBuilder(new FindManyDto());
  }

  /**
   * Configure pagination
   */
  withPagination(page: number, limit: number): DtoBuilder<T> {
    this.dto.page = page;
    this.dto.limit = limit;
    return this;
  }

  /**
   * Configure search
   */
  withSearch(searchTerm: string): DtoBuilder<T> {
    this.dto.search = searchTerm;
    return this;
  }

  /**
   * Configure sorting
   */
  withSort(sort: string): DtoBuilder<T> {
    this.dto.sort = sort;
    return this;
  }

  /**
   * Configure includes/relations
   */
  withInclude(include: string): DtoBuilder<T> {
    this.dto.include = include;
    return this;
  }

  /**
   * Configure status filter
   */
  withStatus(status: string): DtoBuilder<T> {
    this.dto.status = status;
    return this;
  }

  /**
   * Configure user-specific properties (if T extends UserQueryDto)
   */
  withUserType(userType: 'business' | 'individual' | 'admin'): DtoBuilder<T> {
    if ('userType' in this.dto) {
      (this.dto as any).userType = userType;
    }
    return this;
  }

  withEmail(email: string): DtoBuilder<T> {
    if ('email' in this.dto) {
      (this.dto as any).email = email;
    }
    return this;
  }

  withVerified(verified: boolean): DtoBuilder<T> {
    if ('verified' in this.dto) {
      (this.dto as any).verified = verified;
    }
    return this;
  }

  withDateRange(createdAfter?: string, createdBefore?: string): DtoBuilder<T> {
    if ('createdAfter' in this.dto) {
      (this.dto as any).createdAfter = createdAfter;
    }
    if ('createdBefore' in this.dto) {
      (this.dto as any).createdBefore = createdBefore;
    }
    return this;
  }

  /**
   * Configure file-specific properties (if T extends FileQueryDto)
   */
  withFileType(fileType: 'image' | 'document' | 'video' | 'audio'): DtoBuilder<T> {
    if ('fileType' in this.dto) {
      (this.dto as any).fileType = fileType;
    }
    return this;
  }

  withMimeType(mimeType: string): DtoBuilder<T> {
    if ('mimeType' in this.dto) {
      (this.dto as any).mimeType = mimeType;
    }
    return this;
  }

  withUserId(userId: string): DtoBuilder<T> {
    if ('userId' in this.dto) {
      (this.dto as any).userId = userId;
    }
    return this;
  }

  withSizeRange(minSize?: number, maxSize?: number): DtoBuilder<T> {
    if ('minSize' in this.dto) {
      (this.dto as any).minSize = minSize;
    }
    if ('maxSize' in this.dto) {
      (this.dto as any).maxSize = maxSize;
    }
    return this;
  }

  /**
   * Build the final DTO
   */
  build(): T {
    return this.dto;
  }

  /**
   * Build and convert to ICriteria
   */
  buildCriteria(id?: string): ICriteria<any> {
    if ('toICriteria' in this.dto && typeof this.dto.toICriteria === 'function') {
      return this.dto.toICriteria(id);
    }
    throw new Error('DTO does not support toICriteria conversion');
  }
}

/**
 * Common DTO Test Scenarios
 */
export class DtoScenarios {
  /**
   * Basic pagination scenario
   */
  static basicPagination(): BaseQueryDto {
    return DtoFactory.createBaseQuery({
      page: 2,
      limit: 10,
    });
  }

  /**
   * Search with pagination scenario
   */
  static searchWithPagination(searchTerm: string = 'test'): BaseQueryDto {
    return DtoFactory.createSearchQuery(searchTerm, {
      page: 1,
      limit: 25,
      sort: 'relevance:DESC',
    });
  }

  /**
   * Complex user query scenario
   */
  static complexUserQuery(): UserQueryDto {
    return DtoFactory.createUserQuery({
      page: 2,
      limit: 10,
      userType: 'business',
      verified: true,
      search: 'doctor',
      include: 'id,name,email,profile,business',
      sort: 'createdAt:DESC,name:ASC',
      createdAfter: '2023-01-01',
    });
  }

  /**
   * File query for images scenario
   */
  static imageFilesQuery(): FileQueryDto {
    return DtoFactory.createFileQuery({
      fileType: 'image',
      mimeType: 'image/jpeg',
      minSize: 1024,
      maxSize: 5000000,
      include: 'id,name,size,user,folder',
    });
  }

  /**
   * Admin user query scenario
   */
  static adminUsersQuery(): UserQueryDto {
    return DtoFactory.createAdminUserQuery({
      verified: true,
      status: 'active',
      include: 'id,name,email,profile,permissions',
      sort: 'lastName:ASC',
    });
  }

  /**
   * Minimal query scenario
   */
  static minimalQuery(): BaseQueryDto {
    return new BaseQueryDto();
  }

  /**
   * Large pagination scenario
   */
  static largePagination(): BaseQueryDto {
    return DtoFactory.createBaseQuery({
      page: 10,
      limit: 100,
    });
  }

  /**
   * Multi-sort scenario
   */
  static multiSort(): BaseQueryDto {
    return DtoFactory.createSortedQuery('status:ASC,createdAt:DESC,name:ASC');
  }

  /**
   * Full includes scenario
   */
  static fullIncludes(): UserQueryDto {
    return DtoFactory.createUserQuery({
      include: 'id,name,email,firstName,lastName,phone,profile,business,posts,files',
    });
  }

  /**
   * Date range filtering scenario
   */
  static dateRangeQuery(): UserQueryDto {
    return DtoFactory.createUserQueryWithDateRange(
      '2023-01-01',
      '2023-12-31',
      {
        sort: 'createdAt:ASC',
      }
    );
  }
}

/**
 * ICriteria Mock Factory - Creates mock ICriteria objects for testing
 */
export class CriteriaFactory {
  /**
   * Creates basic ICriteria with where conditions
   */
  static createBasic(where: any = {}, overrides: Partial<ICriteria<any>> = {}): ICriteria<any> {
    return {
      where,
      page: 1,
      limit: 20,
      ...overrides,
    };
  }

  /**
   * Creates ICriteria with relations
   */
  static withRelations(relations: string[], where: any = {}): ICriteria<any> {
    return this.createBasic(where, { relations });
  }

  /**
   * Creates ICriteria with sorting
   */
  static withSort(sort: { [key: string]: 'ASC' | 'DESC' }, where: any = {}): ICriteria<any> {
    return this.createBasic(where, { sort });
  }

  /**
   * Creates ICriteria with field selection
   */
  static withSelect(select: string[], where: any = {}): ICriteria<any> {
    return this.createBasic(where, { select });
  }

  /**
   * Creates ICriteria with search
   */
  static withSearch(term: string, where: any = {}): ICriteria<any> {
    return this.createBasic(where, {
      search: { term }
    });
  }

  /**
   * Creates ICriteria with pagination
   */
  static withPagination(page: number, limit: number, where: any = {}): ICriteria<any> {
    return this.createBasic(where, { page, limit });
  }

  /**
   * Creates complete ICriteria with all options
   */
  static createComplete(): ICriteria<any> {
    return {
      where: { status: 'active' },
      page: 2,
      limit: 10,
      relations: ['profile', 'business'],
      select: ['id', 'name', 'email'],
      sort: { createdAt: 'DESC', name: 'ASC' },
      search: { term: 'test search' },
    };
  }
}