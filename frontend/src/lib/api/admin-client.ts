'use client';

import { apiGet, downloadFile } from './client';
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
} from '@/types';

// Simple cache implementation
interface StatsCache {
  data: AdminStats | null;
  timestamp: number;
  TTL: number;
}

const statsCache: StatsCache = {
  data: null,
  timestamp: 0,
  TTL: 60000, // 1 minute
};

/**
 * Admin API client for browser-side operations
 */
export const adminApi = {
  /**
   * Get dashboard statistics (cached)
   * Note: Backend /admin/stats endpoint doesn't support query parameters currently
   */
  async getDashboardStats(useCache: boolean = true): Promise<AdminStats> {
    const now = Date.now();
    
    // Return cached data if fresh and cache is enabled
    if (useCache && statsCache.data && (now - statsCache.timestamp) < statsCache.TTL) {
      console.log('[adminApi.getDashboardStats] Returning cached stats');
      return statsCache.data;
    }
    
    console.log('[adminApi.getDashboardStats] Fetching fresh stats');
    const stats = await apiGet<AdminStats>('/admin/stats');
    
    // Update cache
    statsCache.data = stats;
    statsCache.timestamp = now;
    
    return stats;
  },

  /**
   * Get dashboard statistics with time range (when backend supports it)
   * Currently falls back to regular stats
   */
  async getDashboardStatsFiltered(timeRange: StatsTimeRangeDto): Promise<AdminStats> {
    console.warn('[adminApi.getDashboardStatsFiltered] Time-range filtering not yet implemented by backend');
    // When backend supports it, uncomment:
    // const params = new URLSearchParams();
    // if (timeRange.startDate) params.append('startDate', String(timeRange.startDate));
    // if (timeRange.endDate) params.append('endDate', String(timeRange.endDate));
    // if (timeRange.range) params.append('range', timeRange.range);
    // return apiGet<AdminStats>(`/admin/stats?${params.toString()}`);
    
    return this.getDashboardStats(false); // Don't use cache for explicit filter requests
  },

  /**
   * Clear stats cache
   */
  clearStatsCache() {
    statsCache.data = null;
    statsCache.timestamp = 0;
    console.log('[adminApi.clearStatsCache] Cache cleared');
  },

  /**
   * Get user analytics (Super Admin only)
   */
  async getUserAnalytics(
    startDate?: Date | string,
    endDate?: Date | string
  ): Promise<UserAnalytics> {
    const params = new URLSearchParams();
    let hasParams = false;
    
    if (startDate) {
      params.append('startDate', String(startDate));
      hasParams = true;
    }
    if (endDate) {
      params.append('endDate', String(endDate));
      hasParams = true;
    }
    
    const endpoint = hasParams 
      ? `/admin/analytics/users?${params.toString()}` 
      : '/admin/analytics/users';
    
    return apiGet<UserAnalytics>(endpoint);
  },

  /**
   * Get assessment performance analytics
   */
  async getAssessmentAnalytics(timeRange?: StatsTimeRangeDto): Promise<AssessmentAnalytics> {
    const params = new URLSearchParams();
    let hasParams = false;
    
    if (timeRange) {
      if (timeRange.startDate) {
        params.append('startDate', String(timeRange.startDate));
        hasParams = true;
      }
      if (timeRange.endDate) {
        params.append('endDate', String(timeRange.endDate));
        hasParams = true;
      }
      if (timeRange.range) {
        params.append('range', timeRange.range);
        hasParams = true;
      }
    }
    
    const endpoint = hasParams
      ? `/admin/analytics/assessments?${params.toString()}`
      : '/admin/analytics/assessments';
    
    return apiGet<AssessmentAnalytics>(endpoint);
  },

  /**
   * Get detailed statistics for a specific institution (Super Admin only)
   */
  async getInstitutionStats(institutionId: number): Promise<InstitutionDetailedStats> {
    return apiGet<InstitutionDetailedStats>(`/admin/institutions/${institutionId}/stats`);
  },

  /**
   * Get platform health metrics (Super Admin only)
   */
  async getPlatformHealthMetrics(): Promise<PlatformHealthMetrics> {
    return apiGet<PlatformHealthMetrics>('/admin/health/metrics');
  },

  /**
   * Export statistics in specified format
   */
  async exportStats(
    format: ExportFormat = 'json',
    timeRange?: StatsTimeRangeDto
  ): Promise<any> {
    const params = new URLSearchParams();
    params.append('format', format);
    
    if (timeRange) {
      if (timeRange.startDate) params.append('startDate', String(timeRange.startDate));
      if (timeRange.endDate) params.append('endDate', String(timeRange.endDate));
      if (timeRange.range) params.append('range', timeRange.range);
    }
    
    const endpoint = `/admin/export/stats?${params.toString()}`;
    
    if (format === 'json') {
      return apiGet<any>(endpoint);
    }
    
    const timestamp = new Date().toISOString().split('T')[0];
    const extension = format === 'csv' ? 'csv' : format === 'excel' ? 'xlsx' : 'json';
    const filename = `statistics_${timestamp}.${extension}`;
    
    return downloadFile(endpoint, filename);
  },

  /**
   * Get quick stats summary (uses cached data when possible)
   */
  async getQuickStats(): Promise<{
    totalUsers: number;
    activeToday: number;
    newThisWeek: number;
    totalInstitutions?: number;
  }> {
    const stats = await this.getDashboardStats(true); // Use cache
    
    if (stats.role === 'SUPER_ADMIN') {
      const superStats = stats as SuperAdminStats;
      return {
        totalUsers: superStats.totalUsers,
        activeToday: superStats.platformActivity.activeSessionsCount,
        newThisWeek: superStats.growth.usersThisMonth,
        totalInstitutions: superStats.totalInstitutions,
      };
    } else {
      const instStats = stats as InstitutionAdminStats;
      return {
        totalUsers: instStats.students.total,
        activeToday: instStats.students.active,
        newThisWeek: instStats.recentActivity.lastWeekRegistrations,
      };
    }
  },

  /**
   * Get real-time activity metrics (with intelligent caching)
   */
  async getRealTimeMetrics(): Promise<{
    activeSessions: number;
    queuedSubmissions: number;
    recentSubmissions: number;
    aiInterviewsInProgress: number;
  }> {
    // Use cached stats for basic metrics
    const stats = await this.getDashboardStats(true);
    
    if (stats.role === 'SUPER_ADMIN') {
      try {
        // Try to get real-time health metrics (not cached)
        const [superStats, health] = await Promise.all([
          Promise.resolve(stats as SuperAdminStats),
          this.getPlatformHealthMetrics().catch(() => null),
        ]);
        
        if (health) {
          return {
            activeSessions: health.activeSessions,
            queuedSubmissions: health.queuedSubmissions,
            recentSubmissions: superStats.platformActivity.totalSubmissions,
            aiInterviewsInProgress: superStats.platformActivity.totalAiInterviews,
          };
        }
        
        // Fall back to stats only
        return {
          activeSessions: superStats.platformActivity.activeSessionsCount,
          queuedSubmissions: 0,
          recentSubmissions: superStats.platformActivity.totalSubmissions,
          aiInterviewsInProgress: superStats.platformActivity.totalAiInterviews,
        };
      } catch (error) {
        console.error('[adminApi.getRealTimeMetrics] Error:', error);
        const superStats = stats as SuperAdminStats;
        return {
          activeSessions: superStats.platformActivity.activeSessionsCount,
          queuedSubmissions: 0,
          recentSubmissions: superStats.platformActivity.totalSubmissions,
          aiInterviewsInProgress: superStats.platformActivity.totalAiInterviews,
        };
      }
    } else {
      const instStats = stats as InstitutionAdminStats;
      return {
        activeSessions: instStats.students.active,
        queuedSubmissions: 0,
        recentSubmissions: instStats.recentActivity.lastWeekSubmissions,
        aiInterviewsInProgress: instStats.aiInterviews.thisMonth,
      };
    }
  },
};

