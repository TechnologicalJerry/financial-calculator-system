import { IsNumber, IsPositive, IsInt, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CompoundInterestDto {
  @ApiProperty({ example: 10000 })
  @IsNumber()
  @IsPositive()
  principal: number;

  @ApiProperty({ example: 7.5 })
  @IsNumber()
  @IsPositive()
  annualRate: number; // percentage, e.g. 7.5%

  @ApiProperty({ example: 10 })
  @IsInt()
  @IsPositive()
  years: number;

  @ApiProperty({ example: 12, description: '1 = Annually, 4 = Quarterly, 12 = Monthly' })
  @IsInt()
  @Min(1)
  @Max(365)
  compoundingFrequency: number;
}
