import { getPrismaClient } from '@packages/database';
import { Prisma } from '@prisma/client';
import { toDecimal, roundDecimal, formatDecimal, Decimal } from '@packages/calculators';
import { budgetService } from '@packages/budgeting';
import { goalService } from '@packages/budgeting';
import { portfolioService, valuationService } from '@packages/investments';
import { calculationHistoryService } from '@packages/calculators';
import {
  DashboardSummaryResult,
  NetWorthResult,
  ExpenseAnalyticsResult,
  IncomeAnalyticsResult,
  CashFlowResult,
  BudgetAnalyticsResult,
  GoalAnalyticsResult,
  InvestmentAnalyticsResult,
} from '../types/analytics.types.js';
import {
  netWorthHistoryQuerySchema,
  expenseAnalyticsQuerySchema,
  incomeAnalyticsQuerySchema,
  cashFlowQuerySchema,
  investmentPerformanceQuerySchema,
} from '../schemas/analytics.schemas.js';
import { ValidationError } from '@packages/errors';

export class AnalyticsService {
  private get prisma() {
    return getPrismaClient();
  }

  public async getDashboard(userId: string): Promise<DashboardSummaryResult> {
    const [finAccounts, portfolios, budgetsList, goalsList, historyResult] = await Promise.all([
      this.prisma.financialAccount.findMany({ where: { userId } }),
      this.prisma.portfolio.findMany({ where: { userId } }),
      budgetService.listBudgets(userId, { page: 1, limit: 100 }),
      goalService.listGoals(userId, { page: 1, limit: 100 }),
      calculationHistoryService.listCalculationHistory(userId, { page: 1, limit: 5 }),
    ]);

    let totalBankAssets = toDecimal(0);
    let totalBankLiabilities = toDecimal(0);

    for (const acc of finAccounts) {
      const bal = toDecimal(acc.balance.toString());
      if (acc.type === 'CREDIT_CARD' || acc.type === 'LOAN') {
        totalBankLiabilities = totalBankLiabilities.plus(bal);
      } else {
        totalBankAssets = totalBankAssets.plus(bal);
      }
    }

    let totalPortfolioValuation = toDecimal(0);
    let totalPortfolioCost = toDecimal(0);
    let totalUnrealizedGL = toDecimal(0);
    let totalRealizedGL = toDecimal(0);
    let totalCashBalance = totalBankAssets;

    for (const p of portfolios) {
      const val = await valuationService.getPortfolioValuation(p.id, userId);
      totalPortfolioValuation = totalPortfolioValuation.plus(toDecimal(val.netPortfolioValue));
      totalPortfolioCost = totalPortfolioCost.plus(toDecimal(val.totalCost));
      totalUnrealizedGL = totalUnrealizedGL.plus(toDecimal(val.unrealizedGainLoss));
      totalRealizedGL = totalRealizedGL.plus(toDecimal(val.realizedGainLoss));
      totalCashBalance = totalCashBalance.plus(toDecimal(val.cashBalance));
    }

    const netWorth = totalBankAssets.plus(totalPortfolioValuation).minus(totalBankLiabilities);

    let totalBudgeted = toDecimal(0);
    let totalSpent = toDecimal(0);

    for (const b of budgetsList.data) {
      const prog = await budgetService.getBudgetProgress(b.id, userId);
      totalBudgeted = totalBudgeted.plus(toDecimal(prog.totalLimit));
      totalSpent = totalSpent.plus(toDecimal(prog.totalSpent));
    }
    const totalRemainingBudget = totalBudgeted.minus(totalSpent);
    const budgetPct = totalBudgeted.isZero()
      ? toDecimal(0)
      : roundDecimal(totalSpent.dividedBy(totalBudgeted).times(100), 2);

    let activeGoalsCount = 0;
    let completedGoalsCount = 0;
    let totalTargetAmount = toDecimal(0);
    let totalCurrentAmount = toDecimal(0);

    for (const g of goalsList.data) {
      if (g.status === 'COMPLETED') completedGoalsCount++;
      else activeGoalsCount++;

      totalTargetAmount = totalTargetAmount.plus(toDecimal(g.targetAmount.toString()));
      totalCurrentAmount = totalCurrentAmount.plus(toDecimal(g.currentAmount.toString()));
    }

    const goalPct = totalTargetAmount.isZero()
      ? toDecimal(0)
      : roundDecimal(totalCurrentAmount.dividedBy(totalTargetAmount).times(100), 2);

    return {
      netWorth: formatDecimal(netWorth, 2),
      totalAssets: formatDecimal(totalBankAssets.plus(totalPortfolioValuation), 2),
      totalLiabilities: formatDecimal(totalBankLiabilities, 2),
      cashBalance: formatDecimal(totalCashBalance, 2),
      budgetSummary: {
        totalBudgeted: formatDecimal(totalBudgeted, 2),
        totalSpent: formatDecimal(totalSpent, 2),
        totalRemaining: formatDecimal(totalRemainingBudget.lessThan(0) ? 0 : totalRemainingBudget, 2),
        utilizationPercentage: formatDecimal(budgetPct, 2),
      },
      goalSummary: {
        activeGoalsCount,
        completedGoalsCount,
        totalTargetAmount: formatDecimal(totalTargetAmount, 2),
        totalCurrentAmount: formatDecimal(totalCurrentAmount, 2),
        overallProgressPercentage: formatDecimal(goalPct, 2),
      },
      portfolioSummary: {
        totalMarketValue: formatDecimal(totalPortfolioValuation, 2),
        netPortfolioValue: formatDecimal(totalPortfolioValuation, 2),
        unrealizedGainLoss: formatDecimal(totalUnrealizedGL, 2),
        realizedGainLoss: formatDecimal(totalRealizedGL, 2),
      },
      recentCalculations: historyResult.data.map((c) => ({
        id: c.id,
        calculatorId: c.calculatorId,
        calculatorVersion: c.calculatorVersion,
        createdAt: typeof c.createdAt === 'string' ? c.createdAt : (c.createdAt as Date).toISOString(),
      })),
    };
  }

