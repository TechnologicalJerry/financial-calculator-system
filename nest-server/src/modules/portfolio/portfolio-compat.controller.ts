import { Body, Controller, Delete, Get, Inject, NotFoundException, Param, Post, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../../prisma/prisma.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ApiResponse } from '../../common/dto/api-response.dto';
import { AddInvestmentHoldingDto, CreateInvestmentAccountDto } from './dto/investment.dto';

@ApiTags('Investment Portfolios')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1')
export class PortfolioCompatController {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  private async portfolio(id: string, userId: string) {
    const portfolio = await this.prisma.portfolio.findFirst({ where: { id, userId } });
    if (!portfolio) throw new NotFoundException('Portfolio not found');
    return portfolio;
  }

  @Get('portfolios/:id')
  async getPortfolio(@Param('id') id: string, @CurrentUser('userId') userId: string) {
    await this.portfolio(id, userId);
    return ApiResponse.ok(
      await this.prisma.portfolio.findUnique({
        where: { id },
        include: { assets: true, liabilities: true, goals: true, budgets: { include: { categories: true } } },
      }),
    );
  }

  @Put('portfolios/:id')
  async updatePortfolio(@Param('id') id: string, @CurrentUser('userId') userId: string, @Body() body: any) {
    await this.portfolio(id, userId);
    return ApiResponse.ok(
      await this.prisma.portfolio.update({
        where: { id },
        data: { name: body.name, type: body.type, currency: body.currency },
      }),
    );
  }

  @Delete('portfolios/:id')
  async deletePortfolio(@Param('id') id: string, @CurrentUser('userId') userId: string) {
    await this.portfolio(id, userId);
    await this.prisma.portfolio.delete({ where: { id } });
    return ApiResponse.ok(null, 'Portfolio deleted');
  }

  @Get('net-worth/portfolio/:portfolioId')
  async netWorth(@Param('portfolioId') id: string, @CurrentUser('userId') userId: string) {
    await this.portfolio(id, userId);
    const [assets, liabilities, snapshots] = await Promise.all([
      this.prisma.portfolioAsset.findMany({ where: { portfolioId: id } }),
      this.prisma.portfolioLiability.findMany({ where: { portfolioId: id } }),
      this.prisma.netWorthSnapshot.findMany({ where: { portfolioId: id }, orderBy: { snapshotDate: 'asc' } }),
    ]);
    const totalAssets = assets.reduce((sum, a) => sum + Number(a.currentValue), 0);
    const totalLiabilities = liabilities.reduce((sum, l) => sum + Number(l.outstandingAmount), 0);
    return ApiResponse.ok({ totalAssets, totalLiabilities, netWorth: totalAssets - totalLiabilities, snapshots });
  }

  @Post('portfolios/:portfolioId/assets')
  async addAsset(@Param('portfolioId') portfolioId: string, @CurrentUser('userId') userId: string, @Body() body: any) {
    await this.portfolio(portfolioId, userId);
    return ApiResponse.ok(
      await this.prisma.portfolioAsset.create({
        data: { portfolioId, name: body.name, assetType: body.assetType, currentValue: body.currentValue },
      }),
    );
  }

  @Get('portfolios/:portfolioId/assets')
  async assets(@Param('portfolioId') portfolioId: string, @CurrentUser('userId') userId: string) {
    await this.portfolio(portfolioId, userId);
    return ApiResponse.ok(await this.prisma.portfolioAsset.findMany({ where: { portfolioId } }));
  }

  @Post('portfolios/:portfolioId/liabilities')
  async addLiability(@Param('portfolioId') portfolioId: string, @CurrentUser('userId') userId: string, @Body() body: any) {
    await this.portfolio(portfolioId, userId);
    return ApiResponse.ok(
      await this.prisma.portfolioLiability.create({
        data: { portfolioId, name: body.name, liabilityType: body.liabilityType, outstandingAmount: body.outstandingAmount },
      }),
    );
  }

