import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { PortfolioService } from './portfolio.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Portfolio & Wealth Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/portfolios')
export class PortfolioController {
  constructor(private readonly portfolioService: PortfolioService) {}

  @Get()
  @ApiOperation({ summary: 'List user portfolios with assets and liabilities' })
  getPortfolios(@CurrentUser('userId') userId: string) {
    return this.portfolioService.getUserPortfolios(userId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new portfolio' })
  createPortfolio(@CurrentUser('userId') userId: string, @Body() data: any) {
    return this.portfolioService.createPortfolio(userId, data);
  }
}
