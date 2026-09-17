import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class SearchHistoryDto {
  @ApiPropertyOptional({ description: 'Filter query keyword' })
  @IsString()
  @IsOptional()
  query?: string;

  @ApiPropertyOptional({ description: 'Calculator code filter' })
  @IsString()
  @IsOptional()
  calculatorCode?: string;
}

export class BatchDeleteHistoryDto {
  @ApiProperty({ description: 'Array of calculation history UUIDs to delete' })
  @IsArray()
  @IsUUID(undefined, { each: true })
  ids!: string[];
}

export class GenerateReportDto {
  @ApiProperty({ description: 'Report type e.g. TAX_SUMMARY, NET_WORTH, PORTFOLIO_ANALYSIS' })
  @IsString()
  @IsNotEmpty()
  reportType!: string;

  @ApiPropertyOptional({ description: 'Report title' })
  @IsString()
  @IsOptional()
  title?: string;
}

export class ExportReportDto {
  @ApiProperty({ description: 'Report type or target ID' })
  @IsString()
  @IsNotEmpty()
  reportType!: string;

  @ApiPropertyOptional({ description: 'Export format: PDF, CSV, EXCEL', default: 'PDF' })
  @IsString()
  @IsOptional()
  format?: string;
}