  public async getNetWorth(userId: string): Promise<NetWorthResult> {
    const [finAccounts, portfolios] = await Promise.all([
      this.prisma.financialAccount.findMany({ where: { userId } }),
      this.prisma.portfolio.findMany({ where: { userId } }),
    ]);

    let totalAssets = toDecimal(0);
    let totalLiabilities = toDecimal(0);

    const assetBreakdown: Array<{ category: string; amount: string }> = [];
    const liabilityBreakdown: Array<{ category: string; amount: string }> = [];

    for (const acc of finAccounts) {
      const bal = toDecimal(acc.balance.toString());
      if (acc.type === 'CREDIT_CARD' || acc.type === 'LOAN') {
        totalLiabilities = totalLiabilities.plus(bal);
        liabilityBreakdown.push({ category: acc.name, amount: formatDecimal(bal, 2) });
      } else {
        totalAssets = totalAssets.plus(bal);
        assetBreakdown.push({ category: acc.name, amount: formatDecimal(bal, 2) });
      }
    }

    for (const p of portfolios) {
      const val = await valuationService.getPortfolioValuation(p.id, userId);
      const pNet = toDecimal(val.netPortfolioValue);
      totalAssets = totalAssets.plus(pNet);
      assetBreakdown.push({ category: `Portfolio: ${p.name}`, amount: formatDecimal(pNet, 2) });
    }

    const netWorth = totalAssets.minus(totalLiabilities);

    return {
      netWorth: formatDecimal(netWorth, 2),
      totalAssets: formatDecimal(totalAssets, 2),
      totalLiabilities: formatDecimal(totalLiabilities, 2),
      assetBreakdown,
      liabilityBreakdown,
    };
  }

