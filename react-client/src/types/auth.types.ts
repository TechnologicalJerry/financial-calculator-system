export type UserStatus =
  | 'PENDING_VERIFICATION'
  | 'ACTIVE'
  | 'LOCKED'
  | 'SUSPENDED'
  | 'DEACTIVATED';

export interface UserProfileResponse {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string | null;
  status: UserStatus;
  isMfaEnabled: boolean;
  roles: string[];
  permissions: string[];
  createdAt: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  userId: string;
  email: string;
  username: string;
  roles: string[];
  permissions: string[];
}

export interface SignupRequest {
  email: string;
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
}

export interface LoginRequest {
  usernameOrEmail: string;
  password: string;
  rememberMe?: boolean;
  deviceFingerprint?: string;
  deviceName?: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface VerifyEmailRequest {
  token: string;
}

export interface ResendVerificationRequest {
  email: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface SessionResponse {
  id: string;
  sessionToken: string;
  ipAddress: string;
  userAgent: string;
  deviceFingerprint?: string | null;
  deviceName?: string | null;
  expiresAt: string;
  createdAt: string;
  isCurrentSession?: boolean;
}
