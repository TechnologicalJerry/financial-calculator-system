import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('AI Smart Insights')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Get('health-score')
  @ApiOperation({ summary: 'Get AI Financial Health Score & Assessment' })
  getHealthScore(@CurrentUser('userId') userId: string) {
    return this.aiService.getFinancialHealthScore(userId);
  }
}
