'use client';

import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import type { UserListFilters } from '@/types';
import { Role, UserStatus } from '@/types/enum';

interface FiltersPanelProps {
  filters: UserListFilters;
  onFiltersChange: (filters: UserListFilters) => void;
  userRole: Role;
  onClose: () => void;
}

export default function FiltersPanel({ 
  filters, 
  onFiltersChange, 
  userRole,
  onClose 
}: FiltersPanelProps) {
  const updateFilter = (key: keyof UserListFilters, value: any) => {
    onFiltersChange({ ...filters, [key]: value, page: 1 });
  };

  const resetFilters = () => {
    onFiltersChange({
      page: 1,
      limit: 12,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
  };

  return (
    <div className="mb-6 p-4 bg-muted/50 rounded-lg border">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold">Filters</h3>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X size={16} />
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Role Filter */}
        <div>
          <Label>Role</Label>
          <Select
            value={filters.role || 'all'}
            onValueChange={(value) => updateFilter('role', value === 'all' ? undefined : value as Role)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value={Role.STUDENT}>Student</SelectItem>
              <SelectItem value={Role.INSTITUTION_ADMIN}>Institution Admin</SelectItem>
              {userRole === Role.SUPER_ADMIN && (
                <SelectItem value={Role.SUPER_ADMIN}>Super Admin</SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Status Filter */}
        <div>
          <Label>Status</Label>
          <Select
            value={filters.status || 'all'}
            onValueChange={(value) => updateFilter('status', value === 'all' ? undefined : value as UserStatus)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value={UserStatus.ACTIVE}>Active</SelectItem>
              <SelectItem value={UserStatus.SUSPENDED}>Suspended</SelectItem>
              <SelectItem value={UserStatus.PENDING_PROFILE_COMPLETION}>Pending</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Sort By */}
        <div>
          <Label>Sort By</Label>
          <Select
            value={filters.sortBy || 'createdAt'}
            onValueChange={(value) => updateFilter('sortBy', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="createdAt">Join Date</SelectItem>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="lastLoginAt">Last Login</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Sort Order */}
        <div>
          <Label>Order</Label>
          <Select
            value={filters.sortOrder || 'desc'}
            onValueChange={(value) => updateFilter('sortOrder', value as 'asc' | 'desc')}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="asc">Ascending</SelectItem>
              <SelectItem value="desc">Descending</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <Button variant="outline" size="sm" onClick={resetFilters}>
          Reset Filters
        </Button>
      </div>
    </div>
  );
}