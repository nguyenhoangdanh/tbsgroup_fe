import React, { useState } from "react";
import dayjs from "dayjs";
import { Controller, FieldValues, Control, Path } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Clock } from "./custom/Clock"; // Assuming the Clock component is in the same directory
import { CalendarIcon, ClockIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Matcher } from "react-day-picker";

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
}

export const FieldDateTimePicker = <T extends FieldValues>({
    name,
    label,
    control,
    placeholder = "Chọn ngày và giờ",
    className,
    disabled = false,
    required = false,
    format = "DD/MM/YYYY HH:mm",
    minDate,
    maxDate,
    timeOnly = false,
    dateOnly = false
}: FieldDateTimePickerProps<T>) => {
    const [dateOpen, setDateOpen] = useState(false);
    const [timeOpen, setTimeOpen] = useState(false);

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

                // Handle date selection
                const handleDateSelect = (selectedDate: Date | undefined) => {
                    if (!selectedDate) return;

                    // If we have an existing time, preserve it
                    const newDateTime = currentValue
                        ? dayjs(selectedDate)
                            .hour(currentValue.hour())
                            .minute(currentValue.minute())
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
                        ? dayjs(currentValue)
                            .hour(hours)
                            .minute(minutes)
                        : dayjs().hour(hours).minute(minutes);

                    field.onChange(newDateTime.toDate());
                    setTimeOpen(false);
                };

                return (
                    <div className={cn("flex flex-col gap-1 default-theme", className)}>
                        <Label htmlFor={name} className="text-left font-medium">
                            {label}
                            {required && <span className="text-red-500">*</span>}
                        </Label>
                        <div className="flex gap-2">
                            {!timeOnly && (
                                <Popover open={dateOpen} onOpenChange={setDateOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            disabled={disabled}
                                            className={cn(
                                                "flex-grow justify-start text-left font-normal",
                                                !currentValue && "text-muted-foreground",
                                                disabled && "bg-gray-100 cursor-not-allowed dark:bg-gray-800",
                                                error ? "border-red-500" : "border-gray-300"
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {currentValue ? (
                                                dayjs(currentValue).format("DD/MM/YYYY")
                                            ) : (
                                                <span>Chọn ngày</span>
                                            )}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                        <Calendar
                                            mode="single"
                                            selected={currentValue?.toDate()}
                                            onSelect={handleDateSelect}
                                            disabled={disabledDates}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            )}

                            {!dateOnly && (
                                <Popover open={timeOpen} onOpenChange={setTimeOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            disabled={disabled}
                                            className={cn(
                                                "flex-grow justify-start text-left font-normal",
                                                !currentValue && "text-muted-foreground",
                                                disabled && "bg-gray-100 cursor-not-allowed dark:bg-gray-800",
                                                error ? "border-red-500" : "border-gray-300"
                                            )}
                                        >
                                            <ClockIcon className="mr-2 h-4 w-4" />
                                            {currentValue ? (
                                                dayjs(currentValue).format("HH:mm")
                                            ) : (
                                                <span>Chọn giờ</span>
                                            )}
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
                        {error?.message && (
                            <p className="h-5 text-red-500 text-sm">{error.message}</p>
                        )}
                    </div>
                )
            }}
        />
    );
};