'use client';
import React, { useMemo, useState } from 'react';

import { ShiftType } from '@/common/types/digital-form';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useDigitalFormContext } from '@/hooks/digital-form';
import { useWorkShifts } from '@/hooks/digital-form/useWorkShifts';
import { cn } from '@/lib/utils';

interface BagTimeSlotGridProps {
  entryId: string;
  hourlyData?: Record<string, number>;
  readonly?: boolean;
  shiftType?: ShiftType;
  className?: string;
}

export const BagTimeSlotGrid: React.FC<BagTimeSlotGridProps> = ({
  entryId,
  hourlyData = {},
  readonly = false,
  shiftType = ShiftType.REGULAR,
  className,
}) => {
  const { updateHourlyData } = useDigitalFormContext();
  const { timeSlots, currentSlot, calculateTotalOutput } = useWorkShifts(shiftType);

  // Track whether each cell has been edited
  const [editedCells, setEditedCells] = useState<Record<string, boolean>>({});

  // Format hourly data to ensure all slots have values
  const formattedHourlyData = useMemo(() => {
    return timeSlots.reduce<Record<string, number>>((acc, slot) => {
      acc[slot.label] = hourlyData[slot.label] || 0;
      return acc;
    }, {});
  }, [hourlyData, timeSlots]);

  // Calculate total output
  const totalOutput = useMemo(() => {
    return calculateTotalOutput(formattedHourlyData);
  }, [calculateTotalOutput, formattedHourlyData]);

  // Handle input change
  const handleInputChange = (timeSlot: string, value: string) => {
    // Convert to number and validate
    const numValue = parseInt(value, 10) || 0;

    // Skip if readonly or value hasn't changed
    if (readonly || numValue === formattedHourlyData[timeSlot]) return;

    // Mark cell as edited
    setEditedCells(prev => ({ ...prev, [timeSlot]: true }));

    // Update context
    updateHourlyData(entryId, timeSlot, numValue);
  };

  return (
    <Card className={cn('bg-white shadow-sm', className)}>
      <CardContent className="p-3">
        <div className="grid grid-cols-2 gap-1 md:flex md:flex-wrap md:justify-between">
          {/* Time slot header with current slot highlight */}
          <div className="flex items-center justify-between col-span-2 mb-2">
            <h3 className="text-sm font-medium">Kết quả thực hiện trong ngày</h3>
            <span className="text-sm text-muted-foreground">Tổng: {totalOutput}</span>
          </div>

          {/* Time slots grid */}
          <div className="col-span-2 grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-12 gap-1 w-full">
            {timeSlots.map(slot => {
              const isCurrentTimeSlot = currentSlot?.label === slot.label;
              const cellValue = formattedHourlyData[slot.label] || 0;
              const hasValue = cellValue > 0;

              return (
                <div
                  key={slot.label}
                  className={cn('flex flex-col', isCurrentTimeSlot && 'bg-amber-50')}
                >
                  <div
                    className={cn(
                      'text-[10px] font-medium text-center px-1 py-0.5 border-b truncate',
                      isCurrentTimeSlot ? 'bg-amber-200' : 'bg-slate-100',
                    )}
                  >
                    {slot.start.substring(0, 5)}-{slot.end.substring(0, 5)}
                  </div>
                  <Input
                    type="number"
                    min="0"
                    value={cellValue || ''}
                    onChange={e => handleInputChange(slot.label, e.target.value)}
                    className={cn(
                      'h-8 text-center px-0 text-sm rounded-none',
                      hasValue ? 'text-green-600 font-medium' : 'text-gray-500',
                      editedCells[slot.label] ? 'bg-blue-50' : '',
                      readonly && 'bg-gray-50 cursor-not-allowed opacity-70',
                    )}
                    readOnly={readonly}
                  />
                </div>
              );
            })}
          </div>

          {/* Total row */}
          <div className="col-span-2 flex justify-between items-center mt-2 py-1 px-2 bg-slate-100 rounded">
            <span className="text-sm font-medium">Tổng cộng</span>
            <Badge variant="outline" className="font-bold">
              {totalOutput}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BagTimeSlotGrid;
