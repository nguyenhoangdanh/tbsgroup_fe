"use client"

import { useId } from "react"
import { Controller, type FieldValues, type Control, type Path, type FieldPath, type PathValue } from "react-hook-form"
import clsx from "clsx"
import { DatePicker } from "@/components/ui/date-picker"

interface FieldDatePickerProps<T extends FieldValues> {
    name: Path<T>
    label: string
    control: Control<T>
    placeholder?: string
    className?: string
    disabled?: boolean
    required?: boolean
    minDate?: Date
    maxDate?: Date
    readOnly?: boolean
    description?: string
}

export const FieldDatePicker = <T extends FieldValues>({
    name,
    label,
    control,
    placeholder = "Select date",
    className,
    disabled = false,
    required = false,
    minDate,
    maxDate,
    readOnly = false,
    description,
}: FieldDatePickerProps<T>) => {
    const id = useId()
    const fieldId = `date-picker-${id}-${name}`

    return (
        <Controller
            control={control}
            name={name}
            render={({ field, fieldState: { error } }) => {
                // Improved date conversion logic
                const parseDate = (value: any): Date | null => {
                    if (!value) return null

                    // If already a Date object
                    if (value instanceof Date && !isNaN(value.getTime())) {
                        return value
                    }

                    // If ISO string or other string format
                    if (typeof value === "string") {
                        const date = new Date(value)
                        return !isNaN(date.getTime()) ? date : null
                    }

                    // If timestamp number
                    if (typeof value === "number") {
                        const date = new Date(value)
                        return !isNaN(date.getTime()) ? date : null
                    }

                    return null
                }

                const dateValue = parseDate(field.value)

                return (
                    <div className={clsx("w-full", className)}>
                        {description && <p className="text-sm text-muted-foreground mb-2">{description}</p>}
                        <DatePicker
                            id={fieldId}
                            name={name as string}
                            value={dateValue}
                            onChange={(date) => {
                                // Set value as Date object for react-hook-form
                                field.onChange(date as PathValue<T, FieldPath<T>>)
                            }}
                            onBlur={field.onBlur}
                            placeholder={placeholder}
                            disabled={disabled}
                            label={label}
                            required={required}
                            error={error?.message}
                            minDate={minDate}
                            maxDate={maxDate}
                            readOnly={readOnly}
                            aria-invalid={!!error}
                            aria-describedby={error ? `${fieldId}-error` : undefined}
                        />
                    </div>
                )
            }}
        />
    )
}

// Memoize the component to prevent unnecessary re-renders
export default FieldDatePicker
