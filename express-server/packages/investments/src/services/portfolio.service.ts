import { randomUUID } from 'crypto';
import { NotFoundError, ValidationError } from '@packages/errors';
import { EventPublisher } from '@packages/messaging';
import { getLogger } from '@packages/logger';
import { Prisma } from '@prisma/client';
import { portfolioRepository, PortfolioRepository } from '../repositories/portfolio.repository.js';
import {
  createPortfolioSchema,
  updatePortfolioSchema,
  portfolioQuerySchema,
} from '../schemas/investment.schemas.js';

export class PortfolioService {
  private publisher = new EventPublisher();

  constructor(private repository: PortfolioRepository = portfolioRepository) {}

  public async createPortfolio(userId: string, rawInput: unknown, correlationId?: string) {
    const parse = createPortfolioSchema.safeParse(rawInput);
    if (!parse.success) {
      throw new ValidationError('Invalid portfolio creation parameters', parse.error.errors);
    }
    const data = parse.data;

    const portfolio = await this.repository.createPortfolio({
      userId,
      name: data.name,
      description: data.description,
      baseCurrency: data.baseCurrency,
      status: data.status,
    });

    try {
      const corrId = correlationId || randomUUID();
      await this.publisher.publish({
        exchange: 'amq.direct',
        routingKey: 'portfolio.created',
        correlationId: corrId,
        message: {
          eventId: randomUUID(),
          eventType: 'portfolio.created',
          userId,
          portfolioId: portfolio.id,
          timestamp: new Date().toISOString(),
          correlationId: corrId,
        },
      });
    } catch (err) {
      getLogger().warn({ err, portfolioId: portfolio.id }, 'Failed to publish portfolio.created event');
    }

    return portfolio;
  }

  public async listPortfolios(userId: string, rawQuery: unknown) {
    const parse = portfolioQuerySchema.safeParse(rawQuery);
    if (!parse.success) {
      throw new ValidationError('Invalid portfolio query parameters', parse.error.errors);
    }
    const query = parse.data;

    const [items, total] = await Promise.all([
      this.repository.findPortfoliosForUser(userId, query),
      this.repository.countPortfoliosForUser(userId, query),
    ]);

    const totalPages = Math.ceil(total / query.limit) || 1;

    return {
      data: items,
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages,
      },
    };
  }

  public async getPortfolioDetail(id: string, userId: string) {
    const portfolio = await this.repository.findPortfolioByIdForUser(id, userId);
    if (!portfolio) {
      throw new NotFoundError(`Portfolio '${id}' not found`);
    }
    return portfolio;
  }

  public async updatePortfolio(id: string, userId: string, rawInput: unknown, correlationId?: string) {
    const parse = updatePortfolioSchema.safeParse(rawInput);
    if (!parse.success) {
      throw new ValidationError('Invalid portfolio update parameters', parse.error.errors);
    }
    const data = parse.data;

    const updateData: Prisma.PortfolioUpdateInput = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.baseCurrency !== undefined) updateData.baseCurrency = data.baseCurrency;
    if (data.status !== undefined) updateData.status = data.status;

    const updated = await this.repository.updatePortfolioForUser(id, userId, updateData);
    if (!updated) {
      throw new NotFoundError(`Portfolio '${id}' not found`);
    }

    try {
      const corrId = correlationId || randomUUID();
      await this.publisher.publish({
        exchange: 'amq.direct',
        routingKey: 'portfolio.updated',
        correlationId: corrId,
        message: {
          eventId: randomUUID(),
          eventType: 'portfolio.updated',
          userId,
          portfolioId: id,
          timestamp: new Date().toISOString(),
          correlationId: corrId,
        },
      });
    } catch (err) {
      getLogger().warn({ err, portfolioId: id }, 'Failed to publish portfolio.updated event');
    }

    return updated;
  }

  public async deletePortfolio(id: string, userId: string, correlationId?: string) {
    const deleted = await this.repository.deletePortfolioForUser(id, userId);
    if (!deleted) {
      throw new NotFoundError(`Portfolio '${id}' not found`);
    }

    try {
      const corrId = correlationId || randomUUID();
      await this.publisher.publish({
        exchange: 'amq.direct',
        routingKey: 'portfolio.deleted',
        correlationId: corrId,
        message: {
          eventId: randomUUID(),
          eventType: 'portfolio.deleted',
          userId,
          portfolioId: id,
          timestamp: new Date().toISOString(),
          correlationId: corrId,
        },
      });
    } catch (err) {
      getLogger().warn({ err, portfolioId: id }, 'Failed to publish portfolio.deleted event');
    }

    return { id, deleted: true };
  }
}

export const portfolioService = new PortfolioService();
