import { CheckCircle, Clock, AlertCircle } from 'lucide-react';

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

type TimeSlotStatus = 'completed' | 'current' | 'pending' | 'missing';

interface TimeSlotStatusProps {
  status: TimeSlotStatus;
  label?: string;
  value?: number | string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
}

export function TimeSlotStatus({
  status,
  label,
  value,
  className,
  size = 'md',
  showTooltip = false,
}: TimeSlotStatusProps) {
  // Define icon sizes based on the size prop
  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  const iconSize = iconSizes[size];
  const textSize = textSizes[size];

  //Define the content to display
  const content = (
    <div className={cn('flex items-center gap-1', className)}>
      {status === 'completed' && (
        <>
          <CheckCircle className={cn(iconSize, 'text-green-500')} />
          {label && <span className={cn(textSize, 'text-green-700')}>{label}</span>}
          {value !== undefined && <span className={cn(textSize, 'font-medium')}>{value}</span>}
        </>
      )}
      {status === 'current' && (
        <>
          <Clock className={cn(iconSize, 'text-blue-500 animate-pulse')} />
          {label && <span className={cn(textSize, 'text-blue-700')}>{label}</span>}
          {value !== undefined && <span className={cn(textSize, 'font-medium')}>{value}</span>}
        </>
      )}
      {status === 'pending' && (
        <>
          <Clock className={cn(iconSize, 'text-gray-400')} />
          {label && <span className={cn(textSize, 'text-gray-500')}>{label}</span>}
          {value !== undefined && <span className={cn(textSize, 'font-medium')}>{value}</span>}
        </>
      )}
      {status === 'missing' && (
        <>
          <AlertCircle className={cn(iconSize, 'text-red-500')} />
          {label && <span className={cn(textSize, 'text-red-700')}>{label}</span>}
          {value !== undefined && <span className={cn(textSize, 'font-medium')}>{value}</span>}
        </>
      )}
    </div>
  );

  // If tooltip is enabled, wrap the content in a tooltip
  if (showTooltip && label) {
    const tooltipContent = `${label}${value !== undefined ? `: ${value}` : ''}`;

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent>
            <p>{tooltipContent}</p>
            <p className="text-xs text-muted-foreground">
              {status === 'completed' && 'Hoàn thành'}
              {status === 'current' && 'Đang diễn ra'}
              {status === 'pending' && 'Chưa đến giờ'}
              {status === 'missing' && 'Thiếu dữ liệu'}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  //Otherwise, return the content directly
  return content;
}
