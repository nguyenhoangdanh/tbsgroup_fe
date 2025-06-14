'use client';

import dayjs from 'dayjs';
import { CalendarIcon, ClockIcon } from 'lucide-react';
import React, { useState, useEffect, useCallback, memo } from 'react';
import { Matcher } from 'react-day-picker';
import { Controller, FieldValues, Control, Path } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export interface SpecialDate {
  date: Date;
  title: string;
  className?: string;
}

interface FieldDateTimePickerProps<T extends FieldValues> {
  name: Path<T>;
  label: string;
  control: Control<T>;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  format?: string;
  minDate?: Date;
  maxDate?: Date;
  timeOnly?: boolean;
  dateOnly?: boolean;
  description?: string;
  specialDates?: SpecialDate[];
  accentColor?: string;
  clearable?: boolean;
  readOnly?: boolean;
}

// Clock component for time selection
interface ClockProps {
  onSelect: (hours: number, minutes: number) => void;
  hours: number;
  minutes: number;
}

const Clock = ({ onSelect, hours: initialHours, minutes: initialMinutes }: ClockProps) => {
  const [hours, setHours] = useState(initialHours);
  const [minutes, setMinutes] = useState(initialMinutes);

  const handleHourChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newHour = parseInt(e.target.value);
    setHours(newHour);
    onSelect(newHour, minutes);
  };

  const handleMinuteChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newMinute = parseInt(e.target.value);
    setMinutes(newMinute);
    onSelect(hours, newMinute);
  };

  return (
    <div className="p-4">
      <div className="flex items-center justify-center space-x-2">
        <select
          value={hours}
          onChange={handleHourChange}
          className="p-2 border rounded-md"
        >
          {Array.from({ length: 24 }, (_, i) => (
            <option key={i} value={i}>
              {i.toString().padStart(2, '0')}
            </option>
          ))}
        </select>
        <span className="text-lg font-semibold">:</span>
        <select
          value={minutes}
          onChange={handleMinuteChange}
          className="p-2 border rounded-md"
        >
          {Array.from({ length: 60 }, (_, i) => (
            <option key={i} value={i}>
              {i.toString().padStart(2, '0')}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export const FieldDateTimePicker = <T extends FieldValues>({
  name,
  label,
  control,
  placeholder = 'Chọn thời gian',
  className,
  disabled = false,
  required = false,
  format = 'DD/MM/YYYY HH:mm',
  minDate,
  maxDate,
  timeOnly = false,
  dateOnly = false,
  description,
  specialDates = [],
  accentColor,
  clearable = true,
  readOnly = false,
}: FieldDateTimePickerProps<T>) => {
  const [dateOpen, setDateOpen] = useState(false);
  const [timeOpen, setTimeOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Phát hiện thiết bị di động
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // CSS cho các ngày đặc biệt
  const getSpecialDayStyle = useCallback(
    (date: Date) => {
      const special = specialDates.find(
        sd => dayjs(sd.date).format('YYYY-MM-DD') === dayjs(date).format('YYYY-MM-DD')
      );
      
      return special
        ? {
            className: `special-date ${special.className || ''}`,
            title: special.title,
            style: { border: `2px solid ${accentColor || 'var(--primary)'}` }
          }
        : {};
    },
    [specialDates, accentColor]
  );

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState: { error } }) => {
        // Convert field value to dayjs object or null
        const currentValue = field.value ? dayjs(field.value) : null;

        // Create disabled date matcher
        const disabledDates: Matcher[] = [];
        if (minDate) {
          disabledDates.push({ before: minDate });
        }
        if (maxDate) {
          disabledDates.push({ after: maxDate });
        }
        
        // Xử lý sự kiện native date input trên mobile
        const handleNativeInput = (
          e: React.ChangeEvent<HTMLInputElement>
        ) => {
          const value = e.target.value;
          if (!value) {
            field.onChange(undefined);
            return;
          }

          // Xử lý theo định dạng datetime-local
          if (e.target.type === 'datetime-local') {
            field.onChange(new Date(value));
            return;
          }

          // Xử lý theo định dạng date
          if (e.target.type === 'date') {
            const dateValue = new Date(value);
            // Giữ nguyên thời gian nếu đã có
            if (currentValue) {
              dateValue.setHours(currentValue.hour(), currentValue.minute(), 0, 0);
            }
            field.onChange(dateValue);
            return;
          }

          // Xử lý theo định dạng time
          if (e.target.type === 'time') {
            const [hours, minutes] = value.split(':').map(Number);
            const dateValue = field.value ? new Date(field.value) : new Date();
            dateValue.setHours(hours, minutes, 0, 0);
            field.onChange(dateValue);
          }
        };

        // Handle date selection
        const handleDateSelect = (selectedDate: Date | undefined) => {
          if (!selectedDate) {
            if (clearable) field.onChange(undefined);
            return;
          }

          // If we have an existing time, preserve it
          const newDateTime = currentValue
            ? dayjs(selectedDate).hour(currentValue.hour()).minute(currentValue.minute())
            : dayjs(selectedDate);

          field.onChange(newDateTime.toDate());

          // If date-only mode, close popover
          if (dateOnly) {
            setDateOpen(false);
          }
        };

        // Handle time selection
        const handleTimeSelect = (hours: number, minutes: number) => {
          const newDateTime = currentValue
            ? dayjs(currentValue).hour(hours).minute(minutes)
            : dayjs().hour(hours).minute(minutes);

          field.onChange(newDateTime.toDate());
          setTimeOpen(false);
        };

        // Handle clearing the value
        const handleClear = () => {
          field.onChange(undefined);
          setDateOpen(false);
          setTimeOpen(false);
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
            
            {/* Mobile Native Input */}
            {isMobile && (
              <div className="sm:hidden flex gap-2">
                {!timeOnly && (
                  <input
                    type="date"
                    value={currentValue ? currentValue.format('YYYY-MM-DD') : ''}
                    onChange={handleNativeInput}
                    disabled={disabled || readOnly}
                    min={minDate ? dayjs(minDate).format('YYYY-MM-DD') : undefined}
                    max={maxDate ? dayjs(maxDate).format('YYYY-MM-DD') : undefined}
                    className={cn(
                      'flex-1 px-3 py-2 border rounded-md',
                      disabled && 'bg-gray-100 cursor-not-allowed',
                      readOnly && 'bg-gray-50 cursor-default',
                      error ? 'border-red-500' : 'border-gray-300'
                    )}
                  />
                )}
                
                {!dateOnly && (
                  <input
                    type="time"
                    value={currentValue ? currentValue.format('HH:mm') : ''}
                    onChange={handleNativeInput}
                    disabled={disabled || readOnly}
                    className={cn(
                      'flex-1 px-3 py-2 border rounded-md',
                      disabled && 'bg-gray-100 cursor-not-allowed',
                      readOnly && 'bg-gray-50 cursor-default',
                      error ? 'border-red-500' : 'border-gray-300'
                    )}
                  />
                )}

                {clearable && currentValue && !disabled && !readOnly && (
                  <Button type="button" variant="ghost" onClick={handleClear} size="icon">
                    ✕
                  </Button>
                )}
              </div>
            )}
            
            {/* Desktop Popover UI */}
            <div className={cn(isMobile ? 'hidden sm:flex' : 'flex', 'gap-2')}>
              {!timeOnly && (
                <Popover open={dateOpen} onOpenChange={disabled || readOnly ? undefined : setDateOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      disabled={disabled}
                      className={cn(
                        'flex-grow justify-start text-left font-normal',
                        !currentValue && 'text-muted-foreground',
                        disabled && 'bg-gray-100 cursor-not-allowed dark:bg-gray-800',
                        readOnly && 'bg-gray-50 cursor-default dark:bg-gray-900',
                        error ? 'border-red-500' : 'border-gray-300'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {currentValue ? (
                        dayjs(currentValue).format('DD/MM/YYYY')
                      ) : (
                        <span>{placeholder}</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={currentValue?.toDate()}
                      onSelect={handleDateSelect}
                      disabled={disabledDates}
                      initialFocus
                      modifiers={{
                        special: specialDates.map(sd => sd.date)
                      }}
                      modifiersStyles={{
                        special: { border: `2px solid ${accentColor || 'var(--primary)'}` }
                      }}
                      components={{
                        Day: ({ date, ...props }: { date: Date }) => {
                          const dayProps = getSpecialDayStyle(date);
                          return <button {...props} {...dayProps} />;
                        }
                      }}
                    />
                    
                    {clearable && currentValue && (
                      <div className="p-2 border-t border-gray-100 dark:border-gray-800">
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm" 
                          onClick={handleClear}
                          className="w-full text-center text-muted-foreground hover:text-destructive"
                        >
                          Xóa ngày
                        </Button>
                      </div>
                    )}
                  </PopoverContent>
                </Popover>
              )}

              {!dateOnly && (
                <Popover open={timeOpen} onOpenChange={disabled || readOnly ? undefined : setTimeOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      disabled={disabled}
                      className={cn(
                        'flex-grow justify-start text-left font-normal',
                        !currentValue && 'text-muted-foreground',
                        disabled && 'bg-gray-100 cursor-not-allowed dark:bg-gray-800',
                        readOnly && 'bg-gray-50 cursor-default dark:bg-gray-900',
                        error ? 'border-red-500' : 'border-gray-300'
                      )}
                    >
                      <ClockIcon className="mr-2 h-4 w-4" />
                      {currentValue ? dayjs(currentValue).format('HH:mm') : <span>Chọn giờ</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Clock
                      onSelect={handleTimeSelect}
                      hours={currentValue?.hour() ?? new Date().getHours()}
                      minutes={currentValue?.minute() ?? new Date().getMinutes()}
                    />
                  </PopoverContent>
                </Popover>
              )}
            </div>
            
            {error?.message && <p className="h-5 text-red-500 text-sm">{error.message}</p>}
          </div>
        );
      }}
    />
  );
};

export default memo(FieldDateTimePicker) as typeof FieldDateTimePicker;
