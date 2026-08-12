import { randomUUID } from 'crypto';
import { getPrismaClient } from '@packages/database';
import { Prisma } from '@prisma/client';
import { NotFoundError, ValidationError } from '@packages/errors';
import { EventPublisher } from '@packages/messaging';
import { getLogger } from '@packages/logger';
import { toDecimal, roundDecimal } from '@packages/calculators';
import { transactionRepository, TransactionRepository } from '../repositories/transaction.repository.js';
import { portfolioRepository, PortfolioRepository } from '../repositories/portfolio.repository.js';
import { accountRepository, AccountRepository } from '../repositories/account.repository.js';
import { securityRepository, SecurityRepository } from '../repositories/security.repository.js';
import {
  buyTransactionSchema,
  sellTransactionSchema,
  dividendTransactionSchema,
  depositTransactionSchema,
  withdrawalTransactionSchema,
  transactionQuerySchema,
} from '../schemas/investment.schemas.js';

export class TransactionService {
  private publisher = new EventPublisher();

  constructor(
    private repository: TransactionRepository = transactionRepository,
    private pRepo: PortfolioRepository = portfolioRepository,
    private aRepo: AccountRepository = accountRepository,
    private sRepo: SecurityRepository = securityRepository,
  ) {}

  private get prisma() {
    return getPrismaClient();
  }

  // BUY TRANSACTION
  public async executeBuy(portfolioId: string, userId: string, rawInput: unknown, correlationId?: string) {
    const portfolio = await this.pRepo.findPortfolioByIdForUser(portfolioId, userId);
    if (!portfolio) throw new NotFoundError(`Portfolio '${portfolioId}' not found`);

    const parse = buyTransactionSchema.safeParse(rawInput);
    if (!parse.success) throw new ValidationError('Invalid buy transaction parameters', parse.error.errors);
    const data = parse.data;

    const account = await this.aRepo.findAccountByIdForUser(data.investmentAccountId, portfolioId, userId);
    if (!account) throw new NotFoundError(`Investment account '${data.investmentAccountId}' not found in portfolio`);

    const security = await this.sRepo.findSecurityById(data.securityId);
    if (!security) throw new NotFoundError(`Security '${data.securityId}' not found`);

    const qty = toDecimal(data.quantity);
    const price = toDecimal(data.price);
    const fees = toDecimal(data.fees);
    const taxes = toDecimal(data.taxes);

    const grossAmount = qty.times(price);
    const totalAmount = grossAmount.plus(fees).plus(taxes);

    const currentCash = toDecimal(portfolio.cashBalance.toString());
    if (currentCash.lessThan(totalAmount)) {
      throw new ValidationError(`Insufficient cash balance (${currentCash.toString()} ${portfolio.baseCurrency}) for buy transaction total (${totalAmount.toString()} ${portfolio.baseCurrency})`);
    }

    return this.prisma.$transaction(async (tx) => {
      // Check idempotency reference if provided
      if (data.referenceId) {
        const existingTx = await tx.investmentTransaction.findUnique({
          where: { referenceId: data.referenceId },
          include: { security: true, investmentAccount: true },
        });
        if (existingTx) return existingTx;
      }

      // Update cash
      const newCash = currentCash.minus(totalAmount);
      await tx.portfolio.update({
        where: { id: portfolioId },
        data: { cashBalance: new Prisma.Decimal(newCash.toString()) },
      });

      // Update or create holding
      const existingHolding = await tx.holding.findFirst({
        where: { portfolioId, investmentAccountId: data.investmentAccountId, securityId: data.securityId },
      });

      if (existingHolding) {
        const existQty = toDecimal(existingHolding.quantity.toString());
        const existTotalCost = toDecimal(existingHolding.totalCost.toString());

        const newQty = existQty.plus(qty);
        const newTotalCost = existTotalCost.plus(totalAmount);
        const newAvgCost = roundDecimal(newTotalCost.dividedBy(newQty), 6);

        await tx.holding.update({
          where: { id: existingHolding.id },
          data: {
            quantity: new Prisma.Decimal(newQty.toString()),
            totalCost: new Prisma.Decimal(newTotalCost.toString()),
            averageCost: new Prisma.Decimal(newAvgCost.toString()),
          },
        });
      } else {
        const newAvgCost = roundDecimal(totalAmount.dividedBy(qty), 6);
        await tx.holding.create({
          data: {
            portfolioId,
            investmentAccountId: data.investmentAccountId,
            securityId: data.securityId,
            quantity: new Prisma.Decimal(qty.toString()),
            totalCost: new Prisma.Decimal(totalAmount.toString()),
            averageCost: new Prisma.Decimal(newAvgCost.toString()),
            currency: portfolio.baseCurrency,
          },
        });
      }

      // Record transaction
      const transaction = await tx.investmentTransaction.create({
        data: {
          userId,
          portfolioId,
          investmentAccountId: data.investmentAccountId,
          securityId: data.securityId,
          type: 'BUY',
          quantity: new Prisma.Decimal(qty.toString()),
          price: new Prisma.Decimal(price.toString()),
          fees: new Prisma.Decimal(fees.toString()),
          taxes: new Prisma.Decimal(taxes.toString()),
          totalAmount: new Prisma.Decimal(totalAmount.toString()),
          currency: portfolio.baseCurrency,
          transactionDate: data.transactionDate ? new Date(data.transactionDate) : new Date(),
          description: data.description || null,
          referenceId: data.referenceId || null,
        },
        include: { security: true, investmentAccount: true },
      });

      try {
        const corrId = correlationId || randomUUID();
        await this.publisher.publish({
          exchange: 'amq.direct',
          routingKey: 'investment.buy.created',
          correlationId: corrId,
          message: {
            eventId: randomUUID(),
            eventType: 'investment.buy.created',
            userId,
            portfolioId,
            transactionId: transaction.id,
            timestamp: new Date().toISOString(),
            correlationId: corrId,
          },
        });
      } catch (err) {
        getLogger().warn({ err, transactionId: transaction.id }, 'Failed to publish investment.buy.created event');
      }

      return transaction;
    });
  }

