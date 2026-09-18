import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ApiResponse } from '../../common/dto/api-response.dto';

@Injectable()
export class PortfolioService {
  constructor(private prisma: PrismaService) {}

  async getUserPortfolios(userId: string) {
    const portfolios = await this.prisma.portfolio.findMany({
      where: { userId },
      include: {
        assets: true,
        liabilities: true,
        goals: true,
      },
    });
    return ApiResponse.ok(portfolios);
  }

  async createPortfolio(userId: string, data: any) {
    const portfolio = await this.prisma.portfolio.create({
      data: {
        userId,
        name: data.name,
        type: data.type || 'PERSONAL',
        currency: data.currency || 'USD',
      },
    });
    return ApiResponse.ok(portfolio, 'Portfolio created successfully');
  }
}
