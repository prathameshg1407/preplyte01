// src/lib/api/admin-server.ts
import 'server-only';

import { 
  serverGet,
  serverPost,
  serverPut,
  serverPatch,
  serverDelete,
  type ServerFetchOptions 
} from './server';

import type {
  AdminStats,
  SuperAdminStats,
  InstitutionAdminStats,
  StatsTimeRangeDto,
  UserAnalytics,
  AssessmentAnalytics,
  InstitutionDetailedStats,
  PlatformHealthMetrics,
  ExportFormat,
  PaginatedResponse,
  AppUser,
  Institution,
} from '@/types';

/**
 * Admin API for server-side operations (Server Components, API Routes)
 * 
 * @important This file should ONLY be imported in Server Components or API Routes
 * For Client Components, use '@/lib/api/admin-client' instead
 */

// ===================================================================================
// ## Statistics & Analytics
// ===================================================================================

export const adminStatsServer = {
  /**
   * Get dashboard statistics based on admin role
   */
  async getDashboardStats(
    timeRange?: StatsTimeRangeDto,
    options?: ServerFetchOptions
  ): Promise<AdminStats> {
    const params = new URLSearchParams();
    
    if (timeRange) {
      if (timeRange.startDate) params.append('startDate', timeRange.startDate.toString());
      if (timeRange.endDate) params.append('endDate', timeRange.endDate.toString());
      if (timeRange.range) params.append('range', timeRange.range);
    }
    
    const queryString = params.toString();
    const endpoint = queryString ? `/admin/stats?${queryString}` : '/admin/stats';
    
    return serverGet<AdminStats>(endpoint, options);
  },

  /**
   * Get user analytics (Super Admin only)
   */
  async getUserAnalytics(
    startDate?: Date | string,
    endDate?: Date | string,
    options?: ServerFetchOptions
  ): Promise<UserAnalytics> {
    const params = new URLSearchParams();
    
    if (startDate) params.append('startDate', startDate.toString());
    if (endDate) params.append('endDate', endDate.toString());
    
    const queryString = params.toString();
    const endpoint = queryString ? `/admin/analytics/users?${queryString}` : '/admin/analytics/users';
    
    return serverGet<UserAnalytics>(endpoint, options);
  },

  /**
   * Get assessment performance analytics
   */
  async getAssessmentAnalytics(
    timeRange?: StatsTimeRangeDto,
    options?: ServerFetchOptions
  ): Promise<AssessmentAnalytics> {
    const params = new URLSearchParams();
    
    if (timeRange) {
      if (timeRange.startDate) params.append('startDate', timeRange.startDate.toString());
      if (timeRange.endDate) params.append('endDate', timeRange.endDate.toString());
      if (timeRange.range) params.append('range', timeRange.range);
    }
    
    const queryString = params.toString();
    const endpoint = queryString ? `/admin/analytics/assessments?${queryString}` : '/admin/analytics/assessments';
    
    return serverGet<AssessmentAnalytics>(endpoint, options);
  },

  /**
   * Get detailed statistics for a specific institution (Super Admin only)
   */
  async getInstitutionStats(
    institutionId: number,
    options?: ServerFetchOptions
  ): Promise<InstitutionDetailedStats> {
    return serverGet<InstitutionDetailedStats>(
      `/admin/institutions/${institutionId}/stats`,
      options
    );
  },

  /**
   * Get platform health metrics (Super Admin only)
   */
  async getPlatformHealthMetrics(
    options?: ServerFetchOptions
  ): Promise<PlatformHealthMetrics> {
    return serverGet<PlatformHealthMetrics>('/admin/health/metrics', options);
  },

  /**
   * Export statistics in specified format
   */
  async exportStats(
    format: ExportFormat = 'json',
    timeRange?: StatsTimeRangeDto,
    options?: ServerFetchOptions
  ): Promise<any> {
    const params = new URLSearchParams();
    params.append('format', format);
    
    if (timeRange) {
      if (timeRange.startDate) params.append('startDate', timeRange.startDate.toString());
      if (timeRange.endDate) params.append('endDate', timeRange.endDate.toString());
      if (timeRange.range) params.append('range', timeRange.range);
    }
    
    const endpoint = `/admin/export/stats?${params.toString()}`;
    
    return serverGet<any>(endpoint, options);
  },
};

// ===================================================================================
// ## User Management
// ===================================================================================