  public async getNetWorthHistory(userId: string, rawQuery: unknown) {
    const parse = netWorthHistoryQuerySchema.safeParse(rawQuery);
    if (!parse.success) {
      throw new ValidationError('Invalid net worth history parameters', parse.error.errors);
    }

    const currentNW = await this.getNetWorth(userId);
    const history = [
      {
        date: new Date().toISOString().split('T')[0]!,
        netWorth: currentNW.netWorth,
        assets: currentNW.totalAssets,
        liabilities: currentNW.totalLiabilities,
      },
    ];

    return history;
  }

  public async getAssetAllocation(userId: string) {
    const portfolios = await this.prisma.portfolio.findMany({ where: { userId } });
    const assetMap = new Map<string, Decimal>();
    let totalVal = toDecimal(0);

    for (const p of portfolios) {
      const alloc = await valuationService.getPortfolioAllocation(p.id, userId);
      for (const item of alloc.byAssetType) {
        const val = toDecimal(item.marketValue);
        const cur = assetMap.get(item.key) || toDecimal(0);
        assetMap.set(item.key, cur.plus(val));
        totalVal = totalVal.plus(val);
      }
    }

    return Array.from(assetMap.entries()).map(([type, val]) => {
      const pct = totalVal.isZero() ? toDecimal(0) : roundDecimal(val.dividedBy(totalVal).times(100), 2);
      return {
        key: type,
        name: type,
        value: formatDecimal(val, 2),
        percentage: formatDecimal(pct, 2),
      };
    });
  }

  public async getExpenseAnalytics(userId: string, rawQuery: unknown): Promise<ExpenseAnalyticsResult> {
    const parse = expenseAnalyticsQuerySchema.safeParse(rawQuery);
    if (!parse.success) {
      throw new ValidationError('Invalid expense analytics parameters', parse.error.errors);
    }
    const query = parse.data;

    const where: Prisma.BudgetExpenseWhereInput = { userId };
    if (query.budgetId) where.budgetId = query.budgetId;
    if (query.category) where.categoryId = query.category;
    if (query.fromDate || query.toDate) {
      where.expenseDate = {};
      if (query.fromDate) where.expenseDate.gte = new Date(query.fromDate);
      if (query.toDate) where.expenseDate.lte = new Date(query.toDate);
    }

    const expenses = await this.prisma.budgetExpense.findMany({
      where,
      include: { category: true },
    });

    let totalExpenses = toDecimal(0);
    const catMap = new Map<string, { name: string; amount: Decimal }>();

    for (const exp of expenses) {
      const amt = toDecimal(exp.amount.toString());
      totalExpenses = totalExpenses.plus(amt);

      const item = catMap.get(exp.categoryId) || { name: exp.category.name, amount: toDecimal(0) };
      item.amount = item.amount.plus(amt);
      catMap.set(exp.categoryId, item);
    }

    const categoryBreakdown = Array.from(catMap.entries()).map(([catId, obj]) => {
      const pct = totalExpenses.isZero() ? toDecimal(0) : roundDecimal(obj.amount.dividedBy(totalExpenses).times(100), 2);
      return {
        categoryId: catId,
        categoryName: obj.name,
        amount: formatDecimal(obj.amount, 2),
        percentage: formatDecimal(pct, 2),
      };
    });

    const topCategories = [...categoryBreakdown]
      .sort((a, b) => Number(b.amount) - Number(a.amount))
      .slice(0, 5);

    const count = expenses.length || 1;
    const avgExpense = roundDecimal(totalExpenses.dividedBy(count), 2);

    return {
      totalExpenses: formatDecimal(totalExpenses, 2),
      averageExpense: formatDecimal(avgExpense, 2),
      categoryBreakdown,
      topCategories,
    };
  }

