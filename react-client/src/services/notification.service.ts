import { apiClient } from '@/lib/api-client';
import { ApiResponse } from '@/types/api.types';

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  readAt?: string;
  metadataJson?: string;
  createdAt: string;
}

export interface SendNotificationPayload {
  userId?: string;
  title: string;
  message: string;
  type?: string;
  metadataJson?: string;
}

export const notificationService = {
  async getNotifications(): Promise<ApiResponse<NotificationItem[]>> {
    const res = await apiClient.get<ApiResponse<NotificationItem[]>>('/api/v1/notifications');
    return res.data;
  },

  async getUnread(): Promise<ApiResponse<NotificationItem[]>> {
    const res = await apiClient.get<ApiResponse<NotificationItem[]>>('/api/v1/notifications/unread');
    return res.data;
  },

  async getUnreadCount(): Promise<ApiResponse<{ unreadCount: number }>> {
    const res = await apiClient.get<ApiResponse<{ unreadCount: number }>>('/api/v1/notifications/unread-count');
    return res.data;
  },

  async markAsRead(id: string): Promise<ApiResponse<NotificationItem>> {
    const res = await apiClient.put<ApiResponse<NotificationItem>>(`/api/v1/notifications/${id}/read`);
    return res.data;
  },

  async markAllAsRead(): Promise<ApiResponse<void>> {
    const res = await apiClient.put<ApiResponse<void>>('/api/v1/notifications/mark-all-read');
    return res.data;
  },

  async send(payload: SendNotificationPayload): Promise<ApiResponse<NotificationItem>> {
    const res = await apiClient.post<ApiResponse<NotificationItem>>('/api/v1/notifications/send', payload);
    return res.data;
  },
};
