/**
 * File-specific Query DTO
 * Extends base with File entity fields and relations
 */

import { IsOptional, IsString, IsNumber, IsEnum, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { BaseQueryDto } from './base-query.dto';

export class FileQueryDto extends BaseQueryDto {
  @ApiPropertyOptional({ example: 'user123', description: 'Filter by user ID' })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({
    example: 'image',
    enum: ['image', 'document', 'video', 'audio'],
    description: 'File type filter'
  })
  @IsOptional()
  @IsEnum(['image', 'document', 'video', 'audio'])
  fileType?: string;

  @ApiPropertyOptional({ example: 'image/jpeg', description: 'MIME type filter' })
  @IsOptional()
  @IsString()
  mimeType?: string;

  @ApiPropertyOptional({ example: 1000, description: 'Minimum file size in bytes' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  minSize?: number;

  @ApiPropertyOptional({ example: 5000000, description: 'Maximum file size in bytes' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  maxSize?: number;

  /**
   * Define File entity relations for smart include parsing
   */
  protected getKnownRelations(): string[] {
    return ['user', 'folder', 'tags', 'metadata', 'createdBy', 'updatedBy'];
  }

  protected buildWhereClause(): any {
    const where = super.buildWhereClause() || {};

    if (this.userId) where.userId = this.userId;
    if (this.fileType) where.fileType = this.fileType;
    if (this.mimeType) where.mimeType = this.mimeType;

    // Size range
    if (this.minSize || this.maxSize) {
      where.size = {};
      if (this.minSize) where.size.$gte = this.minSize;
      if (this.maxSize) where.size.$lte = this.maxSize;
    }

    return where;
  }
}