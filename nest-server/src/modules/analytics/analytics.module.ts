import { Module } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { DashboardController } from './dashboard.controller';
import { ReportController } from './report.controller';
import { HistoryController } from './history.controller';
import { FavoriteController } from './favorite.controller';
import { AnalyticsController } from './analytics.controller';

@Module({
  controllers: [
    DashboardController,
    ReportController,
    HistoryController,
    FavoriteController,
    AnalyticsController,
  ],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
