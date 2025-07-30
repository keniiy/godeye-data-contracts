/**
 * User-specific Query DTO
 * Extends base with User entity fields and relations
 */

import { IsOptional, IsString, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { BaseQueryDto } from './base-query.dto';

export class UserQueryDto extends BaseQueryDto {
  @ApiPropertyOptional({
    example: 'business',
    enum: ['business', 'individual'],
    description: 'User type filter'
  })
  @IsOptional()
  @IsEnum(['business', 'individual'])
  userType?: 'business' | 'individual';

  @ApiPropertyOptional({ example: 'john@example.com', description: 'Filter by email' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({ example: true, description: 'Filter by verification status' })
  @IsOptional()
  @Type(() => Boolean)
  verified?: boolean;

  @ApiPropertyOptional({
    example: '2023-01-01',
    description: 'Created after date (ISO string)'
  })
  @IsOptional()
  @IsString()
  createdAfter?: string;

  @ApiPropertyOptional({
    example: '2023-12-31',
    description: 'Created before date (ISO string)'
  })
  @IsOptional()
  @IsString()
  createdBefore?: string;

  /**
   * Define User entity relations for smart include parsing
   */
  protected getKnownRelations(): string[] {
    return ['profile', 'business', 'posts', 'files', 'createdBy', 'updatedBy'];
  }

  protected buildWhereClause(): any {
    const where = super.buildWhereClause() || {};

    if (this.userType) where.userType = this.userType;
    if (this.email) where.email = this.email;
    if (this.verified !== undefined) where.verified = this.verified;

    // Date range filters
    if (this.createdAfter || this.createdBefore) {
      where.createdAt = {};
      if (this.createdAfter) where.createdAt.$gte = new Date(this.createdAfter);
      if (this.createdBefore) where.createdAt.$lte = new Date(this.createdBefore);
    }

    return where;
  }
}