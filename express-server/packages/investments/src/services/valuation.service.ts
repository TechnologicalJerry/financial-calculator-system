import { NotFoundError, ValidationError } from '@packages/errors';
import { toDecimal, roundDecimal, formatDecimal, Decimal } from '@packages/calculators';
import { portfolioRepository, PortfolioRepository } from '../repositories/portfolio.repository.js';
import { holdingRepository, HoldingRepository } from '../repositories/holding.repository.js';
import { transactionRepository, TransactionRepository } from '../repositories/transaction.repository.js';
import { holdingQuerySchema } from '../schemas/investment.schemas.js';
import {
  PortfolioValuationResult,
  HoldingValuationItem,
  PortfolioAllocationResult,
  AssetAllocationItem,
  PortfolioPerformanceResult,
  AssetType,
} from '../types/investment.types.js';

export class ValuationService {
  constructor(
    private pRepo: PortfolioRepository = portfolioRepository,
    private hRepo: HoldingRepository = holdingRepository,
    private tRepo: TransactionRepository = transactionRepository,
  ) {}

  public async getPortfolioValuation(portfolioId: string, userId: string): Promise<PortfolioValuationResult> {
    const portfolio = await this.pRepo.findPortfolioByIdForUser(portfolioId, userId);
    if (!portfolio) {
      throw new NotFoundError(`Portfolio '${portfolioId}' not found`);
    }

    const cashBalance = toDecimal(portfolio.cashBalance.toString());
    let totalHoldingsMarketValue = toDecimal(0);
    let totalHoldingsCost = toDecimal(0);

    const holdingsValuation: Array<{
      holdingId: string;
      investmentAccountId: string;
      securityId: string;
      symbol: string;
      name: string;
      assetType: AssetType;
      quantity: Decimal;
      averageCost: Decimal;
      totalCost: Decimal;
      currentPrice: Decimal;
      marketValue: Decimal;
      unrealizedGainLoss: Decimal;
      unrealizedGainLossPercentage: Decimal;
    }> = [];

    for (const h of portfolio.holdings) {
      const qty = toDecimal(h.quantity.toString());
      const avgCost = toDecimal(h.averageCost.toString());
      const totalCost = toDecimal(h.totalCost.toString());

      const priceRecord = h.security.prices[0];
      const curPrice = priceRecord ? toDecimal(priceRecord.price.toString()) : avgCost;

      const mktVal = qty.times(curPrice);
      const unrlzdGL = mktVal.minus(totalCost);
      const unrlzdGLPct = totalCost.isZero()
        ? toDecimal(0)
        : roundDecimal(unrlzdGL.dividedBy(totalCost).times(100), 2);

      totalHoldingsMarketValue = totalHoldingsMarketValue.plus(mktVal);
      totalHoldingsCost = totalHoldingsCost.plus(totalCost);

      holdingsValuation.push({
        holdingId: h.id,
        investmentAccountId: h.investmentAccountId,
        securityId: h.securityId,
        symbol: h.security.symbol,
        name: h.security.name,
        assetType: h.security.assetType,
        quantity: qty,
        averageCost: avgCost,
        totalCost,
        currentPrice: curPrice,
        marketValue: mktVal,
        unrealizedGainLoss: unrlzdGL,
        unrealizedGainLossPercentage: unrlzdGLPct,
      });
    }

    const netPortfolioValue = totalHoldingsMarketValue.plus(cashBalance);
    const overallUnrealizedGL = totalHoldingsMarketValue.minus(totalHoldingsCost);
    const overallUnrealizedGLPct = totalHoldingsCost.isZero()
      ? toDecimal(0)
      : roundDecimal(overallUnrealizedGL.dividedBy(totalHoldingsCost).times(100), 2);

    // Sum realized gains from SELL transactions
    const transactions = await this.tRepo.findTransactionsForPortfolio(portfolioId, userId, {
      page: 1,
      limit: 10000,
      sortBy: 'transactionDate',
      sortOrder: 'desc',
    });

    const totalRealizedGL = transactions.reduce((acc, tx) => {
      if (tx.type === 'SELL' && tx.realizedGainLoss) {
        return acc.plus(toDecimal(tx.realizedGainLoss.toString()));
      }
      return acc;
    }, toDecimal(0));

    // Format holding items with allocation percentage
    const formattedHoldings: HoldingValuationItem[] = holdingsValuation.map((h) => {
      const allocPct = netPortfolioValue.isZero()
        ? toDecimal(0)
        : roundDecimal(h.marketValue.dividedBy(netPortfolioValue).times(100), 2);

      return {
        holdingId: h.holdingId,
        investmentAccountId: h.investmentAccountId,
        securityId: h.securityId,
        symbol: h.symbol,
        name: h.name,
        assetType: h.assetType,
        quantity: formatDecimal(h.quantity, 6),
        averageCost: formatDecimal(h.averageCost, 6),
        totalCost: formatDecimal(h.totalCost, 2),
        currentPrice: formatDecimal(h.currentPrice, 6),
        marketValue: formatDecimal(h.marketValue, 2),
        unrealizedGainLoss: formatDecimal(h.unrealizedGainLoss, 2),
        unrealizedGainLossPercentage: formatDecimal(h.unrealizedGainLossPercentage, 2),
        allocationPercentage: formatDecimal(allocPct, 2),
      };
    });

    return {
      portfolioId: portfolio.id,
      portfolioName: portfolio.name,
      baseCurrency: portfolio.baseCurrency,
      totalMarketValue: formatDecimal(totalHoldingsMarketValue, 2),
      totalCost: formatDecimal(totalHoldingsCost, 2),
      unrealizedGainLoss: formatDecimal(overallUnrealizedGL, 2),
      unrealizedGainLossPercentage: formatDecimal(overallUnrealizedGLPct, 2),
      realizedGainLoss: formatDecimal(totalRealizedGL, 2),
      cashBalance: formatDecimal(cashBalance, 2),
      netPortfolioValue: formatDecimal(netPortfolioValue, 2),
      holdings: formattedHoldings,
    };
  }

