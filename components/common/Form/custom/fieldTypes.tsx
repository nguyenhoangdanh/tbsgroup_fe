"use client";

import React, { memo, useCallback } from "react";
import { FieldValues } from "react-hook-form";
import {
    FieldContainer,
    CheckFieldContainer,
    FieldLabel,
    FieldDescription,
    ErrorMessage
} from "./fieldComponents";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
    Popover,
    PopoverContent,
    PopoverTrigger
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList
} from "@/components/ui/command";
import {
    RadioGroup,
    RadioGroupItem
} from "@/components/ui/radio-group";
import {
    Check,
    ChevronsUpDown,
    CalendarIcon,
    ClockIcon,
    Eye,
    EyeOff,
    X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { FormFieldOption } from "./types";
import { useFormField } from "./useFormField";
import { Clock } from "../Clock";
import { TimeRangePicker } from "../TimeRangePicker";
import StyledRangeCalendar from "../StyledRangeCalendar";
import clsx from "clsx";
import { Switch } from "@/components/ui/switch";

// Props for each field type component
interface FieldTypeProps<T extends FieldValues> {
    name: string;
    field: any;
    error?: { message?: string };
    label: string;
    placeholder?: string;
    description?: string;
    required?: boolean;
    disabled?: boolean;
    className?: string;
    [key: string]: any; // For additional props
    allowClear?: boolean;
}

/**
 * Text Input Field Component
 */
export const TextField = memo(<T extends FieldValues>({
    name,
    field,
    error,
    label,
    placeholder = "",
    description,
    required = false,
    disabled = false,
    className = "",
    autoComplete,
    type = "text",
}: FieldTypeProps<T> & {
    autoComplete?: string;
    type?: "text" | "number" | "email";
}) => {
    const { getSafeValue } = useFormField({ field, type });

    const inputClass = cn(
        "w-full",
        disabled && "bg-gray-100 cursor-not-allowed dark:bg-gray-800",
        error ? "border-red-500 focus:ring-red-500" : "border-gray-300",
        className
    );

    return (
        <FieldContainer>
            <FieldLabel name={name} label={label} required={required} />
            <FieldDescription description={description} />
            <Input
                {...field}
                id={name}
                type={type}
                placeholder={placeholder}
                autoComplete={autoComplete}
                disabled={disabled}
                value={getSafeValue()}
                className={inputClass}
                aria-invalid={!!error}
                aria-describedby={error ? `${name}-error` : undefined}
            />
            <ErrorMessage error={error} name={name} />
        </FieldContainer>
    );
});
TextField.displayName = "TextField";

/**
 * Password Field Component
 */
export const PasswordField = memo(<T extends FieldValues>({
    name,
    field,
    error,
    label,
    placeholder = "",
    description,
    required = false,
    disabled = false,
    className = "",
    autoComplete,
}: FieldTypeProps<T> & {
    autoComplete?: string;
}) => {
    const { showPassword, togglePasswordVisibility, getSafeValue } = useFormField({
        field,
        type: "password"
    });

    const inputClass = cn(
        "w-full",
        disabled && "bg-gray-100 cursor-not-allowed dark:bg-gray-800",
        error ? "border-red-500 focus:ring-red-500" : "border-gray-300",
        className
    );

    return (
        <FieldContainer>
            <FieldLabel name={name} label={label} required={required} />
            <FieldDescription description={description} />
            <div className="relative">
                <Input
                    {...field}
                    id={name}
                    type={showPassword ? "text" : "password"}
                    placeholder={placeholder}
                    autoComplete={autoComplete}
                    disabled={disabled}
                    value={getSafeValue()}
                    className={inputClass}
                    aria-invalid={!!error}
                    aria-describedby={error ? `${name}-error` : undefined}
                />
                <button
                    type="button"
                    tabIndex={-1}
                    onClick={togglePasswordVisibility}
                    className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700"
                    aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
            </div>
            <ErrorMessage error={error} name={name} />
        </FieldContainer>
    );
});
PasswordField.displayName = "PasswordField";

/**
 * Textarea Field Component
 */
export const TextareaField = memo(<T extends FieldValues>({
    name,
    field,
    error,
    label,
    placeholder = "",
    description,
    required = false,
    disabled = false,
    className = "",
    rows = 3,
}: FieldTypeProps<T> & {
    rows?: number;
}) => {
    const { getSafeValue } = useFormField({ field, type: "textarea" });

    const inputClass = cn(
        "w-full",
        disabled && "bg-gray-100 cursor-not-allowed dark:bg-gray-800",
        error ? "border-red-500 focus:ring-red-500" : "border-gray-300",
        className
    );

    return (
        <FieldContainer>
            <FieldLabel name={name} label={label} required={required} />
            <FieldDescription description={description} />
            <Textarea
                {...field}
                id={name}
                placeholder={placeholder}
                disabled={disabled}
                value={getSafeValue()}
                rows={rows}
                className={inputClass}
                aria-invalid={!!error}
                aria-describedby={error ? `${name}-error` : undefined}
            />
            <ErrorMessage error={error} name={name} />
        </FieldContainer>
    );
});
TextareaField.displayName = "TextareaField";

/**
 * Select Field Component
 */
export const SelectField = memo(<T extends FieldValues>({
    name,
    field,
    error,
    label,
    placeholder = "",
    description,
    required = false,
    disabled = false,
    className = "",
    options = [],
}: FieldTypeProps<T> & {
    options: FormFieldOption[];
}) => {
    const inputClass = cn(
        "w-full",
        disabled && "bg-gray-100 cursor-not-allowed dark:bg-gray-800",
        error ? "border-red-500 focus:ring-red-500" : "border-gray-300",
        className
    );

    return (
        <FieldContainer>
            <FieldLabel name={name} label={label} required={required} />
            <FieldDescription description={description} />
            <Select
                disabled={disabled}
                value={field.value !== undefined && field.value !== null ? String(field.value) : ""}
                onValueChange={(value) => {
                    // Convert value back to original type if possible
                    const option = options.find(opt => String(opt.value) === value);
                    field.onChange(option ? option.value : value);
                }}
            >
                <SelectTrigger
                    id={name}
                    className={cn(
                        inputClass,
                        "flex justify-between items-center"
                    )}
                    aria-invalid={!!error}
                    aria-describedby={error ? `${name}-error` : undefined}
                >
                    <SelectValue placeholder={placeholder} />
                </SelectTrigger>
                <SelectContent position="popper" className="w-full z-50">
                    {options.map((option) => (
                        <SelectItem
                            key={String(option.value)}
                            value={String(option.value)}
                        >
                            {option.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <ErrorMessage error={error} name={name} />
        </FieldContainer>
    );
});
SelectField.displayName = "SelectField";

/**
 * Combobox Field Component (also used for autocomplete)
 */
export const ComboboxField = memo(<T extends FieldValues>({
    name,
    field,
    error,
    label,
    placeholder = "",
    description,
    required = false,
    disabled = false,
    className = "",
    options = [],
    searchPlaceholder = "Tìm kiếm...",
    allowClear = false,
    onChange,
}: FieldTypeProps<T> & {
    options: FormFieldOption[];
    searchPlaceholder?: string;
}) => {
    const {
        comboboxOpen,
        setComboboxOpen,
        searchTerm,
        setSearchTerm,
        filteredOptions,
        selectedOption
    } = useFormField({ field, type: "combobox", options });

    // Handle field clear
    const handleClear = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        field.onChange("");
        if (onChange) onChange("");
    }, [field, onChange]);

    return (
        <FieldContainer className={className}>
            <FieldLabel name={name} label={label} required={required} />
            <FieldDescription description={description} />
            <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={comboboxOpen}
                        disabled={disabled}
                        className={cn(
                            "w-full justify-between text-left font-normal",
                            disabled && "bg-gray-100 cursor-not-allowed dark:bg-gray-800",
                            error ? "border-red-500" : "border-gray-300"
                        )}
                        aria-invalid={!!error}
                        aria-describedby={error ? `${name}-error` : undefined}
                    >
                        <span className="truncate">
                            {selectedOption ? selectedOption.label : placeholder}
                        </span>
                        <div className="flex items-center gap-1">
                            {allowClear && field.value && (
                                <X
                                    className="h-4 w-4 shrink-0 opacity-50 hover:opacity-100"
                                    onClick={handleClear}
                                    aria-label="Clear selection"
                                />
                            )}
                            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                        </div>
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0 overflow-hidden border rounded-md z-50" align="start">
                    <Command shouldFilter={false} className="rounded-t-none">
                        <div className="border-b">
                            <CommandInput
                                placeholder={searchPlaceholder}
                                value={searchTerm}
                                onValueChange={setSearchTerm}
                                className="h-9 border-0 focus:ring-0"
                            />
                        </div>
                        <CommandList className="max-h-[200px] custom-scrollbar">
                            <CommandEmpty>Không tìm thấy kết quả</CommandEmpty>
                            <CommandGroup>
                                {filteredOptions.map((option) => (
                                    <CommandItem
                                        key={String(option.value)}
                                        value={String(option.value)}
                                        onSelect={(currentValue) => {
                                            // Update field value and close popover
                                            const newValue = currentValue === String(field.value)
                                                ? ""
                                                : option.value;

                                            field.onChange(newValue);
                                            if (onChange) onChange(newValue);

                                            setComboboxOpen(false);
                                            setSearchTerm(""); // Reset search term
                                        }}
                                    >
                                        {option.label}
                                        <Check
                                            className={cn(
                                                "ml-auto h-4 w-4",
                                                String(field.value) === String(option.value)
                                                    ? "opacity-100"
                                                    : "opacity-0"
                                            )}
                                        />
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
            <ErrorMessage error={error} name={name} />
        </FieldContainer>
    );
});
ComboboxField.displayName = "ComboboxField";
/**
 * Checkbox Field Component
 */
export const CheckboxField = memo(<T extends FieldValues>({
    name,
    field,
    error,
    label,
    description,
    required = false,
    disabled = false,
    className = "",
}: FieldTypeProps<T>) => {
    return (
        <CheckFieldContainer className={className}>
            <Checkbox
                id={name}
                checked={!!field.value}
                onCheckedChange={field.onChange}
                disabled={disabled}
                className={cn(
                    error ? "border-red-500" : "border-gray-300"
                )}
                aria-invalid={!!error}
                aria-describedby={error ? `${name}-error` : undefined}
            />
            <div className="space-y-1 leading-none">
                <Label
                    htmlFor={name}
                    className={cn(
                        "font-medium cursor-pointer",
                        disabled && "cursor-not-allowed opacity-70"
                    )}
                >
                    {label}
                    {required && <span className="text-red-500">*</span>}
                </Label>
                <FieldDescription description={description} />
                <ErrorMessage error={error} name={name} />
            </div>
        </CheckFieldContainer>
    );
});
CheckboxField.displayName = "CheckboxField";

/**
 * Radio Group Field Component
 */
export const RadioField = memo(<T extends FieldValues>({
    name,
    field,
    error,
    label,
    description,
    required = false,
    disabled = false,
    className = "",
    options = [],
    orientation = 'vertical',
}: FieldTypeProps<T> & {
    options: FormFieldOption[];
    orientation?: 'horizontal' | 'vertical';
}) => {
    return (
        <FieldContainer className={className}>
            <FieldLabel name={name} label={label} required={required} />
            <FieldDescription description={description} />
            <RadioGroup
                value={field.value?.toString()}
                onValueChange={field.onChange}
                disabled={disabled}
                className={cn(
                    "mt-2",
                    orientation === 'horizontal' ? "flex flex-row gap-4 flex-wrap" : "flex flex-col gap-2"
                )}
                aria-invalid={!!error}
                aria-describedby={error ? `${name}-error` : undefined}
            >
                {options.map((option) => (
                    <div key={String(option.value)} className="flex items-center space-x-2">
                        <RadioGroupItem
                            id={`${name}-${option.value}`}
                            value={String(option.value)}
                            disabled={disabled}
                            className={cn(
                                error ? "border-red-500" : "border-gray-300"
                            )}
                        />
                        <Label
                            htmlFor={`${name}-${option.value}`}
                            className={cn(
                                disabled && "cursor-not-allowed opacity-70"
                            )}
                        >
                            {option.label}
                        </Label>
                    </div>
                ))}
            </RadioGroup>
            <ErrorMessage error={error} name={name} />
        </FieldContainer>
    );
});
RadioField.displayName = "RadioField";

/**
 * Date Field Component
 */
export const DateField = memo(<T extends FieldValues>({
    name,
    field,
    error,
    label,
    placeholder = "Chọn ngày",
    description,
    required = false,
    disabled = false,
    className = "",
    minDate,
    maxDate,
}: FieldTypeProps<T> & {
    minDate?: Date;
    maxDate?: Date;
}) => {
    const { dateOpen, setDateOpen, handleDateSelect } = useFormField({
        field,
        type: "date",
        dateOnly: true
    });

    return (
        <FieldContainer className={className}>
            <FieldLabel name={name} label={label} required={required} />
            <FieldDescription description={description} />
            <Popover open={dateOpen} onOpenChange={setDateOpen}>
                <PopoverTrigger asChild>
                    <Button
                        id={name}
                        variant="outline"
                        className={cn(
                            "w-full justify-start text-left font-normal",
                            !field.value && "text-muted-foreground",
                            disabled && "bg-gray-100 cursor-not-allowed dark:bg-gray-800",
                            error ? "border-red-500" : "border-gray-300"
                        )}
                        disabled={disabled}
                        aria-invalid={!!error}
                        aria-describedby={error ? `${name}-error` : undefined}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.value ? format(new Date(field.value), "dd/MM/yyyy", { locale: vi }) : placeholder}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                        mode="single"
                        selected={field.value ? new Date(field.value) : undefined}
                        onSelect={handleDateSelect}
                        disabled={disabled}
                        initialFocus
                        locale={vi}
                        fromDate={minDate}
                        toDate={maxDate}
                    />
                </PopoverContent>
            </Popover>
            <ErrorMessage error={error} name={name} />
        </FieldContainer>
    );
});
DateField.displayName = "DateField";
/**
 * DateTime Field Component
 */
export const DateTimeField = memo(<T extends FieldValues>({
    name,
    field,
    error,
    label,
    placeholder = "Chọn ngày và giờ",
    description,
    required = false,
    disabled = false,
    className = "",
    minDate,
    maxDate,
}: FieldTypeProps<T> & {
    minDate?: Date;
    maxDate?: Date;
}) => {
    const { dateOpen, setDateOpen, timeOpen, setTimeOpen, handleDateSelect, handleTimeSelect } = useFormField({
        field,
        type: "datetime"
    });

    // Format the selected date and time for display
    const formattedDateTime = field.value
        ? format(new Date(field.value), "dd/MM/yyyy HH:mm", { locale: vi })
        : "";

    return (
        <FieldContainer className={className}>
            <FieldLabel name={name} label={label} required={required} />
            <FieldDescription description={description} />
            <div className="flex space-x-2">
                <Popover open={dateOpen} onOpenChange={setDateOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            id={`${name}-date`}
                            variant="outline"
                            className={cn(
                                "w-full justify-start text-left font-normal",
                                !field.value && "text-muted-foreground",
                                disabled && "bg-gray-100 cursor-not-allowed dark:bg-gray-800",
                                error ? "border-red-500" : "border-gray-300"
                            )}
                            disabled={disabled}
                            aria-invalid={!!error}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value ? format(new Date(field.value), "dd/MM/yyyy", { locale: vi }) : placeholder}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            mode="single"
                            selected={field.value ? new Date(field.value) : undefined}
                            onSelect={handleDateSelect}
                            disabled={disabled}
                            initialFocus
                            locale={vi}
                            fromDate={minDate}
                            toDate={maxDate}
                        />
                    </PopoverContent>
                </Popover>

                <Popover open={timeOpen} onOpenChange={setTimeOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            id={`${name}-time`}
                            variant="outline"
                            className={cn(
                                "w-full justify-start text-left font-normal",
                                !field.value && "text-muted-foreground",
                                disabled && "bg-gray-100 cursor-not-allowed dark:bg-gray-800",
                                error ? "border-red-500" : "border-gray-300"
                            )}
                            disabled={disabled}
                            aria-invalid={!!error}
                        >
                            <ClockIcon className="mr-2 h-4 w-4" />
                            {field.value ? format(new Date(field.value), "HH:mm", { locale: vi }) : "Chọn giờ"}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-4" align="start">
                        <Clock
                            date={field.value ? new Date(field.value) : undefined}
                            setDate={(hours, minutes) => handleTimeSelect(hours, minutes)}
                            disabled={disabled}
                        />
                    </PopoverContent>
                </Popover>
            </div>
            <ErrorMessage error={error} name={name} />
        </FieldContainer>
    );
});
DateTimeField.displayName = "DateTimeField";

/**
 * Time Field Component
 */
export const TimeField = memo(<T extends FieldValues>({
    name,
    field,
    error,
    label,
    placeholder = "Chọn giờ",
    description,
    required = false,
    disabled = false,
    className = "",
}: FieldTypeProps<T>) => {
    const { timeOpen, setTimeOpen, handleTimeSelect } = useFormField({
        field,
        type: "time",
        timeOnly: true
    });

    // For time-only fields, we store as "HH:MM" string
    const timeValue = field.value || "";

    // Parse the hours and minutes from the stored string
    const [hours, minutes] = timeValue.split(':').map(v => parseInt(v) || 0);

    return (
        <FieldContainer className={className}>
            <FieldLabel name={name} label={label} required={required} />
            <FieldDescription description={description} />
            <Popover open={timeOpen} onOpenChange={setTimeOpen}>
                <PopoverTrigger asChild>
                    <Button
                        id={name}
                        variant="outline"
                        className={cn(
                            "w-full justify-start text-left font-normal",
                            !field.value && "text-muted-foreground",
                            disabled && "bg-gray-100 cursor-not-allowed dark:bg-gray-800",
                            error ? "border-red-500" : "border-gray-300"
                        )}
                        disabled={disabled}
                        aria-invalid={!!error}
                        aria-describedby={error ? `${name}-error` : undefined}
                    >
                        <ClockIcon className="mr-2 h-4 w-4" />
                        {field.value || placeholder}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-4" align="start">
                    <Clock
                        hours={hours}
                        minutes={minutes}
                        setDate={(hours, minutes) => handleTimeSelect(hours, minutes)}
                        disabled={disabled}
                    />
                </PopoverContent>
            </Popover>
            <ErrorMessage error={error} name={name} />
        </FieldContainer>
    );
});
TimeField.displayName = "TimeField";

/**
 * Time Range Field Component
 */
export const TimeRangeField = memo(<T extends FieldValues>({
    name,
    field,
    error,
    label,
    placeholder = "Chọn khoảng thời gian",
    description,
    required = false,
    disabled = false,
    className = "",
    allowSameTime = false,
}: FieldTypeProps<T> & {
    allowSameTime?: boolean;
}) => {
    const { timeOpen, setTimeOpen, handleTimeRangeSelect, getTimeRangeDetails } = useFormField({
        field,
        type: "time-range",
        allowSameTime
    });

    const { timeRangeDisplay, currentTimeRange } = getTimeRangeDetails();

    return (
        <FieldContainer className={className}>
            <FieldLabel name={name} label={label} required={required} />
            <FieldDescription description={description} />
            <Popover open={timeOpen} onOpenChange={setTimeOpen}>
                <PopoverTrigger asChild>
                    <Button
                        id={name}
                        variant="outline"
                        className={cn(
                            "w-full justify-start text-left font-normal",
                            !timeRangeDisplay && "text-muted-foreground",
                            disabled && "bg-gray-100 cursor-not-allowed dark:bg-gray-800",
                            error ? "border-red-500" : "border-gray-300"
                        )}
                        disabled={disabled}
                        aria-invalid={!!error}
                        aria-describedby={error ? `${name}-error` : undefined}
                    >
                        <ClockIcon className="mr-2 h-4 w-4" />
                        {timeRangeDisplay || placeholder}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-4" align="start">
                    <TimeRangePicker
                        startHours={currentTimeRange.startHours}
                        startMinutes={currentTimeRange.startMinutes}
                        endHours={currentTimeRange.endHours}
                        endMinutes={currentTimeRange.endMinutes}
                        onChange={(startHours, startMinutes, endHours, endMinutes) =>
                            handleTimeRangeSelect(startHours, startMinutes, endHours, endMinutes)
                        }
                        disabled={disabled}
                        allowSameTime={allowSameTime}
                    />
                </PopoverContent>
            </Popover>
            <ErrorMessage error={error} name={name} />
        </FieldContainer>
    );
});
TimeRangeField.displayName = "TimeRangeField";

/**
 * Date Range Field Component
 */
export const DateRangeField = memo(<T extends FieldValues>({
    name,
    field,
    error,
    label,
    placeholder = "Chọn khoảng ngày",
    description,
    required = false,
    disabled = false,
    className = "",
    minDate,
    maxDate,
    allowSameDateTime = false,
}: FieldTypeProps<T> & {
    minDate?: Date;
    maxDate?: Date;
    allowSameDateTime?: boolean;
}) => {
    const { dateOpen, setDateOpen, handleDateRangeSelect, getDateRangeDetails } = useFormField({
        field,
        type: "date-range",
        allowSameDateTime
    });

    const { dateRangeValue, dateRangeDisplay } = getDateRangeDetails();

    // Prepare date range value for the calendar
    const dateRange = {
        from: dateRangeValue.startDateTime,
        to: dateRangeValue.endDateTime
    };

    return (
        <FieldContainer className={className}>
            <FieldLabel name={name} label={label} required={required} />
            <FieldDescription description={description} />
            <Popover open={dateOpen} onOpenChange={setDateOpen}>
                <PopoverTrigger asChild>
                    <Button
                        id={name}
                        variant="outline"
                        className={cn(
                            "w-full justify-start text-left font-normal",
                            !field.value && "text-muted-foreground",
                            disabled && "bg-gray-100 cursor-not-allowed dark:bg-gray-800",
                            error ? "border-red-500" : "border-gray-300"
                        )}
                        disabled={disabled}
                        aria-invalid={!!error}
                        aria-describedby={error ? `${name}-error` : undefined}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateRangeDisplay || placeholder}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <StyledRangeCalendar
                        selected={dateRange}
                        onSelect={handleDateRangeSelect}
                        numberOfMonths={2}
                        disabled={disabled}
                        initialFocus
                    />
                </PopoverContent>
            </Popover>
            <ErrorMessage error={error} name={name} />
        </FieldContainer>
    );
});
DateRangeField.displayName = "DateRangeField";

/**
 * Color Field Component
 */
export const ColorField = memo(<T extends FieldValues>({
    name,
    field,
    error,
    label,
    description,
    required = false,
    disabled = false,
    className = "",
    customColors,
}: FieldTypeProps<T> & {
    customColors?: string[];
}) => {
    const { colorOpen, setColorOpen, colors } = useFormField({
        field,
        type: "color",
        customColors
    });

    return (
        <FieldContainer className={className}>
            <FieldLabel name={name} label={label} required={required} />
            <FieldDescription description={description} />
            <Popover open={colorOpen} onOpenChange={setColorOpen}>
                <PopoverTrigger asChild>
                    <Button
                        id={name}
                        variant="outline"
                        className={cn(
                            "w-full justify-start text-left font-normal h-10",
                            disabled && "bg-gray-100 cursor-not-allowed dark:bg-gray-800",
                            error ? "border-red-500" : "border-gray-300"
                        )}
                        disabled={disabled}
                        aria-invalid={!!error}
                        aria-describedby={error ? `${name}-error` : undefined}
                    >
                        <div className="flex items-center gap-2">
                            {field.value && (
                                <div
                                    className="h-5 w-5 rounded-full border border-gray-200"
                                    style={{ backgroundColor: field.value }}
                                />
                            )}
                            <span className={!field.value ? "text-muted-foreground" : ""}>
                                {field.value || "Chọn màu"}
                            </span>
                        </div>
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-3" align="start">
                    <div className="grid grid-cols-4 gap-2">
                        {colors.map((color) => (
                            <button
                                key={color}
                                type="button"
                                className={cn(
                                    "h-8 w-8 rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400",
                                    field.value === color && "ring-2 ring-gray-800"
                                )}
                                style={{ backgroundColor: color }}
                                onClick={() => {
                                    field.onChange(color);
                                    setColorOpen(false);
                                }}
                                aria-label={`Color: ${color}`}
                            />
                        ))}
                    </div>
                </PopoverContent>
            </Popover>
            <ErrorMessage error={error} name={name} />
        </FieldContainer>
    );
});
ColorField.displayName = "ColorField";


/**
 * Switch Field Component
 */
export const SwitchField = memo(<T extends FieldValues>({
    name,
    field,
    error,
    label,
    description,
    required = false,
    disabled = false,
    className = "",
    onChange,
}: FieldTypeProps<T> & {
    onChange?: (checked: boolean) => void;
}) => {
    return (
        <CheckFieldContainer className={className}>
            <Switch
                id={name}
                checked={!!field.value}
                onCheckedChange={(checked) => {
                    field.onChange(checked);
                    if (onChange) onChange(checked);
                }}
                disabled={disabled}
                className={cn(
                    error ? "border-red-500" : "border-gray-300"
                )}
                aria-invalid={!!error}
                aria-describedby={error ? `${name}-error` : undefined}
            />
            <div className="space-y-1 leading-none">
                <Label
                    htmlFor={name}
                    className={cn(
                        "font-medium cursor-pointer",
                        disabled && "cursor-not-allowed opacity-70"
                    )}
                >
                    {label}
                    {required && <span className="text-red-500">*</span>}
                </Label>
                <FieldDescription description={description} />
                <ErrorMessage error={error} name={name} />
            </div>
        </CheckFieldContainer>
    );
});
SwitchField.displayName = "SwitchField";