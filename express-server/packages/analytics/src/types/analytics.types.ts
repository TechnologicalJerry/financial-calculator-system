import { ReportType } from '@prisma/client';

export { ReportType };

export interface DashboardSummaryResult {
  netWorth: string;
  totalAssets: string;
  totalLiabilities: string;
  cashBalance: string;
  budgetSummary: {
    totalBudgeted: string;
    totalSpent: string;
    totalRemaining: string;
    utilizationPercentage: string;
  };
  goalSummary: {
    activeGoalsCount: number;
    completedGoalsCount: number;
    totalTargetAmount: string;
    totalCurrentAmount: string;
    overallProgressPercentage: string;
  };
  portfolioSummary: {
    totalMarketValue: string;
    netPortfolioValue: string;
    unrealizedGainLoss: string;
    realizedGainLoss: string;
  };
  recentCalculations: Array<{
    id: string;
    calculatorId: string;
    calculatorVersion: string;
    createdAt: string;
  }>;
}

export interface NetWorthResult {
  netWorth: string;
  totalAssets: string;
  totalLiabilities: string;
  assetBreakdown: Array<{ category: string; amount: string }>;
  liabilityBreakdown: Array<{ category: string; amount: string }>;
}

export interface NetWorthHistoryItem {
  date: string;
  netWorth: string;
  assets: string;
  liabilities: string;
}

export interface ExpenseAnalyticsResult {
  totalExpenses: string;
  averageExpense: string;
  categoryBreakdown: Array<{ categoryId: string; categoryName: string; amount: string; percentage: string }>;
  topCategories: Array<{ categoryId: string; categoryName: string; amount: string }>;
}

export interface IncomeAnalyticsResult {
  totalIncome: string;
  incomeBreakdown: Array<{ source: string; amount: string; percentage: string }>;
}

export interface CashFlowResult {
  totalInflow: string;
  totalOutflow: string;
  netCashFlow: string;
  breakdown: {
    income: string;
    expenses: string;
    investmentDeposits: string;
    investmentWithdrawals: string;
    dividends: string;
    fees: string;
    other: string;
  };
}

export interface BudgetAnalyticsResult {
  totalBudgeted: string;
  totalSpent: string;
  totalRemaining: string;
  utilizationPercentage: string;
  overBudgetCategoriesCount: number;
  underBudgetCategoriesCount: number;
}

export interface GoalAnalyticsResult {
  totalGoals: number;
  activeGoals: number;
  completedGoals: number;
  totalTargetAmount: string;
  totalCurrentAmount: string;
  totalRemainingAmount: string;
  overallProgressPercentage: string;
}

export interface InvestmentAnalyticsResult {
  portfolioValue: string;
  totalCost: string;
  realizedGainLoss: string;
  unrealizedGainLoss: string;
  cashBalance: string;
  netPortfolioValue: string;
  assetAllocation: Array<{ key: string; name: string; value: string; percentage: string }>;
}
