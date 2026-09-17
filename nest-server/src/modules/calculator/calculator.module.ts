import { Module } from '@nestjs/common';
import { CalculatorController } from './calculator.controller';
import { CalculatorService } from './calculator.service';
import { CalculatorCompatController } from './calculator-compat.controller';

@Module({
  controllers: [CalculatorController, CalculatorCompatController],
  providers: [CalculatorService],
  exports: [CalculatorService],
})
export class CalculatorModule {}
