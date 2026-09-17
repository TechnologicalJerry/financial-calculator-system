import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Report & Analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get()
  @ApiOperation({ summary: 'Get summary dashboard metrics' })
  getDashboardMetrics(@CurrentUser('userId') userId: string) {
    return this.analyticsService.getDashboardMetrics(userId);
  }

  @Get('dashboard')
  getLegacyDashboardMetrics(@CurrentUser('userId') userId: string) {
    return this.analyticsService.getDashboardMetrics(userId);
  }
}
