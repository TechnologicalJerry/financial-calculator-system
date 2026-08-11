import { getPrismaClient } from '@packages/database';
import { CalculationStatus, Prisma } from '@prisma/client';
import { HistoryQueryInput } from '../schemas/history.schemas.js';

export interface CreateCalculationData {
  userId: string;
  calculatorId: string;
  calculatorVersion: string;
  status?: CalculationStatus;
  currency?: string;
  input: Record<string, unknown>;
  result: Record<string, unknown>;
}

export interface CreateAuditEventData {
  userId: string;
  calculationId?: string;
  eventType: string;
  metadata?: Record<string, unknown>;
}

export class CalculationRepository {
  private get prisma() {
    return getPrismaClient();
  }

  public async create(data: CreateCalculationData) {
    return this.prisma.calculation.create({
      data: {
        userId: data.userId,
        calculatorId: data.calculatorId,
        calculatorVersion: data.calculatorVersion,
        status: data.status || CalculationStatus.COMPLETED,
        currency: data.currency || 'USD',
        input: data.input as Prisma.InputJsonValue,
        result: data.result as Prisma.InputJsonValue,
      },
    });
  }

  public async findByIdForUser(id: string, userId: string) {
    return this.prisma.calculation.findFirst({
      where: {
        id,
        userId,
      },
    });
  }

  private buildWhereClause(userId: string, options: HistoryQueryInput): Prisma.CalculationWhereInput {
    const whereClause: Prisma.CalculationWhereInput = { userId };

    if (options.calculatorId) {
      whereClause.calculatorId = options.calculatorId;
    }
    if (options.status) {
      whereClause.status = options.status;
    }
    if (options.currency) {
      whereClause.currency = options.currency.toUpperCase();
    }
    if (options.fromDate || options.toDate) {
      const createdAtFilter: Prisma.DateTimeFilter = {};
      if (options.fromDate) {
        createdAtFilter.gte = new Date(options.fromDate);
      }
      if (options.toDate) {
        createdAtFilter.lte = new Date(options.toDate);
      }
      whereClause.createdAt = createdAtFilter;
    }

    return whereClause;
  }

  public async findManyForUser(userId: string, options: HistoryQueryInput) {
    const whereClause = this.buildWhereClause(userId, options);

    const page = options.page || 1;
    const limit = options.limit || 20;
    const skip = (page - 1) * limit;

    const sortField = options.sortBy || 'createdAt';
    const sortOrder = options.sortOrder || 'desc';
    const orderBy: Prisma.CalculationOrderByWithRelationInput = {
      [sortField]: sortOrder,
    };

    return this.prisma.calculation.findMany({
      where: whereClause,
      skip,
      take: limit,
      orderBy,
    });
  }

  public async countForUser(userId: string, options: HistoryQueryInput) {
    const whereClause = this.buildWhereClause(userId, options);

    return this.prisma.calculation.count({
      where: whereClause,
    });
  }

  public async deleteForUser(id: string, userId: string) {
    const existing = await this.findByIdForUser(id, userId);
    if (!existing) return null;

    return this.prisma.calculation.delete({
      where: {
        id,
      },
    });
  }

  public async createAuditEvent(data: CreateAuditEventData) {
    return this.prisma.calculationAuditEvent.create({
      data: {
        userId: data.userId,
        calculationId: data.calculationId ?? null,
        eventType: data.eventType,
        metadata: data.metadata ? (data.metadata as Prisma.InputJsonValue) : Prisma.JsonNull,
      },
    });
  }
}

export const calculationRepository = new CalculationRepository();
