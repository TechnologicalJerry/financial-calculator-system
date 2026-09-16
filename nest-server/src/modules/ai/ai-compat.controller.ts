import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiResponse } from '../../common/dto/api-response.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AiService } from './ai.service';
import { GenerateInsightDto, SendChatMessageDto } from './dto/ai.dto';

@ApiTags('AI Assistant & Copilot')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1')
export class AiCompatController {
  constructor(private readonly ai: AiService) {}

  @Post('ai/chat')
  @ApiOperation({ summary: 'Send message to AI financial advisor' })
  chat(@CurrentUser('userId') userId: string, @Body() dto: SendChatMessageDto) {
    return this.ai.processChat(userId, dto);
  }

  @Get('ai/chat/conversations')
  @ApiOperation({ summary: 'List user AI chat conversations' })
  conversations(@CurrentUser('userId') userId: string) {
    return this.ai.getConversations(userId);
  }

  @Get('ai/chat/conversations/:conversationId/messages')
  @ApiOperation({ summary: 'Get messages for a conversation' })
  messages(@CurrentUser('userId') userId: string, @Param('conversationId') conversationId: string) {
    return this.ai.getMessages(userId, conversationId);
  }

  @Post('insights/generate')
  @ApiOperation({ summary: 'Generate AI financial insights' })
  insights(@CurrentUser('userId') userId: string, @Body() dto: GenerateInsightDto) {
    return this.ai.generateInsights(userId, dto);
  }

  @Get('insights')
  @ApiOperation({ summary: 'Get AI financial insights' })
  getInsights(@CurrentUser('userId') userId: string) {
    return this.ai.getInsights(userId);
  }

  @Get('prompts')
  @ApiOperation({ summary: 'List available AI prompt templates' })
  prompts() {
    return ApiResponse.ok([
      { name: 'retirement_planning', category: 'RETIREMENT' },
      { name: 'tax_optimization', category: 'TAX' },
      { name: 'debt_snowball', category: 'DEBT' },
    ]);
  }

  @Get('prompts/:name')
  @ApiOperation({ summary: 'Get AI prompt template details' })
  prompt(@Param('name') name: string) {
    return ApiResponse.ok({ name, template: `System prompt for ${name}` });
  }

  @Post('health-score/evaluate')
  @ApiOperation({ summary: 'Evaluate user financial health score' })
  evaluate(@CurrentUser('userId') userId: string) {
    return this.ai.getFinancialHealthScore(userId);
  }

  @Get('health-score')
  @ApiOperation({ summary: 'Get user financial health score' })
  health(@CurrentUser('userId') userId: string) {
    return this.ai.getFinancialHealthScore(userId);
  }
}
