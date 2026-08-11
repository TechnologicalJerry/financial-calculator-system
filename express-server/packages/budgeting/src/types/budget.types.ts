import {
  BudgetPeriod,
  BudgetStatus,
  BudgetCategoryType,
  GoalCategory,
  GoalStatus,
} from '@prisma/client';

export { BudgetPeriod, BudgetStatus, BudgetCategoryType, GoalCategory, GoalStatus };

export interface AllocationInput {
  categoryId: string;
  limit: number | string;
}

export interface CategoryProgressItem {
  categoryId: string;
  categoryName: string;
  limit: string;
  spent: string;
  remaining: string;
  percentageUsed: string;
}

export interface BudgetProgressResult {
  budgetId: string;
  budgetName: string;
  totalLimit: string;
  totalSpent: string;
  remaining: string;
  percentageUsed: string;
  categoryProgress: CategoryProgressItem[];
}

export interface BudgetSummaryResult {
  budgetId: string;
  budgetName: string;
  totalLimit: string;
  totalAllocated: string;
  unallocatedLimit: string;
  totalSpent: string;
  remaining: string;
  percentageUsed: string;
  categoryBreakdown: CategoryProgressItem[];
  highestSpendingCategories: CategoryProgressItem[];
}

export interface GoalProgressResult {
  goalId: string;
  goalName: string;
  targetAmount: string;
  currentAmount: string;
  remainingAmount: string;
  percentageComplete: string;
  targetDate: string;
  daysRemaining: number;
  status: GoalStatus;
}