  public async getPortfolioAllocation(portfolioId: string, userId: string): Promise<PortfolioAllocationResult> {
    const valuation = await this.getPortfolioValuation(portfolioId, userId);
    const netVal = toDecimal(valuation.netPortfolioValue);

    const assetTypeMap = new Map<string, Decimal>();
    const securityMap = new Map<string, { name: string; value: Decimal }>();

    // Add cash balance to assetType allocation
    const cashVal = toDecimal(valuation.cashBalance);
    if (!cashVal.isZero()) {
      assetTypeMap.set('CASH', cashVal);
      securityMap.set('CASH', { name: 'Cash Balance', value: cashVal });
    }

    for (const item of valuation.holdings) {
      const mktVal = toDecimal(item.marketValue);
      const curAsset = assetTypeMap.get(item.assetType) || toDecimal(0);
      assetTypeMap.set(item.assetType, curAsset.plus(mktVal));

      const curSec = securityMap.get(item.symbol) || { name: item.name, value: toDecimal(0) };
      securityMap.set(item.symbol, { name: item.name, value: curSec.value.plus(mktVal) });
    }

    const byAssetType: AssetAllocationItem[] = Array.from(assetTypeMap.entries()).map(([type, val]) => {
      const pct = netVal.isZero() ? toDecimal(0) : roundDecimal(val.dividedBy(netVal).times(100), 2);
      return {
        key: type,
        name: type,
        marketValue: formatDecimal(val, 2),
        allocationPercentage: formatDecimal(pct, 2),
      };
    });

    const bySecurity: AssetAllocationItem[] = Array.from(securityMap.entries()).map(([symbol, obj]) => {
      const pct = netVal.isZero() ? toDecimal(0) : roundDecimal(obj.value.dividedBy(netVal).times(100), 2);
      return {
        key: symbol,
        name: obj.name,
        marketValue: formatDecimal(obj.value, 2),
        allocationPercentage: formatDecimal(pct, 2),
      };
    });

    return {
      portfolioId,
      netPortfolioValue: valuation.netPortfolioValue,
      byAssetType,
      bySecurity,
    };
  }

  public async getPortfolioPerformance(portfolioId: string, userId: string): Promise<PortfolioPerformanceResult> {
    const valuation = await this.getPortfolioValuation(portfolioId, userId);

    const transactions = await this.tRepo.findTransactionsForPortfolio(portfolioId, userId, {
      page: 1,
      limit: 10000,
      sortBy: 'transactionDate',
      sortOrder: 'desc',
    });

    let totalContributed = toDecimal(0);
    let totalWithdrawn = toDecimal(0);
    let totalDividends = toDecimal(0);
    let totalFees = toDecimal(0);

    for (const tx of transactions) {
      const amt = toDecimal(tx.totalAmount.toString());
      const fees = toDecimal(tx.fees.toString());
      totalFees = totalFees.plus(fees);

      if (tx.type === 'DEPOSIT') {
        totalContributed = totalContributed.plus(amt);
      } else if (tx.type === 'WITHDRAWAL') {
        totalWithdrawn = totalWithdrawn.plus(amt);
      } else if (tx.type === 'DIVIDEND') {
        totalDividends = totalDividends.plus(amt);
      }
    }

    return {
      portfolioId,
      baseCurrency: valuation.baseCurrency,
      totalContributed: formatDecimal(totalContributed, 2),
      totalWithdrawn: formatDecimal(totalWithdrawn, 2),
      totalDividends: formatDecimal(totalDividends, 2),
      totalFees: formatDecimal(totalFees, 2),
      realizedGainLoss: valuation.realizedGainLoss,
      unrealizedGainLoss: valuation.unrealizedGainLoss,
      netPortfolioValue: valuation.netPortfolioValue,
    };
  }

  public async listHoldings(portfolioId: string, userId: string, rawQuery: unknown) {
    const portfolio = await this.pRepo.findPortfolioByIdForUser(portfolioId, userId);
    if (!portfolio) throw new NotFoundError(`Portfolio '${portfolioId}' not found`);

    const parse = holdingQuerySchema.safeParse(rawQuery);
    if (!parse.success) throw new ValidationError('Invalid holding query parameters', parse.error.errors);
    const query = parse.data;

    const [items, total] = await Promise.all([
      this.hRepo.findHoldingsForPortfolio(portfolioId, userId, query),
      this.hRepo.countHoldingsForPortfolio(portfolioId, userId, query),
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

  public async getHoldingDetail(portfolioId: string, holdingId: string, userId: string) {
    const holding = await this.hRepo.findHoldingByIdForUser(holdingId, portfolioId, userId);
    if (!holding) {
      throw new NotFoundError(`Holding '${holdingId}' not found for portfolio '${portfolioId}'`);
    }
    return holding;
  }
}

export const valuationService = new ValuationService();
