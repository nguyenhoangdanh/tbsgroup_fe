// components/shift-type-badge.tsx
import { Clock, AlarmClock, Clock4 } from 'lucide-react';

import { ShiftType } from '@/common/types/digital-form';
import { Badge } from '@/components/ui/badge';

interface ShiftTypeBadgeProps {
  type: ShiftType;
  size?: 'sm' | 'md' | 'lg';
}

export function ShiftTypeBadge({ type, size = 'md' }: ShiftTypeBadgeProps) {
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

  switch (type) {
    case ShiftType.REGULAR:
      return (
        <Badge
          variant="outline"
          className={`bg-blue-50 text-blue-700 border-blue-200 flex items-center gap-1 ${textSize}`}
        >
          <Clock className={iconSize} />
          <span>Ca thường</span>
        </Badge>
      );
    case ShiftType.EXTENDED:
      return (
        <Badge
          variant="outline"
          className={`bg-purple-50 text-purple-700 border-purple-200 flex items-center gap-1 ${textSize}`}
        >
          <Clock4 className={iconSize} />
          <span>Giãn ca</span>
        </Badge>
      );
    case ShiftType.OVERTIME:
      return (
        <Badge
          variant="outline"
          className={`bg-amber-50 text-amber-700 border-amber-200 flex items-center gap-1 ${textSize}`}
        >
          <AlarmClock className={iconSize} />
          <span>Tăng ca</span>
        </Badge>
      );
    default:
      return null;
  }
}
