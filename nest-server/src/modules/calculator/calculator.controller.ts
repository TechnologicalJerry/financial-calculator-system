import { Controller, Post, Body, HttpCode, HttpStatus, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CalculatorService } from './calculator.service';
import { CompoundInterestDto } from './dto/compound-interest.dto';
import { LoanAmortizationDto } from './dto/loan-amortization.dto';
import { MortgageDto } from './dto/mortgage.dto';
import { RetirementDto } from './dto/retirement.dto';
import { SipDto } from './dto/sip.dto';
import { TvmDto } from './dto/tvm.dto';
import { TaxEstimatorDto } from './dto/tax-estimator.dto';

@ApiTags('Financial Calculators')
@Controller('api/v1/calculator')
export class CalculatorController {
  constructor(
    @Inject(CalculatorService) private readonly calculatorService: CalculatorService
  ) {}

  @Post('compound-interest')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Calculate Compound Interest and Future Value' })
  compoundInterest(@Body() dto: CompoundInterestDto) {
    return this.calculatorService.calculateCompoundInterest(dto);
  }

  @Post('loan-amortization')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Calculate Loan Monthly Payment & Amortization Schedule' })
  loanAmortization(@Body() dto: LoanAmortizationDto) {
    return this.calculatorService.calculateLoanAmortization(dto);
  }

  @Post('mortgage')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Calculate Monthly Mortgage Payment (P&I, Taxes, Insurance, PMI)' })
  mortgage(@Body() dto: MortgageDto) {
    return this.calculatorService.calculateMortgage(dto);
  }

  @Post('retirement')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Calculate Retirement Savings & FIRE Target' })
  retirement(@Body() dto: RetirementDto) {
    return this.calculatorService.calculateRetirement(dto);
  }

  @Post('fire')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Calculate FIRE Target (Alias for Retirement)' })
  fire(@Body() dto: any) {
    return this.calculatorService.calculateRetirement(dto);
  }

  @Post('sip')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Calculate SIP Mutual Fund Investment Projection' })
  sip(@Body() dto: SipDto) {
    return this.calculatorService.calculateSip(dto);
  }

  @Post('lumpsum')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Calculate Lumpsum Investment Return' })
  lumpsum(@Body() dto: any) {
    return this.calculatorService.calculateLumpsum(dto);
  }

  @Post('tvm')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Calculate Time Value of Money (PV & FV)' })
  tvm(@Body() dto: TvmDto) {
    return this.calculatorService.calculateTvm(dto);
  }

  @Post('inflation')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Calculate Future Purchasing Power & Inflation Impact' })
  inflation(@Body() dto: any) {
    return this.calculatorService.calculateInflation(dto);
  }

  @Post('tax-estimator')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Estimate Federal Progressive Income Tax' })
  taxEstimator(@Body() dto: TaxEstimatorDto) {
    return this.calculatorService.calculateTax(dto);
  }

  @Post('tax')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Estimate Progressive Income Tax (Alias for tax-estimator)' })
  tax(@Body() dto: any) {
    return this.calculatorService.calculateTax(dto);
  }
}