  @Get('portfolios/:portfolioId/liabilities')
  async liabilities(@Param('portfolioId') portfolioId: string, @CurrentUser('userId') userId: string) {
    await this.portfolio(portfolioId, userId);
    return ApiResponse.ok(await this.prisma.portfolioLiability.findMany({ where: { portfolioId } }));
  }

  @Post('transactions')
  async createTransaction(@CurrentUser('userId') userId: string, @Body() body: any) {
    await this.portfolio(body.portfolioId, userId);
    return ApiResponse.ok(
      await this.prisma.transaction.create({
        data: {
          portfolioId: body.portfolioId,
          transactionType: body.transactionType,
          amount: body.amount,
          category: body.category,
          description: body.description,
          transactionDate: new Date(body.transactionDate),
        },
      }),
    );
  }

  @Get('transactions/portfolio/:portfolioId')
  async portfolioTransactions(@Param('portfolioId') portfolioId: string, @CurrentUser('userId') userId: string) {
    await this.portfolio(portfolioId, userId);
    return ApiResponse.ok(
      await this.prisma.transaction.findMany({ where: { portfolioId }, orderBy: { transactionDate: 'desc' } }),
    );
  }

  @Get('transactions')
  async transactions(@CurrentUser('userId') userId: string) {
    return ApiResponse.ok(
      await this.prisma.transaction.findMany({ where: { portfolio: { userId } }, orderBy: { transactionDate: 'desc' } }),
    );
  }

  @Post('goals')
  async createGoal(@CurrentUser('userId') userId: string, @Body() body: any) {
    await this.portfolio(body.portfolioId, userId);
    return ApiResponse.ok(
      await this.prisma.financialGoal.create({
        data: {
          portfolioId: body.portfolioId,
          name: body.name,
          targetAmount: body.targetAmount,
          currentAmount: body.currentAmount ?? 0,
          deadline: body.deadline ? new Date(body.deadline) : null,
          status: body.status,
        },
      }),
    );
  }

  @Get('goals/portfolio/:portfolioId')
  async goals(@Param('portfolioId') portfolioId: string, @CurrentUser('userId') userId: string) {
    await this.portfolio(portfolioId, userId);
    return ApiResponse.ok(await this.prisma.financialGoal.findMany({ where: { portfolioId }, include: { milestones: true } }));
  }

  @Get('goals')
  async allGoals(@CurrentUser('userId') userId: string) {
    return ApiResponse.ok(await this.prisma.financialGoal.findMany({ where: { portfolio: { userId } }, include: { milestones: true } }));
  }

  @Put('goals/:id/progress')
  async goalProgress(@Param('id') id: string, @CurrentUser('userId') userId: string, @Body() body: any) {
    const goal = await this.prisma.financialGoal.findFirst({ where: { id, portfolio: { userId } } });
    if (!goal) throw new NotFoundException('Goal not found');
    return ApiResponse.ok(await this.prisma.financialGoal.update({ where: { id }, data: { currentAmount: body.currentAmount, status: body.status } }));
  }

  @Post('budgets')
  async createBudget(@CurrentUser('userId') userId: string, @Body() body: any) {
    await this.portfolio(body.portfolioId, userId);
    return ApiResponse.ok(
      await this.prisma.budget.create({
        data: {
          portfolioId: body.portfolioId,
          name: body.name,
          totalLimit: body.totalLimit,
          startDate: new Date(body.startDate),
          endDate: new Date(body.endDate),
          categories: body.categories ? { create: body.categories.map((c: any) => ({ categoryName: c.categoryName, allocatedAmount: c.allocatedAmount })) } : undefined,
        },
        include: { categories: true },
      }),
    );
  }

  @Get('budgets/portfolio/:portfolioId')
  async budgets(@Param('portfolioId') portfolioId: string, @CurrentUser('userId') userId: string) {
    await this.portfolio(portfolioId, userId);
    return ApiResponse.ok(await this.prisma.budget.findMany({ where: { portfolioId }, include: { categories: true } }));
  }

  @Get('budgets')
  async allBudgets(@CurrentUser('userId') userId: string) {
    return ApiResponse.ok(await this.prisma.budget.findMany({ where: { portfolio: { userId } }, include: { categories: true } }));
  }

