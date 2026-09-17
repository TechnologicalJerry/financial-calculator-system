import { IsNumber, IsString, IsPositive } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class TaxEstimatorDto {
  @ApiProperty({ example: 95000 })
  @IsNumber()
  @IsPositive()
  grossIncome: number;

  @ApiProperty({ example: 'SINGLE', description: 'SINGLE, MARRIED_JOINT, HEAD_OF_HOUSEHOLD' })
  @IsString()
  filingStatus: string;

  @ApiProperty({ example: 13850, required: false })
  @IsNumber()
  deductions?: number;
}
