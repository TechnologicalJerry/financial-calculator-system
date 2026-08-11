import { getPrismaClient } from '@packages/database';
import { Prisma, GoalCategory, GoalStatus } from '@prisma/client';
import { toDecimal } from '@packages/calculators';

export interface CreateGoalData {
  userId: string;
  name: string;
  description?: string | undefined;
  category?: GoalCategory | undefined;
  targetAmount: string | number;
  currentAmount?: string | number | undefined;
  currency?: string | undefined;
  targetDate: Date;
}

export interface FindGoalsOptions {
  page: number;
  limit: number;
  status?: GoalStatus | undefined;
  category?: GoalCategory | undefined;
  targetDate?: string | undefined;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export interface CountGoalsOptions {
  status?: GoalStatus | undefined;
  category?: GoalCategory | undefined;
  targetDate?: string | undefined;
}

export interface CreateContributionData {
  goalId: string;
  userId: string;
  amount: string | number;
  currency?: string | undefined;
  contributionDate?: Date | undefined;
  description?: string | undefined;
}

export interface FindContributionsOptions {
  page: number;
  limit: number;
  fromDate?: string | undefined;
  toDate?: string | undefined;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export interface CountContributionsOptions {
  fromDate?: string | undefined;
  toDate?: string | undefined;
}

export class GoalRepository {
  private get prisma() {
    return getPrismaClient();
  }

  public async createGoal(data: CreateGoalData) {
    const target = new Prisma.Decimal(toDecimal(data.targetAmount).toString());
    const current = new Prisma.Decimal(toDecimal(data.currentAmount ?? 0).toString());

    let status: GoalStatus = 'ACTIVE';
    if (current.greaterThanOrEqualTo(target)) {
      status = 'COMPLETED';
    }

    return this.prisma.financialGoal.create({
      data: {
        userId: data.userId,
        name: data.name,
        description: data.description || null,
        category: data.category || 'OTHER',
        targetAmount: target,
        currentAmount: current,
        currency: (data.currency || 'USD').toUpperCase(),
        targetDate: data.targetDate,
        status,
      },
    });
  }

  public async findGoalByIdForUser(id: string, userId: string) {
    return this.prisma.financialGoal.findFirst({
      where: { id, userId },
      include: {
        contributions: {
          orderBy: { contributionDate: 'desc' },
        },
      },
    });
  }

  public async findGoalsForUser(userId: string, options: FindGoalsOptions) {
    const where: Prisma.FinancialGoalWhereInput = { userId };
    if (options.status) where.status = options.status;
    if (options.category) where.category = options.category;
    if (options.targetDate) where.targetDate = { lte: new Date(options.targetDate) };

    const skip = (options.page - 1) * options.limit;
    const orderBy = { [options.sortBy]: options.sortOrder };

    return this.prisma.financialGoal.findMany({
      where,
      skip,
      take: options.limit,
      orderBy,
    });
  }

  public async countGoalsForUser(userId: string, options: CountGoalsOptions) {
    const where: Prisma.FinancialGoalWhereInput = { userId };
    if (options.status) where.status = options.status;
    if (options.category) where.category = options.category;
    if (options.targetDate) where.targetDate = { lte: new Date(options.targetDate) };

    return this.prisma.financialGoal.count({ where });
  }

  public async updateGoalForUser(
    id: string,
    userId: string,
    data: Prisma.FinancialGoalUpdateInput,
  ) {
    const existing = await this.findGoalByIdForUser(id, userId);
    if (!existing) return null;

    return this.prisma.financialGoal.update({
      where: { id },
      data,
    });
  }

  public async deleteGoalForUser(id: string, userId: string) {
    const existing = await this.findGoalByIdForUser(id, userId);
    if (!existing) return null;

    return this.prisma.financialGoal.delete({
      where: { id },
    });
  }

  // CONTRIBUTION OPERATIONS (ATOMIC TRANSACTIONS)
  public async createContributionAndUpdateBalance(data: CreateContributionData) {
    return this.prisma.$transaction(async (tx) => {
      const goal = await tx.financialGoal.findFirst({
        where: { id: data.goalId, userId: data.userId },
      });
      if (!goal) return null;

      const contribAmount = toDecimal(data.amount);
      const newCurrentAmount = toDecimal(goal.currentAmount.toString()).plus(contribAmount);

      const contribution = await tx.goalContribution.create({
        data: {
          goalId: data.goalId,
          userId: data.userId,
          amount: new Prisma.Decimal(contribAmount.toString()),
          currency: (data.currency || goal.currency).toUpperCase(),
          contributionDate: data.contributionDate || new Date(),
          description: data.description || null,
        },
      });

      let newStatus = goal.status;
      if (newCurrentAmount.greaterThanOrEqualTo(toDecimal(goal.targetAmount.toString())) && goal.status === 'ACTIVE') {
        newStatus = 'COMPLETED';
      }

      const updatedGoal = await tx.financialGoal.update({
        where: { id: data.goalId },
        data: {
          currentAmount: new Prisma.Decimal(newCurrentAmount.toString()),
          status: newStatus,
        },
      });

      return { contribution, goal: updatedGoal };
    });
  }

  public async findContributionByIdForUser(id: string, goalId: string, userId: string) {
    return this.prisma.goalContribution.findFirst({
      where: { id, goalId, userId },
    });
  }

  public async findContributionsForGoal(userId: string, goalId: string, options: FindContributionsOptions) {
    const where: Prisma.GoalContributionWhereInput = { userId, goalId };
    if (options.fromDate || options.toDate) {
      where.contributionDate = {};
      if (options.fromDate) where.contributionDate.gte = new Date(options.fromDate);
      if (options.toDate) where.contributionDate.lte = new Date(options.toDate);
    }

    const skip = (options.page - 1) * options.limit;
    const orderBy = { [options.sortBy]: options.sortOrder };

    return this.prisma.goalContribution.findMany({
      where,
      skip,
      take: options.limit,
      orderBy,
    });
  }

  public async countContributionsForGoal(userId: string, goalId: string, options: CountContributionsOptions) {
    const where: Prisma.GoalContributionWhereInput = { userId, goalId };
    if (options.fromDate || options.toDate) {
      where.contributionDate = {};
      if (options.fromDate) where.contributionDate.gte = new Date(options.fromDate);
      if (options.toDate) where.contributionDate.lte = new Date(options.toDate);
    }

    return this.prisma.goalContribution.count({ where });
  }

  public async deleteContributionAndUpdateBalance(id: string, goalId: string, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const contribution = await tx.goalContribution.findFirst({
        where: { id, goalId, userId },
      });
      if (!contribution) return null;

      const goal = await tx.financialGoal.findFirst({
        where: { id: goalId, userId },
      });
      if (!goal) return null;

      const contribAmount = toDecimal(contribution.amount.toString());
      let newCurrentAmount = toDecimal(goal.currentAmount.toString()).minus(contribAmount);
      if (newCurrentAmount.lessThan(0)) newCurrentAmount = toDecimal(0);

      await tx.goalContribution.delete({
        where: { id },
      });

      const updatedGoal = await tx.financialGoal.update({
        where: { id: goalId },
        data: {
          currentAmount: new Prisma.Decimal(newCurrentAmount.toString()),
        },
      });

      return { id, deleted: true, goal: updatedGoal };
    });
  }
}

export const goalRepository = new GoalRepository();
