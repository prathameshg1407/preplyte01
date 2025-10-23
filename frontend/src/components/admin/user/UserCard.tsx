'use client';

import { 
  Mail, 
  Calendar, 
  Building, 
  Edit, 
  Eye, 
  Shield,
  CheckCircle2,
} from 'lucide-react';

import type { AppUser } from '@/types';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  getRoleBadgeClass, 
  getRoleDisplayName, 
  getUserStatusColor 
} from '@/lib/utils/user-helpers';

interface UserCardProps {
  user: AppUser;
  onViewDetails: (user: AppUser) => void;
  onChangeRole?: (user: AppUser) => void;
  onChangeStatus?: (user: AppUser) => void;
  selected?: boolean;
  onSelect?: () => void;
}

export default function UserCard({
  user,
  onViewDetails,
  onChangeRole,
  onChangeStatus,
  selected,
  onSelect,
}: UserCardProps) {
  return (
    <div className={`bg-card rounded-lg shadow-md border p-5 flex flex-col justify-between hover:shadow-xl transition-all duration-300 ${selected ? 'ring-2 ring-primary' : ''}`}>
      {/* Selection Checkbox */}
      {onSelect && (
        <div className="mb-2">
          <input
            type="checkbox"
            checked={selected}
            onChange={onSelect}
            onClick={(e) => e.stopPropagation()}
            className="w-4 h-4 rounded border-gray-300"
          />
        </div>
      )}

      {/* User Info */}
      <div 
        className="cursor-pointer flex-grow"
        onClick={() => onViewDetails(user)}
      >
        <div className="flex items-center gap-3 mb-4">
          <img
            src={
              user.profile?.profileImageUrl ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(
                user.profile?.fullName || user.email
              )}&background=e2e8f0&color=475569&size=64`
            }
            alt="Avatar"
            className="w-14 h-14 rounded-full object-cover flex-shrink-0"
          />
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-foreground truncate">
              {user.profile?.fullName || 'Profile Incomplete'}
            </h3>
            <div className="flex items-center gap-1 text-xs text-muted-foreground truncate">
              <Mail size={12} />
              <span className="truncate">{user.email}</span>
            </div>
          </div>
        </div>

        {/* User Details */}
        <div className="space-y-2 text-sm text-muted-foreground">
          {user.institution && (
            <div className="flex items-center gap-2">
              <Building size={14} className="flex-shrink-0" />
              <span className="truncate">{user.institution.name}</span>
            </div>
          )}
          
          <div className="flex items-center gap-2">
            <Calendar size={14} className="flex-shrink-0" />
            <span>
              Joined {new Date(user.createdAt).toLocaleDateString()}
            </span>
          </div>

          {user.lastLoginAt && (
            <div className="flex items-center gap-2">
              <CheckCircle2 size={14} className="flex-shrink-0" />
              <span>
                Last login {new Date(user.lastLoginAt).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>

        {/* Activity Stats */}
        {user._count && (
          <div className="mt-3 pt-3 border-t border-border grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-xs text-muted-foreground">Tests</div>
              <div className="font-semibold">{user._count.machineTestSubmissions || 0}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Interviews</div>
              <div className="font-semibold">{user._count.aiInterviewSessions || 0}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Jobs</div>
              <div className="font-semibold">{user._count.jobApplications || 0}</div>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="mt-4 pt-4 border-t border-border flex items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1">
          <Badge className={getRoleBadgeClass(user.role)}>
            {getRoleDisplayName(user.role)}
          </Badge>
          <Badge variant={getUserStatusColor(user.status)}>
            {user.status}
          </Badge>
        </div>
        
        <div className="flex gap-1">
          {onChangeRole && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onChangeRole(user);
              }}
              title="Change Role"
            >
              <Shield size={14} />
            </Button>
          )}
          {onChangeStatus && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onChangeStatus(user);
              }}
              title="Change Status"
            >
              <Edit size={14} />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails(user);
            }}
            title="View Details"
          >
            <Eye size={14} />
          </Button>
        </div>
      </div>
    </div>
  );
}