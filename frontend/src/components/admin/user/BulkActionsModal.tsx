'use client';

import { useState } from 'react';
import { X, Loader2, Users, AlertTriangle } from 'lucide-react';

import { bulkUpdateUserStatus } from '@/lib/api/users.client';
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
import { Progress } from '@/components/ui/progress';

interface BulkActionsModalProps {
  userIds: string[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function BulkActionsModal({ 
  userIds, 
  onClose, 
  onSuccess 
}: BulkActionsModalProps) {
  const [action, setAction] = useState<'status'>('status');
  const [newStatus, setNewStatus] = useState<UserStatus>(UserStatus.ACTIVE);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ updated: number; failed: string[] } | null>(null);

  const handleExecute = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      if (action === 'status') {
        const response = await bulkUpdateUserStatus({
          userIds,
          status: newStatus,
        });
        setResult(response);
        
        if (response.failed.length === 0) {
          setTimeout(() => {
            onSuccess();
          }, 1500);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to execute bulk action');
    } finally {
      setLoading(false);
    }
  };

  const isDestructive = newStatus === UserStatus.SUSPENDED || newStatus === UserStatus.DELETED;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${isDestructive ? 'bg-destructive/10' : 'bg-primary/10'}`}>
                <Users className={`h-6 w-6 ${isDestructive ? 'text-destructive' : 'text-primary'}`} />
              </div>
              <div>
                <CardTitle>Bulk Actions</CardTitle>
                <CardDescription>
                  Apply action to {userIds.length} selected user{userIds.length > 1 ? 's' : ''}
                </CardDescription>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Action Type (Future: Add more actions) */}
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="action-select">Action Type</Label>
            <Select
              value={action}
              onValueChange={(value: 'status') => setAction(value)}
              disabled={loading || result !== null}
            >
              <SelectTrigger id="action-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="status">Change Status</SelectItem>
                {/* Future: Add more actions like role change, delete, etc. */}
              </SelectContent>
            </Select>
          </div>

          {/* Status Selection */}
          {action === 'status' && (
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="status-select">New Status</Label>
              <Select
                value={newStatus}
                onValueChange={(value: UserStatus) => setNewStatus(value)}
                disabled={loading || result !== null}
              >
                <SelectTrigger id="status-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={UserStatus.ACTIVE}>✓ Active</SelectItem>
                  <SelectItem value={UserStatus.PENDING_PROFILE_COMPLETION}>
                    ⏳ Pending Profile Completion
                  </SelectItem>
                  <SelectItem value={UserStatus.SUSPENDED}>🚫 Suspended</SelectItem>
                  <SelectItem value={UserStatus.DELETED}>🗑️ Deleted</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Warning for destructive actions */}
          {isDestructive && !result && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                This will affect {userIds.length} user{userIds.length > 1 ? 's' : ''}. 
                {newStatus === UserStatus.SUSPENDED && ' Users will be unable to access their accounts.'}
                {newStatus === UserStatus.DELETED && ' User accounts will be marked for deletion.'}
              </AlertDescription>
            </Alert>
          )}

          {/* Result Display */}
          {result && (
            <div className="space-y-3">
              <Progress value={(result.updated / userIds.length) * 100} />
              
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Selected:</span>
                  <span className="font-medium">{userIds.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Successfully Updated:</span>
                  <span className="font-medium text-green-600">{result.updated}</span>
                </div>
                {result.failed.length > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Failed:</span>
                    <span className="font-medium text-destructive">{result.failed.length}</span>
                  </div>
                )}
              </div>

              {result.failed.length > 0 && (
                <Alert>
                  <AlertDescription>
                    Some users could not be updated. This may be due to permissions or invalid user IDs.
                  </AlertDescription>
                </Alert>
              )}

              {result.updated > 0 && result.failed.length === 0 && (
                <Alert className="border-green-200 bg-green-50">
                  <AlertDescription className="text-green-800">
                    ✓ All users updated successfully!
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>

        <CardFooter className="flex justify-end gap-2">
          <Button 
            variant="outline" 
            onClick={onClose}
            disabled={loading}
          >
            {result ? 'Close' : 'Cancel'}
          </Button>
          {!result && (
            <Button
              onClick={handleExecute}
              disabled={loading}
              variant={isDestructive ? 'destructive' : 'default'}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? 'Processing...' : `Update ${userIds.length} User${userIds.length > 1 ? 's' : ''}`}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}