import { randomUUID } from 'crypto';
import { NotFoundError, ValidationError } from '@packages/errors';
import { EventPublisher } from '@packages/messaging';
import { getLogger } from '@packages/logger';
import { Prisma, BudgetCategoryType } from '@prisma/client';
import { toDecimal, roundDecimal, formatDecimal, Decimal } from '@packages/calculators';
import { budgetRepository, BudgetRepository } from '../repositories/budget.repository.js';
import {
  createBudgetSchema,
  updateBudgetSchema,
  budgetQuerySchema,
  createExpenseSchema,
  updateExpenseSchema,
  expenseQuerySchema,
  createCategorySchema,
  updateCategorySchema,
} from '../schemas/budget.schemas.js';
import { BudgetProgressResult, BudgetSummaryResult } from '../types/budget.types.js';

export class BudgetService {
  private publisher = new EventPublisher();

  constructor(private repository: BudgetRepository = budgetRepository) {}

  // CATEGORIES
  public async listCategories(userId: string) {
    let categories = await this.repository.findCategoriesForUser(userId);
    if (categories.length === 0) {
      // Seed standard system categories if empty
      const defaultTypes: Array<{ name: string; type: BudgetCategoryType }> = [
        { name: 'Housing', type: 'HOUSING' },
        { name: 'Food & Dining', type: 'FOOD' },
        { name: 'Transportation', type: 'TRANSPORTATION' },
        { name: 'Utilities', type: 'UTILITIES' },
        { name: 'Healthcare', type: 'HEALTHCARE' },
        { name: 'Education', type: 'EDUCATION' },
        { name: 'Entertainment', type: 'ENTERTAINMENT' },
        { name: 'Shopping', type: 'SHOPPING' },
        { name: 'Debt Payments', type: 'DEBT' },
        { name: 'Insurance', type: 'INSURANCE' },
        { name: 'Savings', type: 'SAVINGS' },
        { name: 'Investments', type: 'INVESTMENTS' },
        { name: 'Travel', type: 'TRAVEL' },
        { name: 'Other', type: 'OTHER' },
      ];
      for (const item of defaultTypes) {
        await this.repository.createCategory({
          name: item.name,
          type: item.type,
          isSystem: true,
        });
      }
      categories = await this.repository.findCategoriesForUser(userId);
    }
    return categories;
  }

  public async createCategory(userId: string, rawInput: unknown) {
    const parse = createCategorySchema.safeParse(rawInput);
    if (!parse.success) {
      throw new ValidationError('Invalid budget category parameters', parse.error.errors);
    }
    const data = parse.data;

    return this.repository.createCategory({
      userId,
      name: data.name,
      type: data.type,
      description: data.description,
      icon: data.icon,
      isSystem: false,
    });
  }

  public async updateCategory(id: string, userId: string, rawInput: unknown) {
    const parse = updateCategorySchema.safeParse(rawInput);
    if (!parse.success) {
      throw new ValidationError('Invalid budget category update parameters', parse.error.errors);
    }

    const data = parse.data;
    const updateData: Prisma.BudgetCategoryUpdateInput = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.icon !== undefined) updateData.icon = data.icon;

