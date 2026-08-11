import { randomUUID } from 'crypto';
import { NotFoundError, ValidationError } from '@packages/errors';
import { EventPublisher } from '@packages/messaging';
import { getLogger } from '@packages/logger';
import { Prisma } from '@prisma/client';
import { toDecimal, roundDecimal, formatDecimal } from '@packages/calculators';
import { goalRepository, GoalRepository } from '../repositories/goal.repository.js';
import {
  createGoalSchema,
  updateGoalSchema,
  goalQuerySchema,
  createContributionSchema,
  contributionQuerySchema,
} from '../schemas/budget.schemas.js';
import { GoalProgressResult } from '../types/budget.types.js';

export class GoalService {
  private publisher = new EventPublisher();

  constructor(private repository: GoalRepository = goalRepository) {}

  public async createGoal(userId: string, rawInput: unknown, correlationId?: string) {
    const parse = createGoalSchema.safeParse(rawInput);
    if (!parse.success) {
      throw new ValidationError('Invalid financial goal creation parameters', parse.error.errors);
    }
    const data = parse.data;

    const goal = await this.repository.createGoal({
      userId,
      name: data.name,
      description: data.description,
      category: data.category,
      targetAmount: data.targetAmount,
      currentAmount: data.currentAmount,
      currency: data.currency,
      targetDate: new Date(data.targetDate),
    });

    try {
      const corrId = correlationId || randomUUID();
      await this.publisher.publish({
        exchange: 'amq.direct',
        routingKey: 'goal.created',
        correlationId: corrId,
        message: {
          eventId: randomUUID(),
          eventType: 'goal.created',
          userId,
          goalId: goal.id,
          timestamp: new Date().toISOString(),
          correlationId: corrId,
        },
      });
    } catch (err) {
      getLogger().warn({ err, goalId: goal.id }, 'Failed to publish goal.created event');
    }

    return goal;
  }

