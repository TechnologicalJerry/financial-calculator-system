import { apiClient } from '@/lib/api-client';
import { ApiResponse } from '@/types/api.types';

export interface UserManagementItem {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'PENDING';
  createdAt: string;
}

export interface UpdateUserStatusDto {
  status: 'ACTIVE' | 'SUSPENDED' | 'PENDING';
  reason?: string;
}

export interface RoleItem {
  id: string;
  roleName: string;
  permissions: string[];
  description?: string;
}

export interface CreateRoleDto {
  roleName: string;
  permissions: string[];
  description?: string;
}

export interface UpdateRolePermissionsDto {
  permissions: string[];
}

export interface TaxRuleItem {
  id: string;
  country: string;
  taxYear: number;
  ruleName: string;
  taxBracketJson: Record<string, unknown>;
}

export interface CreateTaxRuleDto {
  country: string;
  taxYear: number;
  ruleName: string;
  taxBracketJson: Record<string, unknown>;
}

export interface FormulaItem {
  id: string;
  name: string;
  expression: string;
  variables: string[];
}

export interface CreateFormulaDto {
  name: string;
  expression: string;
  variables: string[];
}

export interface FeatureFlagItem {
  id: string;
  keyName: string;
  isEnabled: boolean;
  description?: string;
}

export interface CreateFeatureFlagDto {
  keyName: string;
  isEnabled: boolean;
  description?: string;
}

export interface ApprovalRequestItem {
  id: string;
  requestedByUserId: string;
  type: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  details: Record<string, unknown>;
  createdAt: string;
}

export interface CreateApprovalDto {
  type: string;
  details: Record<string, unknown>;
}

export interface SystemConfigItem {
  key: string;
  value: string;
}

export interface AuditLogItem {
  id: string;
  userId?: string;
  action: string;
  endpoint: string;
  ipAddress?: string;
  createdAt: string;
}

export interface BackgroundJobItem {
  id: string;
  jobName: string;
  status: string;
  type: string;
  payloadJson?: Record<string, unknown>;
  errorLog?: string;
  retryCount: number;
  maxRetries: number;
  createdAt: string;
}

