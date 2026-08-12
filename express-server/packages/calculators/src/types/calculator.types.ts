import { ZodType, ZodTypeDef } from 'zod';

export enum CalculatorCategory {
  INTEREST = 'INTEREST',
  LOAN = 'LOAN',
  MORTGAGE = 'MORTGAGE',
  INVESTMENT = 'INVESTMENT',
  SAVINGS = 'SAVINGS',
  RETIREMENT = 'RETIREMENT',
}

export interface CalculatorMetadata {
  id: string;
  name: string;
  version: string;
  description: string;
  category: CalculatorCategory;
  supportedCurrencies: string[];
}

export interface CalculatorResultMeta {
  currency: string;
  calculatedAt: string;
  assumptions?: string[];
  [key: string]: unknown;
}

export interface CalculatorResponse<TInput = unknown, TResult = unknown> {
  calculator: {
    id: string;
    name: string;
    version: string;
  };
  input: TInput;
  result: TResult;
  metadata: CalculatorResultMeta;
}

export interface ICalculator<TInput = unknown, TOutput = unknown> {
  readonly metadata: CalculatorMetadata;
  readonly inputSchema: ZodType<TInput, ZodTypeDef, unknown>;
  calculate(input: TInput): TOutput;
  validateInput(input: unknown): TInput;
}
