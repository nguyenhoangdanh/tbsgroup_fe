'use client';

import { Clock } from 'lucide-react';
import { useCallback, useState, useMemo, useEffect } from 'react';

import { SHIFT_SCHEDULES } from '@/common/constants/shift-schedules';
import { getCurrentTimeSlot } from '@/common/constants/time-slots';
import { ShiftType, AttendanceStatus } from '@/common/types/digital-form';
import { TimeSlot } from '@/common/types/worker';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

interface TimeSlotGridProps {
  workers: {
    id: string;
    name: string;
    attendanceStatus: AttendanceStatus;
    shiftType: ShiftType;
    hourlyData: Record<string, number>;
    totalOutput?: number;
  }[];
  onUpdateHourlyData: (workerId: string, timeSlot: string, quantity: number) => Promise<boolean>;
  readOnly?: boolean;
  className?: string;
  compact?: boolean;
}

export function TimeSlotGrid({
  workers,
  onUpdateHourlyData,
  readOnly = false,
  className,
  compact = false,
}: TimeSlotGridProps) {
  const [editingCell, setEditingCell] = useState<{
    workerId: string;
    timeSlotId: string;
    value: string;
  } | null>(null);

  const [currentTimeSlot, setCurrentTimeSlot] = useState<TimeSlot | null>(getCurrentTimeSlot());

  // Update current time slot every minute
  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentTimeSlot(getCurrentTimeSlot());
    }, 60000);

    return () => clearInterval(intervalId);
  }, []);

  // Get all time slots for all shift types
  const allTimeSlots = useMemo(() => {
    // Get unique set of time slots from all shift types
    const timeSlotMap = new Map<string, TimeSlot>();

    Object.values(SHIFT_SCHEDULES).forEach(schedule => {
      schedule.timeSlots.forEach(slot => {
        if (!slot.isBreak) {
          timeSlotMap.set(slot.id, slot);
        }
      });
    });

    // Convert to array and sort by start time
    return Array.from(timeSlotMap.values()).sort((a, b) => {
      return a.start.localeCompare(b.start);
    });
  }, []);

  // Get visible time slots based on compact mode and worker shifts
  const visibleTimeSlots = useMemo(() => {
    if (compact) {
      // For compact view, show time slots that have data or are current/upcoming
      const relevantSlots = new Set<string>();

      // Add the current time slot and the next two
      if (currentTimeSlot) {
        const currentIndex = allTimeSlots.findIndex(slot => slot.id === currentTimeSlot.id);
        if (currentIndex >= 0) {
          relevantSlots.add(currentTimeSlot.id);
          if (currentIndex + 1 < allTimeSlots.length) {
            relevantSlots.add(allTimeSlots[currentIndex + 1].id);
          }
          if (currentIndex + 2 < allTimeSlots.length) {
            relevantSlots.add(allTimeSlots[currentIndex + 2].id);
          }
        }
      }

      // Add slots that have data
      workers.forEach(worker => {
        Object.keys(worker.hourlyData || {}).forEach(slotId => {
          if (worker.hourlyData[slotId] > 0) {
            relevantSlots.add(slotId);
          }
        });
      });

      return allTimeSlots.filter(slot => relevantSlots.has(slot.id));
    }

    // For full view, return all time slots
    return allTimeSlots;
  }, [allTimeSlots, compact, currentTimeSlot, workers]);

  // Handle cell click to start editing
  const handleCellClick = useCallback(
    (workerId: string, timeSlotId: string, currentValue: number) => {
      if (readOnly) return;

      setEditingCell({
        workerId,
        timeSlotId,
        value: currentValue.toString(),
      });
    },
    [readOnly],
  );

  // Handle input change
  const handleInputChange = useCallback((value: string) => {
    // Only allow numbers
    if (!/^\d*$/.test(value)) return;

    setEditingCell(prev =>
      prev
        ? {
            ...prev,
            value,
          }
        : null,
    );
  }, []);

  // Handle save
  const handleSave = useCallback(async () => {
    if (!editingCell) return;

    const { workerId, timeSlotId, value } = editingCell;
    const numValue = parseInt(value, 10) || 0;

    try {
      await onUpdateHourlyData(workerId, timeSlotId, numValue);
    } finally {
      setEditingCell(null);
    }
  }, [editingCell, onUpdateHourlyData]);

  // Handle keydown
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleSave();
      } else if (e.key === 'Escape') {
        setEditingCell(null);
      }
    },
    [handleSave],
  );

  // Get the worker's hourly data for a specific time slot
  const getOutputForTimeSlot = useCallback(
    (worker: TimeSlotGridProps['workers'][0], timeSlot: TimeSlot): number => {
      return worker.hourlyData?.[timeSlot.id] || 0;
    },
    [],
  );

  // Check if worker is active for the given timeslot based on shift type and attendance
  const isWorkerActiveForTimeSlot = useCallback(
    (worker: TimeSlotGridProps['workers'][0], timeSlot: TimeSlot): boolean => {
      if (worker.attendanceStatus !== AttendanceStatus.PRESENT) {
        return false;
      }

      const shiftSchedule = SHIFT_SCHEDULES[worker.shiftType];
      if (!shiftSchedule) return false;

      // Check if this time slot is part of the worker's shift
      return shiftSchedule.timeSlots.some(slot => slot.id === timeSlot.id && !slot.isBreak);
    },
    [],
  );

  return (
    <div className={cn('w-full overflow-x-auto', className)}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className={cn('min-w-[160px]', compact && 'min-w-[120px]')}>
              Worker
            </TableHead>
            {/* Time slot headers */}
            {visibleTimeSlots.map(timeSlot => (
              <TableHead
                key={timeSlot.id}
                className={cn('min-w-[80px]', currentTimeSlot?.id === timeSlot.id && 'bg-amber-50')}
              >
                <div className="flex flex-col items-center">
                  <span className="text-xs font-medium">{timeSlot.label}</span>
                  {currentTimeSlot?.id === timeSlot.id && (
                    <Badge variant="secondary" className="mt-1 bg-amber-100">
                      <Clock className="h-3 w-3 mr-1" />
                      <span className="text-[10px]">Current</span>
                    </Badge>
                  )}
                </div>
              </TableHead>
            ))}
            <TableHead className="min-w-[60px] text-right">Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {workers.map(worker => (
            <TableRow
              key={worker.id}
              className={cn(
                worker.attendanceStatus !== AttendanceStatus.PRESENT && 'opacity-60 bg-gray-50',
              )}
            >
              <TableCell className="font-medium">
                <div className="flex flex-col">
                  <span className="truncate max-w-[160px]">{worker.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {worker.shiftType === ShiftType.REGULAR
                      ? 'Reg'
                      : worker.shiftType === ShiftType.EXTENDED
                        ? 'Ext'
                        : 'OT'}
                    {worker.attendanceStatus !== AttendanceStatus.PRESENT && (
                      <Badge variant="outline" className="ml-1 text-[10px] py-0">
                        {worker.attendanceStatus.substring(0, 3)}
                      </Badge>
                    )}
                  </span>
                </div>
              </TableCell>

              {/* Time slots */}
              {visibleTimeSlots.map(timeSlot => {
                const isActive = isWorkerActiveForTimeSlot(worker, timeSlot);
                const isCurrent = currentTimeSlot?.id === timeSlot.id;
                const output = getOutputForTimeSlot(worker, timeSlot);
                const isEditing =
                  editingCell?.workerId === worker.id && editingCell?.timeSlotId === timeSlot.id;

                return (
                  <TableCell
                    key={`${worker.id}-${timeSlot.id}`}
                    className={cn(
                      'text-center relative',
                      isCurrent && 'bg-amber-50',
                      !isActive && 'bg-gray-50',
                      !readOnly && isActive && 'cursor-pointer hover:bg-gray-50',
                    )}
                    onClick={() =>
                      isActive &&
                      !readOnly &&
                      !isEditing &&
                      handleCellClick(worker.id, timeSlot.id, output)
                    }
                  >
                    {isEditing ? (
                      <Input
                        autoFocus
                        value={editingCell.value}
                        onChange={e => handleInputChange(e.target.value)}
                        onBlur={handleSave}
                        onKeyDown={handleKeyDown}
                        className="h-8 text-center"
                      />
                    ) : isActive ? (
                      <span>{output}</span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                );
              })}

              {/* Total */}
              <TableCell className="font-bold text-right">{worker.totalOutput || 0}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default TimeSlotGrid;
