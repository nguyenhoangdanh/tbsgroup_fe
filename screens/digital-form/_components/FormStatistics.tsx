'use client';

import { useMemo } from 'react';

import { AttendanceStatus } from '@/common/types/digital-form';
import { Progress } from '@/components/ui/progress';

interface FormStatisticsProps {
  formData: any;
  worker?: any; // Add an optional single worker prop
  showSingleWorkerStats?: boolean; // Flag to determine which stats to show
}

export function FormStatistics({
  formData,
  worker,
  showSingleWorkerStats = false,
}: FormStatisticsProps) {
  // Calculate attendance statistics
  const attendanceStats = useMemo(() => {
    if (!formData || !formData.workers) {
      return {
        present: 0,
        absent: 0,
        late: 0,
        earlyLeave: 0,
        leaveApproved: 0,
        presentPercentage: 0,
        total: 0,
      };
    }

    // If we're showing stats for a single worker
    if (showSingleWorkerStats && worker) {
      const status = worker.attendanceStatus;
      const isPresent = status === AttendanceStatus.PRESENT;
      const isAbsent = status === AttendanceStatus.ABSENT;
      const isLate = status === AttendanceStatus.LATE;
      const isEarlyLeave = status === AttendanceStatus.EARLY_LEAVE;
      const isLeaveApproved = status === AttendanceStatus.LEAVE_APPROVED;

      return {
        present: isPresent ? 1 : 0,
        absent: isAbsent ? 1 : 0,
        late: isLate ? 1 : 0,
        earlyLeave: isEarlyLeave ? 1 : 0,
        leaveApproved: isLeaveApproved ? 1 : 0,
        presentPercentage: isPresent || isLate ? 100 : 0,
        total: 1,
      };
    }

    //  Group workers by user ID to avoid duplicates (for all workers view)
    const uniqueWorkers = new Map();
    formData.workers.forEach(worker => {
      if (worker.user?.id && !uniqueWorkers.has(worker.user.id)) {
        uniqueWorkers.set(worker.user.id, worker);
      }
    });
    const uniqueWorkersList = Array.from(uniqueWorkers.values());

    const totalWorkers = uniqueWorkersList.length;
    const present = uniqueWorkersList.filter(
      w => w.attendanceStatus === AttendanceStatus.PRESENT,
    ).length;
    const absent = uniqueWorkersList.filter(
      w => w.attendanceStatus === AttendanceStatus.ABSENT,
    ).length;
    const late = uniqueWorkersList.filter(w => w.attendanceStatus === AttendanceStatus.LATE).length;
    const earlyLeave = uniqueWorkersList.filter(
      w => w.attendanceStatus === AttendanceStatus.EARLY_LEAVE,
    ).length;
    const leaveApproved = uniqueWorkersList.filter(
      w => w.attendanceStatus === AttendanceStatus.LEAVE_APPROVED,
    ).length;
    const presentPercentage = totalWorkers > 0 ? Math.round((present / totalWorkers) * 100) : 0;

    return {
      present,
      absent,
      late,
      earlyLeave,
      leaveApproved,
      presentPercentage,
      total: totalWorkers,
    };
  }, [formData, worker, showSingleWorkerStats]);

  // Calculate average output per worker
  const averageOutput = useMemo(() => {
    if (showSingleWorkerStats && worker) {
      return worker.totalOutput || 0;
    }

    if (!formData || !formData.workers) return 0;

    // Group workers by user ID to avoid duplicates
    const uniqueWorkers = new Map();
    formData.workers.forEach(worker => {
      if (worker.user?.id && !uniqueWorkers.has(worker.user.id)) {
        uniqueWorkers.set(worker.user.id, worker);
      }
    });
    const uniqueWorkersList = Array.from(uniqueWorkers.values());

    // Calculate total output
    const totalOutput = formData.workers.reduce(
      (sum, worker) => sum + (worker.totalOutput || 0),
      0,
    );

    // Calculate average
    return uniqueWorkersList.length > 0 ? Math.round(totalOutput / uniqueWorkersList.length) : 0;
  }, [formData, worker, showSingleWorkerStats]);

  return (
    <div>
      <h3 className="text-sm font-medium mb-2">
        {showSingleWorkerStats ? 'Trạng thái công nhân' : 'Chuyên cần'}
      </h3>
      <div className="flex justify-between text-sm mb-1">
        <span>Tỷ lệ có mặt</span>
        <span>{attendanceStats.presentPercentage}%</span>
      </div>
      <Progress value={attendanceStats.presentPercentage} className="h-2" />
      <div className="flex justify-between mt-2 text-xs text-muted-foreground">
        <span>
          {showSingleWorkerStats
            ? 'Trạng thái'
            : `Có mặt: ${attendanceStats.present + attendanceStats.late}/${attendanceStats.total}`}
        </span>
        <span>
          {showSingleWorkerStats && worker
            ? worker.attendanceStatus === AttendanceStatus.PRESENT
              ? 'Có mặt'
              : worker.attendanceStatus === AttendanceStatus.ABSENT
                ? 'Vắng mặt'
                : worker.attendanceStatus === AttendanceStatus.LATE
                  ? 'Đi muộn'
                  : worker.attendanceStatus === AttendanceStatus.EARLY_LEAVE
                    ? 'Về sớm'
                    : 'Nghỉ phép'
            : `Vắng: ${attendanceStats.absent}`}
        </span>
      </div>

      {/* Statistics summary cards */}
      {!showSingleWorkerStats && (
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mt-6">
          <div className="bg-green-50 rounded-md p-2 text-center">
            <div className="font-medium">{attendanceStats.present}</div>
            <div className="text-xs text-green-700">Có mặt</div>
          </div>
          <div className="bg-amber-50 rounded-md p-2 text-center">
            <div className="font-medium">{attendanceStats.late}</div>
            <div className="text-xs text-amber-700">Đi muộn</div>
          </div>
          <div className="bg-red-50 rounded-md p-2 text-center">
            <div className="font-medium">{attendanceStats.absent}</div>
            <div className="text-xs text-red-700">Vắng mặt</div>
          </div>
          <div className="bg-blue-50 rounded-md p-2 text-center">
            <div className="font-medium">{attendanceStats.earlyLeave}</div>
            <div className="text-xs text-blue-700">Về sớm</div>
          </div>
          <div className="bg-purple-50 rounded-md p-2 text-center">
            <div className="font-medium">{attendanceStats.leaveApproved}</div>
            <div className="text-xs text-purple-700">Nghỉ phép</div>
          </div>
          <div className="bg-primary/10 rounded-md p-2 text-center">
            <div className="font-medium">{averageOutput}</div>
            <div className="text-xs text-primary">TB/người</div>
          </div>
        </div>
      )}

      {/* Single worker additional info */}
      {showSingleWorkerStats && worker && (
        <div className="mt-4 bg-muted/20 p-2 rounded-md">
          <div className="text-xs font-medium">Sản lượng: {worker.totalOutput || 0}</div>
        </div>
      )}
    </div>
  );
}
