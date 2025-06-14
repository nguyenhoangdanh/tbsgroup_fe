import dayjs from 'dayjs';
import { ClockIcon } from 'lucide-react';
import React, { useState } from 'react';
import { Controller, FieldValues, Control, Path } from 'react-hook-form';


import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

import { TimeRangePicker } from './TimeRangePicker';

// Định nghĩa kiểu dữ liệu cho TimeRangeValue
export interface TimeRangeValue {
  startTime: Date;
  endTime: Date;
}

interface FieldTimeRangePickerProps<T extends FieldValues> {
  name: Path<T>;
  label: string;
  control: Control<T>;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  allowSameTime?: boolean;
  description?: string;
}

export const FieldTimeRangePicker = <T extends FieldValues>({
  name,
  label,
  control,
  placeholder = 'Chọn khoảng thời gian',
  className,
  disabled = false,
  required = false,
  allowSameTime = false,
  description,
}: FieldTimeRangePickerProps<T>) => {
  const [timeOpen, setTimeOpen] = useState(false);

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState: { error } }) => {
        // Convert field value to time range object or use current time
        const fieldValue = field.value as TimeRangeValue | undefined;
        
        const currentValue = fieldValue
          ? {
              startHours: dayjs(fieldValue.startTime).hour(),
              startMinutes: dayjs(fieldValue.startTime).minute(),
              endHours: dayjs(fieldValue.endTime).hour(),
              endMinutes: dayjs(fieldValue.endTime).minute(),
            }
          : {
              startHours: new Date().getHours(),
              startMinutes: new Date().getMinutes(),
              endHours: new Date().getHours(),
              endMinutes: new Date().getMinutes(),
            };

        //  Handle time range selection
        const handleTimeRangeSelect = (
          startHours: number,
          startMinutes: number,
          endHours: number,
          endMinutes: number,
        ) => {
          // Create date objects for start and end times
          const startTime = dayjs().hour(startHours).minute(startMinutes).second(0).millisecond(0).toDate();
          const endTime = dayjs().hour(endHours).minute(endMinutes).second(0).millisecond(0).toDate();

          // Update field value
          field.onChange({ startTime, endTime } as any);
          setTimeOpen(false);
        };

        // Format display string
        const displayValue = fieldValue
          ? `${dayjs(fieldValue.startTime).format('HH:mm')} - ${dayjs(fieldValue.endTime).format('HH:mm')}`
          : placeholder;

        return (
          <div className={cn('flex flex-col gap-1 default-theme', className)}>
            <Label htmlFor={name} className="text-left font-medium">
              {label}
              {required && <span className="text-red-500">*</span>}
            </Label>
            
            {description && (
              <p className="text-sm text-muted-foreground -mt-1 mb-1">{description}</p>
            )}
            
            <Popover open={timeOpen} onOpenChange={disabled ? undefined : setTimeOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  disabled={disabled}
                  className={cn(
                    'flex-grow justify-start text-left font-normal',
                    !field.value && 'text-muted-foreground',
                    disabled && 'bg-gray-100 cursor-not-allowed dark:bg-gray-800',
                    error ? 'border-red-500' : 'border-gray-300'
                  )}
                >
                  <ClockIcon className="mr-2 h-4 w-4" />
                  {displayValue}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <TimeRangePicker
                  onSelect={handleTimeRangeSelect}
                  startHours={currentValue.startHours}
                  startMinutes={currentValue.startMinutes}
                  endHours={currentValue.endHours}
                  endMinutes={currentValue.endMinutes}
                  allowSameTime={allowSameTime}
                />
              </PopoverContent>
            </Popover>
            {error?.message && <p className="h-5 text-red-500 text-sm">{error.message}</p>}
          </div>
        );
      }}
    />
  );
};

export default FieldTimeRangePicker;
