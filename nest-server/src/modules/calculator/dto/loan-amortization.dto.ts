import { IsNumber, IsPositive, IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoanAmortizationDto {
  @ApiProperty({ example: 250000 })
  @IsNumber()
  @IsPositive()
  loanAmount: number;

  @ApiProperty({ example: 6.5 })
  @IsNumber()
  @IsPositive()
  annualInterestRate: number;

  @ApiProperty({ example: 30 })
  @IsInt()
  @IsPositive()
  termYears: number;
}
