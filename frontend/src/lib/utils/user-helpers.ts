import type { AppUser, FullUserProfile } from '@/types';
import { Role, UserStatus } from '@/types/enum';

/**
 * Get badge class for user role
 */
export const getRoleBadgeClass = (role: Role): string => {
  switch (role) {
    case Role.SUPER_ADMIN:
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
    case Role.INSTITUTION_ADMIN:
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    case Role.STUDENT:
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  }
};

/**
 * Get display name for user role
 */
export const getRoleDisplayName = (role: Role): string => {
  switch (role) {
    case Role.SUPER_ADMIN:
      return 'Super Admin';
    case Role.INSTITUTION_ADMIN:
      return 'Admin';
    case Role.STUDENT:
      return 'Student';
  }
};
/**
 * Get badge variant for user status
 */
export const getUserStatusColor = (
  status: UserStatus
): 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' => {
  switch (status) {
    case UserStatus.ACTIVE:
      return 'success';
    case UserStatus.SUSPENDED:
      return 'destructive';
    case UserStatus.DELETED:
      return 'destructive';
    case UserStatus.PENDING_PROFILE_COMPLETION:
      return 'warning';
    default:
      return 'outline';
  }
};

/**
 * Format user display name
 */
export const formatUserDisplayName = (user: AppUser | FullUserProfile): string => {
  if (user.profile?.fullName) {
    return user.profile.fullName;
  }
  return user.email.split('@')[0];
};

/**
 * Calculate profile completion percentage
 */
export const calculateProfileCompletion = (user: AppUser | FullUserProfile): number => {
  if (!user.profile) return 0;

  const fields = [
    user.profile.fullName,
    user.profile.graduationYear,
    user.profile.profileImageUrl,
    user.profile.linkedinUrl,
    user.profile.githubUrl,
    user.profile.sscPercentage,
    user.profile.hscPercentage,
    user.profile.averageCgpa,
  ];

  const completedFields = fields.filter(
    (field) => field !== null && field !== undefined
  ).length;

  return Math.round((completedFields / fields.length) * 100);
};

/**
 * Check if user can be edited by current user
 */
export const canEditUser = (
  targetUser: AppUser,
  currentUserRole: Role,
  currentUserInstitutionId?: number
): boolean => {
  // Super admin can edit anyone except other super admins
  if (currentUserRole === Role.SUPER_ADMIN) {
    return targetUser.role !== Role.SUPER_ADMIN;
  }

  // Institution admin can edit users in their institution
  if (currentUserRole === Role.INSTITUTION_ADMIN) {
    return (
      targetUser.role === Role.STUDENT &&
      targetUser.institution?.id === currentUserInstitutionId
    );
  }

  return false;
};

/**
 * Check if current user can change roles
 */
export const canChangeRole = (currentUserRole: Role): boolean => {
  return currentUserRole === Role.SUPER_ADMIN;
};

/**
 * Check if current user can suspend/delete users
 */
export const canSuspendUser = (
  targetUser: AppUser,
  currentUserRole: Role,
  currentUserInstitutionId?: number
): boolean => {
  if (currentUserRole === Role.SUPER_ADMIN) {
    return targetUser.role !== Role.SUPER_ADMIN;
  }

  if (currentUserRole === Role.INSTITUTION_ADMIN) {
    return (
      targetUser.role === Role.STUDENT &&
      targetUser.institution?.id === currentUserInstitutionId
    );
  }

  return false;
};

/**
 * Get user initials for avatar
 */
export const getUserInitials = (user: AppUser | FullUserProfile): string => {
  if (user.profile?.fullName) {
    const names = user.profile.fullName.split(' ');
    if (names.length >= 2) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return names[0][0].toUpperCase();
  }
  return user.email[0].toUpperCase();
};

/**
 * Format date for display
 */
export const formatDate = (date: string | Date): string => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

/**
 * Format relative time (e.g., "2 days ago")
 */
export const formatRelativeTime = (date: string | Date): string => {
  const now = new Date();
  const past = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 604800)} weeks ago`;
  if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)} months ago`;
  return `${Math.floor(diffInSeconds / 31536000)} years ago`;
};

