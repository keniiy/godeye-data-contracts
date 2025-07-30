/**
 * Find One DTO - For single entity endpoints
 * Uses unified include parameter for both fields and relations
 */

import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ICriteria } from '../../types/repository.types';

export class FindOneDto {
  @ApiPropertyOptional({
    example: 'id,name,email,profile,business',
    description: 'Fields and relations to include in response (comma-separated)'
  })
  @IsOptional()
  @IsString()
  include?: string;

  /**
   * Convert to ICriteria for single entity lookup
   */
  toICriteria(id: string | number): ICriteria<any> {
    const includeFields = this.parseInclude(this.include);

    return {
      where: { id },
      relations: includeFields.relations,
      select: includeFields.fields
    };
  }

  /**
   * Parse unified include parameter - override in entity-specific DTOs
   */
  protected parseInclude(includeStr?: string): { relations: string[], fields: string[] } {
    if (!includeStr) return { relations: [], fields: [] };

    const items = includeStr.split(',').map(s => s.trim());
    const relations: string[] = [];
    const fields: string[] = [];

    // Base implementation treats all as fields (override in subclasses)
    const knownRelations = this.getKnownRelations();

    items.forEach(item => {
      if (knownRelations.includes(item)) {
        relations.push(item);
      } else {
        fields.push(item);
      }
    });

    return { relations, fields };
  }

  protected getKnownRelations(): string[] {
    return []; // Override in entity-specific DTOs
  }
}