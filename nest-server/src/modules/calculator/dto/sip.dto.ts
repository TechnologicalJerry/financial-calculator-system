import { IsNumber, IsPositive, IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SipDto {
  @ApiProperty({ example: 500 })
  @IsNumber()
  @IsPositive()
  monthlyInvestment: number;

  @ApiProperty({ example: 12.0 })
  @IsNumber()
  expectedCagr: number;

  @ApiProperty({ example: 15 })
  @IsInt()
  @IsPositive()
  investmentYears: number;
}
