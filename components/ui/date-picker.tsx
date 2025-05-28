'use client';

import * as React from 'react';

import {format, parseISO, isValid} from 'date-fns';

import {CalendarIcon} from 'lucide-react';

import {Button} from '@/components/ui/button';
import {Calendar} from '@/components/ui/calendar';
import {Popover, PopoverContent, PopoverTrigger} from '@/components/ui/popover';

import {cn} from '@/lib/utils';

interface DatePickerProps {
  value?: Date | string | null;
  onChange?: (date: Date | null) => void;
  placeholder?: string;
  className?: string;
  id?: string;
  disabled?: boolean;
  label?: string;
  required?: boolean;
  error?: string;
  minDate?: Date;
  maxDate?: Date;
  readOnly?: boolean;
  name?: string;
  onBlur?: () => void;
  ['aria-invalid']?: boolean;
  ['aria-describedby']?: string;
}

export function DatePickerComponent({
  value,
  onChange,
  placeholder = 'Select date',
  className,
  id,
  disabled = false,
  label,
  required = false,
  error,
  minDate,
  maxDate,
  readOnly = false,
  name,
  onBlur,
  ['aria-invalid']: ariaInvalid,
  ['aria-describedby']: ariaDescribedBy,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);

  Convert value to Date object, handling string and Date inputs
  const parseDate = (val: Date | string | null | undefined): Date | null => {
    if (!val) return null;

    If already a Date object and valid
    if (val instanceof Date && !isNaN(val.getTime())) {
      return val;
    }

    If string, try to parse
    if (typeof val === 'string') {
      try {
        const parsedDate = parseISO(val);
        return isValid(parsedDate) ? parsedDate : null;
      } catch {
        return null;
      }
    }

    return null;
  };

  const dateValue = parseDate(value);

  const handleSelect = (date: Date | undefined) => {
    if (readOnly) return;
    onChange?.(date || null);
    setOpen(false); // Close the popover after selection
  };

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={id} className="text-sm font-medium">
          {label}
          {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            name={name}
            variant={'outline'}
            className={cn(
              'w-full justify-start text-left font-normal',
              !dateValue && 'text-muted-foreground',
              disabled && 'opacity-50 cursor-not-allowed',
              error && 'border-red-500',
              className,
            )}
            disabled={disabled || readOnly}
            onBlur={onBlur}
            aria-invalid={ariaInvalid}
            aria-describedby={ariaDescribedBy}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {dateValue ? format(dateValue, 'PP') : <span>{placeholder}</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={dateValue || undefined}
            onSelect={handleSelect}
            initialFocus
            disabled={disabled || readOnly}
            fromDate={minDate}
            toDate={maxDate}
          />
        </PopoverContent>
      </Popover>
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
}

For backward compatibility with any code using DatePickerDemo
export const DatePicker = DatePickerComponent;
