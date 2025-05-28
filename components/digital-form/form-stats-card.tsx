'use client';
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  Calendar,
  BarChart2,
  Target,
  CheckCircle2,
} from 'lucide-react';
import React, { useMemo } from 'react';

import { DigitalForm, DigitalFormEntry } from '@/common/types/digital-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useDigitalFormStats } from '@/hooks/digital-form/useDigitalFormStats';
import { useWorkShifts } from '@/hooks/digital-form/useWorkShifts';
import { cn } from '@/lib/utils';

interface FormStatsCardProps {
  form?: DigitalForm | null;
  entries?: DigitalFormEntry[];
  type?: 'summary' | 'production' | 'attendance';
  className?: string;
}

export const FormStatsCard: React.FC<FormStatsCardProps> = ({
  form,
  entries = [],
  type = 'summary',
  className,
}) => {
  const { stats } = useDigitalFormStats(form, entries);
  const { timeSlots } = useWorkShifts(form?.shiftType);

  // Create bar chart data for hourly statistics
  const hourlyChartData = useMemo(() => {
    if (!stats.hourly) return [];

    return stats.hourly.map(hourData => ({
      timeSlot: hourData.timeSlot,
      value: hourData.totalOutput,
      percentage: Math.min(
        100,
        Math.round((hourData.totalOutput / (stats.productivity?.totalOutput || 1)) * 100),
      ),
    }));
  }, [stats.hourly, stats.productivity?.totalOutput]);

  return (
    <div className={cn('space-y-4', className)}>
      {/* Summary Stats */}
      {(type === 'summary' || type === 'production') && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Sản lượng</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col p-2 border rounded-md">
                <span className="text-xs text-muted-foreground">Tổng sản lượng</span>
                <div className="flex items-center mt-1">
                  <BarChart2 className="h-4 w-4 mr-1.5 text-blue-600" />
                  <span className="text-lg font-medium">
                    {stats.productivity?.totalOutput || 0}
                  </span>
                </div>
              </div>

              <div className="flex flex-col p-2 border rounded-md">
                <span className="text-xs text-muted-foreground">Trung bình / người</span>
                <div className="flex items-center mt-1">
                  <Target className="h-4 w-4 mr-1.5 text-green-600" />
                  <span className="text-lg font-medium">
                    {stats.productivity?.averageOutput || 0}
                  </span>
                </div>
              </div>

              <div className="flex flex-col p-2 border rounded-md">
                <span className="text-xs text-muted-foreground">Kế hoạch</span>
                <div className="flex items-center mt-1">
                  <Target className="h-4 w-4 mr-1.5 text-amber-600" />
                  <span className="text-lg font-medium">
                    {stats.productivity?.plannedOutput || 0}
                  </span>
                </div>
              </div>

              <div className="flex flex-col p-2 border rounded-md">
                <span className="text-xs text-muted-foreground">Tỷ lệ hoàn thành</span>
                <div className="flex items-center mt-1">
                  <CheckCircle2 className="h-4 w-4 mr-1.5 text-indigo-600" />
                  <span className="text-lg font-medium">
                    {stats.productivity?.completionRate || 0}%
                  </span>
                </div>
              </div>
            </div>

            {/* Completion rate progress bar */}
            <div className="mt-4">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-muted-foreground">Tiến độ hoàn thành</span>
                <span className="text-xs font-medium">
                  {stats.productivity?.completionRate || 0}%
                </span>
              </div>
              <Progress
                value={stats.productivity?.completionRate || 0}
                className="h-2"
                indicatorClassName={cn(
                  stats.productivity?.completionRate! >= 100
                    ? 'bg-green-500'
                    : stats.productivity?.completionRate! >= 70
                      ? 'bg-blue-500'
                      : stats.productivity?.completionRate! >= 50
                        ? 'bg-amber-500'
                        : 'bg-red-500',
                )}
              />
            </div>

            {type === 'production' && (
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2">Sản lượng theo giờ</h4>
                <div className="space-y-2">
                  {hourlyChartData.map(hourData => (
                    <div key={hourData.timeSlot} className="space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span>{hourData.timeSlot}</span>
                        <span className="font-medium">{hourData.value}</span>
                      </div>
                      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary"
                          style={{ width: `${hourData.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Attendance Stats */}
      {(type === 'summary' || type === 'attendance') && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Điểm danh</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              <div className="flex flex-col p-2 border rounded-md">
                <span className="text-xs text-muted-foreground">Tổng công nhân</span>
                <div className="flex items-center mt-1">
                  <Users className="h-4 w-4 mr-1.5 text-slate-600" />
                  <span className="text-lg font-medium">{stats.attendance?.totalWorkers || 0}</span>
                </div>
              </div>

              <div className="flex flex-col p-2 border rounded-md">
                <span className="text-xs text-muted-foreground">Có mặt</span>
                <div className="flex items-center mt-1">
                  <UserCheck className="h-4 w-4 mr-1.5 text-green-600" />
                  <span className="text-lg font-medium">{stats.attendance?.present || 0}</span>
                </div>
              </div>

              <div className="flex flex-col p-2 border rounded-md">
                <span className="text-xs text-muted-foreground">Vắng mặt</span>
                <div className="flex items-center mt-1">
                  <UserX className="h-4 w-4 mr-1.5 text-red-600" />
                  <span className="text-lg font-medium">{stats.attendance?.absent || 0}</span>
                </div>
              </div>

              <div className="flex flex-col p-2 border rounded-md">
                <span className="text-xs text-muted-foreground">Đi muộn</span>
                <div className="flex items-center mt-1">
                  <Clock className="h-4 w-4 mr-1.5 text-amber-600" />
                  <span className="text-lg font-medium">{stats.attendance?.late || 0}</span>
                </div>
              </div>

              <div className="flex flex-col p-2 border rounded-md">
                <span className="text-xs text-muted-foreground">Về sớm</span>
                <div className="flex items-center mt-1">
                  <Clock className="h-4 w-4 mr-1.5 text-blue-600" />
                  <span className="text-lg font-medium">{stats.attendance?.earlyLeave || 0}</span>
                </div>
              </div>

              <div className="flex flex-col p-2 border rounded-md">
                <span className="text-xs text-muted-foreground">Nghỉ phép</span>
                <div className="flex items-center mt-1">
                  <Calendar className="h-4 w-4 mr-1.5 text-purple-600" />
                  <span className="text-lg font-medium">
                    {stats.attendance?.leaveApproved || 0}
                  </span>
                </div>
              </div>
            </div>

            {/* Attendance rate progress bar */}
            <div className="mt-4">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-muted-foreground">Tỷ lệ có mặt</span>
                <span className="text-xs font-medium">
                  {stats.attendance?.presentPercentage || 0}%
                </span>
              </div>
              <Progress
                value={stats.attendance?.presentPercentage || 0}
                className="h-2"
                indicatorClassName={cn(
                  stats.attendance?.presentPercentage! >= 90
                    ? 'bg-green-500'
                    : stats.attendance?.presentPercentage! >= 80
                      ? 'bg-blue-500'
                      : stats.attendance?.presentPercentage! >= 70
                        ? 'bg-amber-500'
                        : 'bg-red-500',
                )}
              />
            </div>

            {type === 'attendance' && (
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2">Chi tiết tình trạng</h4>
                <div className="border rounded-md overflow-hidden">
                  <div className="grid grid-cols-2 text-xs p-2 bg-muted/50 border-b">
                    <div>Tình trạng</div>
                    <div className="text-right">Số lượng</div>
                  </div>

                  <div className="divide-y">
                    <div className="grid grid-cols-2 p-2">
                      <div className="flex items-center">
                        <span className="w-2 h-2 rounded-full bg-green-500 mr-1.5"></span>
                        <span className="text-xs">Có mặt</span>
                      </div>
                      <div className="text-xs text-right font-medium">
                        {stats.attendance?.present || 0}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 p-2">
                      <div className="flex items-center">
                        <span className="w-2 h-2 rounded-full bg-red-500 mr-1.5"></span>
                        <span className="text-xs">Vắng mặt</span>
                      </div>
                      <div className="text-xs text-right font-medium">
                        {stats.attendance?.absent || 0}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 p-2">
                      <div className="flex items-center">
                        <span className="w-2 h-2 rounded-full bg-amber-500 mr-1.5"></span>
                        <span className="text-xs">Đi muộn</span>
                      </div>
                      <div className="text-xs text-right font-medium">
                        {stats.attendance?.late || 0}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 p-2">
                      <div className="flex items-center">
                        <span className="w-2 h-2 rounded-full bg-blue-500 mr-1.5"></span>
                        <span className="text-xs">Về sớm</span>
                      </div>
                      <div className="text-xs text-right font-medium">
                        {stats.attendance?.earlyLeave || 0}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 p-2">
                      <div className="flex items-center">
                        <span className="w-2 h-2 rounded-full bg-purple-500 mr-1.5"></span>
                        <span className="text-xs">Nghỉ phép</span>
                      </div>
                      <div className="text-xs text-right font-medium">
                        {stats.attendance?.leaveApproved || 0}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Overall Completion Stats */}
      {type === 'summary' && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Tiến độ nhập liệu</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-muted-foreground">Tiến độ hoàn thành</span>
                  <span className="text-xs font-medium">
                    {stats.completion?.completionPercentage || 0}%
                  </span>
                </div>
                <Progress
                  value={stats.completion?.completionPercentage || 0}
                  className="h-2"
                  indicatorClassName={cn(
                    stats.completion?.completionPercentage! >= 90
                      ? 'bg-green-500'
                      : stats.completion?.completionPercentage! >= 70
                        ? 'bg-blue-500'
                        : stats.completion?.completionPercentage! >= 50
                          ? 'bg-amber-500'
                          : 'bg-red-500',
                  )}
                />
              </div>

              <div className="flex justify-between items-center text-xs text-muted-foreground">
                <span>Khung giờ đã nhập: {stats.completion?.filledTimeSlots || 0}</span>
                <span>Tổng số khung giờ: {stats.completion?.totalTimeSlots || 0}</span>
              </div>

              <div className="grid grid-cols-12 gap-1">
                {timeSlots.map((slot, index) => {
                  // Calculate a color based on completion percentage for this time slot
                  const hourStat = stats.hourly?.find(h => h.timeSlot === slot.label);
                  const isFilled = hourStat && hourStat.filledPercentage > 0;

                  return (
                    <div
                      key={slot.label}
                      className={cn(
                        'h-2 rounded-full',
                        isFilled
                          ? hourStat!.filledPercentage >= 80
                            ? 'bg-green-500'
                            : hourStat!.filledPercentage >= 50
                              ? 'bg-amber-500'
                              : 'bg-blue-300'
                          : 'bg-muted',
                      )}
                      title={`${slot.label}: ${hourStat?.filledPercentage || 0}% đã nhập`}
                    />
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FormStatsCard;
