// components/worker-status-badge.tsx
import { CheckCircle2, Clock, XCircle, AlertTriangle, LogOut } from 'lucide-react';

import { AttendanceStatus } from '@/common/types/digital-form';
import { Badge } from '@/components/ui/badge';

interface WorkerStatusBadgeProps {
  status: AttendanceStatus;
  size?: 'sm' | 'md' | 'lg';
}

export function WorkerStatusBadge({ status, size = 'md' }: WorkerStatusBadgeProps) {
  // Determine icon size based on badge size
  const iconSize = {
    sm: 'h-2.5 w-2.5',
    md: 'h-3 w-3',
    lg: 'h-4 w-4',
  }[size];

  const textSize = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  }[size];

  switch (status) {
    case AttendanceStatus.PRESENT:
      return (
        <Badge
          variant="outline"
          className={`bg-green-50 text-green-700 border-green-200 flex items-center gap-1 ${textSize}`}
        >
          <CheckCircle2 className={iconSize} />
          <span>Có mặt</span>
        </Badge>
      );
    case AttendanceStatus.ABSENT:
      return (
        <Badge
          variant="outline"
          className={`bg-red-50 text-red-700 border-red-200 flex items-center gap-1 ${textSize}`}
        >
          <XCircle className={iconSize} />
          <span>Vắng mặt</span>
        </Badge>
      );
    case AttendanceStatus.LATE:
      return (
        <Badge
          variant="outline"
          className={`bg-amber-50 text-amber-700 border-amber-200 flex items-center gap-1 ${textSize}`}
        >
          <Clock className={iconSize} />
          <span>Đi muộn</span>
        </Badge>
      );
    case AttendanceStatus.EARLY_LEAVE:
      return (
        <Badge
          variant="outline"
          className={`bg-amber-50 text-amber-700 border-amber-200 flex items-center gap-1 ${textSize}`}
        >
          <LogOut className={iconSize} />
          <span>Về sớm</span>
        </Badge>
      );
    case AttendanceStatus.LEAVE_APPROVED:
      return (
        <Badge
          variant="outline"
          className={`bg-blue-50 text-blue-700 border-blue-200 flex items-center gap-1 ${textSize}`}
        >
          <AlertTriangle className={iconSize} />
          <span>Nghỉ phép</span>
        </Badge>
      );
    default:
      return null;
  }
}
