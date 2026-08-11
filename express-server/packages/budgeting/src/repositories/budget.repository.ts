import { getPrismaClient } from '@packages/database';
import { Prisma, BudgetPeriod, BudgetStatus, BudgetCategoryType } from '@prisma/client';
import { AllocationInput } from '../types/budget.types.js';
import { toDecimal } from '@packages/calculators';

export interface CreateCategoryData {
  userId?: string | undefined;
  type?: BudgetCategoryType | undefined;
  name: string;
  description?: string | undefined;
  icon?: string | undefined;
  isSystem?: boolean | undefined;
}

export interface CreateBudgetData {
  userId: string;
  name: string;
  description?: string | undefined;
  currency?: string | undefined;
  period?: BudgetPeriod | undefined;
  startDate: Date;
  endDate: Date;
  totalLimit: string | number;
}

export interface FindBudgetsOptions {
  page: number;
  limit: number;
  status?: BudgetStatus | undefined;
  period?: BudgetPeriod | undefined;
  startDate?: string | undefined;
  endDate?: string | undefined;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export interface CountBudgetsOptions {
  status?: BudgetStatus | undefined;
  period?: BudgetPeriod | undefined;
  startDate?: string | undefined;
  endDate?: string | undefined;
}

export interface CreateExpenseData {
  userId: string;
  budgetId: string;
  categoryId: string;
  amount: string | number;
  currency?: string | undefined;
  description?: string | undefined;
  expenseDate?: Date | undefined;
}

export interface FindExpensesOptions {
  page: number;
  limit: number;
  categoryId?: string | undefined;
  fromDate?: string | undefined;
  toDate?: string | undefined;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export interface CountExpensesOptions {
  categoryId?: string | undefined;
  fromDate?: string | undefined;
  toDate?: string | undefined;
}

export class BudgetRepository {
  private get prisma() {
    return getPrismaClient();
  }

  // CATEGORY OPERATIONS
  public async findCategoriesForUser(userId: string) {
    return this.prisma.budgetCategory.findMany({
      where: {
        OR: [{ isSystem: true }, { userId }],
      },
      orderBy: [{ isSystem: 'desc' }, { name: 'asc' }],
    });
  }

  public async findCategoryById(id: string, userId: string) {
    return this.prisma.budgetCategory.findFirst({
      where: {
        id,
        OR: [{ isSystem: true }, { userId }],
      },
    });
  }

  public async createCategory(data: CreateCategoryData) {
    return this.prisma.budgetCategory.create({
      data: {
        userId: data.userId || null,
        type: data.type || 'OTHER',
        name: data.name,
        description: data.description || null,
        icon: data.icon || null,
        isSystem: data.isSystem || false,
      },
    });
  }

  public async updateCategoryForUser(
    id: string,
    userId: string,
    data: Prisma.BudgetCategoryUpdateInput,
  ) {
    const existing = await this.prisma.budgetCategory.findFirst({
      where: { id, userId, isSystem: false },
    });
    if (!existing) return null;

    return this.prisma.budgetCategory.update({
      where: { id },
      data,
    });
  }

  public async deleteCategoryForUser(id: string, userId: string) {
    const existing = await this.prisma.budgetCategory.findFirst({
      where: { id, userId, isSystem: false },
    });
    if (!existing) return null;

    return this.prisma.budgetCategory.delete({
      where: { id },
    });
  }

  // BUDGET OPERATIONS
  public async createBudgetWithAllocations(
    data: CreateBudgetData,
    allocations: AllocationInput[],
  ) {
    return this.prisma.$transaction(async (tx) => {
      const budget = await tx.budget.create({
        data: {
          userId: data.userId,
          name: data.name,
          description: data.description || null,
          currency: (data.currency || 'USD').toUpperCase(),
          period: data.period || 'MONTHLY',
          startDate: data.startDate,
          endDate: data.endDate,
          status: 'ACTIVE',
          totalLimit: new Prisma.Decimal(toDecimal(data.totalLimit).toString()),
        },
      });

      if (allocations && allocations.length > 0) {
        const allocationRecords = allocations.map((alloc) => ({
          budgetId: budget.id,
          categoryId: alloc.categoryId,
          limit: new Prisma.Decimal(toDecimal(alloc.limit).toString()),
        }));

        await tx.budgetCategoryAllocation.createMany({
          data: allocationRecords,
        });
      }

      return tx.budget.findUnique({
        where: { id: budget.id },
        include: {
          allocations: {
            include: { category: true },
          },
        },
      });
    });
  }

  public async findBudgetByIdForUser(id: string, userId: string) {
    return this.prisma.budget.findFirst({
      where: { id, userId },
      include: {
        allocations: {
          include: { category: true },
        },
        expenses: {
          include: { category: true },
        },
      },
    });
  }

