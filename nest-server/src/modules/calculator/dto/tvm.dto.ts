import { IsNumber, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class TvmDto {
  @ApiProperty({ example: 10000, required: false })
  @IsOptional()
  @IsNumber()
  presentValue?: number;

  @ApiProperty({ example: 20000, required: false })
  @IsOptional()
  @IsNumber()
  futureValue?: number;

  @ApiProperty({ example: 7.0 })
  @IsNumber()
  annualRate: number;

  @ApiProperty({ example: 10 })
  @IsNumber()
  periods: number;
}