    const updated = await this.repository.updateCategoryForUser(id, userId, updateData);
    if (!updated) {
      throw new NotFoundError(`Custom category '${id}' not found or cannot be modified`);
    }
    return updated;
  }

  public async deleteCategory(id: string, userId: string) {
    const deleted = await this.repository.deleteCategoryForUser(id, userId);
    if (!deleted) {
      throw new NotFoundError(`Custom category '${id}' not found or cannot be deleted`);
    }
    return { id, deleted: true };
  }

  // BUDGETS
  public async createBudget(userId: string, rawInput: unknown, correlationId?: string) {
    const parse = createBudgetSchema.safeParse(rawInput);
    if (!parse.success) {
      throw new ValidationError('Invalid budget creation parameters', parse.error.errors);
    }
    const data = parse.data;

    // Verify category ownership or system category
    if (data.allocations && data.allocations.length > 0) {
      for (const alloc of data.allocations) {
        const cat = await this.repository.findCategoryById(alloc.categoryId, userId);
        if (!cat) {
          throw new ValidationError(`Category ID '${alloc.categoryId}' is invalid or inaccessible`);
        }
      }
    }

    const budget = await this.repository.createBudgetWithAllocations(
      {
        userId,
        name: data.name,
        description: data.description,
        currency: data.currency,
        period: data.period,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        totalLimit: data.totalLimit,
      },
      data.allocations || [],
    );

    // RabbitMQ Event
    try {
      const corrId = correlationId || randomUUID();
      await this.publisher.publish({
        exchange: 'amq.direct',
        routingKey: 'budget.created',
        correlationId: corrId,
        message: {
          eventId: randomUUID(),
          eventType: 'budget.created',
          userId,
          budgetId: budget!.id,
          timestamp: new Date().toISOString(),
          correlationId: corrId,
        },
      });
    } catch (err) {
      getLogger().warn({ err, budgetId: budget!.id }, 'Failed to publish budget.created event');
    }

    return budget;
  }

  public async listBudgets(userId: string, rawQuery: unknown) {
    const parse = budgetQuerySchema.safeParse(rawQuery);
    if (!parse.success) {
      throw new ValidationError('Invalid budget query parameters', parse.error.errors);
    }
    const query = parse.data;

    const [items, total] = await Promise.all([
      this.repository.findBudgetsForUser(userId, query),
      this.repository.countBudgetsForUser(userId, query),
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

  public async getBudgetDetail(id: string, userId: string) {
    const budget = await this.repository.findBudgetByIdForUser(id, userId);
    if (!budget) {
      throw new NotFoundError(`Budget '${id}' not found`);
    }
    return budget;
  }

  public async updateBudget(id: string, userId: string, rawInput: unknown, correlationId?: string) {
    const parse = updateBudgetSchema.safeParse(rawInput);
    if (!parse.success) {
      throw new ValidationError('Invalid budget update parameters', parse.error.errors);
    }
    const data = parse.data;

    const updateData: Prisma.BudgetUpdateInput = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.currency !== undefined) updateData.currency = data.currency;
    if (data.period !== undefined) updateData.period = data.period;
    if (data.startDate !== undefined) updateData.startDate = new Date(data.startDate);
    if (data.endDate !== undefined) updateData.endDate = new Date(data.endDate);
    if (data.status !== undefined) updateData.status = data.status;
    if (data.totalLimit !== undefined) updateData.totalLimit = toDecimal(data.totalLimit).toString();

    const updated = await this.repository.updateBudgetForUser(id, userId, updateData);
    if (!updated) {
      throw new NotFoundError(`Budget '${id}' not found`);
    }

    try {
      const corrId = correlationId || randomUUID();
      await this.publisher.publish({
        exchange: 'amq.direct',
        routingKey: 'budget.updated',
        correlationId: corrId,
        message: {
          eventId: randomUUID(),
          eventType: 'budget.updated',
          userId,
          budgetId: id,
          timestamp: new Date().toISOString(),
          correlationId: corrId,
        },
      });
    } catch (err) {
      getLogger().warn({ err, budgetId: id }, 'Failed to publish budget.updated event');
    }

    return updated;
  }

  public async deleteBudget(id: string, userId: string, correlationId?: string) {
    const deleted = await this.repository.deleteBudgetForUser(id, userId);
    if (!deleted) {
      throw new NotFoundError(`Budget '${id}' not found`);
    }

    try {
      const corrId = correlationId || randomUUID();
      await this.publisher.publish({
        exchange: 'amq.direct',
        routingKey: 'budget.deleted',
        correlationId: corrId,
        message: {
          eventId: randomUUID(),
          eventType: 'budget.deleted',
          userId,
          budgetId: id,
          timestamp: new Date().toISOString(),
          correlationId: corrId,
        },
      });
    } catch (err) {
      getLogger().warn({ err, budgetId: id }, 'Failed to publish budget.deleted event');
    }

    return { id, deleted: true };
  }

  // EXPENSES
  public async createExpense(budgetId: string, userId: string, rawInput: unknown, correlationId?: string) {
    const budget = await this.repository.findBudgetByIdForUser(budgetId, userId);
    if (!budget) {
      throw new NotFoundError(`Budget '${budgetId}' not found`);
    }

    const parse = createExpenseSchema.safeParse(rawInput);
    if (!parse.success) {
      throw new ValidationError('Invalid expense parameters', parse.error.errors);
    }
    const data = parse.data;

    // Currency check
    if (data.currency && data.currency !== budget.currency) {
      throw new ValidationError(`Expense currency '${data.currency}' does not match budget base currency '${budget.currency}'`);
    }

    const cat = await this.repository.findCategoryById(data.categoryId, userId);
    if (!cat) {
      throw new ValidationError(`Category ID '${data.categoryId}' is invalid or inaccessible`);
    }

    const expense = await this.repository.createExpense({
      userId,
      budgetId,
      categoryId: data.categoryId,
      amount: data.amount,
      currency: budget.currency,
      description: data.description,
      expenseDate: data.expenseDate ? new Date(data.expenseDate) : new Date(),
    });

    try {
      const corrId = correlationId || randomUUID();
      await this.publisher.publish({
        exchange: 'amq.direct',
        routingKey: 'budget.expense.created',
        correlationId: corrId,
        message: {
          eventId: randomUUID(),
          eventType: 'budget.expense.created',
          userId,
          budgetId,
          expenseId: expense.id,
          timestamp: new Date().toISOString(),
          correlationId: corrId,
        },
      });
    } catch (err) {
      getLogger().warn({ err, expenseId: expense.id }, 'Failed to publish budget.expense.created event');
    }

    return expense;
  }

  public async listExpenses(budgetId: string, userId: string, rawQuery: unknown) {
    const budget = await this.repository.findBudgetByIdForUser(budgetId, userId);
    if (!budget) {
      throw new NotFoundError(`Budget '${budgetId}' not found`);
    }

    const parse = expenseQuerySchema.safeParse(rawQuery);
    if (!parse.success) {
      throw new ValidationError('Invalid expense query parameters', parse.error.errors);
    }
    const query = parse.data;

    const [items, total] = await Promise.all([
      this.repository.findExpensesForBudget(userId, budgetId, query),
      this.repository.countExpensesForBudget(userId, budgetId, query),
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

  public async getExpenseDetail(budgetId: string, expenseId: string, userId: string) {
    const expense = await this.repository.findExpenseByIdForUser(expenseId, userId, budgetId);
    if (!expense) {
      throw new NotFoundError(`Expense '${expenseId}' not found for budget '${budgetId}'`);
    }
    return expense;
  }

  public async updateExpense(
    budgetId: string,
    expenseId: string,
    userId: string,
    rawInput: unknown,
  ) {
    const parse = updateExpenseSchema.safeParse(rawInput);
    if (!parse.success) {
      throw new ValidationError('Invalid expense update parameters', parse.error.errors);
    }
    const data = parse.data;

    const updateData: Prisma.BudgetExpenseUpdateInput = {};
    if (data.amount !== undefined) updateData.amount = toDecimal(data.amount).toString();
    if (data.description !== undefined) updateData.description = data.description;
    if (data.expenseDate !== undefined) updateData.expenseDate = new Date(data.expenseDate);
    if (data.categoryId !== undefined) {
      const cat = await this.repository.findCategoryById(data.categoryId, userId);
      if (!cat) throw new ValidationError(`Category '${data.categoryId}' is invalid`);
      updateData.category = { connect: { id: data.categoryId } };
    }

    const updated = await this.repository.updateExpenseForUser(expenseId, userId, budgetId, updateData);
    if (!updated) {
      throw new NotFoundError(`Expense '${expenseId}' not found for budget '${budgetId}'`);
    }
    return updated;
  }

  public async deleteExpense(budgetId: string, expenseId: string, userId: string, correlationId?: string) {
    const deleted = await this.repository.deleteExpenseForUser(expenseId, userId, budgetId);
    if (!deleted) {
      throw new NotFoundError(`Expense '${expenseId}' not found for budget '${budgetId}'`);
    }

    try {
      const corrId = correlationId || randomUUID();
      await this.publisher.publish({
        exchange: 'amq.direct',
        routingKey: 'budget.expense.deleted',
        correlationId: corrId,
        message: {
          eventId: randomUUID(),
          eventType: 'budget.expense.deleted',
          userId,
          budgetId,
          expenseId,
          timestamp: new Date().toISOString(),
          correlationId: corrId,
        },
      });
    } catch (err) {
      getLogger().warn({ err, expenseId }, 'Failed to publish budget.expense.deleted event');
    }

    return { id: expenseId, deleted: true };
  }

  // PROGRESS & SUMMARY CALCULATIONS
  public async getBudgetProgress(id: string, userId: string): Promise<BudgetProgressResult> {
    const budget = await this.repository.findBudgetByIdForUser(id, userId);
    if (!budget) {
      throw new NotFoundError(`Budget '${id}' not found`);
    }

    const totalLimit = toDecimal(budget.totalLimit.toString());
    const totalSpent = budget.expenses.reduce(
      (acc, exp) => acc.plus(toDecimal(exp.amount.toString())),
      toDecimal(0),
    );

    let remaining = totalLimit.minus(totalSpent);
    if (remaining.lessThan(0)) remaining = toDecimal(0);

    const percentageUsed = totalLimit.isZero()
      ? toDecimal(0)
      : roundDecimal(totalSpent.dividedBy(totalLimit).times(100), 2);

    const categoryMap = new Map<string, { name: string; limit: Decimal; spent: Decimal }>();

    for (const alloc of budget.allocations) {
      categoryMap.set(alloc.categoryId, {
        name: alloc.category.name,
        limit: toDecimal(alloc.limit.toString()),
        spent: toDecimal(0),
      });
    }

    for (const exp of budget.expenses) {
      const item = categoryMap.get(exp.categoryId);
      const expAmt = toDecimal(exp.amount.toString());
      if (item) {
        item.spent = item.spent.plus(expAmt);
      } else {
        categoryMap.set(exp.categoryId, {
          name: exp.category.name,
          limit: toDecimal(0),
          spent: expAmt,
        });
      }
    }

    const categoryProgress = Array.from(categoryMap.entries()).map(([catId, val]) => {
      let catRemaining = val.limit.minus(val.spent);
      if (catRemaining.lessThan(0)) catRemaining = toDecimal(0);
      const catPct = val.limit.isZero()
        ? toDecimal(0)
        : roundDecimal(val.spent.dividedBy(val.limit).times(100), 2);

      return {
        categoryId: catId,
        categoryName: val.name,
        limit: formatDecimal(val.limit, 2),
        spent: formatDecimal(val.spent, 2),
        remaining: formatDecimal(catRemaining, 2),
        percentageUsed: formatDecimal(catPct, 2),
      };
    });

    return {
      budgetId: budget.id,
      budgetName: budget.name,
      totalLimit: formatDecimal(totalLimit, 2),
      totalSpent: formatDecimal(totalSpent, 2),
      remaining: formatDecimal(remaining, 2),
      percentageUsed: formatDecimal(percentageUsed, 2),
      categoryProgress,
    };
  }

  public async getBudgetSummary(id: string, userId: string): Promise<BudgetSummaryResult> {
    const progress = await this.getBudgetProgress(id, userId);
    const budget = (await this.repository.findBudgetByIdForUser(id, userId))!;

    const totalLimit = toDecimal(budget.totalLimit.toString());
    const totalAllocated = budget.allocations.reduce(
      (acc, a) => acc.plus(toDecimal(a.limit.toString())),
      toDecimal(0),
    );
    const unallocatedLimit = totalLimit.minus(totalAllocated);

    const sortedCategories = [...progress.categoryProgress].sort(
      (a, b) => Number(b.spent) - Number(a.spent),
    );

    return {
      budgetId: budget.id,
      budgetName: budget.name,
      totalLimit: progress.totalLimit,
      totalAllocated: formatDecimal(totalAllocated, 2),
      unallocatedLimit: formatDecimal(unallocatedLimit.lessThan(0) ? 0 : unallocatedLimit, 2),
      totalSpent: progress.totalSpent,
      remaining: progress.remaining,
      percentageUsed: progress.percentageUsed,
      categoryBreakdown: progress.categoryProgress,
      highestSpendingCategories: sortedCategories.slice(0, 5),
    };
  }
}

export const budgetService = new BudgetService();
