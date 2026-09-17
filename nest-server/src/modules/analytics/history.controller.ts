import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, Inject } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { BatchDeleteHistoryDto, SearchHistoryDto } from './dto/history-report.dto';

@ApiTags('Analytics & Insights')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/history')
export class HistoryController {
  constructor(@Inject(AnalyticsService) private readonly analyticsService: AnalyticsService) {}

  @Get()
  @ApiOperation({ summary: 'Get calculation history' })
  getHistory(@CurrentUser('userId') userId: string) {
    return this.analyticsService.getHistory(userId);
  }

  @Post('search')
  @ApiOperation({ summary: 'Search calculation history logs' })
  searchHistory(@CurrentUser('userId') userId: string, @Body() dto: SearchHistoryDto) {
    return this.analyticsService.searchHistory(userId, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get specific calculation history record' })
  getHistoryById(@CurrentUser('userId') userId: string, @Param('id') id: string) {
    return this.analyticsService.getHistoryById(userId, id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete calculation history log' })
  deleteHistory(@CurrentUser('userId') userId: string, @Param('id') id: string) {
    return this.analyticsService.deleteHistory(userId, id);
  }

  @Put(':id/archive')
  @ApiOperation({ summary: 'Archive calculation history record' })
  archive(@CurrentUser('userId') userId: string, @Param('id') id: string) {
    return this.analyticsService.archiveHistory(userId, id);
  }

  @Put(':id/pin')
  @ApiOperation({ summary: 'Pin calculation history record' })
  pin(@CurrentUser('userId') userId: string, @Param('id') id: string) {
    return this.analyticsService.pinHistory(userId, id);
  }

  @Put(':id/restore')
  @ApiOperation({ summary: 'Restore archived calculation history record' })
  restore(@CurrentUser('userId') userId: string, @Param('id') id: string) {
    return this.analyticsService.restoreHistory(userId, id);
  }

  @Post('batch-delete')
  @ApiOperation({ summary: 'Batch delete calculation history logs' })
  async batchDelete(@CurrentUser('userId') userId: string, @Body() dto: BatchDeleteHistoryDto) {
    await Promise.all((dto.ids ?? []).map((id) => this.analyticsService.deleteHistory(userId, id)));
    return { success: true, message: 'History entries deleted' };
  }

  @Post(':id/duplicate')
  @ApiOperation({ summary: 'Duplicate calculation history log' })
  duplicate(@CurrentUser('userId') userId: string, @Param('id') id: string) {
    return this.analyticsService.duplicateHistory(userId, id);
  }
}
