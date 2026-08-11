import { getPrismaClient } from '@packages/database';
import { NotFoundError } from '@packages/errors';
import { EventPublisher } from '@packages/messaging';
import { Decimal } from '@prisma/client/runtime/library';

export interface UpdateProfileDto {
  currency?: string;
  country?: string;
  monthlyIncome?: number | string;
  monthlyExpenses?: number | string;
  riskTolerance?: 'LOW' | 'MEDIUM' | 'HIGH';
  financialGoalSummary?: string | null;
}

export class FinancialProfileService {
  private prisma = getPrismaClient();
  private publisher = new EventPublisher();

  public async getProfile(userId: string) {
    const profile = await this.prisma.financialProfile.findUnique({
      where: { userId },
    });

    const preferences = await this.prisma.financialPreferences.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundError('Financial profile not found');
    }

    return {
      profile: this.formatProfile(profile),
      preferences,
    };
  }

  public async updateProfile(userId: string, dto: UpdateProfileDto) {
    const existing = await this.prisma.financialProfile.findUnique({
      where: { userId },
    });

    if (!existing) {
      throw new NotFoundError('Financial profile not found');
    }

    const updated = await this.prisma.financialProfile.update({
      where: { userId },
      data: {
        ...(dto.currency ? { currency: dto.currency } : {}),
        ...(dto.country ? { country: dto.country } : {}),
        ...(dto.monthlyIncome !== undefined ? { monthlyIncome: new Decimal(dto.monthlyIncome) } : {}),
        ...(dto.monthlyExpenses !== undefined ? { monthlyExpenses: new Decimal(dto.monthlyExpenses) } : {}),
        ...(dto.riskTolerance ? { riskTolerance: dto.riskTolerance } : {}),
        ...(dto.financialGoalSummary !== undefined ? { financialGoalSummary: dto.financialGoalSummary } : {}),
      },
    });

    this.publisher
      .publish({
        exchange: 'amq.direct',
        routingKey: 'financial.profile.updated',
        message: { userId, updatedAt: updated.updatedAt },
      })
      .catch(() => {});

    return this.formatProfile(updated);
  }

  private formatProfile(profile: {
    id: string;
    userId: string;
    currency: string;
    country: string;
    monthlyIncome: Decimal;
    monthlyExpenses: Decimal;
    riskTolerance: string;
    financialGoalSummary: string | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: profile.id,
      userId: profile.userId,
      currency: profile.currency,
      country: profile.country,
      monthlyIncome: profile.monthlyIncome.toString(),
      monthlyExpenses: profile.monthlyExpenses.toString(),
      riskTolerance: profile.riskTolerance,
      financialGoalSummary: profile.financialGoalSummary,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    };
  }
}
