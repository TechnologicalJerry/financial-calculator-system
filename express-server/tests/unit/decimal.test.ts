import {
  toDecimal,
  isValidDecimal,
  toPercentageDecimal,
  roundDecimal,
  formatDecimal,
  formatCurrency,
  add,
  sub,
  mul,
  div,
  Decimal,
} from '@packages/calculators';
import { CalculatorInputError } from '@packages/errors';

describe('Decimal Precision & Utilities Unit Tests', () => {
  it('should avoid floating-point representation errors (0.1 + 0.2 === 0.3)', () => {
    const sum = add('0.1', '0.2');
    expect(sum.toString()).toBe('0.3');
    expect(sum.equals(new Decimal('0.3'))).toBe(true);
  });

  it('should parse valid numbers and decimal strings correctly', () => {
    expect(toDecimal(100.5).toString()).toBe('100.5');
    expect(toDecimal('1000000.000005').toString()).toBe('1000000.000005');
  });

  it('should throw CalculatorInputError on NaN or Infinity', () => {
    expect(() => toDecimal(NaN)).toThrow(CalculatorInputError);
    expect(() => toDecimal(Infinity)).toThrow(CalculatorInputError);
    expect(() => toDecimal('invalid-number')).toThrow(CalculatorInputError);
  });

  it('should validate decimal representations accurately', () => {
    expect(isValidDecimal('123.45')).toBe(true);
    expect(isValidDecimal(0)).toBe(true);
    expect(isValidDecimal('abc')).toBe(false);
    expect(isValidDecimal(null)).toBe(false);
  });

  it('should convert percentage to decimal fraction correctly', () => {
    expect(toPercentageDecimal(5).toString()).toBe('0.05');
    expect(toPercentageDecimal('7.5').toString()).toBe('0.075');
  });

  it('should round and format decimals using HALF_UP convention', () => {
    const d = new Decimal('123.456');
    expect(roundDecimal(d, 2).toString()).toBe('123.46');
    expect(formatDecimal(d, 2)).toBe('123.46');
    expect(formatCurrency(d, 'USD', 2)).toBe('USD 123.46');
  });

  it('should handle basic arithmetic functions without precision loss', () => {
    expect(add('10.5', '5.25').toString()).toBe('15.75');
    expect(sub('10.5', '5.25').toString()).toBe('5.25');
    expect(mul('10.5', '2').toString()).toBe('21');
    expect(div('21', '2').toString()).toBe('10.5');
  });

  it('should throw error on division by zero', () => {
    expect(() => div(100, 0)).toThrow(CalculatorInputError);
  });
});
