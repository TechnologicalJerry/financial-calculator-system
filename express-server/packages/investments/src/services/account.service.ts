import { NotFoundError, ValidationError } from '@packages/errors';
import { Prisma } from '@prisma/client';
import { accountRepository, AccountRepository } from '../repositories/account.repository.js';
import { portfolioRepository, PortfolioRepository } from '../repositories/portfolio.repository.js';
import {
  createAccountSchema,
  updateAccountSchema,
  accountQuerySchema,
} from '../schemas/investment.schemas.js';

export class AccountService {
  constructor(
    private repository: AccountRepository = accountRepository,
    private pRepo: PortfolioRepository = portfolioRepository,
  ) {}

  public async createAccount(portfolioId: string, userId: string, rawInput: unknown) {
    const portfolio = await this.pRepo.findPortfolioByIdForUser(portfolioId, userId);
    if (!portfolio) {
      throw new NotFoundError(`Portfolio '${portfolioId}' not found`);
    }

    const parse = createAccountSchema.safeParse(rawInput);
    if (!parse.success) {
      throw new ValidationError('Invalid investment account creation parameters', parse.error.errors);
    }
    const data = parse.data;

    if (data.currency && data.currency !== portfolio.baseCurrency) {
      throw new ValidationError(`Account currency '${data.currency}' does not match portfolio base currency '${portfolio.baseCurrency}'`);
    }

    return this.repository.createAccount({
      portfolioId,
      userId,
      name: data.name,
      accountType: data.accountType,
      brokerName: data.brokerName,
      accountNumberMasked: data.accountNumberMasked,
      currency: portfolio.baseCurrency,
      status: data.status,
    });
  }

  public async listAccounts(portfolioId: string, userId: string, rawQuery: unknown) {
    const portfolio = await this.pRepo.findPortfolioByIdForUser(portfolioId, userId);
    if (!portfolio) {
      throw new NotFoundError(`Portfolio '${portfolioId}' not found`);
    }

    const parse = accountQuerySchema.safeParse(rawQuery);
    if (!parse.success) {
      throw new ValidationError('Invalid account query parameters', parse.error.errors);
    }
    const query = parse.data;

    const [items, total] = await Promise.all([
      this.repository.findAccountsForPortfolio(portfolioId, userId, query),
      this.repository.countAccountsForPortfolio(portfolioId, userId, query),
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

  public async getAccountDetail(portfolioId: string, accountId: string, userId: string) {
    const account = await this.repository.findAccountByIdForUser(accountId, portfolioId, userId);
    if (!account) {
      throw new NotFoundError(`Investment account '${accountId}' not found for portfolio '${portfolioId}'`);
    }
    return account;
  }

  public async updateAccount(
    portfolioId: string,
    accountId: string,
    userId: string,
    rawInput: unknown,
  ) {
    const parse = updateAccountSchema.safeParse(rawInput);
    if (!parse.success) {
      throw new ValidationError('Invalid account update parameters', parse.error.errors);
    }
    const data = parse.data;

    const updateData: Prisma.InvestmentAccountUpdateInput = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.accountType !== undefined) updateData.accountType = data.accountType;
    if (data.brokerName !== undefined) updateData.brokerName = data.brokerName;
    if (data.accountNumberMasked !== undefined) updateData.accountNumberMasked = data.accountNumberMasked;
    if (data.currency !== undefined) updateData.currency = data.currency;
    if (data.status !== undefined) updateData.status = data.status;

    const updated = await this.repository.updateAccountForUser(accountId, portfolioId, userId, updateData);
    if (!updated) {
      throw new NotFoundError(`Investment account '${accountId}' not found for portfolio '${portfolioId}'`);
    }
    return updated;
  }

  public async deleteAccount(portfolioId: string, accountId: string, userId: string) {
    const deleted = await this.repository.deleteAccountForUser(accountId, portfolioId, userId);
    if (!deleted) {
      throw new NotFoundError(`Investment account '${accountId}' not found for portfolio '${portfolioId}'`);
    }
    return { id: accountId, deleted: true };
  }
}

export const accountService = new AccountService();
