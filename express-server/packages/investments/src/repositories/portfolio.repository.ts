import { getPrismaClient } from '@packages/database';
import { Prisma, PortfolioStatus } from '@prisma/client';

export interface CreatePortfolioData {
  userId: string;
  name: string;
  description?: string | undefined;
  baseCurrency?: string | undefined;
  status?: PortfolioStatus | undefined;
}

export interface FindPortfoliosOptions {
  page: number;
  limit: number;
  status?: PortfolioStatus | undefined;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export interface CountPortfoliosOptions {
  status?: PortfolioStatus | undefined;
}

export class PortfolioRepository {
  private get prisma() {
    return getPrismaClient();
  }

  public async createPortfolio(data: CreatePortfolioData) {
    return this.prisma.portfolio.create({
      data: {
        userId: data.userId,
        name: data.name,
        description: data.description || null,
        baseCurrency: (data.baseCurrency || 'USD').toUpperCase(),
        status: data.status || 'ACTIVE',
        cashBalance: new Prisma.Decimal('0.00'),
      },
    });
  }

  public async findPortfolioByIdForUser(id: string, userId: string) {
    return this.prisma.portfolio.findFirst({
      where: { id, userId },
      include: {
        accounts: true,
        holdings: {
          include: {
            security: {
              include: {
                prices: {
                  orderBy: { priceDate: 'desc' },
                  take: 1,
                },
              },
            },
          },
        },
      },
    });
  }

  public async findPortfoliosForUser(userId: string, options: FindPortfoliosOptions) {
    const where: Prisma.PortfolioWhereInput = { userId };
    if (options.status) where.status = options.status;

    const skip = (options.page - 1) * options.limit;
    const orderBy = { [options.sortBy]: options.sortOrder };

    return this.prisma.portfolio.findMany({
      where,
      skip,
      take: options.limit,
      orderBy,
      include: {
        accounts: true,
      },
    });
  }

  public async countPortfoliosForUser(userId: string, options: CountPortfoliosOptions) {
    const where: Prisma.PortfolioWhereInput = { userId };
    if (options.status) where.status = options.status;

    return this.prisma.portfolio.count({ where });
  }

  public async updatePortfolioForUser(
    id: string,
    userId: string,
    data: Prisma.PortfolioUpdateInput,
  ) {
    const existing = await this.findPortfolioByIdForUser(id, userId);
    if (!existing) return null;

    return this.prisma.portfolio.update({
      where: { id },
      data,
    });
  }

  public async deletePortfolioForUser(id: string, userId: string) {
    const existing = await this.findPortfolioByIdForUser(id, userId);
    if (!existing) return null;

    return this.prisma.portfolio.delete({
      where: { id },
    });
  }
}

export const portfolioRepository = new PortfolioRepository();
