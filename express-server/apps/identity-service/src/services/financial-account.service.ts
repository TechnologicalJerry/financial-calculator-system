import { getPrismaClient } from '@packages/database';
import { NotFoundError, AuthorizationError, ErrorCode } from '@packages/errors';
import { EventPublisher } from '@packages/messaging';
import { Decimal } from '@prisma/client/runtime/library';
import { AccountType } from '@prisma/client';

export interface CreateAccountDto {
  name: string;
  type: AccountType;
  institutionName?: string | null;
  currency?: string;
  balance?: number | string;
}

export interface UpdateAccountDto {
  name?: string;
  type?: AccountType;
  institutionName?: string | null;
  currency?: string;
  balance?: number | string;
  isActive?: boolean;
}

export class FinancialAccountService {
  private prisma = getPrismaClient();
  private publisher = new EventPublisher();

  public async getAccounts(userId: string) {
    const accounts = await this.prisma.financialAccount.findMany({
      where: { userId, isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    return accounts.map((acc) => this.formatAccount(acc));
  }

  public async getAccountById(userId: string, accountId: string) {
    const account = await this.prisma.financialAccount.findUnique({
      where: { id: accountId },
    });

    if (!account || !account.isActive) {
      throw new NotFoundError('Financial account not found');
    }

    // MANDATORY IDOR PROTECTION
    if (account.userId !== userId) {
      throw new AuthorizationError('Access denied to financial account', ErrorCode.ACCOUNT_ACCESS_DENIED);
    }

    return this.formatAccount(account);
  }

  public async createAccount(userId: string, dto: CreateAccountDto) {
    const created = await this.prisma.financialAccount.create({
      data: {
        userId,
        name: dto.name.trim(),
        type: dto.type,
        institutionName: dto.institutionName ? dto.institutionName.trim() : null,
        currency: dto.currency || 'USD',
        balance: new Decimal(dto.balance ?? 0),
        isActive: true,
      },
    });

    this.publisher
      .publish({
        exchange: 'amq.direct',
        routingKey: 'financial.account.created',
        message: { userId, accountId: created.id, createdAt: created.createdAt },
      })
      .catch(() => {});

    return this.formatAccount(created);
  }

  public async updateAccount(userId: string, accountId: string, dto: UpdateAccountDto) {
    const existing = await this.prisma.financialAccount.findUnique({
      where: { id: accountId },
    });

    if (!existing || !existing.isActive) {
      throw new NotFoundError('Financial account not found');
    }

    // MANDATORY IDOR PROTECTION
    if (existing.userId !== userId) {
      throw new AuthorizationError('Access denied to financial account', ErrorCode.ACCOUNT_ACCESS_DENIED);
    }

    const updated = await this.prisma.financialAccount.update({
      where: { id: accountId },
      data: {
        ...(dto.name ? { name: dto.name.trim() } : {}),
        ...(dto.type ? { type: dto.type } : {}),
        ...(dto.institutionName !== undefined ? { institutionName: dto.institutionName } : {}),
        ...(dto.currency ? { currency: dto.currency } : {}),
        ...(dto.balance !== undefined ? { balance: new Decimal(dto.balance) } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      },
    });

    this.publisher
      .publish({
        exchange: 'amq.direct',
        routingKey: 'financial.account.updated',
        message: { userId, accountId: updated.id, updatedAt: updated.updatedAt },
      })
      .catch(() => {});

    return this.formatAccount(updated);
  }

  public async deleteAccount(userId: string, accountId: string) {
    const existing = await this.prisma.financialAccount.findUnique({
      where: { id: accountId },
    });

    if (!existing || !existing.isActive) {
      throw new NotFoundError('Financial account not found');
    }

    // MANDATORY IDOR PROTECTION
    if (existing.userId !== userId) {
      throw new AuthorizationError('Access denied to financial account', ErrorCode.ACCOUNT_ACCESS_DENIED);
    }

    await this.prisma.financialAccount.update({
      where: { id: accountId },
      data: { isActive: false },
    });

    this.publisher
      .publish({
        exchange: 'amq.direct',
        routingKey: 'financial.account.deleted',
        message: { userId, accountId, deletedAt: new Date() },
      })
      .catch(() => {});

    return { success: true };
  }

  private formatAccount(account: {
    id: string;
    userId: string;
    name: string;
    type: AccountType;
    institutionName: string | null;
    currency: string;
    balance: Decimal;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: account.id,
      userId: account.userId,
      name: account.name,
      type: account.type,
      institutionName: account.institutionName,
      currency: account.currency,
      balance: account.balance.toString(),
      isActive: account.isActive,
      createdAt: account.createdAt,
      updatedAt: account.updatedAt,
    };
  }
}
