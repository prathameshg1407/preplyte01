'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Calendar, 
  Users, 
  Clock, 
  Eye, 
  Edit, 
  Trash2,
  CheckCircle,
  XCircle 
} from 'lucide-react';
import Link from 'next/link';
import { getStatusColor, formatDateRange, formatDuration } from '@/lib/utils/mock-drive.helpers';
import type { MockDriveListItem } from '@/types/mock-drive.types';
import { format } from 'date-fns';

interface MockDriveCardProps {
  drive: MockDriveListItem;
  onDelete?: (id: string) => void;
  onPublishToggle?: (id: string, currentStatus: boolean) => void;
}

export default function MockDriveCard({ 
  drive, 
  onDelete, 
  onPublishToggle 
}: MockDriveCardProps) {
  return (
    <Card className="p-6 hover:shadow-lg transition-shadow">
      <div className="space-y-4">
        {/* Header */}
        <div>
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-lg font-semibold line-clamp-1">{drive.title}</h3>
            <div className="flex gap-1">
              <Badge className={getStatusColor(drive.status)} variant="secondary">
                {drive.status.replace(/_/g, ' ')}
              </Badge>
            </div>
          </div>
          {drive.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {drive.description}
            </p>
          )}
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              {format(new Date(drive.driveStartDate), 'PP')}
            </span>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              {formatDuration(drive.duration)}
            </span>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              {drive._count.registrations} registered
            </span>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              {drive._count.attempts} attempts
            </span>
          </div>
        </div>

        {/* Eligible Years */}
        <div className="flex flex-wrap gap-1">
          {drive.eligibleYear.map((year) => (
            <Badge key={year} variant="outline" className="text-xs">
              Year {year}
            </Badge>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 border-t">
          <Button
            size="sm"
            variant={drive.isPublished ? 'default' : 'outline'}
            onClick={() => onPublishToggle?.(drive.id, drive.isPublished)}
          >
            {drive.isPublished ? (
              <>
                <CheckCircle className="h-3 w-3 mr-1" />
                Published
              </>
            ) : (
              <>
                <XCircle className="h-3 w-3 mr-1" />
                Draft
              </>
            )}
          </Button>

          <div className="flex gap-1">
            <Link href={`/admin/mock-drive/${drive.id}`}>
              <Button size="sm" variant="ghost">
                <Eye className="h-4 w-4" />
              </Button>
            </Link>
            <Link href={`/admin/mock-drive/${drive.id}`}>
              <Button size="sm" variant="ghost">
                <Edit className="h-4 w-4" />
              </Button>
            </Link>
            <Button 
              size="sm" 
              variant="ghost"
              onClick={() => onDelete?.(drive.id)}
              disabled={drive._count.attempts > 0}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}