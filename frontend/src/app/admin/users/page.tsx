'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Users, 
  Loader2, 
  ShieldAlert, 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  UserX,
  Filter,
  Download,
  RefreshCw,
} from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';
import { 
  getAllUsers, 
  exportUsers,
} from '@/lib/api/users.client';
import type { AppUser, UserListFilters, PaginatedResponse } from '@/types';
import { Role } from '@/types/enum';

// Components
import UserDetailModal from '@/components/admin/user/UserDetailModal';
import RoleChangeModal from '@/components/admin/user/RoleChangeModal';
import StatusChangeModal from '@/components/admin/user/StatusChangeModal';
import BulkActionsModal from '@/components/admin/user/BulkActionsModal';

import FiltersPanel from '@/components/admin/user/FiltersPanel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import UserCard from '@/components/admin/user/UserCard';

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export default function ManageUsersPage() {
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  // Data state
  const [users, setUsers] = useState<AppUser[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters state
  const [filters, setFilters] = useState<UserListFilters>({
    page: 1,
    limit: 12,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });
  
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  
  // UI state
  const [selectedUser, setSelectedUser] = useState<AppUser | null>(null);
  const [userToEdit, setUserToEdit] = useState<AppUser | null>(null);
  const [userToChangeStatus, setUserToChangeStatus] = useState<AppUser | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Authorization check
  useEffect(() => {
    if (!isAuthLoading && (!isAuthenticated || ![Role.SUPER_ADMIN, Role.INSTITUTION_ADMIN].includes(user?.role!))) {
      router.push('/admin/dashboard');
    }
  }, [isAuthLoading, isAuthenticated, user, router]);

  // Apply institution filter for institution admins
  useEffect(() => {
    if (user?.role === Role.INSTITUTION_ADMIN && user.institution) {
      setFilters(prev => ({
        ...prev,
        institutionId: user.institution!.id,
      }));
    }
  }, [user]);

  // Fetch users
  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const filterParams: UserListFilters = {
        ...filters,
        search: debouncedSearchTerm || undefined,
      };

      const response: PaginatedResponse<AppUser> = await getAllUsers(filterParams);
      
      setUsers(response.data);
      setTotal(response.pagination.total);
    } catch (err: any) {
      setError(err.message || 'Failed to load users');
      toast({
        title: 'Error',
        description: err.message || 'Failed to load users',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch on filter/search changes
  useEffect(() => {
    if (isAuthenticated) {
      fetchUsers();
    }
  }, [isAuthenticated, filters, debouncedSearchTerm]);

  // Reset page when search changes
  useEffect(() => {
    if (searchTerm) {
      setFilters(prev => ({ ...prev, page: 1 }));
    }
  }, [debouncedSearchTerm]);

  // Handle export
  const handleExport = async () => {
    setExporting(true);
    try {
      await exportUsers('csv');
      toast({
        title: 'Success',
        description: 'Users exported successfully',
      });
    } catch (err: any) {
      toast({
        title: 'Export Failed',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setExporting(false);
    }
  };

  // Handle user selection for bulk actions
  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const selectAllUsers = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map(u => u.id));
    }
  };

  if (isAuthLoading || (!user && !error)) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  const totalPages = Math.ceil(total / (filters.limit || 12));
  const canChangeRole = user?.role === Role.SUPER_ADMIN;
  const canBulkAction = selectedUsers.length > 0;

  return (
    <>
      <div className="p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <Users size={32} />
              <span>
                {user?.role === Role.SUPER_ADMIN 
                  ? 'User Management' 
                  : `${user?.institution?.name || 'Institution'} Users`}
              </span>
            </h1>
            <p className="mt-2 text-muted-foreground">
              {user?.role === Role.SUPER_ADMIN 
                ? 'Manage all users across the platform' 
                : 'Manage users in your institution'}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter size={16} className="mr-2" />
              Filters
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={fetchUsers}
              disabled={loading}
            >
              <RefreshCw size={16} className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={exporting}
            >
              <Download size={16} className="mr-2" />
              {exporting ? 'Exporting...' : 'Export'}
            </Button>

            {canBulkAction && (
              <Button
                variant="default"
                size="sm"
                onClick={() => setShowBulkActions(true)}
              >
                Bulk Actions ({selectedUsers.length})
              </Button>
            )}
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
            <Input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <FiltersPanel
            filters={filters}
            onFiltersChange={setFilters}
            userRole={user?.role!}
            onClose={() => setShowFilters(false)}
          />
        )}

        {/* Selection Controls */}
        {users.length > 0 && canChangeRole && (
          <div className="mb-4 flex items-center gap-4 text-sm">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedUsers.length === users.length}
                onChange={selectAllUsers}
                className="w-4 h-4 rounded border-gray-300"
              />
              <span>Select All</span>
            </label>
            {selectedUsers.length > 0 && (
              <span className="text-muted-foreground">
                {selectedUsers.length} selected
              </span>
            )}
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="text-center py-10">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center text-destructive p-8 bg-destructive/10 rounded-lg">
            <ShieldAlert className="w-16 h-16 mb-4" />
            <h2 className="text-2xl font-bold">Failed to load users</h2>
            <p className="mt-2">{error}</p>
            <Button onClick={fetchUsers} className="mt-4">
              Try Again
            </Button>
          </div>
        ) : users.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {users.map(u => (
                <UserCard
                  key={u.id}
                  user={u}
                  onViewDetails={setSelectedUser}
                  onChangeRole={canChangeRole ? setUserToEdit : undefined}
                  onChangeStatus={setUserToChangeStatus}
                  selected={selectedUsers.includes(u.id)}
                  onSelect={canChangeRole ? () => toggleUserSelection(u.id) : undefined}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-8">
                <div className="text-sm text-muted-foreground">
                  Page <span className="font-medium">{filters.page}</span> of{' '}
                  <span className="font-medium">{totalPages}</span> ({total} users)
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setFilters(prev => ({ ...prev, page: prev.page! - 1 }))}
                    disabled={filters.page === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setFilters(prev => ({ ...prev, page: prev.page! + 1 }))}
                    disabled={filters.page! >= totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-16 text-muted-foreground">
            <UserX className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg">No users found</p>
            {searchTerm && (
              <p className="text-sm mt-2">
                Try adjusting your search or filters
              </p>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      {selectedUser && (
        <UserDetailModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
        />
      )}
      
      {userToEdit && (
        <RoleChangeModal
          user={userToEdit}
          onClose={() => setUserToEdit(null)}
          onSuccess={() => {
            setUserToEdit(null);
            fetchUsers();
            toast({
              title: 'Success',
              description: 'User role updated successfully',
            });
          }}
        />
      )}

      {userToChangeStatus && (
        <StatusChangeModal
          user={userToChangeStatus}
          onClose={() => setUserToChangeStatus(null)}
          onSuccess={() => {
            setUserToChangeStatus(null);
            fetchUsers();
            toast({
              title: 'Success',
              description: 'User status updated successfully',
            });
          }}
        />
      )}

      {showBulkActions && (
        <BulkActionsModal
          userIds={selectedUsers}
          onClose={() => setShowBulkActions(false)}
          onSuccess={() => {
            setShowBulkActions(false);
            setSelectedUsers([]);
            fetchUsers();
          }}
        />
      )}
    </>
  );
}