import { apiClient } from '@/lib/api-client';
import { ApiResponse } from '@/types/api.types';

export interface AiChatMessage {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
}

export interface AiConversation {
  id: string;
  userId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages?: AiChatMessage[];
}

export interface AiInsight {
  id: string;
  userId: string;
  type: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface SendChatMessagePayload {
  message: string;
  conversationId?: string;
  prompt?: string;
}

export interface FinancialHealthScore {
  userId: string;
  overallScore: number;
  debtToIncomeRatio: number;
  savingsRate: number;
  emergencyFundMonths: number;
  recommendation: string;
}

export const aiService = {
  async sendMessage(payload: SendChatMessagePayload): Promise<ApiResponse<{ conversationId: string; userId: string; message: AiChatMessage }>> {
    const res = await apiClient.post<ApiResponse<{ conversationId: string; userId: string; message: AiChatMessage }>>('/api/v1/ai/chat', payload);
    return res.data;
  },

  async getConversations(): Promise<ApiResponse<AiConversation[]>> {
    const res = await apiClient.get<ApiResponse<AiConversation[]>>('/api/v1/ai/chat/conversations');
    return res.data;
  },

  async getMessages(conversationId: string): Promise<ApiResponse<{ conversationId: string; messages: AiChatMessage[] }>> {
    const res = await apiClient.get<ApiResponse<{ conversationId: string; messages: AiChatMessage[] }>>(`/api/v1/ai/chat/conversations/${conversationId}/messages`);
    return res.data;
  },

  async getInsights(): Promise<ApiResponse<AiInsight[]>> {
    const res = await apiClient.get<ApiResponse<AiInsight[]>>('/api/v1/insights');
    return res.data;
  },

  async markInsightRead(id: string): Promise<ApiResponse<AiInsight>> {
    const res = await apiClient.put<ApiResponse<AiInsight>>(`/api/v1/insights/${id}/read`);
    return res.data;
  },

  async getHealthScore(): Promise<ApiResponse<FinancialHealthScore>> {
    const res = await apiClient.get<ApiResponse<FinancialHealthScore>>('/api/v1/health-score');
    return res.data;
  },
};