  // SELL TRANSACTION
  public async executeSell(portfolioId: string, userId: string, rawInput: unknown, correlationId?: string) {
    const portfolio = await this.pRepo.findPortfolioByIdForUser(portfolioId, userId);
    if (!portfolio) throw new NotFoundError(`Portfolio '${portfolioId}' not found`);

    const parse = sellTransactionSchema.safeParse(rawInput);
    if (!parse.success) throw new ValidationError('Invalid sell transaction parameters', parse.error.errors);
    const data = parse.data;

    const account = await this.aRepo.findAccountByIdForUser(data.investmentAccountId, portfolioId, userId);
    if (!account) throw new NotFoundError(`Investment account '${data.investmentAccountId}' not found in portfolio`);

    const security = await this.sRepo.findSecurityById(data.securityId);
    if (!security) throw new NotFoundError(`Security '${data.securityId}' not found`);

    const qty = toDecimal(data.quantity);
    const price = toDecimal(data.price);
    const fees = toDecimal(data.fees);
    const taxes = toDecimal(data.taxes);

    const grossProceeds = qty.times(price);
    let netProceeds = grossProceeds.minus(fees).minus(taxes);
    if (netProceeds.lessThan(0)) netProceeds = toDecimal(0);

    return this.prisma.$transaction(async (tx) => {
      if (data.referenceId) {
        const existingTx = await tx.investmentTransaction.findUnique({
          where: { referenceId: data.referenceId },
          include: { security: true, investmentAccount: true },
        });
        if (existingTx) return existingTx;
      }

      const holding = await tx.holding.findFirst({
        where: { portfolioId, investmentAccountId: data.investmentAccountId, securityId: data.securityId },
      });

      if (!holding) {
        throw new ValidationError(`No holding found for security '${security.symbol}' in this account`);
      }

      const currentHoldingQty = toDecimal(holding.quantity.toString());
      if (qty.greaterThan(currentHoldingQty)) {
        throw new ValidationError(`Cannot sell ${qty.toString()} units. Existing holding quantity is ${currentHoldingQty.toString()}`);
      }

      const currentAvgCost = toDecimal(holding.averageCost.toString());
      const currentTotalCost = toDecimal(holding.totalCost.toString());

      const costOfSoldUnits = qty.times(currentAvgCost);
      const realizedGainLoss = roundDecimal(netProceeds.minus(costOfSoldUnits), 2);

      const remainingQty = currentHoldingQty.minus(qty);
      let remainingTotalCost = currentTotalCost.minus(costOfSoldUnits);
      if (remainingTotalCost.lessThan(0) || remainingQty.isZero()) remainingTotalCost = toDecimal(0);

      if (remainingQty.isZero()) {
        await tx.holding.delete({ where: { id: holding.id } });
      } else {
        await tx.holding.update({
          where: { id: holding.id },
          data: {
            quantity: new Prisma.Decimal(remainingQty.toString()),
            totalCost: new Prisma.Decimal(remainingTotalCost.toString()),
          },
        });
      }

      // Update cash
      const currentCash = toDecimal(portfolio.cashBalance.toString());
      const newCash = currentCash.plus(netProceeds);
      await tx.portfolio.update({
        where: { id: portfolioId },
        data: { cashBalance: new Prisma.Decimal(newCash.toString()) },
      });

      // Record transaction
      const transaction = await tx.investmentTransaction.create({
        data: {
          userId,
          portfolioId,
          investmentAccountId: data.investmentAccountId,
          securityId: data.securityId,
          type: 'SELL',
          quantity: new Prisma.Decimal(qty.toString()),
          price: new Prisma.Decimal(price.toString()),
          fees: new Prisma.Decimal(fees.toString()),
          taxes: new Prisma.Decimal(taxes.toString()),
          totalAmount: new Prisma.Decimal(netProceeds.toString()),
          realizedGainLoss: new Prisma.Decimal(realizedGainLoss.toString()),
          currency: portfolio.baseCurrency,
          transactionDate: data.transactionDate ? new Date(data.transactionDate) : new Date(),
          description: data.description || null,
          referenceId: data.referenceId || null,
        },
        include: { security: true, investmentAccount: true },
      });

      try {
        const corrId = correlationId || randomUUID();
        await this.publisher.publish({
          exchange: 'amq.direct',
          routingKey: 'investment.sell.created',
          correlationId: corrId,
          message: {
            eventId: randomUUID(),
            eventType: 'investment.sell.created',
            userId,
            portfolioId,
            transactionId: transaction.id,
            timestamp: new Date().toISOString(),
            correlationId: corrId,
          },
        });
      } catch (err) {
        getLogger().warn({ err, transactionId: transaction.id }, 'Failed to publish investment.sell.created event');
      }

      return transaction;
    });
  }

