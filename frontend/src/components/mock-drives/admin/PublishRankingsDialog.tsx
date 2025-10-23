'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { publishMockDriveRankings } from '@/lib/api/mock-drive.client';
import { Loader2, AlertTriangle, Award } from 'lucide-react';

interface PublishRankingsDialogProps {
  mockDriveId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}


 
export default function PublishRankingsDialog({
  mockDriveId,
  open,
  onOpenChange,
  onSuccess,
}: PublishRankingsDialogProps) {
  const [isPublishing, setIsPublishing] = useState(false);
   const { toast } = useToast();

  const handlePublish = async () => {
    setIsPublishing(true);
    try {
      await publishMockDriveRankings(mockDriveId);
      
      toast({
        title: 'Success',
        description: 'Rankings have been published successfully. Students can now view their ranks.',
      });

      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to publish rankings',
        variant: 'destructive',
      });
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            <DialogTitle>Publish Rankings</DialogTitle>
          </div>
          <DialogDescription>
            Make the rankings visible to all students who participated in this mock drive.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Important</AlertTitle>
            <AlertDescription className="space-y-2">
              <p>Before publishing rankings, please ensure:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>All students have completed their attempts</li>
                <li>All results have been calculated correctly</li>
                <li>You have reviewed the final scores</li>
              </ul>
              <p className="mt-2 font-medium">
                Once published, students will be able to see their rank and percentile.
              </p>
            </AlertDescription>
          </Alert>

          <div className="bg-muted rounded-lg p-4">
            <h4 className="font-semibold mb-2">What will be published?</h4>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>• Overall rank for each student</li>
              <li>• Percentile scores</li>
              <li>• Leaderboard with top performers</li>
              <li>• Individual component scores</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPublishing}
          >
            Cancel
          </Button>
          <Button onClick={handlePublish} disabled={isPublishing}>
            {isPublishing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isPublishing ? 'Publishing...' : 'Publish Rankings'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}