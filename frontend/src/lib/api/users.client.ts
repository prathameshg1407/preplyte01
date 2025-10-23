'use client';

import { 
  apiGet, 
  apiPut, 
  apiPost, 
  apiPostMessage, 
  apiGetPaginated,
  downloadFile,
} from './client';
import type { 
  AppUser, 
  UpdateUserStatusDto, 
  UpdateUserRoleDto,
  BulkUpdateStatusDto,
  BulkUpdateStatusResult,
  TransferUserDto,
  ChangePasswordDto,
  PasswordResetDto,
  PasswordResetInitiateDto,
  PasswordResetTokenResponse,
  PaginatedResponse,
  UserListFilters,
  StudentStats,
  InstitutionStats,
  AiInterviewStats,
  UserActivityMetrics,
  UserComparison,
  UserSession,
  ForceLogoutResult,
  ApiMessage,
  FullUserProfile,
  ExportFormat,
} from '@/types';

// ===================================================================================
// ## User Management APIs
// ===================================================================================

/**
 * Get user by ID
 */
export const getUserById = async (userId: string): Promise<FullUserProfile> => {
  return apiGet<FullUserProfile>(`/users/${userId}`);
};

/**
 * Get all users with filters and pagination
 */
export const getAllUsers = async (
  filters?: UserListFilters
): Promise<PaginatedResponse<AppUser>> => {
  return apiGetPaginated<AppUser>('/users', {
    page: filters?.page,
    limit: filters?.limit,
    role: filters?.role,
    status: filters?.status,
    institutionId: filters?.institutionId,
    search: filters?.search,
    sortBy: filters?.sortBy,
    sortOrder: filters?.sortOrder,
  });
};

/**
 * Update user role (Super Admin only)
 */
export const updateUserRole = async (
  userId: string,
  dto: UpdateUserRoleDto
): Promise<AppUser> => {
  return apiPut<AppUser>(`/users/${userId}/role`, dto);
};

/**
 * Update user status (Admin only)
 */
export const updateUserStatus = async (
  userId: string,
  dto: UpdateUserStatusDto
): Promise<AppUser> => {
  return apiPut<AppUser>(`/users/${userId}/status`, dto);
};

/**
 * Bulk update user status (Admin only)
 */
export const bulkUpdateUserStatus = async (
  dto: BulkUpdateStatusDto
): Promise<BulkUpdateStatusResult> => {
  return apiPut<BulkUpdateStatusResult>('/users/bulk/status', dto);
};

/**
 * Transfer user to different institution (Super Admin only)
 */
export const transferUser = async (
  userId: string,
  dto: TransferUserDto
): Promise<AppUser> => {
  return apiPut<AppUser>(`/users/${userId}/transfer`, dto);
};

/**
 * Force logout user (invalidate all sessions)
 */
export const forceLogoutUser = async (userId: string): Promise<ForceLogoutResult> => {
  return apiPost<ForceLogoutResult>(`/users/${userId}/logout`);
};

/**
 * Search users
 */
export const searchUsers = async (
  query: string,
  limit: number = 10
): Promise<AppUser[]> => {
  return apiGet<AppUser[]>(`/users/search?q=${encodeURIComponent(query)}&limit=${limit}`);
};

// ===================================================================================
// ## Statistics & Analytics APIs
// ===================================================================================

/**
 * Get current user's statistics
 */
export const getMyStats = async (): Promise<StudentStats> => {
  return apiGet<StudentStats>('/users/stats/me');
};

/**
 * Get AI interview statistics for current user
 */
export const getMyAiInterviewStats = async (): Promise<AiInterviewStats> => {
  return apiGet<AiInterviewStats>('/users/ai-interviews/stats');
};

/**
 * Get institution statistics (Admin only)
 */
export const getInstitutionStats = async (
  institutionId?: number
): Promise<InstitutionStats> => {
  const params = institutionId ? `?institutionId=${institutionId}` : '';
  return apiGet<InstitutionStats>(`/users/stats/by-institution${params}`);
};

/**
 * Get user activity metrics
 */
export const getUserActivity = async (userId: string): Promise<UserActivityMetrics> => {
  return apiGet<UserActivityMetrics>(`/users/${userId}/activity`);
};

/**
 * Compare user with peers
 */
export const compareUserWithPeers = async (
  userId: string,
  group: 'institution' | 'batch' | 'all' = 'institution'
): Promise<UserComparison> => {
  return apiGet<UserComparison>(`/users/${userId}/compare?group=${group}`);
};

/**
 * Get user engagement score
 */
export const getUserEngagement = async (userId: string): Promise<number> => {
  return apiGet<number>(`/users/${userId}/engagement`);
};

// ===================================================================================
// ## Session Management APIs
// ===================================================================================

/**
 * Get user's active sessions
 */
export const getUserSessions = async (userId: string): Promise<UserSession[]> => {
  return apiGet<UserSession[]>(`/users/${userId}/sessions`);
};

/**
 * Get current user's sessions
 */
export const getMySessions = async (): Promise<UserSession[]> => {
  return apiGet<UserSession[]>('/users/me/sessions');
};

// ===================================================================================
// ## Password Management APIs
// ===================================================================================

/**
 * Change password (authenticated user)
 */
export const changePassword = async (dto: ChangePasswordDto): Promise<ApiMessage> => {
  return apiPostMessage('/users/me/change-password', dto);
};

/**
 * Initiate password reset (public)
 */
export const initiatePasswordReset = async (
  dto: PasswordResetInitiateDto
): Promise<PasswordResetTokenResponse | null> => {
  const response = await apiPost<PasswordResetTokenResponse | null>(
    '/users/password-reset/initiate', 
    dto,
    { skipAuth: true }
  );
  // In production, this returns null (token sent via email)
  return response;
};

/**
 * Complete password reset (public)
 */
export const completePasswordReset = async (dto: PasswordResetDto): Promise<ApiMessage> => {
  return apiPostMessage('/users/password-reset/complete', dto, { skipAuth: true });
};

// ===================================================================================
// ## Export APIs
// ===================================================================================

/**
 * Export users to CSV/JSON
 */
export const exportUsers = async (format: ExportFormat = 'csv'): Promise<void> => {
  const filename = `users-export-${new Date().toISOString().split('T')[0]}.${format}`;
  return downloadFile(`/users/export?format=${format}`, filename);
};

// ===================================================================================
// ## Utility Functions
// ===================================================================================

/**
 * Build user list query string
 */
export const buildUserListQuery = (filters?: UserListFilters): string => {
  if (!filters) return '';
  
  const params = new URLSearchParams();
  
  if (filters.page) params.append('page', filters.page.toString());
  if (filters.limit) params.append('limit', filters.limit.toString());
  if (filters.role) params.append('role', filters.role);
  if (filters.status) params.append('status', filters.status);
  if (filters.institutionId) params.append('institutionId', filters.institutionId.toString());
  if (filters.search) params.append('search', filters.search);
  if (filters.sortBy) params.append('sortBy', filters.sortBy);
  if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);
  
  const query = params.toString();
  return query ? `?${query}` : '';
};