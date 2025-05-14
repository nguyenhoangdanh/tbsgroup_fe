// components/ImprovedFormProgress.tsx
'use client';

import { Clock } from 'lucide-react';
import { useMemo } from 'react';

import { AttendanceStatus, ShiftType } from '@/common/types/digital-form';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface FormProgressProps {
  formData: any;
  currentTimeSlot: string | null;
  worker?: any; // Optional specific worker
  showSingleWorkerProgress?: boolean;
}

export function FormProgress({
  formData,
  currentTimeSlot,
  worker,
  showSingleWorkerProgress = false,
}: FormProgressProps) {
  // Calculate completion stats
  const completionStats = useMemo(() => {
    if (!formData || !formData.workers) {
      return {
        totalSlots: 0,
        filledSlots: 0,
        percentage: 0,
        totalOutput: 0,
        averageOutput: 0,
      };
    }

    // For single worker mode
    if (showSingleWorkerProgress && worker) {
      let totalSlots = 0;
      let filledSlots = 0;
      const totalOutput = worker.totalOutput || 0;

      // Skip calculation for absent workers
      if (worker.attendanceStatus === AttendanceStatus.ABSENT) {
        return {
          totalSlots: 0,
          filledSlots: 0,
          percentage: 0,
          totalOutput,
          averageOutput: totalOutput,
        };
      }

      // Determine available time slots based on shift type
      const regularTimeSlots = [
        '07:30-08:30',
        '08:30-09:30',
        '09:30-10:30',
        '10:30-11:30',
        '12:30-13:30',
        '13:30-14:30',
        '14:30-15:30',
        '15:30-16:30',
      ];
      const extendedTimeSlots = ['16:30-17:00', '17:00-18:00'];
      const overtimeTimeSlots = ['18:00-19:00', '19:00-20:00'];

      // Add slots based on worker's shift type
      let availableSlots = [...regularTimeSlots];
      if (worker.shiftType === ShiftType.EXTENDED || worker.shiftType === ShiftType.OVERTIME) {
        availableSlots = [...availableSlots, ...extendedTimeSlots];
      }
      if (worker.shiftType === ShiftType.OVERTIME) {
        availableSlots = [...availableSlots, ...overtimeTimeSlots];
      }

      // Count filled slots from hourly data (only for slots that have already started)
      const workerHourlyData = worker.hourlyData || {};

      const now = new Date();
      const currentHour = now.getHours();
      const currentMinutes = now.getMinutes();
      const currentTimeString = `${currentHour.toString().padStart(2, '0')}:${currentMinutes.toString().padStart(2, '0')}`;

      availableSlots.forEach(slot => {
        const [slotStartTime] = slot.split('-');

        // Check if this slot has already started
        if (slotStartTime <= currentTimeString) {
          // Add this slot to the total count of slots
          totalSlots++;

          // Check if the slot has data
          if (slot in workerHourlyData && workerHourlyData[slot] > 0) {
            filledSlots++;
          }
        }
      });

      // Prevent division by zero
      const percentage = totalSlots > 0 ? Math.round((filledSlots / totalSlots) * 100) : 0;

      return {
        totalSlots,
        filledSlots,
        percentage,
        totalOutput,
        averageOutput: totalOutput,
      };
    }

    // For all workers view (original logic)
    // Group workers by user ID to avoid duplicates
    const uniqueWorkers = new Map();
    formData.workers.forEach(worker => {
      if (worker.user?.id && !uniqueWorkers.has(worker.user.id)) {
        uniqueWorkers.set(worker.user.id, worker);
      }
    });
    const uniqueWorkersList = Array.from(uniqueWorkers.values());

    let totalSlots = 0;
    let filledSlots = 0;
    let totalOutput = 0;

    // Process all entries
    formData.workers.forEach(worker => {
      // Skip counting slots for absent workers
      if (worker.attendanceStatus === AttendanceStatus.ABSENT) {
        return;
      }

      // Determine available time slots based on shift type
      let availableSlots: string[] = [];

      // Regular shift slots (standard for all shift types)
      const regularTimeSlots = [
        '07:30-08:30',
        '08:30-09:30',
        '09:30-10:30',
        '10:30-11:30',
        '12:30-13:30',
        '13:30-14:30',
        '14:30-15:30',
        '15:30-16:30',
      ];

      // Extended shift adds these time slots
      const extendedTimeSlots = ['16:30-17:00', '17:00-18:00'];

      // Overtime shift adds these time slots
      const overtimeTimeSlots = ['18:00-19:00', '19:00-20:00'];

      // Add slots based on worker's shift type
      availableSlots = [...regularTimeSlots];

      if (worker.shiftType === 'EXTENDED' || worker.shiftType === 'OVERTIME') {
        availableSlots = [...availableSlots, ...extendedTimeSlots];
      }

      if (worker.shiftType === 'OVERTIME') {
        availableSlots = [...availableSlots, ...overtimeTimeSlots];
      }

      // Count filled slots from hourly data
      const workerHourlyData = worker.hourlyData || {};
      let workerFilledSlots = 0;

      // Only count slots that have already started based on the current time
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinutes = now.getMinutes();
      const currentTimeString = `${currentHour.toString().padStart(2, '0')}:${currentMinutes.toString().padStart(2, '0')}`;

      availableSlots.forEach(slot => {
        const [slotStartTime] = slot.split('-');

        // Check if this slot has already started
        if (slotStartTime <= currentTimeString) {
          // Add this slot to the total count of slots
          totalSlots++;

          // Check if the slot has data
          if (slot in workerHourlyData && workerHourlyData[slot] > 0) {
            workerFilledSlots++;
          }
        }
      });

      filledSlots += workerFilledSlots;
      totalOutput += worker.totalOutput || 0;
    });

    // Prevent division by zero
    const percentage = totalSlots > 0 ? Math.round((filledSlots / totalSlots) * 100) : 0;
    const averageOutput =
      uniqueWorkersList.length > 0 ? Math.round(totalOutput / uniqueWorkersList.length) : 0;

    return {
      totalSlots,
      filledSlots,
      percentage,
      totalOutput,
      averageOutput,
    };
  }, [formData, worker, showSingleWorkerProgress]);

  return (
    <div>
      <h3 className="text-sm font-medium mb-2">
        {showSingleWorkerProgress ? 'Tiến độ công nhân' : 'Tiến độ nhập liệu'}
      </h3>
      <div className="mb-2">
        <div className="flex justify-between items-center mb-1">
          <div className="flex items-center gap-2">
            {currentTimeSlot && (
              <Badge variant="secondary" className="text-xs">
                <Clock className="h-3 w-3 mr-1" />
                {currentTimeSlot}
              </Badge>
            )}
          </div>
          <span className="text-sm">{completionStats.percentage}%</span>
        </div>
        <Progress value={completionStats.percentage} className="h-2" />
        <div className="flex justify-between mt-2 text-xs text-muted-foreground">
          <span>
            Đã nhập: {completionStats.filledSlots}/{completionStats.totalSlots}
          </span>
          <span>
            {showSingleWorkerProgress ? 'SL:' : 'Tổng SL:'} {completionStats.totalOutput}
          </span>
        </div>
      </div>

      {/* Additional info for single worker */}
      {showSingleWorkerProgress && worker && (
        <div className="bg-muted/20 p-2 rounded-md mt-2 text-xs">
          <div className="font-medium">
            {worker.shiftType === 'REGULAR'
              ? 'Ca thường'
              : worker.shiftType === 'EXTENDED'
                ? 'Giãn ca'
                : 'Tăng ca'}
          </div>
        </div>
      )}
    </div>
  );
}