  public async getIncomeAnalytics(userId: string, rawQuery: unknown): Promise<IncomeAnalyticsResult> {
    const parse = incomeAnalyticsQuerySchema.safeParse(rawQuery);
    if (!parse.success) {
      throw new ValidationError('Invalid income analytics parameters', parse.error.errors);
    }
    const query = parse.data;

    const where: Prisma.InvestmentTransactionWhereInput = { userId, type: { in: ['DEPOSIT', 'DIVIDEND'] } };
    if (query.fromDate || query.toDate) {
      where.transactionDate = {};
      if (query.fromDate) where.transactionDate.gte = new Date(query.fromDate);
      if (query.toDate) where.transactionDate.lte = new Date(query.toDate);
    }

    const txs = await this.prisma.investmentTransaction.findMany({ where });
    let totalIncome = toDecimal(0);
    const incMap = new Map<string, Decimal>();

    for (const tx of txs) {
      const amt = toDecimal(tx.totalAmount.toString());
      totalIncome = totalIncome.plus(amt);
      const cur = incMap.get(tx.type) || toDecimal(0);
      incMap.set(tx.type, cur.plus(amt));
    }

    const incomeBreakdown = Array.from(incMap.entries()).map(([src, val]) => {
      const pct = totalIncome.isZero() ? toDecimal(0) : roundDecimal(val.dividedBy(totalIncome).times(100), 2);
      return {
        source: src,
        amount: formatDecimal(val, 2),
        percentage: formatDecimal(pct, 2),
      };
    });

    return {
      totalIncome: formatDecimal(totalIncome, 2),
      incomeBreakdown,
    };
  }

  public async getCashFlow(userId: string, rawQuery: unknown): Promise<CashFlowResult> {
    const parse = cashFlowQuerySchema.safeParse(rawQuery);
    if (!parse.success) {
      throw new ValidationError('Invalid cash flow parameters', parse.error.errors);
    }

    const [expenses, txs] = await Promise.all([
      this.prisma.budgetExpense.findMany({ where: { userId } }),
      this.prisma.investmentTransaction.findMany({ where: { userId } }),
    ]);

    let expTotal = toDecimal(0);
    for (const e of expenses) expTotal = expTotal.plus(toDecimal(e.amount.toString()));

    let deposits = toDecimal(0);
    let withdrawals = toDecimal(0);
    let dividends = toDecimal(0);
    let fees = toDecimal(0);

    for (const tx of txs) {
      const amt = toDecimal(tx.totalAmount.toString());
      fees = fees.plus(toDecimal(tx.fees.toString()));

      if (tx.type === 'DEPOSIT') deposits = deposits.plus(amt);
      else if (tx.type === 'WITHDRAWAL') withdrawals = withdrawals.plus(amt);
      else if (tx.type === 'DIVIDEND') dividends = dividends.plus(amt);
    }

    const totalInflow = deposits.plus(dividends);
    const totalOutflow = expTotal.plus(withdrawals).plus(fees);
    const netCashFlow = totalInflow.minus(totalOutflow);

    return {
      totalInflow: formatDecimal(totalInflow, 2),
      totalOutflow: formatDecimal(totalOutflow, 2),
      netCashFlow: formatDecimal(netCashFlow, 2),
      breakdown: {
        income: '0.00',
        expenses: formatDecimal(expTotal, 2),
        investmentDeposits: formatDecimal(deposits, 2),
        investmentWithdrawals: formatDecimal(withdrawals, 2),
        dividends: formatDecimal(dividends, 2),
        fees: formatDecimal(fees, 2),
        other: '0.00',
      },
    };
  }

  public async getBudgetAnalytics(userId: string): Promise<BudgetAnalyticsResult> {
    const budgetsList = await budgetService.listBudgets(userId, { page: 1, limit: 100 });
    let totalBudgeted = toDecimal(0);
    let totalSpent = toDecimal(0);
    let overBudgetCategoriesCount = 0;
    let underBudgetCategoriesCount = 0;

    for (const b of budgetsList.data) {
      const prog = await budgetService.getBudgetProgress(b.id, userId);
      totalBudgeted = totalBudgeted.plus(toDecimal(prog.totalLimit));
      totalSpent = totalSpent.plus(toDecimal(prog.totalSpent));

      for (const cat of prog.categoryProgress) {
        if (Number(cat.percentageUsed) > 100) overBudgetCategoriesCount++;
        else underBudgetCategoriesCount++;
      }
    }

    const totalRemaining = totalBudgeted.minus(totalSpent);
    const pct = totalBudgeted.isZero() ? toDecimal(0) : roundDecimal(totalSpent.dividedBy(totalBudgeted).times(100), 2);

    return {
      totalBudgeted: formatDecimal(totalBudgeted, 2),
      totalSpent: formatDecimal(totalSpent, 2),
      totalRemaining: formatDecimal(totalRemaining.lessThan(0) ? 0 : totalRemaining, 2),
      utilizationPercentage: formatDecimal(pct, 2),
      overBudgetCategoriesCount,
      underBudgetCategoriesCount,
    };
  }