// Helper functions remain the same...
export function isSuperAdminStats(stats: AdminStats): stats is SuperAdminStats {
  return stats.role === 'SUPER_ADMIN';
}

export function isInstitutionAdminStats(stats: AdminStats): stats is InstitutionAdminStats {
  return stats.role === 'INSTITUTION_ADMIN';
}

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

export function getTrendColor(
  trend: 'up' | 'down' | 'stable',
  isPositive = true
): string {
  if (trend === 'stable') return 'text-gray-500';
  
  const isGood = (trend === 'up' && isPositive) || (trend === 'down' && !isPositive);
  return isGood ? 'text-green-600' : 'text-red-600';
}

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

export function getDifficultyBadgeColor(difficulty: string): string {
  const difficultyColors: Record<string, string> = {
    EASY: 'bg-green-100 text-green-800',
    MEDIUM: 'bg-yellow-100 text-yellow-800',
    HARD: 'bg-red-100 text-red-800',
  };
  
  return difficultyColors[difficulty] || 'bg-gray-100 text-gray-800';
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(d);
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

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

export function prepareChartData(
  data: Record<string, number>,
  type: 'pie' | 'bar' | 'line' = 'bar'
): any[] {
  const entries = Object.entries(data);
  
  if (type === 'pie') {
    return entries.map(([name, value]) => ({
      name,
      value,
      percentage: 0,
    }));
  }
  
  return entries.map(([label, value]) => ({
    label,
    value,
  }));
}

export function getChartColors(count: number): string[] {
  const baseColors = [
    '#3B82F6', // blue
    '#10B981', // green
    '#F59E0B', // yellow
    '#EF4444', // red
    '#8B5CF6', // purple
    '#EC4899', // pink
    '#14B8A6', // teal
    '#F97316', // orange
  ];
  
  const colors: string[] = [];
  for (let i = 0; i < count; i++) {
    colors.push(baseColors[i % baseColors.length]);
  }
  return colors;
}

export function getMetricNotificationType(
  metricName: string,
  change: number
): 'success' | 'warning' | 'error' | 'info' {
  const positiveMetrics = [
    'users', 'students', 'submissions', 'completions', 
    'registrations', 'active', 'score'
  ];
  
  const negativeMetrics = [
    'suspended', 'deleted', 'rejected', 'failed', 'errors'
  ];
  
  const isPositiveMetric = positiveMetrics.some(m => 
    metricName.toLowerCase().includes(m)
  );
  
  const isNegativeMetric = negativeMetrics.some(m => 
    metricName.toLowerCase().includes(m)
  );
  
  if (isPositiveMetric) {
    return change > 10 ? 'success' : change < -10 ? 'warning' : 'info';
  }
  
  if (isNegativeMetric) {
    return change > 10 ? 'error' : change < -10 ? 'success' : 'info';
  }
  
  return 'info';
}

export function validateStatsData(data: any): data is AdminStats {
  if (!data || typeof data !== 'object') return false;
  
  if (!data.role || !data.generatedAt) return false;
  
  if (data.role === 'SUPER_ADMIN') {
    return !!(
      data.totalUsers !== undefined &&
      data.usersByStatus &&
      data.usersByRole &&
      data.totalInstitutions !== undefined &&
      data.assessmentContent &&
      data.platformActivity &&
      data.growth
    );
  }
  
  if (data.role === 'INSTITUTION_ADMIN') {
    return !!(
      data.institutionId !== undefined &&
      data.institutionName &&
      data.students &&
      data.assessmentPerformance &&
      data.careerOpportunities &&
      data.aiInterviews &&
      data.content &&
      data.recentActivity
    );
  }
  
  return false;
}

export function getDefaultStats(role: 'SUPER_ADMIN' | 'INSTITUTION_ADMIN'): AdminStats {
  const baseStats = {
    generatedAt: new Date(),
  };
  
  if (role === 'SUPER_ADMIN') {
    return {
      ...baseStats,
      role: 'SUPER_ADMIN',
      totalUsers: 0,
      usersByStatus: {
        ACTIVE: 0,
        SUSPENDED: 0,
        DELETED: 0,
        PENDING_PROFILE_COMPLETION: 0,
      },
      usersByRole: {
        students: 0,
        institutionAdmins: 0,
        superAdmins: 0,
      },
      totalInstitutions: 0,
      assessmentContent: {
        totalAptitudeQuestions: 0,
        aptitudeByDifficulty: { EASY: 0, MEDIUM: 0, HARD: 0 },
        totalCodingProblems: 0,
        codingByDifficulty: { EASY: 0, MEDIUM: 0, HARD: 0 },
        publicCodingProblems: 0,
      },
      platformActivity: {
        totalSubmissions: 0,
        totalAiInterviews: 0,
        totalResumes: 0,
        activeSessionsCount: 0,
      },
      growth: {
        usersThisMonth: 0,
        usersLastMonth: 0,
        growthPercentage: 0,
      },
    } as SuperAdminStats;
  }
  
  return {
    ...baseStats,
    role: 'INSTITUTION_ADMIN',
    institutionId: 0,
    institutionName: '',
    students: {
      total: 0,
      active: 0,
      suspended: 0,
      pendingProfileCompletion: 0,
      byGraduationYear: {},
    },
    assessmentPerformance: {
      averageAptitudeScore: 0,
      totalAptitudeAttempts: 0,
      averageCodingScore: 0,
      totalCodingSubmissions: 0,
      topPerformers: [],
    },
    careerOpportunities: {
      jobs: {
        total: 0,
        active: 0,
        applications: {
          PENDING: 0,
          REVIEWED: 0,
          SHORTLISTED: 0,
          REJECTED: 0,
          ACCEPTED: 0,
        },
      },
      internships: {
        total: 0,
        active: 0,
        applications: {
          PENDING: 0,
          REVIEWED: 0,
          SHORTLISTED: 0,
          REJECTED: 0,
          ACCEPTED: 0,
        },
      },
      hackathons: {
        total: 0,
        upcoming: 0,
        registrations: {
          PENDING: 0,
          REVIEWED: 0,
          SHORTLISTED: 0,
          REJECTED: 0,
          ACCEPTED: 0,
        },
      },
    },
    aiInterviews: {
      totalSessions: 0,
      completedSessions: 0,
      averageScore: 0,
      thisMonth: 0,
    },
    content: {
      aptitudeTests: 0,
      codingProblems: 0,
      batches: 0,
    },
    recentActivity: {
      lastWeekSubmissions: 0,
      lastWeekApplications: 0,
      lastWeekRegistrations: 0,
    },
  } as InstitutionAdminStats;
}

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