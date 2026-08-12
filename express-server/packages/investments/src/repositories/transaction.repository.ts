import { getPrismaClient } from '@packages/database';
import { Prisma, InvestmentTransactionType } from '@prisma/client';

export interface FindTransactionsOptions {
  page: number;
  limit: number;
  type?: InvestmentTransactionType | undefined;
  securityId?: string | undefined;
  investmentAccountId?: string | undefined;
  fromDate?: string | undefined;
  toDate?: string | undefined;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export interface CountTransactionsOptions {
  type?: InvestmentTransactionType | undefined;
  securityId?: string | undefined;
  investmentAccountId?: string | undefined;
  fromDate?: string | undefined;
  toDate?: string | undefined;
}

export class TransactionRepository {
  private get prisma() {
    return getPrismaClient();
  }

  public async findTransactionByIdForUser(id: string, portfolioId: string, userId: string) {
    return this.prisma.investmentTransaction.findFirst({
      where: { id, portfolioId, userId },
      include: {
        security: true,
        investmentAccount: true,
      },
    });
  }

  public async findTransactionsForPortfolio(portfolioId: string, userId: string, options: FindTransactionsOptions) {
    const where: Prisma.InvestmentTransactionWhereInput = { portfolioId, userId };
    if (options.type) where.type = options.type;
    if (options.securityId) where.securityId = options.securityId;
    if (options.investmentAccountId) where.investmentAccountId = options.investmentAccountId;
    if (options.fromDate || options.toDate) {
      where.transactionDate = {};
      if (options.fromDate) where.transactionDate.gte = new Date(options.fromDate);
      if (options.toDate) where.transactionDate.lte = new Date(options.toDate);
    }

    const skip = (options.page - 1) * options.limit;
    const orderBy = { [options.sortBy]: options.sortOrder };

    return this.prisma.investmentTransaction.findMany({
      where,
      skip,
      take: options.limit,
      orderBy,
      include: {
        security: true,
        investmentAccount: true,
      },
    });
  }

  public async countTransactionsForPortfolio(portfolioId: string, userId: string, options: CountTransactionsOptions) {
    const where: Prisma.InvestmentTransactionWhereInput = { portfolioId, userId };
    if (options.type) where.type = options.type;
    if (options.securityId) where.securityId = options.securityId;
    if (options.investmentAccountId) where.investmentAccountId = options.investmentAccountId;
    if (options.fromDate || options.toDate) {
      where.transactionDate = {};
      if (options.fromDate) where.transactionDate.gte = new Date(options.fromDate);
      if (options.toDate) where.transactionDate.lte = new Date(options.toDate);
    }

    return this.prisma.investmentTransaction.count({ where });
  }
}

export const transactionRepository = new TransactionRepository();
