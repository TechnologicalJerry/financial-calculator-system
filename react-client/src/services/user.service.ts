import { apiClient } from '@/lib/api-client';
import { ApiResponse } from '@/types/api.types';
import { SessionResponse, UserProfileResponse } from '@/types/auth.types';

export interface UserPreferences {
  userId: string;
  theme: 'dark' | 'light' | 'system';
  currency: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  riskTolerance: 'CONSERVATIVE' | 'MODERATE' | 'AGGRESSIVE';
}

export interface UpdateUserProfileDto {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  avatarUrl?: string;
}

export const userService = {
  async getCurrentUser(): Promise<UserProfileResponse> {
    const res = await apiClient.get<ApiResponse<UserProfileResponse>>('/api/v1/users/me');
    return res.data.data;
  },

  async updateProfile(data: UpdateUserProfileDto): Promise<ApiResponse<UserProfileResponse>> {
    const res = await apiClient.put<ApiResponse<UserProfileResponse>>('/api/v1/users/profile', data);
    return res.data;
  },

  async getUserPreferences(): Promise<ApiResponse<UserPreferences>> {
    const res = await apiClient.get<ApiResponse<UserPreferences>>('/api/v1/user-preferences');
    return res.data;
  },

  async updateUserPreferences(data: Partial<UserPreferences>): Promise<ApiResponse<UserPreferences>> {
    const res = await apiClient.put<ApiResponse<UserPreferences>>('/api/v1/user-preferences', data);
    return res.data;
  },

  async getActiveSessions(): Promise<SessionResponse[]> {
    const res = await apiClient.get<ApiResponse<SessionResponse[]>>('/api/v1/sessions/active');
    return res.data.data;
  },

  async revokeSession(sessionId: string): Promise<ApiResponse<void>> {
    const res = await apiClient.delete<ApiResponse<void>>(`/api/v1/sessions/${sessionId}`);
    return res.data;
  },

  async revokeAllSessions(): Promise<ApiResponse<void>> {
    const res = await apiClient.delete<ApiResponse<void>>('/api/v1/sessions/all');
    return res.data;
  },
};

