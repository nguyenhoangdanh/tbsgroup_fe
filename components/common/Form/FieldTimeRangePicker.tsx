import dayjs from 'dayjs';
import { ClockIcon } from 'lucide-react';
import React, { useState } from 'react';
import { Controller, FieldValues, Control, Path } from 'react-hook-form';

import { TimeRangePicker } from './TimeRangePicker';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface FieldTimeRangePickerProps<T extends FieldValues> {
  name: Path<T>;
  label: string;
  control: Control<T>;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  allowSameTime?: boolean;
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
}: FieldTimeRangePickerProps<T>) => {
  const [timeOpen, setTimeOpen] = useState(false);

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState: { error } }) => {
        // Convert field value to time range object or use current time
        const currentValue = field.value
          ? {
              startHours: dayjs(field.value.startTime).hour(),
              startMinutes: dayjs(field.value.startTime).minute(),
              endHours: dayjs(field.value.endTime).hour(),
              endMinutes: dayjs(field.value.endTime).minute(),
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
          const startTime = dayjs().hour(startHours).minute(startMinutes).toDate();
          const endTime = dayjs().hour(endHours).minute(endMinutes).toDate();

          // Update field value
          field.onChange({ startTime, endTime });
          setTimeOpen(false);
        };

        // Format display string
        const displayValue = field.value
          ? `${dayjs(field.value.startTime).format('HH:mm')} - ${dayjs(field.value.endTime).format('HH:mm')}`
          : placeholder;

        return (
          <div className={cn('flex flex-col gap-1 default-theme', className)}>
            <Label htmlFor={name} className="text-left font-medium">
              {label}
              {required && <span className="text-red-500">*</span>}
            </Label>
            <Popover open={timeOpen} onOpenChange={setTimeOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  disabled={disabled}
                  className={cn(
                    'flex-grow justify-start text-left font-normal',
                    !field.value && 'text-muted-foreground',
                    disabled && 'bg-gray-100 cursor-not-allowed dark:bg-gray-800',
                    error ? 'border-red-500' : 'border-gray-300',
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
