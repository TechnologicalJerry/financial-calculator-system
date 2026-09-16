import { Decimal } from 'decimal.js';

export class DecimalUtils {
  static toDecimal(value: string | number | Decimal): Decimal {
    return new Decimal(value || 0);
  }

  static add(a: string | number | Decimal, b: string | number | Decimal): Decimal {
    return this.toDecimal(a).plus(this.toDecimal(b));
  }

  static subtract(a: string | number | Decimal, b: string | number | Decimal): Decimal {
    return this.toDecimal(a).minus(this.toDecimal(b));
  }

  static multiply(a: string | number | Decimal, b: string | number | Decimal): Decimal {
    return this.toDecimal(a).times(this.toDecimal(b));
  }

  static divide(a: string | number | Decimal, b: string | number | Decimal): Decimal {
    const denom = this.toDecimal(b);
    if (denom.isZero()) {
      throw new Error('Division by zero in financial calculation');
    }
    return this.toDecimal(a).dividedBy(denom);
  }

  static pow(base: string | number | Decimal, exponent: number): Decimal {
    return this.toDecimal(base).pow(exponent);
  }

  static round(value: string | number | Decimal, decimals = 2): number {
    return this.toDecimal(value).toDecimalPlaces(decimals, Decimal.ROUND_HALF_UP).toNumber();
  }
}
