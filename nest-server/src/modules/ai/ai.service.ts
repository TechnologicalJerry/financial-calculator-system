import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ApiResponse } from '../../common/dto/api-response.dto';
import { GenerateInsightDto, SendChatMessageDto } from './dto/ai.dto';

@Injectable()
export class AiService {
  constructor(private readonly prisma: PrismaService) {}

  async processChat(userId: string, dto: SendChatMessageDto) {
    let conversationId = dto.conversationId;
    if (!conversationId) {
      const conv = await this.prisma.aiConversation.create({
        data: {
          userId,
          title: dto.message.slice(0, 40) || 'Financial Chat',
        },
      });
      conversationId = conv.id;
    } else {
      const conv = await this.prisma.aiConversation.findFirst({
        where: { id: conversationId, userId },
      });
      if (!conv) {
        throw new NotFoundException('Conversation not found');
      }
    }

    // Save user message
    await this.prisma.aiMessage.create({
      data: {
        conversationId,
        role: 'user',
        content: dto.message,
      },
    });

    // Save AI response message
    const aiContent = `Financial AI Assistant response to: "${dto.message}". Consider reviewing your budget and portfolio allocation.`;
    const aiMsg = await this.prisma.aiMessage.create({
      data: {
        conversationId,
        role: 'assistant',
        content: aiContent,
      },
    });

    return ApiResponse.ok({
      conversationId,
      userId,
      message: aiMsg,
    });
  }

  async getConversations(userId: string) {
    const list = await this.prisma.aiConversation.findMany({
      where: { userId },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
    return ApiResponse.ok(list);
  }

  async getMessages(userId: string, conversationId: string) {
    const conv = await this.prisma.aiConversation.findFirst({
      where: { id: conversationId, userId },
    });
    if (!conv) throw new NotFoundException('Conversation not found');

    const messages = await this.prisma.aiMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
    });

    return ApiResponse.ok({ conversationId, messages });
  }

  async generateInsights(userId: string, dto?: GenerateInsightDto) {
    const insight = await this.prisma.aiInsight.create({
      data: {
        userId,
        type: dto?.type || 'FINANCIAL_HEALTH',
        severity: dto?.severity || 'INFO',
        message: dto?.context || 'Maintain emergency reserves equal to 3-6 months of expenses.',
      },
    });
    return ApiResponse.ok([insight]);
  }

  async getInsights(userId: string) {
    const insights = await this.prisma.aiInsight.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return ApiResponse.ok(insights);
  }

  async getFinancialHealthScore(userId: string) {
    return ApiResponse.ok({
      userId,
      overallScore: 82,
      debtToIncomeRatio: 0.28,
      savingsRate: 0.22,
      emergencyFundMonths: 5.5,
      recommendation: 'Your savings rate and debt-to-income ratio are within healthy financial limits.',
    });
  }
}