  // DIVIDEND TRANSACTION
  public async executeDividend(portfolioId: string, userId: string, rawInput: unknown, correlationId?: string) {
    const portfolio = await this.pRepo.findPortfolioByIdForUser(portfolioId, userId);
    if (!portfolio) throw new NotFoundError(`Portfolio '${portfolioId}' not found`);

    const parse = dividendTransactionSchema.safeParse(rawInput);
    if (!parse.success) throw new ValidationError('Invalid dividend transaction parameters', parse.error.errors);
    const data = parse.data;

    const account = await this.aRepo.findAccountByIdForUser(data.investmentAccountId, portfolioId, userId);
    if (!account) throw new NotFoundError(`Investment account '${data.investmentAccountId}' not found in portfolio`);

    const security = await this.sRepo.findSecurityById(data.securityId);
    if (!security) throw new NotFoundError(`Security '${data.securityId}' not found`);

    const amt = toDecimal(data.amount);
    const taxes = toDecimal(data.taxes);
    let netDividend = amt.minus(taxes);
    if (netDividend.lessThan(0)) netDividend = toDecimal(0);

    return this.prisma.$transaction(async (tx) => {
      if (data.referenceId) {
        const existingTx = await tx.investmentTransaction.findUnique({
          where: { referenceId: data.referenceId },
          include: { security: true, investmentAccount: true },
        });
        if (existingTx) return existingTx;
      }

      // Update cash
      const currentCash = toDecimal(portfolio.cashBalance.toString());
      const newCash = currentCash.plus(netDividend);
      await tx.portfolio.update({
        where: { id: portfolioId },
        data: { cashBalance: new Prisma.Decimal(newCash.toString()) },
      });

      // Record transaction
      const transaction = await tx.investmentTransaction.create({
        data: {
          userId,
          portfolioId,
          investmentAccountId: data.investmentAccountId,
          securityId: data.securityId,
          type: 'DIVIDEND',
          fees: new Prisma.Decimal('0.00'),
          taxes: new Prisma.Decimal(taxes.toString()),
          totalAmount: new Prisma.Decimal(netDividend.toString()),
          currency: portfolio.baseCurrency,
          transactionDate: data.transactionDate ? new Date(data.transactionDate) : new Date(),
          description: data.description || null,
          referenceId: data.referenceId || null,
        },
        include: { security: true, investmentAccount: true },
      });

      try {
        const corrId = correlationId || randomUUID();
        await this.publisher.publish({
          exchange: 'amq.direct',
          routingKey: 'investment.dividend.created',
          correlationId: corrId,
          message: {
            eventId: randomUUID(),
            eventType: 'investment.dividend.created',
            userId,
            portfolioId,
            transactionId: transaction.id,
            timestamp: new Date().toISOString(),
            correlationId: corrId,
          },
        });
      } catch (err) {
        getLogger().warn({ err, transactionId: transaction.id }, 'Failed to publish investment.dividend.created event');
      }

      return transaction;
    });
  }

