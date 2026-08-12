import {
  PortfolioStatus,
  InvestmentAccountType,
  InvestmentAccountStatus,
  AssetType,
  SecurityStatus,
  InvestmentTransactionType,
} from '@prisma/client';

export {
  PortfolioStatus,
  InvestmentAccountType,
  InvestmentAccountStatus,
  AssetType,
  SecurityStatus,
  InvestmentTransactionType,
};

export interface HoldingValuationItem {
  holdingId: string;
  investmentAccountId: string;
  securityId: string;
  symbol: string;
  name: string;
  assetType: AssetType;
  quantity: string;
  averageCost: string;
  totalCost: string;
  currentPrice: string;
  marketValue: string;
  unrealizedGainLoss: string;
  unrealizedGainLossPercentage: string;
  allocationPercentage: string;
}

export interface PortfolioValuationResult {
  portfolioId: string;
  portfolioName: string;
  baseCurrency: string;
  totalMarketValue: string;
  totalCost: string;
  unrealizedGainLoss: string;
  unrealizedGainLossPercentage: string;
  realizedGainLoss: string;
  cashBalance: string;
  netPortfolioValue: string;
  holdings: HoldingValuationItem[];
}

export interface AssetAllocationItem {
  key: string; // symbol or assetType
  name: string;
  marketValue: string;
  allocationPercentage: string;
}

export interface PortfolioAllocationResult {
  portfolioId: string;
  netPortfolioValue: string;
  byAssetType: AssetAllocationItem[];
  bySecurity: AssetAllocationItem[];
}

export interface PortfolioPerformanceResult {
  portfolioId: string;
  baseCurrency: string;
  totalContributed: string;
  totalWithdrawn: string;
  totalDividends: string;
  totalFees: string;
  realizedGainLoss: string;
  unrealizedGainLoss: string;
  netPortfolioValue: string;
}
