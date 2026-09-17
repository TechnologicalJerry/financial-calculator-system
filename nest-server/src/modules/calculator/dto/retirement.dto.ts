import { IsNumber, IsPositive, IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RetirementDto {
  @ApiProperty({ example: 30 })
  @IsInt()
  @IsPositive()
  currentAge: number;

  @ApiProperty({ example: 60 })
  @IsInt()
  @IsPositive()
  retirementAge: number;

  @ApiProperty({ example: 50000 })
  @IsNumber()
  currentSavings: number;

  @ApiProperty({ example: 1000 })
  @IsNumber()
  monthlyContribution: number;

  @ApiProperty({ example: 8.0 })
  @IsNumber()
  expectedReturnRate: number;

  @ApiProperty({ example: 2.5 })
  @IsNumber()
  inflationRate: number;

  @ApiProperty({ example: 4.0 })
  @IsNumber()
  safeWithdrawalRate: number;
}
