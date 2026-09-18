import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreateInvestmentAccountDto {
  @ApiProperty({ description: 'Account name' })
  @IsString()
  @IsNotEmpty()
  accountName!: string;

  @ApiProperty({ description: 'Account type e.g. BROKERAGE, RETIREMENT, CRYPTO' })
  @IsString()
  @IsNotEmpty()
  accountType!: string;

  @ApiPropertyOptional({ description: 'Portfolio ID to link this account' })
  @IsUUID()
  @IsOptional()
  portfolioId?: string;

  @ApiPropertyOptional({ description: 'Financial institution name' })
  @IsString()
  @IsOptional()
  institutionName?: string;

  @ApiPropertyOptional({ description: 'Masked account number' })
  @IsString()
  @IsOptional()
  accountNumberMasked?: string;

  @ApiPropertyOptional({ description: 'Initial balance', default: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  balance?: number;

  @ApiPropertyOptional({ description: 'Currency code', default: 'USD' })
  @IsString()
  @IsOptional()
  currency?: string;
}

export class AddInvestmentHoldingDto {
  @ApiProperty({ description: 'Investment account ID' })
  @IsUUID()
  @IsNotEmpty()
  accountId!: string;

  @ApiProperty({ description: 'Ticker symbol e.g. AAPL, VTI' })
  @IsString()
  @IsNotEmpty()
  symbol!: string;

  @ApiProperty({ description: 'Security name' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ description: 'Asset class e.g. EQUITY, ETF, BOND, CRYPTO' })
  @IsString()
  @IsNotEmpty()
  assetClass!: string;

  @ApiProperty({ description: 'Quantity owned' })
  @IsNumber()
  @Min(0)
  quantity!: number;

  @ApiProperty({ description: 'Cost basis per share or total' })
  @IsNumber()
  @Min(0)
  costBasis!: number;

  @ApiProperty({ description: 'Current market price' })
  @IsNumber()
  @Min(0)
  currentPrice!: number;
}
