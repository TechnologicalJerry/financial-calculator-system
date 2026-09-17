import { IsNumber, IsPositive, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class MortgageDto {
  @ApiProperty({ example: 400000 })
  @IsNumber()
  @IsPositive()
  homePrice: number;

  @ApiProperty({ example: 80000 })
  @IsNumber()
  downPayment: number;

  @ApiProperty({ example: 6.5 })
  @IsNumber()
  annualInterestRate: number;

  @ApiProperty({ example: 30 })
  @IsNumber()
  termYears: number;

  @ApiProperty({ example: 1.2, required: false })
  @IsOptional()
  @IsNumber()
  propertyTaxRate?: number; // annual %

  @ApiProperty({ example: 1200, required: false })
  @IsOptional()
  @IsNumber()
  homeInsuranceAnnual?: number;

  @ApiProperty({ example: 0.5, required: false })
  @IsOptional()
  @IsNumber()
  pmiRate?: number; // annual PMI %
}
