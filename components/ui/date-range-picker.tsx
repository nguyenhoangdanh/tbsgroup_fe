'use client';

import * as React from 'react';

import {format} from 'date-fns';
import {vi} from 'date-fns/locale';
import {DateRange} from 'react-day-picker';

import {Calendar as CalendarIcon} from 'lucide-react';

import {Button} from '@/components/ui/button';
import {Calendar} from '@/components/ui/calendar';
import {Popover, PopoverContent, PopoverTrigger} from '@/components/ui/popover';

import {cn} from '@/lib/utils';

interface DatePickerWithRangeProps {
  className?: string;
  dateFrom?: Date;
  dateTo?: Date;
  onDateChange: (dateFrom?: Date, dateTo?: Date) => void;
}

export function DatePickerWithRange({
  className,
  dateFrom,
  dateTo,
  onDateChange,
}: DatePickerWithRangeProps) {
  const [date, setDate] = React.useState<DateRange | undefined>(
    dateFrom && dateTo
      ? {
          from: dateFrom,
          to: dateTo,
        }
      : undefined,
  );

  React.useEffect(() => {
    if (dateFrom && dateTo) {
      setDate({
        from: dateFrom,
        to: dateTo,
      });
    } else if (dateFrom) {
      setDate({
        from: dateFrom,
        to: undefined,
      });
    } else {
      setDate(undefined);
    }
  }, [dateFrom, dateTo]);

  const handleDateChange = (range?: DateRange) => {
    setDate(range);
    onDateChange(range?.from, range?.to);
  };

  const formatDateRange = () => {
    if (!date?.from) {
      return 'Chọn khoảng thời gian';
    }

    if (date.to) {
      return `${format(date.from, 'dd/MM/yyyy', {locale: vi})} - ${format(
        date.to,
        'dd/MM/yyyy',
        {locale: vi},
      )}`;
    }

    return format(date.from, 'dd/MM/yyyy', {locale: vi});
  };

  return (
    <div className={cn('grid gap-2', className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={'outline'}
            className={cn(
              'w-full justify-start text-left font-normal',
              !date && 'text-muted-foreground',
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {formatDateRange()}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={handleDateChange}
            numberOfMonths={2}
            locale={vi}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