export const adminService = {
  async getUsers(): Promise<ApiResponse<UserManagementItem[]>> {
    const res = await apiClient.get<ApiResponse<UserManagementItem[]>>('/api/v1/admin/users');
    return res.data;
  },

  async updateUserStatus(userId: string, data: UpdateUserStatusDto): Promise<ApiResponse<UserManagementItem>> {
    const res = await apiClient.put<ApiResponse<UserManagementItem>>(`/api/v1/admin/users/${userId}/status`, data);
    return res.data;
  },

  async getRoles(): Promise<ApiResponse<RoleItem[]>> {
    const res = await apiClient.get<ApiResponse<RoleItem[]>>('/api/v1/admin/roles');
    return res.data;
  },

  async createRole(data: CreateRoleDto): Promise<ApiResponse<RoleItem>> {
    const res = await apiClient.post<ApiResponse<RoleItem>>('/api/v1/admin/roles', data);
    return res.data;
  },

  async updateRolePermissions(roleId: string, data: UpdateRolePermissionsDto): Promise<ApiResponse<RoleItem>> {
    const res = await apiClient.put<ApiResponse<RoleItem>>(`/api/v1/admin/roles/${roleId}/permissions`, data);
    return res.data;
  },

  async getTaxRules(): Promise<ApiResponse<TaxRuleItem[]>> {
    const res = await apiClient.get<ApiResponse<TaxRuleItem[]>>('/api/v1/admin/tax-rules');
    return res.data;
  },

  async createTaxRule(data: CreateTaxRuleDto): Promise<ApiResponse<TaxRuleItem>> {
    const res = await apiClient.post<ApiResponse<TaxRuleItem>>('/api/v1/admin/tax-rules', data);
    return res.data;
  },

  async getFormulas(): Promise<ApiResponse<FormulaItem[]>> {
    const res = await apiClient.get<ApiResponse<FormulaItem[]>>('/api/v1/admin/formulas');
    return res.data;
  },

  async createFormula(data: CreateFormulaDto): Promise<ApiResponse<FormulaItem>> {
    const res = await apiClient.post<ApiResponse<FormulaItem>>('/api/v1/admin/formulas', data);
    return res.data;
  },

  async getFeatureFlags(): Promise<ApiResponse<FeatureFlagItem[]>> {
    const res = await apiClient.get<ApiResponse<FeatureFlagItem[]>>('/api/v1/admin/feature-flags');
    return res.data;
  },

  async createFeatureFlag(data: CreateFeatureFlagDto): Promise<ApiResponse<FeatureFlagItem>> {
    const res = await apiClient.post<ApiResponse<FeatureFlagItem>>('/api/v1/admin/feature-flags', data);
    return res.data;
  },

  async toggleFeatureFlag(keyName: string, isEnabled: boolean): Promise<ApiResponse<FeatureFlagItem>> {
    const res = await apiClient.put<ApiResponse<FeatureFlagItem>>(`/api/v1/admin/feature-flags/${keyName}/toggle`, { isEnabled });
    return res.data;
  },

  async evaluateFeatureFlag(keyName: string): Promise<ApiResponse<{ isEnabled: boolean }>> {
    const res = await apiClient.get<ApiResponse<{ isEnabled: boolean }>>(`/api/v1/admin/feature-flags/evaluate/${keyName}`);
    return res.data;
  },

  async getApprovals(): Promise<ApiResponse<ApprovalRequestItem[]>> {
    const res = await apiClient.get<ApiResponse<ApprovalRequestItem[]>>('/api/v1/admin/approvals');
    return res.data;
  },

  async createApprovalRequest(data: CreateApprovalDto): Promise<ApiResponse<ApprovalRequestItem>> {
    const res = await apiClient.post<ApiResponse<ApprovalRequestItem>>('/api/v1/admin/approvals', data);
    return res.data;
  },

  async approveRequest(requestId: string): Promise<ApiResponse<ApprovalRequestItem>> {
    const res = await apiClient.put<ApiResponse<ApprovalRequestItem>>(`/api/v1/admin/approvals/${requestId}/approve`);
    return res.data;
  },

  async rejectRequest(requestId: string, reason?: string): Promise<ApiResponse<ApprovalRequestItem>> {
    const res = await apiClient.put<ApiResponse<ApprovalRequestItem>>(`/api/v1/admin/approvals/${requestId}/reject`, { reason });
    return res.data;
  },

  async getConfigs(): Promise<ApiResponse<Record<string, string>>> {
    const res = await apiClient.get<ApiResponse<Record<string, string>>>('/api/v1/admin/configs');
    return res.data;
  },

  async updateConfigs(configs: Record<string, string>): Promise<ApiResponse<Record<string, string>>> {
    const res = await apiClient.put<ApiResponse<Record<string, string>>>('/api/v1/admin/configs', configs);
    return res.data;
  },

  async getAuditLogs(): Promise<ApiResponse<AuditLogItem[]>> {
    const res = await apiClient.get<ApiResponse<AuditLogItem[]>>('/api/v1/audit-logs');
    return res.data;
  },

  async getBackgroundJobs(): Promise<ApiResponse<BackgroundJobItem[]>> {
    const res = await apiClient.get<ApiResponse<BackgroundJobItem[]>>('/api/v1/admin/jobs');
    return res.data;
  },

  async retryBackgroundJob(jobId: string): Promise<ApiResponse<BackgroundJobItem>> {
    const res = await apiClient.post<ApiResponse<BackgroundJobItem>>(`/api/v1/admin/jobs/${jobId}/retry`);
    return res.data;
  },

  async cancelBackgroundJob(jobId: string): Promise<ApiResponse<BackgroundJobItem>> {
    const res = await apiClient.post<ApiResponse<BackgroundJobItem>>(`/api/v1/admin/jobs/${jobId}/cancel`);
    return res.data;
  },
};