/**
 * Get activity level based on login frequency
 */
export const getActivityLevel = (lastLoginAt?: string | null): {
  level: 'active' | 'moderate' | 'inactive';
  label: string;
  color: string;
} => {
  if (!lastLoginAt) {
    return {
      level: 'inactive',
      label: 'Never logged in',
      color: 'text-gray-500',
    };
  }

  const daysSinceLogin = Math.floor(
    (Date.now() - new Date(lastLoginAt).getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysSinceLogin <= 7) {
    return {
      level: 'active',
      label: 'Active',
      color: 'text-green-600',
    };
  } else if (daysSinceLogin <= 30) {
    return {
      level: 'moderate',
      label: 'Moderately Active',
      color: 'text-yellow-600',
    };
  } else {
    return {
      level: 'inactive',
      label: 'Inactive',
      color: 'text-red-600',
    };
  }
};

/**
 * Validate password strength
 */
export const validatePassword = (password: string): {
  valid: boolean;
  errors: string[];
  strength: 'weak' | 'medium' | 'strong';
} => {
  const errors: string[] = [];
  let strength: 'weak' | 'medium' | 'strong' = 'weak';

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/[\d\W]/.test(password)) {
    errors.push('Password must contain at least one number or special character');
  }

  // Calculate strength
  if (errors.length === 0) {
    if (password.length >= 12 && /[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      strength = 'strong';
    } else if (password.length >= 10) {
      strength = 'medium';
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    strength,
  };
};

/**
 * Build user avatar URL
 */
export const getUserAvatarUrl = (user: AppUser | FullUserProfile, size: number = 200): string => {
  if (user.profile?.profileImageUrl) {
    return user.profile.profileImageUrl;
  }

  const name = user.profile?.fullName || user.email;
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=${size}&background=random`;
};

/**
 * Sort users by various criteria
 */
export const sortUsers = (
  users: AppUser[],
  sortBy: 'name' | 'email' | 'joinDate' | 'lastLogin' | 'role',
  order: 'asc' | 'desc' = 'asc'
): AppUser[] => {
  return [...users].sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case 'name':
        comparison = (a.profile?.fullName || a.email).localeCompare(
          b.profile?.fullName || b.email
        );
        break;
      case 'email':
        comparison = a.email.localeCompare(b.email);
        break;
      case 'joinDate':
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        break;
      case 'lastLogin':
        const aLogin = a.lastLoginAt ? new Date(a.lastLoginAt).getTime() : 0;
        const bLogin = b.lastLoginAt ? new Date(b.lastLoginAt).getTime() : 0;
        comparison = aLogin - bLogin;
        break;
      case 'role':
        comparison = a.role.localeCompare(b.role);
        break;
    }

    return order === 'asc' ? comparison : -comparison;
  });
};

/**
 * Filter users by search term
 */
export const filterUsersBySearch = (users: AppUser[], searchTerm: string): AppUser[] => {
  if (!searchTerm.trim()) return users;

  const term = searchTerm.toLowerCase();
  return users.filter(
    (user) =>
      user.email.toLowerCase().includes(term) ||
      user.profile?.fullName?.toLowerCase().includes(term) ||
      user.institution?.name?.toLowerCase().includes(term)
  );
};

/**
 * Group users by role
 */
export const groupUsersByRole = (users: AppUser[]): Record<Role, AppUser[]> => {
  return users.reduce(
    (acc, user) => {
      if (!acc[user.role]) {
        acc[user.role] = [];
      }
      acc[user.role].push(user);
      return acc;
    },
    {} as Record<Role, AppUser[]>
  );
};

/**
 * Group users by status
 */
export const groupUsersByStatus = (users: AppUser[]): Record<UserStatus, AppUser[]> => {
  return users.reduce(
    (acc, user) => {
      if (!acc[user.status]) {
        acc[user.status] = [];
      }
      acc[user.status].push(user);
      return acc;
    },
    {} as Record<UserStatus, AppUser[]>
  );
};