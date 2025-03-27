import React, { useEffect } from 'react';
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { DateRange } from "react-day-picker";

// CSS styles để cải thiện khả năng đọc và tương tác
import './StyledRangeCalendar.css';

interface StyledRangeCalendarProps {
    selected?: DateRange | undefined;
    onSelect?: (value: DateRange | undefined) => void;
    disabled?: any;
    initialFocus?: boolean;
    numberOfMonths?: number;
    className?: string;
    accentColor?: string;
}

const StyledRangeCalendar: React.FC<StyledRangeCalendarProps> = ({
    selected,
    onSelect,
    disabled,
    initialFocus = true,
    numberOfMonths = 2,
    className,
    accentColor = "#0284c7" // Default to darker blue for better contrast
}) => {
    // Log selected value to debug
    useEffect(() => {
        console.log('Calendar selected value:', selected);
    }, [selected]);

    // Tính toán các màu phụ thuộc từ màu accent
    const generateColors = React.useMemo(() => {
        // Convert hex to rgba for hover states
        const hexToRgba = (hex: string, alpha: number) => {
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        };

        return {
            accent: accentColor,
            hoverAccent: hexToRgba(accentColor, 0.85),
            lightAccent: hexToRgba(accentColor, 0.2), // Slightly darker for better visibility
            mediumAccent: hexToRgba(accentColor, 0.3),
        };
    }, [accentColor]);

    // CSS variables cho theming
    const styles = React.useMemo(() => ({
        "--calendar-accent": generateColors.accent,
        "--calendar-hover-accent": generateColors.hoverAccent,
        "--calendar-light-accent": generateColors.lightAccent,
        "--calendar-medium-accent": generateColors.mediumAccent,
    } as React.CSSProperties), [generateColors]);

    // Custom handler for selection to ensure correct behavior
    const handleSelect = (range: DateRange | undefined) => {
        console.log('Calendar range selected:', range);
        if (onSelect) {
            onSelect(range);
        }
    };

    return (
        <div
            className={cn("high-contrast-calendar rounded-lg", className)}
            style={styles}
        >
            <Calendar
                mode="range"
                selected={selected}
                onSelect={handleSelect}
                disabled={disabled}
                initialFocus={initialFocus}
                numberOfMonths={numberOfMonths}
                className="p-3"
                classNames={{
                    months: "flex flex-col md:flex-row space-y-4 md:space-x-4 md:space-y-0",
                    month: "space-y-4 bg-white dark:bg-gray-800 rounded-lg",
                    caption: "flex justify-center pt-2 relative items-center mb-2",
                    caption_label: "text-base font-semibold text-gray-900 dark:text-gray-50", // Larger, bolder for better readability
                    nav: "space-x-1 flex items-center",
                    nav_button: cn(
                        "h-9 w-9 bg-transparent rounded-full transition-colors",
                        "flex items-center justify-center",
                        "text-gray-700 dark:text-gray-300", // Darker for better contrast
                        "hover:bg-gray-100 dark:hover:bg-gray-700"
                    ),
                    nav_button_previous: "absolute left-1",
                    nav_button_next: "absolute right-1",
                    table: "w-full border-collapse",
                    head_row: "flex",
                    head_cell: cn(
                        "text-gray-700 dark:text-gray-300 rounded-md w-10 font-bold text-sm", // Bolder headers
                        "flex items-center justify-center h-10"
                    ),
                    row: "flex w-full mt-2",
                    cell: "relative p-0 text-center focus-within:relative focus-within:z-20",
                    day: cn(
                        "h-10 w-10 p-0 font-medium text-gray-900 dark:text-gray-100 text-base", // Larger, bolder text
                        "flex items-center justify-center rounded-full",
                        "hover:bg-gray-100 dark:hover:bg-gray-800",
                        "border border-transparent" // Add border for better definition
                    ),
                    day_selected: "bg-[var(--calendar-accent)] text-white font-semibold hover:bg-[var(--calendar-hover-accent)]",
                    day_today: "border-2 border-[var(--calendar-accent)] text-[var(--calendar-accent)] font-bold", // Bolder today
                    day_outside: "text-gray-500 dark:text-gray-500 opacity-70", // Increased opacity for better visibility
                    day_disabled: "text-gray-400 dark:text-gray-600 opacity-50",
                    day_hidden: "invisible",
                    day_range_middle: cn(
                        "bg-[var(--calendar-light-accent)] rounded-none",
                        "text-gray-900 dark:text-gray-100 font-medium", // Better contrast for in-between days
                        "hover:bg-[var(--calendar-medium-accent)]"
                    ),
                    day_range_start: "rounded-l-full bg-[var(--calendar-accent)] text-white font-semibold",
                    day_range_end: "rounded-r-full bg-[var(--calendar-accent)] text-white font-semibold"
                }}
            />

            <style jsx>{`
                .high-contrast-calendar {
                    background-color: white;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
                    max-width: 100%;
                    overflow: hidden;
                }
                
                :global(.dark) .high-contrast-calendar {
                    background-color: #1f2937;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2), 0 2px 4px -1px rgba(0, 0, 0, 0.1);
                }
                
                /* Make days more distinct */
                .high-contrast-calendar :global(.rdp-day) {
                    position: relative;
                    border: 1px solid rgba(0, 0, 0, 0.05);
                }
                
                :global(.dark) .high-contrast-calendar :global(.rdp-day) {
                    border: 1px solid rgba(255, 255, 255, 0.05);
                }
                
                /* Shadow for selected days */
                .high-contrast-calendar :global(.rdp-day_selected),
                .high-contrast-calendar :global(.rdp-day_range_start),
                .high-contrast-calendar :global(.rdp-day_range_end) {
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
                    z-index: 10; /* Ensure selected days appear above range */
                }
                
                /* Improve focus visibility */
                .high-contrast-calendar :global(.rdp-day:focus) {
                    outline: 2px solid var(--calendar-accent);
                    outline-offset: 2px;
                }
                
                /* Mobile optimizations */
                @media (max-width: 640px) {
                    .high-contrast-calendar {
                        border-radius: 0.5rem;
                    }
                }
            `}</style>
        </div>
    );
};

export default StyledRangeCalendar;