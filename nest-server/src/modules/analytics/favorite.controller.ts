import { Controller, Get, Post, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Analytics & Insights')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/favorites')
export class FavoriteController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Post()
  @ApiOperation({ summary: 'Add calculation to favorites' })
  addFavorite(@CurrentUser('userId') userId: string, @Body() body: { historyId: string }) {
    return this.analyticsService.addFavorite(userId, body.historyId);
  }

  @Post(':historyId')
  @ApiOperation({ summary: 'Add calculation to favorites via URL parameter' })
  addFavoriteByParam(@CurrentUser('userId') userId: string, @Param('historyId') historyId: string) {
    return this.analyticsService.addFavorite(userId, historyId);
  }

  @Delete(':historyId')
  @ApiOperation({ summary: 'Remove calculation from favorites' })
  removeFavorite(@CurrentUser('userId') userId: string, @Param('historyId') historyId: string) {
    return this.analyticsService.removeFavorite(userId, historyId);
  }

  @Get()
  @ApiOperation({ summary: 'List favorite calculations' })
  getFavorites(@CurrentUser('userId') userId: string) {
    return this.analyticsService.getFavorites(userId);
  }
}