export const adminUsersServer = {
  /**
   * Get all users with pagination and filters
   */
  async getUsers(
    page: number = 1,
    limit: number = 20,
    filters?: {
      role?: string;
      status?: string;
      institutionId?: number;
      search?: string;
    },
    options?: ServerFetchOptions
  ): Promise<PaginatedResponse<AppUser>> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (filters) {
      if (filters.role) params.append('role', filters.role);
      if (filters.status) params.append('status', filters.status);
      if (filters.institutionId) params.append('institutionId', filters.institutionId.toString());
      if (filters.search) params.append('search', filters.search);
    }
    
    return serverGet<PaginatedResponse<AppUser>>(
      `/admin/users?${params.toString()}`,
      options
    );
  },

  /**
   * Get a single user by ID
   */
  async getUserById(
    userId: number,
    options?: ServerFetchOptions
  ): Promise<AppUser> {
    return serverGet<AppUser>(`/admin/users/${userId}`, options);
  },

  /**
   * Update user status
   */
  async updateUserStatus(
    userId: number,
    status: string,
    options?: ServerFetchOptions
  ): Promise<AppUser> {
    return serverPatch<AppUser>(
      `/admin/users/${userId}/status`,
      { status },
      options
    );
  },

  /**
   * Update user role
   */
  async updateUserRole(
    userId: number,
    role: string,
    options?: ServerFetchOptions
  ): Promise<AppUser> {
    return serverPatch<AppUser>(
      `/admin/users/${userId}/role`,
      { role },
      options
    );
  },

  /**
   * Delete user (soft delete)
   */
  async deleteUser(
    userId: number,
    options?: ServerFetchOptions
  ): Promise<void> {
    return serverDelete<void>(`/admin/users/${userId}`, options);
  },

  /**
   * Bulk update users
   */
  async bulkUpdateUsers(
    userIds: number[],
    updates: {
      status?: string;
      role?: string;
      institutionId?: number;
    },
    options?: ServerFetchOptions
  ): Promise<{ updated: number }> {
    return serverPatch<{ updated: number }>(
      '/admin/users/bulk',
      { userIds, updates },
      options
    );
  },
};

// ===================================================================================
// ## Institution Management
// ===================================================================================

export const adminInstitutionsServer = {
  /**
   * Get all institutions
   */
  async getInstitutions(
    page: number = 1,
    limit: number = 20,
    filters?: {
      status?: string;
      search?: string;
    },
    options?: ServerFetchOptions
  ): Promise<PaginatedResponse<Institution>> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (filters) {
      if (filters.status) params.append('status', filters.status);
      if (filters.search) params.append('search', filters.search);
    }
    
    return serverGet<PaginatedResponse<Institution>>(
      `/admin/institutions?${params.toString()}`,
      options
    );
  },

  /**
   * Get institution by ID
   */
  async getInstitutionById(
    institutionId: number,
    options?: ServerFetchOptions
  ): Promise<Institution> {
    return serverGet<Institution>(
      `/admin/institutions/${institutionId}`,
      options
    );
  },

  /**
   * Create new institution
   */
  async createInstitution(
    data: {
      name: string;
      type: string;
      location?: string;
      contactEmail?: string;
      contactPhone?: string;
    },
    options?: ServerFetchOptions
  ): Promise<Institution> {
    return serverPost<Institution>('/admin/institutions', data, options);
  },

  /**
   * Update institution
   */
  async updateInstitution(
    institutionId: number,
    data: Partial<{
      name: string;
      type: string;
      location: string;
      contactEmail: string;
      contactPhone: string;
      status: string;
    }>,
    options?: ServerFetchOptions
  ): Promise<Institution> {
    return serverPatch<Institution>(
      `/admin/institutions/${institutionId}`,
      data,
      options
    );
  },

  /**
   * Delete institution
   */
  async deleteInstitution(
    institutionId: number,
    options?: ServerFetchOptions
  ): Promise<void> {
    return serverDelete<void>(`/admin/institutions/${institutionId}`, options);
  },

  /**
   * Get institution statistics
   */
  async getInstitutionStats(
    institutionId: number,
    options?: ServerFetchOptions
  ): Promise<InstitutionDetailedStats> {
    return serverGet<InstitutionDetailedStats>(
      `/admin/institutions/${institutionId}/stats`,
      options
    );
  },
};

// ===================================================================================
// ## Content Management
// ===================================================================================

