import dayjs from 'dayjs';
import { CalendarIcon, ClockIcon } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { Matcher } from 'react-day-picker';
import { Controller, FieldValues, Control, Path } from 'react-hook-form';


import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

import {  StyledRangeCalendar }  from './StyledRangeCalendar';
import { TimeRangePicker } from './TimeRangePicker';

// Interface for the date-time range value
export interface DateTimeRange {
  startDateTime: Date;
  endDateTime: Date;
}

interface FieldRangeDateTimePickerProps<T extends FieldValues> {
  name: Path<T>;
  label: string;
  control: Control<T>;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  minDate?: Date;
  maxDate?: Date;
  allowSameDateTime?: boolean;
  accentColor?: string;
  description?: string;
}

export const FieldRangeDateTimePicker = <T extends FieldValues>({
  name,
  label,
  control,
  placeholder = 'Chọn ngày và giờ',
  className,
  disabled = false,
  required = false,
  minDate,
  maxDate,
  allowSameDateTime = false,
  accentColor = '#0284c7',
  description,
}: FieldRangeDateTimePickerProps<T>) => {
  const [dateOpen, setDateOpen] = useState(false);
  const [timeOpen, setTimeOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Responsive handler
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    // Check on mount
    checkMobile();

    // Add event listener for resize
    window.addEventListener('resize', checkMobile);

    // Cleanup
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState: { error } }) => {
        // Ensure field value exists with default dates
        const currentValue = field.value as DateTimeRange || {
          startDateTime: dayjs().toDate(),
          endDateTime: dayjs().add(1, 'day').toDate(), // Default to next day
        };

        // Create safe references to the date objects
        const startDate = currentValue?.startDateTime 
          ? dayjs(currentValue.startDateTime) 
          : dayjs();
        
        const endDate = currentValue?.endDateTime 
          ? dayjs(currentValue.endDateTime) 
          : dayjs().add(1, 'day');

        // Create disabled date matcher
        const disabledDates: Matcher[] = [];
        if (minDate) {
          disabledDates.push({ before: minDate });
        }
        if (maxDate) {
          disabledDates.push({ after: maxDate });
        }

        // Handle date selection - FIXED VERSION
        const handleDateSelect = (range?: { from?: Date; to?: Date }) => {
          // If no date selected, do nothing
          if (!range || !range.from) return;

          // Start with the existing value or create new one
          const updatedValue: DateTimeRange = { ...currentValue };
          
          // Ensure we have valid dates to start with
          if (!updatedValue.startDateTime) updatedValue.startDateTime = new Date();
          if (!updatedValue.endDateTime) updatedValue.endDateTime = new Date();

          // Update start date preserving the time part
          updatedValue.startDateTime = new Date(
            range.from.getFullYear(),
            range.from.getMonth(),
            range.from.getDate(),
            startDate.hour(),
            startDate.minute(),
          );

          // If to date is provided, use it; otherwise leave end date unchanged
          if (range.to) {
            updatedValue.endDateTime = new Date(
              range.to.getFullYear(),
              range.to.getMonth(),
              range.to.getDate(),
              endDate.hour(),
              endDate.minute(),
            );
          }

          // Don't auto-close if the user only selected the start date
          if (range.from && !range.to) {
            // Keep popover open to allow selecting the end date
          } else {
            // Close the popover since both dates are selected
            setDateOpen(false);
          }

          // Update the field value
          field.onChange(updatedValue as any);
        };

        // Handle time range selection
        const handleTimeRangeSelect = (
          startHours: number,
          startMinutes: number,
          endHours: number,
          endMinutes: number,
        ) => {
          // Create copies of the current dates
          const updatedValue: DateTimeRange = { ...currentValue };
          
          // Ensure we have valid dates
          if (!updatedValue.startDateTime) updatedValue.startDateTime = new Date();
          if (!updatedValue.endDateTime) updatedValue.endDateTime = new Date();
          
          const start = new Date(updatedValue.startDateTime);
          const end = new Date(updatedValue.endDateTime);

          // Update hours and minutes
          start.setHours(startHours);
          start.setMinutes(startMinutes);

          end.setHours(endHours);
          end.setMinutes(endMinutes);

          // Update the field value
          updatedValue.startDateTime = start;
          updatedValue.endDateTime = end;
          field.onChange(updatedValue as any);

          setTimeOpen(false);
        };

        // Validate time range
        const isValidDateTime = () => {
          if (!currentValue?.startDateTime || !currentValue?.endDateTime) return true;
          
          const start = new Date(currentValue.startDateTime);
          const end = new Date(currentValue.endDateTime);

          if (allowSameDateTime) {
            return start.getTime() <= end.getTime();
          } else {
            return start.getTime() < end.getTime();
          }
        };

        return (
          <div className={cn('flex flex-col gap-1 default-theme', className)}>
            <Label htmlFor={name} className="text-left font-medium">
              {label}
              {required && <span className="text-red-500">*</span>}
            </Label>
            
            {description && (
              <p className="text-sm text-muted-foreground -mt-1 mb-1">{description}</p>
            )}

            <div className="flex gap-2">
              {/* Date Selection */}
              <Popover open={dateOpen} onOpenChange={disabled ? undefined : setDateOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    disabled={disabled}
                    className={cn(
                      'flex-grow justify-start text-left font-normal',
                      !currentValue && 'text-muted-foreground',
                      disabled && 'bg-gray-100 cursor-not-allowed dark:bg-gray-800',
                      error ? 'border-red-500' : 'border-gray-300',
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {currentValue?.startDateTime && currentValue?.endDateTime ? (
                      `${startDate.format('DD/MM/YYYY')} - ${endDate.format('DD/MM/YYYY')}`
                    ) : (
                      <span>{placeholder}</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-auto p-0 shadow-lg border-gray-200 dark:border-gray-700"
                  align="start"
                  side="bottom"
                >
                  <StyledRangeCalendar
                    selected={{
                      from: currentValue?.startDateTime || undefined,
                      to: currentValue?.endDateTime || undefined,
                    }}
                    onSelect={handleDateSelect}
                    disabled={disabledDates}
                    initialFocus
                    numberOfMonths={isMobile ? 1 : 2}
                    accentColor={accentColor}
                    className="calendar-container"
                  />
                </PopoverContent>
              </Popover>

              {/* Time Selection */}
              <Popover open={timeOpen} onOpenChange={disabled ? undefined : setTimeOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    disabled={disabled}
                    className={cn(
                      'flex-grow justify-start text-left font-normal',
                      !currentValue && 'text-muted-foreground',
                      disabled && 'bg-gray-100 cursor-not-allowed dark:bg-gray-800',
                      error ? 'border-red-500' : 'border-gray-300',
                    )}
                  >
                    <ClockIcon className="mr-2 h-4 w-4" />
                    {currentValue?.startDateTime && currentValue?.endDateTime ? (
                      `${startDate.format('HH:mm')} - ${endDate.format('HH:mm')}`
                    ) : (
                      <span>Chọn giờ</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start" side="bottom">
                  <TimeRangePicker
                    onSelect={handleTimeRangeSelect}
                    startHours={startDate.hour()}
                    startMinutes={startDate.minute()}
                    endHours={endDate.hour()}
                    endMinutes={endDate.minute()}
                    allowSameTime={allowSameDateTime}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Error Handling */}
            {error?.message && <p className="h-5 text-red-500 text-sm">{error.message}</p>}

            {/* Validation Warning */}
            {currentValue && !isValidDateTime() && (
              <p className="h-5 text-red-500 text-sm">
                Thời gian kết thúc phải sau thời gian bắt đầu
              </p>
            )}
          </div>
        );
      }}
    />
  );
};

export default FieldRangeDateTimePicker;
