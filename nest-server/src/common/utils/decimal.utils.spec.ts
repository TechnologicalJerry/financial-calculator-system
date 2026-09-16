import { describe, it, expect } from 'vitest';
import { DecimalUtils } from './decimal.utils';

describe('DecimalUtils (Vitest Financial Precision Unit Tests)', () => {
  it('should add numbers with exact precision', () => {
    const result = DecimalUtils.add('100.50', '200.25');
    expect(result.toString()).toBe('300.75');
  });

  it('should subtract numbers with exact precision', () => {
    const result = DecimalUtils.subtract('500.00', '125.50');
    expect(result.toString()).toBe('374.5');
  });

  it('should multiply numbers with exact precision', () => {
    const result = DecimalUtils.multiply('50.00', '1.075');
    expect(result.toString()).toBe('53.75');
  });

  it('should throw error on division by zero', () => {
    expect(() => DecimalUtils.divide('100', '0')).toThrow('Division by zero in financial calculation');
  });

  it('should round correctly to specified decimal places', () => {
    const rounded = DecimalUtils.round('123.45678', 2);
    expect(rounded).toBe(123.46);
  });
});
