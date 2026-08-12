import { getPrismaClient } from '@packages/database';
import { Prisma, InvestmentAccountType, InvestmentAccountStatus } from '@prisma/client';

export interface CreateAccountData {
  portfolioId: string;
  userId: string;
  name: string;
  accountType?: InvestmentAccountType | undefined;
  brokerName?: string | undefined;
  accountNumberMasked?: string | undefined;
  currency?: string | undefined;
  status?: InvestmentAccountStatus | undefined;
}

export interface FindAccountsOptions {
  page: number;
  limit: number;
  status?: InvestmentAccountStatus | undefined;
  accountType?: InvestmentAccountType | undefined;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export interface CountAccountsOptions {
  status?: InvestmentAccountStatus | undefined;
  accountType?: InvestmentAccountType | undefined;
}

export class AccountRepository {
  private get prisma() {
    return getPrismaClient();
  }

  public async createAccount(data: CreateAccountData) {
    return this.prisma.investmentAccount.create({
      data: {
        portfolioId: data.portfolioId,
        userId: data.userId,
        name: data.name,
        accountType: data.accountType || 'BROKERAGE',
        brokerName: data.brokerName || null,
        accountNumberMasked: data.accountNumberMasked || null,
        currency: (data.currency || 'USD').toUpperCase(),
        status: data.status || 'ACTIVE',
      },
    });
  }

  public async findAccountByIdForUser(id: string, portfolioId: string, userId: string) {
    return this.prisma.investmentAccount.findFirst({
      where: { id, portfolioId, userId },
    });
  }

  public async findAccountsForPortfolio(portfolioId: string, userId: string, options: FindAccountsOptions) {
    const where: Prisma.InvestmentAccountWhereInput = { portfolioId, userId };
    if (options.status) where.status = options.status;
    if (options.accountType) where.accountType = options.accountType;

    const skip = (options.page - 1) * options.limit;
    const orderBy = { [options.sortBy]: options.sortOrder };

    return this.prisma.investmentAccount.findMany({
      where,
      skip,
      take: options.limit,
      orderBy,
    });
  }

  public async countAccountsForPortfolio(portfolioId: string, userId: string, options: CountAccountsOptions) {
    const where: Prisma.InvestmentAccountWhereInput = { portfolioId, userId };
    if (options.status) where.status = options.status;
    if (options.accountType) where.accountType = options.accountType;

    return this.prisma.investmentAccount.count({ where });
  }

  public async updateAccountForUser(
    id: string,
    portfolioId: string,
    userId: string,
    data: Prisma.InvestmentAccountUpdateInput,
  ) {
    const existing = await this.findAccountByIdForUser(id, portfolioId, userId);
    if (!existing) return null;

    return this.prisma.investmentAccount.update({
      where: { id },
      data,
    });
  }

  public async deleteAccountForUser(id: string, portfolioId: string, userId: string) {
    const existing = await this.findAccountByIdForUser(id, portfolioId, userId);
    if (!existing) return null;

    return this.prisma.investmentAccount.delete({
      where: { id },
    });
  }
}

export const accountRepository = new AccountRepository();