  public async getGoalAnalytics(userId: string): Promise<GoalAnalyticsResult> {
    const goalsList = await goalService.listGoals(userId, { page: 1, limit: 100 });
    let totalGoals = goalsList.data.length;
    let activeGoals = 0;
    let completedGoals = 0;
    let totalTargetAmount = toDecimal(0);
    let totalCurrentAmount = toDecimal(0);

    for (const g of goalsList.data) {
      if (g.status === 'COMPLETED') completedGoals++;
      else activeGoals++;

      totalTargetAmount = totalTargetAmount.plus(toDecimal(g.targetAmount.toString()));
      totalCurrentAmount = totalCurrentAmount.plus(toDecimal(g.currentAmount.toString()));
    }

    const totalRemainingAmount = totalTargetAmount.minus(totalCurrentAmount);
    const pct = totalTargetAmount.isZero() ? toDecimal(0) : roundDecimal(totalCurrentAmount.dividedBy(totalTargetAmount).times(100), 2);

    return {
      totalGoals,
      activeGoals,
      completedGoals,
      totalTargetAmount: formatDecimal(totalTargetAmount, 2),
      totalCurrentAmount: formatDecimal(totalCurrentAmount, 2),
      totalRemainingAmount: formatDecimal(totalRemainingAmount.lessThan(0) ? 0 : totalRemainingAmount, 2),
      overallProgressPercentage: formatDecimal(pct, 2),
    };
  }

  public async getInvestmentAnalytics(userId: string): Promise<InvestmentAnalyticsResult> {
    const portfolios = await portfolioService.listPortfolios(userId, { page: 1, limit: 100 });
    let totalValue = toDecimal(0);
    let totalCost = toDecimal(0);
    let realizedGL = toDecimal(0);
    let unrealizedGL = toDecimal(0);
    let cashBal = toDecimal(0);

    for (const p of portfolios.data) {
      const val = await valuationService.getPortfolioValuation(p.id, userId);
      totalValue = totalValue.plus(toDecimal(val.netPortfolioValue));
      totalCost = totalCost.plus(toDecimal(val.totalCost));
      realizedGL = realizedGL.plus(toDecimal(val.realizedGainLoss));
      unrealizedGL = unrealizedGL.plus(toDecimal(val.unrealizedGainLoss));
      cashBal = cashBal.plus(toDecimal(val.cashBalance));
    }

    const assetAllocation = await this.getAssetAllocation(userId);

    return {
      portfolioValue: formatDecimal(totalValue, 2),
      totalCost: formatDecimal(totalCost, 2),
      realizedGainLoss: formatDecimal(realizedGL, 2),
      unrealizedGainLoss: formatDecimal(unrealizedGL, 2),
      cashBalance: formatDecimal(cashBal, 2),
      netPortfolioValue: formatDecimal(totalValue, 2),
      assetAllocation,
    };
  }

  public async getInvestmentPerformance(userId: string, rawQuery: unknown) {
    const parse = investmentPerformanceQuerySchema.safeParse(rawQuery);
    if (!parse.success) {
      throw new ValidationError('Invalid performance query parameters', parse.error.errors);
    }
    const query = parse.data;

    if (query.portfolioId) {
      return valuationService.getPortfolioPerformance(query.portfolioId, userId);
    }

    return this.getInvestmentAnalytics(userId);
  }
}

export const analyticsService = new AnalyticsService();
