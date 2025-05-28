'use client';

import { AttendanceStatus } from '@/common/types/digital-form';
import { Badge } from '@/components/ui/badge';

// Status colors mapping
const statusColors = {
  [AttendanceStatus.PRESENT]: 'bg-green-500',
  [AttendanceStatus.ABSENT]: 'bg-red-500',
  [AttendanceStatus.LATE]: 'bg-amber-500',
  [AttendanceStatus.EARLY_LEAVE]: 'bg-orange-500',
  [AttendanceStatus.LEAVE_APPROVED]: 'bg-blue-500',
};

// Status labels mapping
const statusLabels = {
  [AttendanceStatus.PRESENT]: 'Có mặt',
  [AttendanceStatus.ABSENT]: 'Vắng mặt',
  [AttendanceStatus.LATE]: 'Đi muộn',
  [AttendanceStatus.EARLY_LEAVE]: 'Về sớm',
  [AttendanceStatus.LEAVE_APPROVED]: 'Nghỉ phép',
};

interface AttendanceBadgeProps {
  status: AttendanceStatus;
  className?: string;
}

export default function AttendanceBadge({ status, className = '' }: AttendanceBadgeProps) {
  return (
    <Badge className={`${className}`} variant="outline">
      <div className={`w-2 h-2 rounded-full mr-1 ${statusColors[status]}`}></div>
      {statusLabels[status]}
    </Badge>
  );
}
