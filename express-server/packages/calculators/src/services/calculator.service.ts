import { CalculatorRegistry, calculatorRegistry } from '../registry/calculator.registry.js';
import { CalculatorMetadata, CalculatorResponse } from '../types/calculator.types.js';

export class CalculatorService {
  constructor(private registry: CalculatorRegistry = calculatorRegistry) {}

  public listCalculators(): CalculatorMetadata[] {
    return this.registry.list();
  }

  public getCalculatorMetadata(calculatorId: string): CalculatorMetadata {
    const calculator = this.registry.get(calculatorId);
    return calculator.metadata;
  }

  public calculate(calculatorId: string, rawInput: unknown): CalculatorResponse {
    const calculator = this.registry.get(calculatorId);
    const validatedInput = calculator.validateInput(rawInput);
    const result = calculator.calculate(validatedInput);

    const inputRecord = validatedInput as Record<string, unknown>;
    const currency = (inputRecord['currency'] as string) || 'USD';

    const resultObj = result as Record<string, unknown>;
    const assumptions = Array.isArray(resultObj['assumptions'])
      ? (resultObj['assumptions'] as string[])
      : undefined;

    return {
      calculator: {
        id: calculator.metadata.id,
        name: calculator.metadata.name,
        version: calculator.metadata.version,
      },
      input: validatedInput,
      result,
      metadata: {
        currency,
        calculatedAt: new Date().toISOString(),
        ...(assumptions ? { assumptions } : {}),
      },
    };
  }
}

export const calculatorService = new CalculatorService();