  @Get('assets-liabilities')
  async assetsLiabilities(@CurrentUser('userId') userId: string) {
    const [assets, liabilities] = await Promise.all([
      this.prisma.portfolioAsset.findMany({ where: { portfolio: { userId } } }),
      this.prisma.portfolioLiability.findMany({ where: { portfolio: { userId } } }),
    ]);
    return ApiResponse.ok([...assets, ...liabilities]);
  }

  @Post('assets-liabilities')
  async createAssetOrLiability(@CurrentUser('userId') userId: string, @Body() body: any) {
    if (body.type === 'LIABILITY' || body.outstandingAmount !== undefined) {
      return ApiResponse.ok(
        await this.prisma.portfolioLiability.create({
          data: { portfolioId: body.portfolioId, name: body.name, liabilityType: body.liabilityType ?? 'LOAN', outstandingAmount: body.outstandingAmount ?? body.value ?? 0 },
        }),
      );
    }
    return ApiResponse.ok(
      await this.prisma.portfolioAsset.create({
        data: { portfolioId: body.portfolioId, name: body.name, assetType: body.assetType ?? 'CASH', currentValue: body.currentValue ?? body.value ?? 0 },
      }),
    );
  }

  @Delete('assets-liabilities/:id')
  async deleteAssetOrLiability(@Param('id') id: string, @CurrentUser('userId') userId: string) {
    await this.prisma.portfolioAsset.deleteMany({ where: { id, portfolio: { userId } } });
    await this.prisma.portfolioLiability.deleteMany({ where: { id, portfolio: { userId } } });
    return ApiResponse.ok(null, 'Asset/Liability deleted');
  }

  // --- Investment persistent endpoints ---

  @Post('investments/accounts')
  @ApiOperation({ summary: 'Create investment account' })
  async createAccount(@CurrentUser('userId') userId: string, @Body() dto: CreateInvestmentAccountDto) {
    if (dto.portfolioId) await this.portfolio(dto.portfolioId, userId);
    const account = await this.prisma.investmentAccount.create({
      data: {
        userId,
        portfolioId: dto.portfolioId,
        accountName: dto.accountName,
        accountType: dto.accountType,
        institutionName: dto.institutionName,
        accountNumberMasked: dto.accountNumberMasked,
        balance: dto.balance ?? 0,
        currency: dto.currency ?? 'USD',
      },
    });
    return ApiResponse.ok(account);
  }

  @Get('investments/accounts')
  @ApiOperation({ summary: 'List user investment accounts' })
  async listAccounts(@CurrentUser('userId') userId: string) {
    const accounts = await this.prisma.investmentAccount.findMany({
      where: { userId },
      include: { holdings: true },
    });
    return ApiResponse.ok(accounts);
  }

  @Post('investments/holdings')
  @ApiOperation({ summary: 'Add holding to investment account' })
  async addHolding(@CurrentUser('userId') userId: string, @Body() dto: AddInvestmentHoldingDto) {
    const account = await this.prisma.investmentAccount.findFirst({
      where: { id: dto.accountId, userId },
    });
    if (!account) throw new NotFoundException('Investment account not found');

    const currentValue = dto.quantity * dto.currentPrice;
    const holding = await this.prisma.investmentHolding.create({
      data: {
        accountId: dto.accountId,
        symbol: dto.symbol,
        name: dto.name,
        assetClass: dto.assetClass,
        quantity: dto.quantity,
        costBasis: dto.costBasis,
        currentPrice: dto.currentPrice,
        currentValue,
      },
    });
    return ApiResponse.ok(holding);
  }

  @Get('investments/accounts/:accountId/holdings')
  @ApiOperation({ summary: 'Get holdings for investment account' })
  async holdings(@Param('accountId') accountId: string, @CurrentUser('userId') userId: string) {
    const account = await this.prisma.investmentAccount.findFirst({
      where: { id: accountId, userId },
    });
    if (!account) throw new NotFoundException('Investment account not found');

    const holdings = await this.prisma.investmentHolding.findMany({
      where: { accountId },
    });
    return ApiResponse.ok(holdings);
  }
}
