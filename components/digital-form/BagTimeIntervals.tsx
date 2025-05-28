'use client';
import { CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react';
import React, { useMemo } from 'react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useWorkShifts } from '@/hooks/digital-form/useWorkShifts';
import { cn } from '@/lib/utils';

interface BagTimeInterval {
  timeSlot: string;
  completed: boolean;
  output?: number;
}

interface BagTimeIntervalsProps {
  entryId: string;
  intervals: BagTimeInterval[];
  title?: string;
  className?: string;
}

export const BagTimeIntervals: React.FC<BagTimeIntervalsProps> = ({
  // entryId,
  intervals = [],
  title = 'Khoảng thời gian',
  className,
}) => {
  const { currentSlot } = useWorkShifts();

  // Calculate statistics
  const stats = useMemo(() => {
    const total = intervals.length;
    const completed = intervals.filter(i => i.completed).length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    const totalOutput = intervals.reduce((sum, interval) => sum + (interval.output || 0), 0);

    return {
      total,
      completed,
      completionRate,
      totalOutput,
    };
  }, [intervals]);

  return (
    <Card className={cn('bg-white shadow-sm', className)}>
      <CardHeader className="pb-3 pt-4">
        <div className="flex justify-between items-center">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <Badge
            variant={
              stats.completionRate >= 80
                ? 'success'
                : stats.completionRate >= 50
                  ? 'warning'
                  : 'destructive'
            }
          >
            {stats.completionRate}%
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pb-4">
        {/* Mobile view */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
          {stats.total === 0 ? (
            <div className="col-span-full text-center py-3 text-muted-foreground text-sm">
              Không có khoảng thời gian nào được thiết lập
            </div>
          ) : (
            intervals.map((interval, idx) => {
              const isCurrent = currentSlot?.label === interval.timeSlot;

              return (
                <div
                  key={`${interval.timeSlot}-${idx}`}
                  className={cn(
                    'flex items-center justify-between p-2 border rounded-md',
                    interval.completed ? 'bg-green-50/50' : '',
                    isCurrent ? 'bg-blue-50/60 border-blue-200' : '',
                  )}
                >
                  <div className="flex items-center">
                    <Clock className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                    <span className="text-xs">{interval.timeSlot}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {interval.output !== undefined && (
                      <span className="text-xs font-medium">{interval.output}</span>
                    )}
                    {interval.completed ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : isCurrent ? (
                      <AlertCircle className="h-4 w-4 text-blue-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Summary */}
        <div className="flex justify-between items-center text-xs text-muted-foreground pt-2 border-t">
          <div>
            Đã hoàn thành: {stats.completed}/{stats.total}
          </div>
          <div>
            Tổng sản lượng: <span className="font-medium">{stats.totalOutput}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BagTimeIntervals;
