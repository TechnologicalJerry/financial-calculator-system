import { randomUUID } from 'crypto';
import { NotFoundError, ValidationError } from '@packages/errors';
import { EventPublisher } from '@packages/messaging';
import { getLogger } from '@packages/logger';
import { calculatorService } from './calculator.service.js';
import { calculationRepository, CalculationRepository } from '../repository/calculation.repository.js';
import { historyQuerySchema } from '../schemas/history.schemas.js';
import { CalculatorResponse } from '../types/calculator.types.js';

export interface CalculationHistoryResponse<TInput = unknown, TResult = unknown> extends CalculatorResponse<TInput, TResult> {
  id?: string;
}

export class CalculationHistoryService {
  private publisher = new EventPublisher();

  constructor(private repository: CalculationRepository = calculationRepository) {}

  public async executeAndPersist(
    calculatorId: string,
    rawInput: unknown,
    userId?: string,
    correlationId?: string,
  ): Promise<CalculationHistoryResponse> {
    const calcResponse = calculatorService.calculate(calculatorId, rawInput);

    if (!userId) {
      return calcResponse;
    }

    const inputData = calcResponse.input as Record<string, unknown>;
    const resultData = calcResponse.result as Record<string, unknown>;
    const currency = calcResponse.metadata.currency || 'USD';

    // 1. Save Calculation record
    const savedCalculation = await this.repository.create({
      userId,
      calculatorId: calcResponse.calculator.id,
      calculatorVersion: calcResponse.calculator.version,
      currency,
      input: inputData,
      result: resultData,
    });

    // 2. Audit Event
    try {
      await this.repository.createAuditEvent({
        userId,
        calculationId: savedCalculation.id,
        eventType: 'calculation.created',
        metadata: {
          calculatorId: calcResponse.calculator.id,
          calculatorVersion: calcResponse.calculator.version,
          currency,
        },
      });
    } catch (auditErr) {
      getLogger().warn({ err: auditErr, calculationId: savedCalculation.id }, 'Failed to persist audit event');
    }

    // 3. RabbitMQ Event
    try {
      const corrId = correlationId || randomUUID();
      await this.publisher.publish({
        exchange: 'amq.direct',
        routingKey: 'calculation.created',
        correlationId: corrId,
        message: {
          eventId: randomUUID(),
          eventType: 'calculation.created',
          calculationId: savedCalculation.id,
          userId,
          calculatorId: calcResponse.calculator.id,
          calculatorVersion: calcResponse.calculator.version,
          timestamp: savedCalculation.createdAt.toISOString(),
          correlationId: corrId,
        },
      });
    } catch (msgErr) {
      getLogger().warn({ err: msgErr, calculationId: savedCalculation.id }, 'Failed to publish calculation.created event');
    }

    return {
      id: savedCalculation.id,
      ...calcResponse,
      metadata: {
        ...calcResponse.metadata,
        id: savedCalculation.id,
      },
    };
  }

  public async getCalculationDetail(id: string, userId: string) {
    const record = await this.repository.findByIdForUser(id, userId);
    if (!record) {
      throw new NotFoundError(`Calculation record '${id}' not found`);
    }

    return {
      id: record.id,
      userId: record.userId,
      calculator: {
        id: record.calculatorId,
        version: record.calculatorVersion,
      },
      status: record.status,
      currency: record.currency,
      input: record.input,
      result: record.result,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    };
  }

  public async listCalculationHistory(userId: string, rawQuery: unknown) {
    const parseResult = historyQuerySchema.safeParse(rawQuery);
    if (!parseResult.success) {
      throw new ValidationError('Invalid calculation history query parameters', parseResult.error.errors);
    }
    const query = parseResult.data;

    const [items, total] = await Promise.all([
      this.repository.findManyForUser(userId, query),
      this.repository.countForUser(userId, query),
    ]);

    const totalPages = Math.ceil(total / query.limit) || 1;

    const formattedData = items.map((item) => ({
      id: item.id,
      calculatorId: item.calculatorId,
      calculatorVersion: item.calculatorVersion,
      status: item.status,
      currency: item.currency,
      input: item.input,
      result: item.result,
      createdAt: item.createdAt.toISOString(),
    }));

    return {
      data: formattedData,
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages,
      },
    };
  }

  public async deleteCalculationHistory(id: string, userId: string, correlationId?: string) {
    const deleted = await this.repository.deleteForUser(id, userId);
    if (!deleted) {
      throw new NotFoundError(`Calculation record '${id}' not found`);
    }

    // 1. Audit Event
    try {
      await this.repository.createAuditEvent({
        userId,
        calculationId: id,
        eventType: 'calculation.deleted',
        metadata: {
          calculatorId: deleted.calculatorId,
          calculatorVersion: deleted.calculatorVersion,
        },
      });
    } catch (auditErr) {
      getLogger().warn({ err: auditErr, calculationId: id }, 'Failed to persist audit event');
    }

    // 2. RabbitMQ Event
    try {
      const corrId = correlationId || randomUUID();
      await this.publisher.publish({
        exchange: 'amq.direct',
        routingKey: 'calculation.deleted',
        correlationId: corrId,
        message: {
          eventId: randomUUID(),
          eventType: 'calculation.deleted',
          calculationId: id,
          userId,
          calculatorId: deleted.calculatorId,
          timestamp: new Date().toISOString(),
          correlationId: corrId,
        },
      });
    } catch (msgErr) {
      getLogger().warn({ err: msgErr, calculationId: id }, 'Failed to publish calculation.deleted event');
    }

    return {
      id,
      deleted: true,
    };
  }
}

export const calculationHistoryService = new CalculationHistoryService();
