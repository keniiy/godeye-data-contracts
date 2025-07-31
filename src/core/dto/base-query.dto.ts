/**
 * Base Query DTO - Universal for all entities
 * Auto-transforms HTTP parameters to ICriteria format
 */

import { IsOptional, IsNumber, IsString, IsEnum, Min, Max } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ICriteria } from '../../types/repository.types';

export class BaseQueryDto {
  @ApiPropertyOptional({ example: 1, description: 'Page number (1-based)' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ example: 20, description: 'Items per page', minimum: 1, maximum: 100 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 20;

  @ApiPropertyOptional({
    example: 'id,name,email,profile,business',
    description: 'Fields and relations to include in response (comma-separated)'
  })
  @IsOptional()
  @IsString()
  include?: string;

  @ApiPropertyOptional({
    example: 'createdAt:DESC,name:ASC',
    description: 'Sort fields with direction (field:ASC/DESC)'
  })
  @IsOptional()
  @IsString()
  sort?: string;

  @ApiPropertyOptional({ 
    example: 'john doe', 
    description: 'Search term - backend automatically determines fields and search strategy' 
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    example: 'active',
    enum: ['active', 'inactive', 'deleted'],
    description: 'Entity status'
  })
  @IsOptional()
  @IsEnum(['active', 'inactive', 'deleted'])
  status?: 'active' | 'inactive' | 'deleted';

  /**
   * Auto-transform DTO to ICriteria with unified include handling
   */
  toICriteria(): ICriteria<any> {
    const includeFields = this.parseInclude(this.include);

    return {
      page: this.page,
      limit: this.limit,
      relations: includeFields.relations,
      select: includeFields.fields,
      sort: this.parseSortString(this.sort),
      search: this.search ? {
        term: this.search
        // Backend will auto-discover fields and determine search strategy
      } : undefined,
      where: this.buildWhereClause()
    };
  }

  /**
   * Parse unified include parameter into potential relations and fields
   * Repository will validate which items are actual relations using auto-discovery
   */
  protected parseInclude(includeStr?: string): { relations: string[], fields: string[] } {
    if (!includeStr) return { relations: [], fields: [] };

    const items = includeStr.split(',').map(s => s.trim());
    
    // For now, treat all items as potential relations
    // Repository will filter out invalid relations using auto-discovery
    return {
      relations: items.filter(item => this.looksLikeRelation(item)),
      fields: items.filter(item => !this.looksLikeRelation(item))
    };
  }

  /**
   * Basic heuristic to determine if an item looks like a relation
   * Repository auto-discovery will provide final validation
   */
  private looksLikeRelation(item: string): boolean {
    // Items with dots are likely deep relations (e.g., 'business.owner')
    if (item.includes('.')) return true;
    
    // Common field patterns that are NOT relations
    const fieldPatterns = ['id', 'name', 'email', 'createdAt', 'updatedAt', 'status', 'type'];
    if (fieldPatterns.includes(item)) return false;
    
    // Assume other items could be relations (repository will validate)
    return true;
  }

  protected parseSortString(sortStr?: string): Record<string, 'ASC' | 'DESC'> | undefined {
    if (!sortStr) return undefined;

    const sortObj: Record<string, 'ASC' | 'DESC'> = {};
    sortStr.split(',').forEach(item => {
      const [field, direction = 'ASC'] = item.split(':');
      sortObj[field.trim()] = (direction.toUpperCase() as 'ASC' | 'DESC');
    });

    return sortObj;
  }

  protected buildWhereClause(): any {
    const where: any = {};

    if (this.status) {
      where.status = this.status;
    }

    return Object.keys(where).length > 0 ? where : undefined;
  }
}