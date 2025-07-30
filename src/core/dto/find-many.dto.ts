/**
 * Find Many DTO - For paginated list endpoints
 * Extends BaseQueryDto with list-specific features
 */

import { IsOptional, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { BaseQueryDto } from './base-query.dto';

export class FindManyDto extends BaseQueryDto {
  @ApiPropertyOptional({ example: 50, description: 'Maximum items per page', maximum: 100 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 20;

  @ApiPropertyOptional({ example: true, description: 'Include total count for pagination' })
  @IsOptional()
  @Type(() => Boolean)
  includeTotalCount?: boolean = true;
}