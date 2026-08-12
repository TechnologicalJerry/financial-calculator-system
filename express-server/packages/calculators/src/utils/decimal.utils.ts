import Decimal from 'decimal.js';
import { CalculatorInputError } from '@packages/errors';

// Set default Decimal configuration for financial precision
Decimal.set({ precision: 30, rounding: Decimal.ROUND_HALF_UP });

export { Decimal };

/**
 * Safely parses any input into a Decimal instance.
 * Throws CalculatorInputError if input is NaN, Infinity, or unparseable.
 */
export function toDecimal(val: Decimal.Value): Decimal {
  try {
    const d = new Decimal(val);
    if (d.isNaN() || !d.isFinite()) {
      throw new CalculatorInputError('Decimal value must be a finite number');
    }
    return d;
  } catch (err) {
    if (err instanceof CalculatorInputError) throw err;
    throw new CalculatorInputError('Invalid numeric/decimal value provided');
  }
}

/**
 * Checks whether a given value is a valid, finite Decimal representation.
 */
export function isValidDecimal(val: unknown): boolean {
  if (val === null || val === undefined || val === '') return false;
  try {
    const d = new Decimal(val as Decimal.Value);
    return !d.isNaN() && d.isFinite();
  } catch {
    return false;
  }
}

/**
 * Converts a percentage value (e.g. 5 for 5%) into a decimal fraction (0.05).
 */
export function toPercentageDecimal(ratePercentage: Decimal.Value): Decimal {
  const p = toDecimal(ratePercentage);
  return p.dividedBy(100);
}

/**
 * Rounds a Decimal to specified decimal places using HALF_UP rounding.
 */
export function roundDecimal(
  val: Decimal,
  dp = 2,
  roundingMode: Decimal.Rounding = Decimal.ROUND_HALF_UP,
): Decimal {
  return val.toDecimalPlaces(dp, roundingMode);
}

/**
 * Formats a Decimal to a string representation with exact decimal places.
 */
export function formatDecimal(val: Decimal.Value, dp = 2): string {
  const d = toDecimal(val);
  return d.toFixed(dp);
}

/**
 * Formats a decimal amount as a currency string representation.
 */
export function formatCurrency(val: Decimal.Value, currency = 'USD', dp = 2): string {
  const formatted = formatDecimal(val, dp);
  return `${currency} ${formatted}`;
}

export function add(a: Decimal.Value, b: Decimal.Value): Decimal {
  return toDecimal(a).plus(toDecimal(b));
}

export function sub(a: Decimal.Value, b: Decimal.Value): Decimal {
  return toDecimal(a).minus(toDecimal(b));
}

export function mul(a: Decimal.Value, b: Decimal.Value): Decimal {
  return toDecimal(a).times(toDecimal(b));
}

export function div(a: Decimal.Value, b: Decimal.Value): Decimal {
  const denominator = toDecimal(b);
  if (denominator.isZero()) {
    throw new CalculatorInputError('Division by zero is invalid');
  }
  return toDecimal(a).dividedBy(denominator);
}

export function pow(base: Decimal.Value, exponent: Decimal.Value): Decimal {
  return toDecimal(base).pow(toDecimal(exponent));
}
