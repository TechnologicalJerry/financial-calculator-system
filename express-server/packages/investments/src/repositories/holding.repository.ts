import { getPrismaClient } from '@packages/database';
import { Prisma } from '@prisma/client';

export interface FindHoldingsOptions {
  page: number;
  limit: number;
  investmentAccountId?: string | undefined;
  securityId?: string | undefined;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export interface CountHoldingsOptions {
  investmentAccountId?: string | undefined;
  securityId?: string | undefined;
}

export class HoldingRepository {
  private get prisma() {
    return getPrismaClient();
  }

  public async findHoldingByIdForUser(id: string, portfolioId: string, userId: string) {
    return this.prisma.holding.findFirst({
      where: {
        id,
        portfolioId,
        portfolio: { userId },
      },
      include: {
        security: {
          include: {
            prices: {
              orderBy: { priceDate: 'desc' },
              take: 1,
            },
          },
        },
        investmentAccount: true,
      },
    });
  }

  public async findHoldingsForPortfolio(portfolioId: string, userId: string, options: FindHoldingsOptions) {
    const where: Prisma.HoldingWhereInput = {
      portfolioId,
      portfolio: { userId },
    };

    if (options.investmentAccountId) where.investmentAccountId = options.investmentAccountId;
    if (options.securityId) where.securityId = options.securityId;

    const skip = (options.page - 1) * options.limit;
    const orderBy = { [options.sortBy]: options.sortOrder };

    return this.prisma.holding.findMany({
      where,
      skip,
      take: options.limit,
      orderBy,
      include: {
        security: {
          include: {
            prices: {
              orderBy: { priceDate: 'desc' },
              take: 1,
            },
          },
        },
        investmentAccount: true,
      },
    });
  }

  public async countHoldingsForPortfolio(portfolioId: string, userId: string, options: CountHoldingsOptions) {
    const where: Prisma.HoldingWhereInput = {
      portfolioId,
      portfolio: { userId },
    };

    if (options.investmentAccountId) where.investmentAccountId = options.investmentAccountId;
    if (options.securityId) where.securityId = options.securityId;

    return this.prisma.holding.count({ where });
  }
}

export const holdingRepository = new HoldingRepository();
