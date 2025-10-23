'use client';

import { useState } from 'react';
import { X, Loader2, AlertTriangle, UserCog } from 'lucide-react';

import { updateUserStatus } from '@/lib/api/users.client';
import type { AppUser } from '@/types';
import { UserStatus } from '@/types/enum';
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

interface StatusChangeModalProps {
  user: AppUser;
  onClose: () => void;
  onSuccess: () => void;
}

export default function StatusChangeModal({ 
  user, 
  onClose, 
  onSuccess 
}: StatusChangeModalProps) {
  const [newStatus, setNewStatus] = useState<UserStatus>(user.status);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (newStatus === user.status) {
      onClose();
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await updateUserStatus(user.id, { status: newStatus });
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to update user status');
    } finally {
      setLoading(false);
    }
  };

  const getStatusDescription = (status: UserStatus) => {
    switch (status) {
      case UserStatus.ACTIVE:
        return 'User can access all features';
      case UserStatus.SUSPENDED:
        return 'User cannot log in or access the platform';
      case UserStatus.PENDING_PROFILE_COMPLETION:
        return 'User needs to complete their profile';
      case UserStatus.DELETED:
        return 'User account is marked for deletion';
      default:
        return '';
    }
  };

  const isDestructive = newStatus === UserStatus.SUSPENDED || newStatus === UserStatus.DELETED;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${isDestructive ? 'bg-destructive/10' : 'bg-primary/10'}`}>
                <UserCog className={`h-6 w-6 ${isDestructive ? 'text-destructive' : 'text-primary'}`} />
              </div>
              <div>
                <CardTitle>Change User Status</CardTitle>
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
            <Label htmlFor="status-select">Select new status</Label>
            <Select
              value={newStatus}
              onValueChange={(value: UserStatus) => setNewStatus(value)}
            >
              <SelectTrigger id="status-select">
                <SelectValue placeholder="Select a status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={UserStatus.ACTIVE}>
                  ✓ Active
                </SelectItem>
                <SelectItem value={UserStatus.PENDING_PROFILE_COMPLETION}>
                  ⏳ Pending Profile Completion
                </SelectItem>
                <SelectItem value={UserStatus.SUSPENDED}>
                  🚫 Suspended
                </SelectItem>
                <SelectItem value={UserStatus.DELETED}>
                  🗑️ Deleted
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              {getStatusDescription(newStatus)}
            </p>
          </div>

          {isDestructive && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {newStatus === UserStatus.SUSPENDED && (
                  <>This will prevent the user from accessing their account. They will need to be reactivated by an admin.</>
                )}
                {newStatus === UserStatus.DELETED && (
                  <>This marks the user account for deletion. This action should be used with caution.</>
                )}
              </AlertDescription>
            </Alert>
          )}

          {newStatus !== user.status && (
            <div className="p-3 bg-muted rounded-md">
              <div className="text-sm">
                <div className="flex justify-between mb-1">
                  <span className="text-muted-foreground">Current:</span>
                  <span className="font-medium">{user.status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">New:</span>
                  <span className={`font-medium ${isDestructive ? 'text-destructive' : 'text-primary'}`}>
                    {newStatus}
                  </span>
                </div>
              </div>
            </div>
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
            disabled={loading || newStatus === user.status}
            variant={isDestructive ? 'destructive' : 'default'}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loading ? 'Updating...' : 'Update Status'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}