  public async findBudgetsForUser(userId: string, options: FindBudgetsOptions) {
    const where: Prisma.BudgetWhereInput = { userId };
    if (options.status) where.status = options.status;
    if (options.period) where.period = options.period;
    if (options.startDate || options.endDate) {
      where.startDate = {};
      if (options.startDate) where.startDate.gte = new Date(options.startDate);
      if (options.endDate) where.startDate.lte = new Date(options.endDate);
    }

    const skip = (options.page - 1) * options.limit;
    const orderBy = { [options.sortBy]: options.sortOrder };

    return this.prisma.budget.findMany({
      where,
      skip,
      take: options.limit,
      orderBy,
      include: {
        allocations: {
          include: { category: true },
        },
      },
    });
  }

  public async countBudgetsForUser(userId: string, options: CountBudgetsOptions) {
    const where: Prisma.BudgetWhereInput = { userId };
    if (options.status) where.status = options.status;
    if (options.period) where.period = options.period;
    if (options.startDate || options.endDate) {
      where.startDate = {};
      if (options.startDate) where.startDate.gte = new Date(options.startDate);
      if (options.endDate) where.startDate.lte = new Date(options.endDate);
    }

    return this.prisma.budget.count({ where });
  }

  public async updateBudgetForUser(
    id: string,
    userId: string,
    data: Prisma.BudgetUpdateInput,
  ) {
    const existing = await this.findBudgetByIdForUser(id, userId);
    if (!existing) return null;

    return this.prisma.budget.update({
      where: { id },
      data,
      include: {
        allocations: {
          include: { category: true },
        },
      },
    });
  }

  public async deleteBudgetForUser(id: string, userId: string) {
    const existing = await this.findBudgetByIdForUser(id, userId);
    if (!existing) return null;

    return this.prisma.budget.delete({
      where: { id },
    });
  }

  // EXPENSE OPERATIONS
  public async createExpense(data: CreateExpenseData) {
    return this.prisma.budgetExpense.create({
      data: {
        userId: data.userId,
        budgetId: data.budgetId,
        categoryId: data.categoryId,
        amount: new Prisma.Decimal(toDecimal(data.amount).toString()),
        currency: (data.currency || 'USD').toUpperCase(),
        description: data.description || null,
        expenseDate: data.expenseDate || new Date(),
      },
      include: {
        category: true,
      },
    });
  }

  public async findExpenseByIdForUser(id: string, userId: string, budgetId: string) {
    return this.prisma.budgetExpense.findFirst({
      where: { id, userId, budgetId },
      include: { category: true },
    });
  }

  public async findExpensesForBudget(userId: string, budgetId: string, options: FindExpensesOptions) {
    const where: Prisma.BudgetExpenseWhereInput = { userId, budgetId };
    if (options.categoryId) where.categoryId = options.categoryId;
    if (options.fromDate || options.toDate) {
      where.expenseDate = {};
      if (options.fromDate) where.expenseDate.gte = new Date(options.fromDate);
      if (options.toDate) where.expenseDate.lte = new Date(options.toDate);
    }

    const skip = (options.page - 1) * options.limit;
    const orderBy = { [options.sortBy]: options.sortOrder };

    return this.prisma.budgetExpense.findMany({
      where,
      skip,
      take: options.limit,
      orderBy,
      include: { category: true },
    });
  }

  public async countExpensesForBudget(userId: string, budgetId: string, options: CountExpensesOptions) {
    const where: Prisma.BudgetExpenseWhereInput = { userId, budgetId };
    if (options.categoryId) where.categoryId = options.categoryId;
    if (options.fromDate || options.toDate) {
      where.expenseDate = {};
      if (options.fromDate) where.expenseDate.gte = new Date(options.fromDate);
      if (options.toDate) where.expenseDate.lte = new Date(options.toDate);
    }

    return this.prisma.budgetExpense.count({ where });
  }

  public async updateExpenseForUser(
    id: string,
    userId: string,
    budgetId: string,
    data: Prisma.BudgetExpenseUpdateInput,
  ) {
    const existing = await this.findExpenseByIdForUser(id, userId, budgetId);
    if (!existing) return null;

    return this.prisma.budgetExpense.update({
      where: { id },
      data,
      include: { category: true },
    });
  }

  public async deleteExpenseForUser(id: string, userId: string, budgetId: string) {
    const existing = await this.findExpenseByIdForUser(id, userId, budgetId);
    if (!existing) return null;

    return this.prisma.budgetExpense.delete({
      where: { id },
    });
  }
}

export const budgetRepository = new BudgetRepository();
