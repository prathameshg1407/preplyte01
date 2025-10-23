'use client';

import { useState } from 'react';
import { AppUser } from '@/types';
import UserCard from './UserCard';
import RoleChangeModal from './RoleChangeModal';
import StatusChangeModal from './StatusChangeModal';
import UserDetailModal from './UserDetailModal';

interface UserListProps {
  users: AppUser[];
  role: string;
  onUserClick?: (user: AppUser) => void;
  onRoleChangeSuccess?: () => void | Promise<void>;
}

export default function UserList({ 
  users = [], // Add default value
  role, 
  onUserClick,
  onRoleChangeSuccess 
}: UserListProps) {
  const [selectedUserForRole, setSelectedUserForRole] = useState<AppUser | null>(null);
  const [selectedUserForStatus, setSelectedUserForStatus] = useState<AppUser | null>(null);
  const [selectedUserForDetails, setSelectedUserForDetails] = useState<AppUser | null>(null);

  const handleViewDetails = (user: AppUser) => {
    if (onUserClick) {
      onUserClick(user);
    } else {
      setSelectedUserForDetails(user);
    }
  };

  const handleRoleChange = (user: AppUser) => {
    setSelectedUserForRole(user);
  };

  const handleStatusChange = (user: AppUser) => {
    setSelectedUserForStatus(user);
  };

  const handleRoleChangeSuccess = () => {
    setSelectedUserForRole(null);
    if (onRoleChangeSuccess) {
      onRoleChangeSuccess();
    }
  };

  const handleStatusChangeSuccess = () => {
    setSelectedUserForStatus(null);
    if (onRoleChangeSuccess) {
      onRoleChangeSuccess();
    }
  };

  // Add safety check for users
  if (!users || !Array.isArray(users) || users.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <p>No {role.toLowerCase()}s found.</p>
      </div>
    );
  }

  return (
    <>
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {users.map((user) => (
            <UserCard
              key={user.id}
              user={user}
              onViewDetails={handleViewDetails}
              onChangeRole={handleRoleChange}
              onChangeStatus={handleStatusChange}
            />
          ))}
        </div>
      </div>

      {/* Role Change Modal */}
      {selectedUserForRole && (
        <RoleChangeModal
          user={selectedUserForRole}
          onClose={() => setSelectedUserForRole(null)}
          onSuccess={handleRoleChangeSuccess}
        />
      )}

      {/* Status Change Modal */}
      {selectedUserForStatus && (
        <StatusChangeModal
          user={selectedUserForStatus}
          onClose={() => setSelectedUserForStatus(null)}
          onSuccess={handleStatusChangeSuccess}
        />
      )}

      {/* User Detail Modal (only if onUserClick is not provided) */}
      {selectedUserForDetails && !onUserClick && (
        <UserDetailModal
          user={selectedUserForDetails}
          onClose={() => setSelectedUserForDetails(null)}
        />
      )}
    </>
  );
}