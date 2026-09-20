import { apiClient } from '@/lib/api-client';
import { ApiResponse } from '@/types/api.types';
import {
  AuthResponse,
  ChangePasswordRequest,
  ForgotPasswordRequest,
  LoginRequest,
  ResendVerificationRequest,
  ResetPasswordRequest,
  SignupRequest,
  UserProfileResponse,
  VerifyEmailRequest,
} from '@/types/auth.types';

export const authService = {
  async signup(data: SignupRequest): Promise<ApiResponse<UserProfileResponse>> {
    const res = await apiClient.post<ApiResponse<UserProfileResponse>>('/api/v1/auth/signup', data);
    return res.data;
  },

  async login(data: LoginRequest): Promise<ApiResponse<AuthResponse>> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const json = await res.json();
    if (!res.ok) {
      throw json;
    }
    return json;
  },

  async logout(): Promise<void> {
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
  },

  async forgotPassword(data: ForgotPasswordRequest): Promise<ApiResponse<void>> {
    const res = await apiClient.post<ApiResponse<void>>('/api/v1/auth/forgot-password', data);
    return res.data;
  },

  async resetPassword(data: ResetPasswordRequest): Promise<ApiResponse<void>> {
    const res = await apiClient.post<ApiResponse<void>>('/api/v1/auth/reset-password', data);
    return res.data;
  },

  async verifyEmail(data: VerifyEmailRequest): Promise<ApiResponse<void>> {
    const res = await apiClient.post<ApiResponse<void>>('/api/v1/auth/verify-email', data);
    return res.data;
  },

  async resendVerification(data: ResendVerificationRequest): Promise<ApiResponse<void>> {
    const res = await apiClient.post<ApiResponse<void>>('/api/v1/auth/resend-verification', data);
    return res.data;
  },

  async changePassword(data: ChangePasswordRequest): Promise<ApiResponse<void>> {
    const res = await apiClient.post<ApiResponse<void>>('/api/v1/auth/change-password', data);
    return res.data;
  },
};
