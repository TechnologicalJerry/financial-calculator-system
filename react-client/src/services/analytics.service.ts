import { apiClient } from '@/lib/api-client';
import { ApiResponse } from '@/types/api.types';

export interface DashboardSummary {
  totalCalculationsCount: number;
  totalFavoritesCount: number;
  totalReportsCount: number;
  recentActivity: Array<{
    id: string;
    type: string;
    description: string;
    createdAt: string;
  }>;
  summaryMetrics: {
    totalNetWorth: number;
    totalAssets: number;
    totalLiabilities: number;
  };
}

export interface AnalyticsMetrics {
  userActivityCount: number;
  calculationBreakdown: Record<string, number>;
  timeSeriesData: Array<{ date: string; value: number }>;
}

export interface HistoryItem {
  id: string;
  userId: string;
  calculatorType: string;
  inputParams: Record<string, unknown>;
  outputResult: Record<string, unknown>;
  isArchived: boolean;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SearchHistoryDto {
  query?: string;
  calculatorType?: string;
  isArchived?: boolean;
  isPinned?: boolean;
}

export interface GenerateReportDto {
  title: string;
  reportType: string;
  format: 'PDF' | 'CSV' | 'EXCEL';
  dateRange?: { startDate: string; endDate: string };
}

export interface ReportExportItem {
  id: string;
  userId: string;
  reportType: string;
  title: string;
  format: string;
  fileUrl: string;
  status: string;
  createdAt: string;
}

export const analyticsService = {
  async getDashboardSummary(): Promise<ApiResponse<DashboardSummary>> {
    const res = await apiClient.get<ApiResponse<DashboardSummary>>('/api/v1/dashboard');
    return res.data;
  },

  async getAnalyticsMetrics(): Promise<ApiResponse<AnalyticsMetrics>> {
    const res = await apiClient.get<ApiResponse<AnalyticsMetrics>>('/api/v1/analytics');
    return res.data;
  },

  async getHistory(): Promise<ApiResponse<HistoryItem[]>> {
    const res = await apiClient.get<ApiResponse<HistoryItem[]>>('/api/v1/history');
    return res.data;
  },

  async searchHistory(data: SearchHistoryDto): Promise<ApiResponse<HistoryItem[]>> {
    const res = await apiClient.post<ApiResponse<HistoryItem[]>>('/api/v1/history/search', data);
    return res.data;
  },

  async archiveHistory(id: string): Promise<ApiResponse<HistoryItem>> {
    const res = await apiClient.put<ApiResponse<HistoryItem>>(`/api/v1/history/${id}/archive`);
    return res.data;
  },

  async pinHistory(id: string): Promise<ApiResponse<HistoryItem>> {
    const res = await apiClient.put<ApiResponse<HistoryItem>>(`/api/v1/history/${id}/pin`);
    return res.data;
  },

  async restoreHistory(id: string): Promise<ApiResponse<HistoryItem>> {
    const res = await apiClient.put<ApiResponse<HistoryItem>>(`/api/v1/history/${id}/restore`);
    return res.data;
  },

  async duplicateHistory(id: string): Promise<ApiResponse<HistoryItem>> {
    const res = await apiClient.post<ApiResponse<HistoryItem>>(`/api/v1/history/${id}/duplicate`);
    return res.data;
  },

  async deleteHistory(id: string): Promise<ApiResponse<void>> {
    const res = await apiClient.delete<ApiResponse<void>>(`/api/v1/history/${id}`);
    return res.data;
  },

  async batchDeleteHistory(ids: string[]): Promise<ApiResponse<void>> {
    const res = await apiClient.post<ApiResponse<void>>('/api/v1/history/batch-delete', { ids });
    return res.data;
  },

  async getFavorites(): Promise<ApiResponse<HistoryItem[]>> {
    const res = await apiClient.get<ApiResponse<HistoryItem[]>>('/api/v1/favorites');
    return res.data;
  },

  async addFavorite(historyId: string): Promise<ApiResponse<void>> {
    const res = await apiClient.post<ApiResponse<void>>(`/api/v1/favorites/${historyId}`);
    return res.data;
  },

  async removeFavorite(historyId: string): Promise<ApiResponse<void>> {
    const res = await apiClient.delete<ApiResponse<void>>(`/api/v1/favorites/${historyId}`);
    return res.data;
  },

  async generateReport(data: GenerateReportDto): Promise<ApiResponse<ReportExportItem>> {
    const res = await apiClient.post<ApiResponse<ReportExportItem>>('/api/v1/reports/generate', data);
    return res.data;
  },

  async exportReport(data: GenerateReportDto): Promise<ApiResponse<ReportExportItem>> {
    const res = await apiClient.post<ApiResponse<ReportExportItem>>('/api/v1/reports/export', data);
    return res.data;
  },

  async getExportedReports(): Promise<ApiResponse<ReportExportItem[]>> {
    const res = await apiClient.get<ApiResponse<ReportExportItem[]>>('/api/v1/reports/exports');
    return res.data;
  },
};