export const adminContentServer = {
  /**
   * Get aptitude questions with filters
   */
  async getAptitudeQuestions(
    page: number = 1,
    limit: number = 20,
    filters?: {
      category?: string;
      difficulty?: string;
      institutionId?: number;
    },
    options?: ServerFetchOptions
  ): Promise<PaginatedResponse<any>> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (filters) {
      if (filters.category) params.append('category', filters.category);
      if (filters.difficulty) params.append('difficulty', filters.difficulty);
      if (filters.institutionId) params.append('institutionId', filters.institutionId.toString());
    }
    
    return serverGet<PaginatedResponse<any>>(
      `/admin/content/aptitude?${params.toString()}`,
      options
    );
  },

  /**
   * Get coding problems with filters
   */
  async getCodingProblems(
    page: number = 1,
    limit: number = 20,
    filters?: {
      difficulty?: string;
      isPublic?: boolean;
      institutionId?: number;
    },
    options?: ServerFetchOptions
  ): Promise<PaginatedResponse<any>> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (filters) {
      if (filters.difficulty) params.append('difficulty', filters.difficulty);
      if (filters.isPublic !== undefined) params.append('isPublic', filters.isPublic.toString());
      if (filters.institutionId) params.append('institutionId', filters.institutionId.toString());
    }
    
    return serverGet<PaginatedResponse<any>>(
      `/admin/content/coding?${params.toString()}`,
      options
    );
  },

  /**
   * Bulk import content
   */
  async bulkImportContent(
    type: 'aptitude' | 'coding',
    data: any[],
    options?: ServerFetchOptions
  ): Promise<{ imported: number; failed: number; errors?: string[] }> {
    return serverPost<{ imported: number; failed: number; errors?: string[] }>(
      `/admin/content/${type}/bulk-import`,
      { items: data },
      options
    );
  },
};

// ===================================================================================
// ## Helper Functions
// ===================================================================================

/**
 * Helper to determine if stats are for Super Admin
 */
export function isSuperAdminStats(stats: AdminStats): stats is SuperAdminStats {
  return stats.role === 'SUPER_ADMIN';
}

/**
 * Helper to determine if stats are for Institution Admin
 */
export function isInstitutionAdminStats(stats: AdminStats): stats is InstitutionAdminStats {
  return stats.role === 'INSTITUTION_ADMIN';
}

/**
 * Format statistics for display
 */
export function formatStatValue(
  value: number,
  type: 'number' | 'percentage' | 'currency' = 'number'
): string {
  switch (type) {
    case 'percentage':
      return `${value.toFixed(1)}%`;
    case 'currency':
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
      }).format(value);
    default:
      return new Intl.NumberFormat('en-US').format(value);
  }
}

/**
 * Calculate percentage change between two values
 */
export function calculatePercentageChange(
  current: number,
  previous: number
): {
  value: number;
  trend: 'up' | 'down' | 'stable';
} {
  if (previous === 0) {
    return { value: current > 0 ? 100 : 0, trend: current > 0 ? 'up' : 'stable' };
  }
  
  const change = ((current - previous) / previous) * 100;
  
  return {
    value: Math.abs(change),
    trend: change > 0 ? 'up' : change < 0 ? 'down' : 'stable',
  };
}

/**
 * Get trend indicator color
 */
export function getTrendColor(
  trend: 'up' | 'down' | 'stable',
  isPositive = true
): string {
  if (trend === 'stable') return 'text-gray-500';
  
  const isGood = (trend === 'up' && isPositive) || (trend === 'down' && !isPositive);
  return isGood ? 'text-green-600' : 'text-red-600';
}

/**
 * Get status badge color
 */
export function getStatusBadgeColor(status: string): string {
  const statusColors: Record<string, string> = {
    ACTIVE: 'bg-green-100 text-green-800',
    SUSPENDED: 'bg-red-100 text-red-800',
    DELETED: 'bg-gray-100 text-gray-800',
    PENDING_PROFILE_COMPLETION: 'bg-yellow-100 text-yellow-800',
    PENDING: 'bg-yellow-100 text-yellow-800',
    REVIEWED: 'bg-blue-100 text-blue-800',
    SHORTLISTED: 'bg-purple-100 text-purple-800',
    REJECTED: 'bg-red-100 text-red-800',
    ACCEPTED: 'bg-green-100 text-green-800',
  };
  
  return statusColors[status] || 'bg-gray-100 text-gray-800';
}

/**
 * Time range presets for quick selection
 */
export const TIME_RANGE_PRESETS = {
  TODAY: { range: 'day' as const },
  THIS_WEEK: { range: 'week' as const },
  THIS_MONTH: { range: 'month' as const },
  THIS_QUARTER: { range: 'quarter' as const },
  THIS_YEAR: { range: 'year' as const },
  LAST_7_DAYS: {
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date().toISOString(),
  },
  LAST_30_DAYS: {
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date().toISOString(),
  },
  LAST_90_DAYS: {
    startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date().toISOString(),
  },
} as const;

// ===================================================================================
// ## Unified Export (for convenience)
// ===================================================================================

/**
 * Unified admin API for server-side use
 */
export const adminApiServer = {
  stats: adminStatsServer,
  users: adminUsersServer,
  institutions: adminInstitutionsServer,
  content: adminContentServer,
};

// Export types
export type {
  AdminStats,
  SuperAdminStats,
  InstitutionAdminStats,
  StatsTimeRangeDto,
  UserAnalytics,
  AssessmentAnalytics,
  InstitutionDetailedStats,
  PlatformHealthMetrics,
  ExportFormat,
};