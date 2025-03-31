"use client";

import { useState, useCallback, useMemo } from "react";
import { FieldValues, Path } from "react-hook-form";
import { DateRange } from "react-day-picker";
import dayjs from "dayjs";
import { FormFieldOption, FormFieldType } from "./types";

// Color palette for the color picker
export const COLOR_PALETTE = [
    "#FF6B6B", "#4ECDC4", "#45B7D1", "#FDCB6E", "#6C5CE7",
    "#FF8A5B", "#2ECC71", "#34495E", "#A3CB38", "#FAD02E",
    "#6D214F", "#182C61"
];

interface UseFormFieldProps<T extends FieldValues> {
    field: any;
    type: FormFieldType;
    options?: FormFieldOption[];
    dateOnly?: boolean;
    timeOnly?: boolean;
    allowSameTime?: boolean;
    allowSameDateTime?: boolean;
    customColors?: string[];
}

/**
 * Custom hook để quản lý logic và state cho form field
 */
export function useFormField<T extends FieldValues>({
    field,
    type,
    options = [],
    dateOnly = false,
    timeOnly = false,
    allowSameTime = false,
    allowSameDateTime = false,
    customColors
}: UseFormFieldProps<T>) {
    // States
    const [showPassword, setShowPassword] = useState(false);
    const [dateOpen, setDateOpen] = useState(false);
    const [timeOpen, setTimeOpen] = useState(false);
    const [colorOpen, setColorOpen] = useState(false);
    const [comboboxOpen, setComboboxOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    
    // Toggle password visibility
    const togglePasswordVisibility = useCallback(() => {
        setShowPassword(prev => !prev);
    }, []);

    // Memoized filtered options for combobox/autocomplete
    const filteredOptions = useMemo(() => {
        if (!searchTerm) return options;
        return options.filter(option =>
            String(option.label).toLowerCase().includes(searchTerm.toLowerCase()) ||
            String(option.value).toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [options, searchTerm]);

    // Find selected option for combobox/select
    const selectedOption = useMemo(() => {
        return options.find(option => String(option.value) === String(field.value));
    }, [options, field.value]);

    // Get color palette
    const colors = useMemo(() => {
        return customColors || COLOR_PALETTE;
    }, [customColors]);

    // Safe value getter with defaults
    const getSafeValue = useCallback((defaultValue: any = "") => {
        return field.value ?? defaultValue;
    }, [field.value]);

    // Handle date selection
    const handleDateSelect = useCallback((date: Date | undefined) => {
        if (!date) return;
        field.onChange(date);
        if (dateOnly) {
            setDateOpen(false);
        }
    }, [field, dateOnly]);

    // Handle time selection
    const handleTimeSelect = useCallback((hours: number, minutes: number) => {
        if (timeOnly) {
            // For time-only, store time as a string "HH:MM"
            field.onChange(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`);
        } else {
            // For datetime, create/update Date object
            const currentValue = field.value ? new Date(field.value) : new Date();
            currentValue.setHours(hours);
            currentValue.setMinutes(minutes);
            field.onChange(currentValue);
        }
        setTimeOpen(false);
    }, [field, timeOnly]);

    // Handle time range selection
    const handleTimeRangeSelect = useCallback((
        startHours: number,
        startMinutes: number,
        endHours: number,
        endMinutes: number
    ) => {
        // Create date objects for start and end times
        const startTime = dayjs().hour(startHours).minute(startMinutes).toDate();
        const endTime = dayjs().hour(endHours).minute(endMinutes).toDate();

        // Update field value
        field.onChange({ startTime, endTime });
        setTimeOpen(false);
    }, [field]);

    // Handle date range selection
    const handleDateRangeSelect = useCallback((range?: DateRange) => {
        if (!range || !range.from) return;

        const currentValue = field.value || {
            startDateTime: new Date(),
            endDateTime: new Date(new Date().setDate(new Date().getDate() + 1))
        };

        const updatedValue = { ...currentValue };

        // Update start date preserving the time part
        const startDate = dayjs(currentValue.startDateTime);
        updatedValue.startDateTime = dayjs(range.from)
            .hour(startDate.hour())
            .minute(startDate.minute())
            .toDate();

        // If to date is provided, use it; otherwise leave end date unchanged
        if (range.to) {
            const endDate = dayjs(currentValue.endDateTime);
            updatedValue.endDateTime = dayjs(range.to)
                .hour(endDate.hour())
                .minute(endDate.minute())
                .toDate();

            // Close popover if both dates are set
            setDateOpen(false);
        }

        // Update field value
        field.onChange(updatedValue);
    }, [field]);

    // Get time range display and defaults
    const getTimeRangeDetails = useCallback(() => {
        const timeRangeValue = field.value;
        
        // Format display string
        const timeRangeDisplay = timeRangeValue
            ? `${dayjs(timeRangeValue.startTime).format('HH:mm')} - ${dayjs(timeRangeValue.endTime).format('HH:mm')}`
            : "";

        // Get current values or defaults
        const currentTimeRange = timeRangeValue
            ? {
                startHours: dayjs(timeRangeValue.startTime).hour(),
                startMinutes: dayjs(timeRangeValue.startTime).minute(),
                endHours: dayjs(timeRangeValue.endTime).hour(),
                endMinutes: dayjs(timeRangeValue.endTime).minute()
            }
            : {
                startHours: new Date().getHours(),
                startMinutes: new Date().getMinutes(),
                endHours: new Date().getHours() + 1,
                endMinutes: new Date().getMinutes()
            };
            
        return { timeRangeDisplay, currentTimeRange };
    }, [field.value]);

    // Get date range display and defaults
    const getDateRangeDetails = useCallback(() => {
        // Get current value or default
        const dateRangeValue = field.value || {
            startDateTime: new Date(),
            endDateTime: new Date(new Date().setDate(new Date().getDate() + 1))
        };

        // Format display string
        const dateRangeDisplay = `${dayjs(dateRangeValue.startDateTime).format('DD/MM/YYYY')} - ${dayjs(dateRangeValue.endDateTime).format('DD/MM/YYYY')}`;
        
        return { dateRangeValue, dateRangeDisplay };
    }, [field.value]);

    return {
        // States
        showPassword,
        setShowPassword,
        togglePasswordVisibility,
        dateOpen,
        setDateOpen,
        timeOpen,
        setTimeOpen,
        colorOpen,
        setColorOpen,
        comboboxOpen,
        setComboboxOpen,
        searchTerm,
        setSearchTerm,
        
        // Memoized values
        filteredOptions,
        selectedOption,
        colors,
        
        // Utility functions
        getSafeValue,
        getTimeRangeDetails,
        getDateRangeDetails,
        
        // Handlers
        handleDateSelect,
        handleTimeSelect,
        handleTimeRangeSelect,
        handleDateRangeSelect
    };
}