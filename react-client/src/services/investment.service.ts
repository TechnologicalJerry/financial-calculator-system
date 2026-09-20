import { apiClient } from '@/lib/api-client';
import { ApiResponse } from '@/types/api.types';

export interface PortfolioItem {
  id: string;
  userId: string;
  name: string;
  description?: string;
  currency: string;
  isDefault: boolean;
  totalValue: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePortfolioDto {
  name: string;
  description?: string;
  currency?: string;
  isDefault?: boolean;
}

export interface NetWorthSummary {
  totalNetWorth: number;
  totalAssets: number;
  totalLiabilities: number;
  debtToAssetRatio: number;
  assetBreakdown: Record<string, number>;
  liabilityBreakdown: Record<string, number>;
}

export interface AssetLiabilityItem {
  id: string;
  portfolioId?: string;
  type: 'ASSET' | 'LIABILITY';
  category: string;
  name: string;
  amount: number;
  currency: string;
  createdAt: string;
}

export interface CreateAssetLiabilityDto {
  portfolioId?: string;
  type: 'ASSET' | 'LIABILITY';
  category: string;
  name: string;
  amount: number;
  currency?: string;
}

export interface FinancialGoalItem {
  id: string;
  portfolioId?: string;
  goalName: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  status: 'ON_TRACK' | 'BEHIND' | 'COMPLETED';
}

export interface CreateGoalDto {
  portfolioId?: string;
  goalName: string;
  targetAmount: number;
  currentAmount?: number;
  targetDate: string;
}

export interface BudgetItem {
  id: string;
  category: string;
  spendingLimit: number;
  currentSpending: number;
  period: 'MONTHLY' | 'YEARLY';
}

export interface CreateBudgetDto {
  category: string;
  spendingLimit: number;
  period?: 'MONTHLY' | 'YEARLY';
}

export interface TransactionItem {
  id: string;
  portfolioId?: string;
  type: 'INCOME' | 'EXPENSE' | 'INVESTMENT';
  category: string;
  amount: number;
  description?: string;
  transactionDate: string;
}

export interface CreateTransactionDto {
  portfolioId?: string;
  type: 'INCOME' | 'EXPENSE' | 'INVESTMENT';
  category: string;
  amount: number;
  description?: string;
  transactionDate?: string;
}

export interface InvestmentAccount {
  id: string;
  userId: string;
  portfolioId?: string;
  accountName: string;
  accountType: string;
  institutionName?: string;
  accountNumberMasked?: string;
  balance: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
  holdings?: InvestmentHolding[];
}

export interface InvestmentHolding {
  id: string;
  accountId: string;
  symbol: string;
  name: string;
  assetClass: string;
  quantity: number;
  costBasis: number;
  currentPrice: number;
  currentValue: number;
  lastUpdated: string;
}

export interface CreateInvestmentAccountPayload {
  accountName: string;
  accountType: string;
  portfolioId?: string;
  institutionName?: string;
  accountNumberMasked?: string;
  balance?: number;
  currency?: string;
}

export interface AddHoldingPayload {
  accountId: string;
  symbol: string;
  name: string;
  assetClass: string;
  quantity: number;
  costBasis: number;
  currentPrice: number;
}

export const investmentService = {
  // Portfolios
  async getPortfolios(): Promise<ApiResponse<PortfolioItem[]>> {
    const res = await apiClient.get<ApiResponse<PortfolioItem[]>>('/api/v1/portfolios');
    return res.data;
  },

  async getPortfolioById(id: string): Promise<ApiResponse<PortfolioItem>> {
    const res = await apiClient.get<ApiResponse<PortfolioItem>>(`/api/v1/portfolios/${id}`);
    return res.data;
  },

  async createPortfolio(data: CreatePortfolioDto): Promise<ApiResponse<PortfolioItem>> {
    const res = await apiClient.post<ApiResponse<PortfolioItem>>('/api/v1/portfolios', data);
    return res.data;
  },

  async updatePortfolio(id: string, data: Partial<CreatePortfolioDto>): Promise<ApiResponse<PortfolioItem>> {
    const res = await apiClient.put<ApiResponse<PortfolioItem>>(`/api/v1/portfolios/${id}`, data);
    return res.data;
  },

  async deletePortfolio(id: string): Promise<ApiResponse<void>> {
    const res = await apiClient.delete<ApiResponse<void>>(`/api/v1/portfolios/${id}`);
    return res.data;
  },

  // Net Worth & Assets
  async getNetWorth(): Promise<ApiResponse<NetWorthSummary>> {
    const res = await apiClient.get<ApiResponse<NetWorthSummary>>('/api/v1/net-worth');
    return res.data;
  },

  async getPortfolioNetWorth(portfolioId: string): Promise<ApiResponse<NetWorthSummary>> {
    const res = await apiClient.get<ApiResponse<NetWorthSummary>>(`/api/v1/net-worth/portfolio/${portfolioId}`);
    return res.data;
  },

  async getAssetsAndLiabilities(): Promise<ApiResponse<AssetLiabilityItem[]>> {
    const res = await apiClient.get<ApiResponse<AssetLiabilityItem[]>>('/api/v1/assets-liabilities');
    return res.data;
  },

  async createAssetOrLiability(data: CreateAssetLiabilityDto): Promise<ApiResponse<AssetLiabilityItem>> {
    const res = await apiClient.post<ApiResponse<AssetLiabilityItem>>('/api/v1/assets-liabilities', data);
    return res.data;
  },

  async deleteAssetOrLiability(id: string): Promise<ApiResponse<void>> {
    const res = await apiClient.delete<ApiResponse<void>>(`/api/v1/assets-liabilities/${id}`);
    return res.data;
  },

  // Goals
  async getGoals(): Promise<ApiResponse<FinancialGoalItem[]>> {
    const res = await apiClient.get<ApiResponse<FinancialGoalItem[]>>('/api/v1/goals');
    return res.data;
  },

  async createGoal(data: CreateGoalDto): Promise<ApiResponse<FinancialGoalItem>> {
    const res = await apiClient.post<ApiResponse<FinancialGoalItem>>('/api/v1/goals', data);
    return res.data;
  },

  async updateGoalProgress(id: string, currentAmount: number): Promise<ApiResponse<FinancialGoalItem>> {
    const res = await apiClient.put<ApiResponse<FinancialGoalItem>>(`/api/v1/goals/${id}/progress`, { currentAmount });
    return res.data;
  },

  // Budgets
  async getBudgets(): Promise<ApiResponse<BudgetItem[]>> {
    const res = await apiClient.get<ApiResponse<BudgetItem[]>>('/api/v1/budgets');
    return res.data;
  },

  async createBudget(data: CreateBudgetDto): Promise<ApiResponse<BudgetItem>> {
    const res = await apiClient.post<ApiResponse<BudgetItem>>('/api/v1/budgets', data);
    return res.data;
  },

  // Transactions
  async getTransactions(): Promise<ApiResponse<TransactionItem[]>> {
    const res = await apiClient.get<ApiResponse<TransactionItem[]>>('/api/v1/transactions');
    return res.data;
  },

  async createTransaction(data: CreateTransactionDto): Promise<ApiResponse<TransactionItem>> {
    const res = await apiClient.post<ApiResponse<TransactionItem>>('/api/v1/transactions', data);
    return res.data;
  },

  // Investment Accounts & Holdings
  async getAccounts(): Promise<ApiResponse<InvestmentAccount[]>> {
    const res = await apiClient.get<ApiResponse<InvestmentAccount[]>>('/api/v1/investments/accounts');
    return res.data;
  },

  async createAccount(data: CreateInvestmentAccountPayload): Promise<ApiResponse<InvestmentAccount>> {
    const res = await apiClient.post<ApiResponse<InvestmentAccount>>('/api/v1/investments/accounts', data);
    return res.data;
  },

  async getHoldings(accountId: string): Promise<ApiResponse<InvestmentHolding[]>> {
    const res = await apiClient.get<ApiResponse<InvestmentHolding[]>>(`/api/v1/investments/accounts/${accountId}/holdings`);
    return res.data;
  },

  async addHolding(data: AddHoldingPayload): Promise<ApiResponse<InvestmentHolding>> {
    const res = await apiClient.post<ApiResponse<InvestmentHolding>>('/api/v1/investments/holdings', data);
    return res.data;
  },
};