  public async listGoals(userId: string, rawQuery: unknown) {
    const parse = goalQuerySchema.safeParse(rawQuery);
    if (!parse.success) {
      throw new ValidationError('Invalid goal query parameters', parse.error.errors);
    }
    const query = parse.data;

    const [items, total] = await Promise.all([
      this.repository.findGoalsForUser(userId, query),
      this.repository.countGoalsForUser(userId, query),
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

  public async getGoalDetail(id: string, userId: string) {
    const goal = await this.repository.findGoalByIdForUser(id, userId);
    if (!goal) {
      throw new NotFoundError(`Financial goal '${id}' not found`);
    }
    return goal;
  }

  public async updateGoal(id: string, userId: string, rawInput: unknown, correlationId?: string) {
    const parse = updateGoalSchema.safeParse(rawInput);
    if (!parse.success) {
      throw new ValidationError('Invalid goal update parameters', parse.error.errors);
    }
    const data = parse.data;

    const updateData: Prisma.FinancialGoalUpdateInput = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.targetAmount !== undefined) updateData.targetAmount = toDecimal(data.targetAmount).toString();
    if (data.currentAmount !== undefined) updateData.currentAmount = toDecimal(data.currentAmount).toString();
    if (data.currency !== undefined) updateData.currency = data.currency;
    if (data.targetDate !== undefined) updateData.targetDate = new Date(data.targetDate);
    if (data.status !== undefined) updateData.status = data.status;

    const updated = await this.repository.updateGoalForUser(id, userId, updateData);
    if (!updated) {
      throw new NotFoundError(`Financial goal '${id}' not found`);
    }

    try {
      const corrId = correlationId || randomUUID();
      await this.publisher.publish({
        exchange: 'amq.direct',
        routingKey: 'goal.updated',
        correlationId: corrId,
        message: {
          eventId: randomUUID(),
          eventType: 'goal.updated',
          userId,
          goalId: id,
          timestamp: new Date().toISOString(),
          correlationId: corrId,
        },
      });
    } catch (err) {
      getLogger().warn({ err, goalId: id }, 'Failed to publish goal.updated event');
    }

    return updated;
  }

  public async deleteGoal(id: string, userId: string, correlationId?: string) {
    const deleted = await this.repository.deleteGoalForUser(id, userId);
    if (!deleted) {
      throw new NotFoundError(`Financial goal '${id}' not found`);
    }

    try {
      const corrId = correlationId || randomUUID();
      await this.publisher.publish({
        exchange: 'amq.direct',
        routingKey: 'goal.deleted',
        correlationId: corrId,
        message: {
          eventId: randomUUID(),
          eventType: 'goal.deleted',
          userId,
          goalId: id,
          timestamp: new Date().toISOString(),
          correlationId: corrId,
        },
      });
    } catch (err) {
      getLogger().warn({ err, goalId: id }, 'Failed to publish goal.deleted event');
    }

    return { id, deleted: true };
  }

  // CONTRIBUTIONS (TRANSACTIONAL)
  public async createContribution(goalId: string, userId: string, rawInput: unknown, correlationId?: string) {
    const goal = await this.repository.findGoalByIdForUser(goalId, userId);
    if (!goal) {
      throw new NotFoundError(`Financial goal '${goalId}' not found`);
    }

    const parse = createContributionSchema.safeParse(rawInput);
    if (!parse.success) {
      throw new ValidationError('Invalid contribution parameters', parse.error.errors);
    }
    const data = parse.data;

    // Currency check
    if (data.currency && data.currency !== goal.currency) {
      throw new ValidationError(`Contribution currency '${data.currency}' does not match goal currency '${goal.currency}'`);
    }

    const result = await this.repository.createContributionAndUpdateBalance({
      goalId,
      userId,
      amount: data.amount,
      currency: goal.currency,
      contributionDate: data.contributionDate ? new Date(data.contributionDate) : new Date(),
      description: data.description,
    });

    if (!result) {
      throw new NotFoundError(`Financial goal '${goalId}' not found`);
    }

    try {
      const corrId = correlationId || randomUUID();
      await this.publisher.publish({
        exchange: 'amq.direct',
        routingKey: 'goal.contribution.created',
        correlationId: corrId,
        message: {
          eventId: randomUUID(),
          eventType: 'goal.contribution.created',
          userId,
          goalId,
          contributionId: result.contribution.id,
          timestamp: new Date().toISOString(),
          correlationId: corrId,
        },
      });
    } catch (err) {
      getLogger().warn({ err, goalId }, 'Failed to publish goal.contribution.created event');
    }

    const progress = await this.getGoalProgress(goalId, userId);
    return {
      contribution: result.contribution,
      progress,
    };
  }

  public async listContributions(goalId: string, userId: string, rawQuery: unknown) {
    const goal = await this.repository.findGoalByIdForUser(goalId, userId);
    if (!goal) {
      throw new NotFoundError(`Financial goal '${goalId}' not found`);
    }

    const parse = contributionQuerySchema.safeParse(rawQuery);
    if (!parse.success) {
      throw new ValidationError('Invalid contribution query parameters', parse.error.errors);
    }
    const query = parse.data;

    const [items, total] = await Promise.all([
      this.repository.findContributionsForGoal(userId, goalId, query),
      this.repository.countContributionsForGoal(userId, goalId, query),
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

  public async getContributionDetail(goalId: string, contributionId: string, userId: string) {
    const contribution = await this.repository.findContributionByIdForUser(contributionId, goalId, userId);
    if (!contribution) {
      throw new NotFoundError(`Contribution '${contributionId}' not found for goal '${goalId}'`);
    }
    return contribution;
  }

  public async deleteContribution(goalId: string, contributionId: string, userId: string, correlationId?: string) {
    const result = await this.repository.deleteContributionAndUpdateBalance(contributionId, goalId, userId);
    if (!result) {
      throw new NotFoundError(`Contribution '${contributionId}' not found for goal '${goalId}'`);
    }

    try {
      const corrId = correlationId || randomUUID();
      await this.publisher.publish({
        exchange: 'amq.direct',
        routingKey: 'goal.contribution.deleted',
        correlationId: corrId,
        message: {
          eventId: randomUUID(),
          eventType: 'goal.contribution.deleted',
          userId,
          goalId,
          contributionId,
          timestamp: new Date().toISOString(),
          correlationId: corrId,
        },
      });
    } catch (err) {
      getLogger().warn({ err, contributionId }, 'Failed to publish goal.contribution.deleted event');
    }

    return { id: contributionId, deleted: true };
  }

  // GOAL PROGRESS
  public async getGoalProgress(id: string, userId: string): Promise<GoalProgressResult> {
    const goal = await this.repository.findGoalByIdForUser(id, userId);
    if (!goal) {
      throw new NotFoundError(`Financial goal '${id}' not found`);
    }

    const targetAmount = toDecimal(goal.targetAmount.toString());
    const currentAmount = toDecimal(goal.currentAmount.toString());

    let remainingAmount = targetAmount.minus(currentAmount);
    if (remainingAmount.lessThan(0)) remainingAmount = toDecimal(0);

    const percentageComplete = targetAmount.isZero()
      ? toDecimal(0)
      : roundDecimal(currentAmount.dividedBy(targetAmount).times(100), 2);

    const now = new Date();
    const targetDate = new Date(goal.targetDate);
    const diffTime = targetDate.getTime() - now.getTime();
    const daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

    return {
      goalId: goal.id,
      goalName: goal.name,
      targetAmount: formatDecimal(targetAmount, 2),
      currentAmount: formatDecimal(currentAmount, 2),
      remainingAmount: formatDecimal(remainingAmount, 2),
      percentageComplete: formatDecimal(percentageComplete, 2),
      targetDate: goal.targetDate.toISOString(),
      daysRemaining,
      status: goal.status,
    };
  }
}

export const goalService = new GoalService();