  // DEPOSIT TRANSACTION
  public async executeDeposit(portfolioId: string, userId: string, rawInput: unknown, correlationId?: string) {
    const portfolio = await this.pRepo.findPortfolioByIdForUser(portfolioId, userId);
    if (!portfolio) throw new NotFoundError(`Portfolio '${portfolioId}' not found`);

    const parse = depositTransactionSchema.safeParse(rawInput);
    if (!parse.success) throw new ValidationError('Invalid deposit transaction parameters', parse.error.errors);
    const data = parse.data;

    const account = await this.aRepo.findAccountByIdForUser(data.investmentAccountId, portfolioId, userId);
    if (!account) throw new NotFoundError(`Investment account '${data.investmentAccountId}' not found in portfolio`);

    const amt = toDecimal(data.amount);

    return this.prisma.$transaction(async (tx) => {
      if (data.referenceId) {
        const existingTx = await tx.investmentTransaction.findUnique({
          where: { referenceId: data.referenceId },
          include: { security: true, investmentAccount: true },
        });
        if (existingTx) return existingTx;
      }

      // Update cash
      const currentCash = toDecimal(portfolio.cashBalance.toString());
      const newCash = currentCash.plus(amt);
      await tx.portfolio.update({
        where: { id: portfolioId },
        data: { cashBalance: new Prisma.Decimal(newCash.toString()) },
      });

      const transaction = await tx.investmentTransaction.create({
        data: {
          userId,
          portfolioId,
          investmentAccountId: data.investmentAccountId,
          type: 'DEPOSIT',
          totalAmount: new Prisma.Decimal(amt.toString()),
          currency: portfolio.baseCurrency,
          transactionDate: data.transactionDate ? new Date(data.transactionDate) : new Date(),
          description: data.description || null,
          referenceId: data.referenceId || null,
        },
        include: { security: true, investmentAccount: true },
      });

      try {
        const corrId = correlationId || randomUUID();
        await this.publisher.publish({
          exchange: 'amq.direct',
          routingKey: 'investment.deposit.created',
          correlationId: corrId,
          message: {
            eventId: randomUUID(),
            eventType: 'investment.deposit.created',
            userId,
            portfolioId,
            transactionId: transaction.id,
            timestamp: new Date().toISOString(),
            correlationId: corrId,
          },
        });
      } catch (err) {
        getLogger().warn({ err, transactionId: transaction.id }, 'Failed to publish investment.deposit.created event');
      }

      return transaction;
    });
  }

