export interface ApiResponse<T = unknown> {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
}

export interface ApiErrorDetail {
  code: string;
  message: string;
  requestId?: string;
  details?: unknown;
}

export interface ApiErrorResponse {
  success: false;
  error: ApiErrorDetail;
}

export interface HealthComponentStatus {
  status: 'up' | 'down';
  latencyMs?: number;
  details?: Record<string, unknown>;
  error?: string;
}

export interface HealthCheckResult {
  status: 'ok' | 'degraded' | 'unhealthy';
  timestamp: string;
  service: string;
  environment: string;
  uptime: number;
  components?: Record<string, HealthComponentStatus>;
}

export interface JwtPayload {
  sub: string;
  email?: string;
  roles?: string[];
  iat?: number;
  exp?: number;
  iss?: string;
  aud?: string;
  [key: string]: unknown;
}

export interface AuthContext {
  userId: string;
  email?: string;
  roles: string[];
  tokenPayload: JwtPayload;
}
