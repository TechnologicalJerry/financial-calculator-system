import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CalculatorService } from './calculator.service';
import { ApiResponse } from '../../common/dto/api-response.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PrismaService } from '../../prisma/prisma.service';

@ApiTags('Financial Calculators')
@Controller('api/v1')
export class CalculatorCompatController {
  constructor(private readonly calculators: CalculatorService, private readonly prisma: PrismaService) {}
  private execCalculate(body: any) {
    const type = String(body.code ?? body.type ?? body.calculatorCode ?? '').toLowerCase();
    if (type.includes('sip')) return this.calculators.calculateSip(body);
    if (type.includes('loan') || type.includes('amortization')) return this.calculators.calculateLoanAmortization(body);
    if (type.includes('mortgage')) return this.calculators.calculateMortgage(body);
    if (type.includes('retirement') || type.includes('fire')) return this.calculators.calculateRetirement(body);
    if (type.includes('tax')) return this.calculators.calculateTax(body);
    if (type.includes('tvm')) return this.calculators.calculateTvm(body);
    return this.calculators.calculateCompoundInterest(body);
  }
  @Post('calculators/calculate') calculate(@Body() body: any) { return this.execCalculate(body); }
  @Post('calculators/evaluate-formula') evaluate(@Body() body: any) { return this.execCalculate(body); }
  @Post('calculators/validate-formula') validate(@Body() body: any) { return ApiResponse.ok({ valid: Boolean(body.expression), errors: body.expression ? [] : ['expression is required'] }); }
  @Get('calculators/categories') categories() { return this.prisma.financialCalculator.findMany({ distinct: ['category'], select: { category: true } }).then((d) => ApiResponse.ok(d.map((x) => x.category))); }
  @Get('calculators/types') types() { return this.prisma.financialCalculator.findMany({ select: { code: true, name: true, category: true } }).then((d) => ApiResponse.ok(d)); }
  @ApiBearerAuth() @UseGuards(JwtAuthGuard) @Get('calculators/history') history(@CurrentUser('userId') userId: string) { return this.prisma.calculationHistory.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } }).then((d) => ApiResponse.ok(d)); }
  @Post('financial-calculators/calculate') financialCalculate(@Body() body: any) { return this.execCalculate(body); }
  @Post('financial-calculators/amortization') amortization(@Body() body: any) { return this.calculators.calculateLoanAmortization(body); }
  @Get('financial-calculators/metadata') metadata() { return this.prisma.financialCalculator.findMany().then((d) => ApiResponse.ok(d)); }
  @Get('financial-calculators/tax-rules') taxRules() { return this.prisma.taxRuleSet.findMany().then((d) => ApiResponse.ok(d)); }
  @ApiBearerAuth() @UseGuards(JwtAuthGuard) @Get('financial-calculators/history') financialHistory(@CurrentUser('userId') userId: string) { return this.prisma.calculationHistory.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } }).then((d) => ApiResponse.ok(d)); }
  @Get('financial-calculators/:code') byCode(@Param('code') code: string) { return this.prisma.financialCalculator.findUnique({ where: { code } }).then((d) => ApiResponse.ok(d)); }
}