  // WITHDRAWAL TRANSACTION
  public async executeWithdrawal(portfolioId: string, userId: string, rawInput: unknown, correlationId?: string) {
    const portfolio = await this.pRepo.findPortfolioByIdForUser(portfolioId, userId);
    if (!portfolio) throw new NotFoundError(`Portfolio '${portfolioId}' not found`);

    const parse = withdrawalTransactionSchema.safeParse(rawInput);
    if (!parse.success) throw new ValidationError('Invalid withdrawal transaction parameters', parse.error.errors);
    const data = parse.data;

    const account = await this.aRepo.findAccountByIdForUser(data.investmentAccountId, portfolioId, userId);
    if (!account) throw new NotFoundError(`Investment account '${data.investmentAccountId}' not found in portfolio`);

    const amt = toDecimal(data.amount);
    const currentCash = toDecimal(portfolio.cashBalance.toString());
    if (currentCash.lessThan(amt)) {
      throw new ValidationError(`Insufficient cash balance (${currentCash.toString()} ${portfolio.baseCurrency}) for withdrawal (${amt.toString()} ${portfolio.baseCurrency})`);
    }

    return this.prisma.$transaction(async (tx) => {
      if (data.referenceId) {
        const existingTx = await tx.investmentTransaction.findUnique({
          where: { referenceId: data.referenceId },
          include: { security: true, investmentAccount: true },
        });
        if (existingTx) return existingTx;
      }

      const newCash = currentCash.minus(amt);
      await tx.portfolio.update({
        where: { id: portfolioId },
        data: { cashBalance: new Prisma.Decimal(newCash.toString()) },
      });

      const transaction = await tx.investmentTransaction.create({
        data: {
          userId,
          portfolioId,
          investmentAccountId: data.investmentAccountId,
          type: 'WITHDRAWAL',
          totalAmount: new Prisma.Decimal(amt.toString()),
          currency: portfolio.baseCurrency,
          transactionDate: data.transactionDate ? new Date(data.transactionDate) : new Date(),
          description: data.description || null,
          referenceId: data.referenceId || null,
        },
        include: { security: true, investmentAccount: true },
      });

      try {
        const corrId = correlationId || randomUUID();
        await this.publisher.publish({
          exchange: 'amq.direct',
          routingKey: 'investment.withdrawal.created',
          correlationId: corrId,
          message: {
            eventId: randomUUID(),
            eventType: 'investment.withdrawal.created',
            userId,
            portfolioId,
            transactionId: transaction.id,
            timestamp: new Date().toISOString(),
            correlationId: corrId,
          },
        });
      } catch (err) {
        getLogger().warn({ err, transactionId: transaction.id }, 'Failed to publish investment.withdrawal.created event');
      }

      return transaction;
    });
  }

  // LIST & GET TRANSACTIONS
  public async listTransactions(portfolioId: string, userId: string, rawQuery: unknown) {
    const portfolio = await this.pRepo.findPortfolioByIdForUser(portfolioId, userId);
    if (!portfolio) throw new NotFoundError(`Portfolio '${portfolioId}' not found`);

    const parse = transactionQuerySchema.safeParse(rawQuery);
    if (!parse.success) throw new ValidationError('Invalid transaction query parameters', parse.error.errors);
    const query = parse.data;

    const [items, total] = await Promise.all([
      this.repository.findTransactionsForPortfolio(portfolioId, userId, query),
      this.repository.countTransactionsForPortfolio(portfolioId, userId, query),
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

  public async getTransactionDetail(portfolioId: string, transactionId: string, userId: string) {
    const transaction = await this.repository.findTransactionByIdForUser(transactionId, portfolioId, userId);
    if (!transaction) {
      throw new NotFoundError(`Transaction '${transactionId}' not found for portfolio '${portfolioId}'`);
    }
    return transaction;
  }
}

export const transactionService = new TransactionService();
