import { 
  serverGet, 
  serverPut, 
  serverPost,
  serverGetPaginated 
} from './server';
import type { 
  AppUser, 
  UpdateUserStatusDto, 
  UpdateUserRoleDto,
  BulkUpdateStatusDto,
  BulkUpdateStatusResult,
  TransferUserDto,
  PaginatedResponse,
  UserListFilters,
  StudentStats,
  InstitutionStats,
  AiInterviewStats,
  UserActivityMetrics,
  UserComparison,
  UserSession,
  ForceLogoutResult,
  FullUserProfile,
} from '@/types';

// ===================================================================================
// ## Server-Side User Management APIs
// ===================================================================================

/**
 * Get user by ID (server-side)
 */
export const getUserById = async (userId: string): Promise<FullUserProfile> => {
  return serverGet<FullUserProfile>(`/users/${encodeURIComponent(userId)}`);
};

/**
 * Get all users with filters and pagination (server-side)
 */
export const getAllUsers = async (
  filters?: UserListFilters
): Promise<PaginatedResponse<AppUser>> => {
  const page = filters?.page || 1;
  const limit = filters?.limit || 10;
  
  const additionalFilters: Record<string, any> = {};
  if (filters?.role) additionalFilters.role = filters.role;
  if (filters?.status) additionalFilters.status = filters.status;
  if (filters?.institutionId) additionalFilters.institutionId = filters.institutionId.toString();
  if (filters?.search) additionalFilters.search = filters.search;
  if (filters?.sortBy) additionalFilters.sortBy = filters.sortBy;
  if (filters?.sortOrder) additionalFilters.sortOrder = filters.sortOrder;
  
  return serverGetPaginated<AppUser>('/users', page, limit, additionalFilters);
};

/**
 * Update user role (server-side)
 */
export const updateUserRole = async (
  userId: string,
  dto: UpdateUserRoleDto
): Promise<AppUser> => {
  return serverPut<AppUser>(`/users/${encodeURIComponent(userId)}/role`, dto);
};

/**
 * Update user status (server-side)
 */
export const updateUserStatus = async (
  userId: string,
  dto: UpdateUserStatusDto
): Promise<AppUser> => {
  return serverPut<AppUser>(`/users/${encodeURIComponent(userId)}/status`, dto);
};

/**
 * Bulk update user status (server-side)
 */
export const bulkUpdateUserStatus = async (
  dto: BulkUpdateStatusDto
): Promise<BulkUpdateStatusResult> => {
  return serverPut<BulkUpdateStatusResult>('/users/bulk/status', dto);
};

/**
 * Transfer user to institution (server-side)
 */
export const transferUser = async (
  userId: string,
  dto: TransferUserDto
): Promise<AppUser> => {
  return serverPut<AppUser>(`/users/${encodeURIComponent(userId)}/transfer`, dto);
};

/**
 * Force logout user (server-side)
 */
export const forceLogoutUser = async (userId: string): Promise<ForceLogoutResult> => {
  return serverPost<ForceLogoutResult>(`/users/${encodeURIComponent(userId)}/logout`, {});
};

/**
 * Search users (server-side)
 */
export const searchUsers = async (
  query: string,
  limit: number = 10
): Promise<AppUser[]> => {
  return serverGet<AppUser[]>(`/users/search?q=${encodeURIComponent(query)}&limit=${limit}`);
};

// ===================================================================================
// ## Server-Side Statistics & Analytics APIs
// ===================================================================================

/**
 * Get current user's statistics (server-side)
 */
export const getMyStats = async (): Promise<StudentStats> => {
  return serverGet<StudentStats>('/users/stats/me');
};

/**
 * Get AI interview statistics (server-side)
 */
export const getMyAiInterviewStats = async (): Promise<AiInterviewStats> => {
  return serverGet<AiInterviewStats>('/users/ai-interviews/stats');
};

/**
 * Get institution statistics (server-side)
 */
export const getInstitutionStats = async (
  institutionId?: number
): Promise<InstitutionStats> => {
  const params = institutionId ? `?institutionId=${institutionId}` : '';
  return serverGet<InstitutionStats>(`/users/stats/by-institution${params}`);
};

/**
 * Get user activity metrics (server-side)
 */
export const getUserActivity = async (userId: string): Promise<UserActivityMetrics> => {
  return serverGet<UserActivityMetrics>(`/users/${encodeURIComponent(userId)}/activity`);
};

/**
 * Compare user with peers (server-side)
 */
export const compareUserWithPeers = async (
  userId: string,
  group: 'institution' | 'batch' | 'all' = 'institution'
): Promise<UserComparison> => {
  return serverGet<UserComparison>(
    `/users/${encodeURIComponent(userId)}/compare?group=${group}`
  );
};

/**
 * Get user engagement score (server-side)
 */
export const getUserEngagement = async (userId: string): Promise<number> => {
  return serverGet<number>(`/users/${encodeURIComponent(userId)}/engagement`);
};

// ===================================================================================
// ## Server-Side Session Management APIs
// ===================================================================================

/**
 * Get user sessions (server-side)
 */
export const getUserSessions = async (userId: string): Promise<UserSession[]> => {
  return serverGet<UserSession[]>(`/users/${encodeURIComponent(userId)}/sessions`);
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