import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronUp, ChevronDown, ArrowRightIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface TimeRangeProps {
    onSelect: (startHours: number, startMinutes: number, endHours: number, endMinutes: number) => void;
    startHours?: number;
    startMinutes?: number;
    endHours?: number;
    endMinutes?: number;
    className?: string;
    label?: string;
    allowSameTime?: boolean; // Allow start and end time to be the same
    disabled?: boolean;
}

export const TimeRangePicker: React.FC<TimeRangeProps> = ({
    onSelect,
    startHours: initialStartHours = new Date().getHours(),
    startMinutes: initialStartMinutes = new Date().getMinutes(),
    endHours: initialEndHours = new Date().getHours(),
    endMinutes: initialEndMinutes = new Date().getMinutes(),
    className,
    label = "Chọn khoảng thời gian",
    allowSameTime = false,
    disabled = false,
}) => {
    const [startHours, setStartHours] = useState(initialStartHours);
    const [startMinutes, setStartMinutes] = useState(initialStartMinutes);
    const [endHours, setEndHours] = useState(initialEndHours);
    const [endMinutes, setEndMinutes] = useState(initialEndMinutes);
    const [editMode, setEditMode] = useState<'start-hours' | 'start-minutes' | 'end-hours' | 'end-minutes' | null>(null);

    // Refs for input focus management
    const inputRef = useRef<HTMLInputElement>(null);

    // Focus input when edit mode changes
    useEffect(() => {
        if (editMode && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [editMode]);

    // Validate time range
    const isValidTimeRange = () => {
        const startTime = startHours * 60 + startMinutes;
        const endTime = endHours * 60 + endMinutes;
        return allowSameTime ? startTime <= endTime : startTime < endTime;
    };

    // Adjust time with wraparound and validation
    const adjustTime = (
        currentHours: number,
        currentMinutes: number,
        hoursChange: number,
        minutesChange: number,
        setHours: (h: number) => void,
        setMinutes: (m: number) => void
    ) => {
        let newHours = (currentHours + hoursChange + 24) % 24;
        let newMinutes = (currentMinutes + minutesChange + 60) % 60;

        // If minutes change causes hour change
        if (currentMinutes + minutesChange < 0) {
            newHours = (newHours - 1 + 24) % 24;
        } else if (currentMinutes + minutesChange >= 60) {
            newHours = (newHours + 1) % 24;
        }

        setHours(newHours);
        setMinutes(newMinutes);
    };

    // Handle manual input validation and update
    const createInputChangeHandler = (
        type: 'start-hours' | 'start-minutes' | 'end-hours' | 'end-minutes',
        setValueFn: (val: number) => void
    ) => (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        const numValue = parseInt(value, 10);

        // Validate based on input type
        switch (type) {
            case 'start-hours':
            case 'end-hours':
                if (!isNaN(numValue) && numValue >= 0 && numValue < 24) {
                    setValueFn(numValue);
                }
                break;
            case 'start-minutes':
            case 'end-minutes':
                if (!isNaN(numValue) && numValue >= 0 && numValue < 60) {
                    setValueFn(numValue);
                }
                break;
        }
    };

    // Render time display or input
    const renderTimeDisplay = (
        hours: number,
        minutes: number,
        type: 'start-hours' | 'start-minutes' | 'end-hours' | 'end-minutes'
    ) => {
        const isEditing = editMode === type;

        if (isEditing) {
            return (
                <Input
                    ref={inputRef}
                    type="number"
                    inputMode="numeric" // Optimize for numeric input on mobile
                    pattern="[0-9]*" // Improve numeric keyboard on iOS
                    min={type.includes('hours') ? "0" : undefined}
                    max={type.includes('hours') ? "23" : "59"}
                    value={hours.toString().padStart(2, '0')}
                    onChange={createInputChangeHandler(type,
                        type === 'start-hours' ? setStartHours :
                            type === 'start-minutes' ? setStartMinutes :
                                type === 'end-hours' ? setEndHours :
                                    setEndMinutes
                    )}
                    onBlur={() => setEditMode(null)}
                    onKeyDown={(e) => {
                        // Close edit mode on Enter or Escape
                        if (e.key === 'Enter' || e.key === 'Escape') {
                            setEditMode(null);
                        }
                    }}
                    className="w-16 text-center text-2xl h-12 appearance-none [-moz-appearance:_textfield] [&::-webkit-inner-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [&::-webkit-outer-spin-button]:appearance-none"
                />
            );
        }

        return (
            <div
                className="text-2xl font-bold w-12 text-center cursor-pointer select-none"
                onClick={() => setEditMode(type)}
            >
                {hours.toString().padStart(2, '0')}
            </div>
        );
    };

    // Render time column with up/down buttons
    const renderTimeColumn = (
        hours: number,
        minutes: number,
        type: 'start' | 'end'
    ) => (
        <div className="flex flex-col items-center">
            <Button
                variant="ghost"
                size="icon"
                onClick={() => adjustTime(
                    hours,
                    minutes,
                    1,
                    0,
                    type === 'start' ? setStartHours : setEndHours,
                    type === 'start' ? setStartMinutes : setEndMinutes
                )}
                className="mb-2 active:bg-gray-200 dark:active:bg-gray-700 touch-manipulation"
            >
                <ChevronUp className="h-4 w-4" />
            </Button>

            <div className="flex items-center">
                {renderTimeDisplay(hours, minutes, `${type}-hours` as any)}
                <span className="text-xl mx-1">:</span>
                {renderTimeDisplay(minutes, hours, `${type}-minutes` as any)}
            </div>

            <Button
                variant="ghost"
                size="icon"
                onClick={() => adjustTime(
                    hours,
                    minutes,
                    -1,
                    0,
                    type === 'start' ? setStartHours : setEndHours,
                    type === 'start' ? setStartMinutes : setEndMinutes
                )}
                className="mt-2 active:bg-gray-200 dark:active:bg-gray-700 touch-manipulation"
            >
                <ChevronDown className="h-4 w-4" />
            </Button>
        </div>
    );

    // Handle selection
    const handleSelect = () => {
        if (isValidTimeRange()) {
            onSelect(startHours, startMinutes, endHours, endMinutes);
        } else {
            alert('Thời gian kết thúc phải sau thời gian bắt đầu');
        }
    };

    return (
        <div
            className={cn(
                "p-4 w-full max-w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg select-none",
                className
            )}
        >
            <div className="text-center mb-4 font-semibold">{label}</div>

            <div className="flex justify-center items-center space-x-4">
                {/* Start Time Column */}
                {renderTimeColumn(startHours, startMinutes, 'start')}

                {/* Arrow Separator */}
                <div className="flex flex-col items-center">
                    <ArrowRightIcon className="h-6 w-6 text-gray-500" />
                </div>

                {/* End Time Column */}
                {renderTimeColumn(endHours, endMinutes, 'end')}
            </div>

            {/* Warning for invalid time range */}
            {!isValidTimeRange() && (
                <div className="text-red-500 text-sm text-center mt-2">
                    Thời gian kết thúc phải sau thời gian bắt đầu
                </div>
            )}

            {/* Select Button */}
            <div className="mt-4 flex justify-end">
                <Button
                    onClick={handleSelect}
                    disabled={!isValidTimeRange()}
                    className="w-full active:bg-primary/90 touch-manipulation"
                >
                    Chọn khoảng thời gian
                </Button>
            </div>
        </div>
    );
};