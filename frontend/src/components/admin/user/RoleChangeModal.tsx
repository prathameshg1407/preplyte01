'use client';

import { useState } from 'react';
import { X, Loader2, Shield, AlertTriangle } from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';
import { updateUserRole } from '@/lib/api/users.client';
import type { AppUser } from '@/types';
import { Role } from '@/types/enum';
import { Button } from '@/components/ui/button';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface RoleChangeModalProps {
  user: AppUser;
  onClose: () => void;
  onSuccess: () => void;
}

export default function RoleChangeModal({ 
  user, 
  onClose, 
  onSuccess 
}: RoleChangeModalProps) {
  const { user: currentUser } = useAuth();
  const [newRole, setNewRole] = useState<Role>(user.role);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canChangeRole = currentUser?.role === Role.SUPER_ADMIN;

  const handleSave = async () => {
    if (!canChangeRole) {
      setError('You do not have permission to perform this action.');
      return;
    }

    if (newRole === user.role) {
      onClose();
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await updateUserRole(user.id, { role: newRole });
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to update role');
    } finally {
      setLoading(false);
    }
  };

  const getRoleDescription = (role: Role) => {
    switch (role) {
      case Role.SUPER_ADMIN:
        return 'Full access to all platform features and settings';
      case Role.INSTITUTION_ADMIN:
        return 'Manage users and content within their institution';
      case Role.STUDENT:
        return 'Access to learning and assessment features';
      default:
        return '';
    }
  };

  const isSuperAdminChange = newRole === Role.SUPER_ADMIN || user.role === Role.SUPER_ADMIN;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-lg">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle>Change Role</CardTitle>
                <CardDescription>
                  For <span className="font-semibold text-foreground">
                    {user.profile?.fullName || user.email}
                  </span>
                </CardDescription>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="role-select">Select new role</Label>
            <Select
              value={newRole}
              onValueChange={(value: Role) => setNewRole(value)}
              disabled={!canChangeRole}
            >
              <SelectTrigger id="role-select">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={Role.STUDENT}>
                  👨‍🎓 Student
                </SelectItem>
                <SelectItem value={Role.INSTITUTION_ADMIN}>
                  👨‍💼 Institution Admin
                </SelectItem>
                <SelectItem value={Role.SUPER_ADMIN}>
                  🛡️ Super Admin
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              {getRoleDescription(newRole)}
            </p>
          </div>

          {isSuperAdminChange && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {newRole === Role.SUPER_ADMIN && (
                  <>Granting Super Admin access provides unrestricted platform control. Use with extreme caution.</>
                )}
                {user.role === Role.SUPER_ADMIN && newRole !== Role.SUPER_ADMIN && (
                  <>Removing Super Admin access will revoke all administrative privileges.</>
                )}
              </AlertDescription>
            </Alert>
          )}

          {newRole !== user.role && (
            <div className="p-3 bg-muted rounded-md">
              <div className="text-sm">
                <div className="flex justify-between mb-1">
                  <span className="text-muted-foreground">Current Role:</span>
                  <span className="font-medium">{user.role}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">New Role:</span>
                  <span className="font-medium text-primary">{newRole}</span>
                </div>
              </div>
            </div>
          )}

          {!canChangeRole && (
            <Alert>
              <AlertDescription>
                Role management is restricted. Only Super Admins can modify user roles.
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>

        <CardFooter className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading || !canChangeRole || newRole === user.role}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}