import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface ClockProps {
    onSelect: (hours: number, minutes: number) => void;
    hours?: number;
    minutes?: number;
    className?: string;
    disabled?: boolean;
}

export const Clock: React.FC<ClockProps> = ({
    onSelect,
    hours: initialHours = new Date().getHours(),
    minutes: initialMinutes = new Date().getMinutes(),
    className,
    disabled = false,
}) => {
    const [hours, setHours] = useState(initialHours);
    const [minutes, setMinutes] = useState(initialMinutes);
    const [editMode, setEditMode] = useState(false);
    const [inputHours, setInputHours] = useState(initialHours.toString().padStart(2, '0'));
    const [inputMinutes, setInputMinutes] = useState(initialMinutes.toString().padStart(2, '0'));

    // Ensure hours and minutes are within valid ranges
    const adjustHours = (delta: number) => {
        const newHours = (hours + delta + 24) % 24;
        setHours(newHours);
        setInputHours(newHours.toString().padStart(2, '0'));
    };

    const adjustMinutes = (delta: number) => {
        const newMinutes = (minutes + delta + 60) % 60;
        setMinutes(newMinutes);
        setInputMinutes(newMinutes.toString().padStart(2, '0'));
    };

    // Handle manual input validation and update
    const handleHoursChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setInputHours(value);

        // Validate and update hours
        const numValue = parseInt(value, 10);
        if (!isNaN(numValue) && numValue >= 0 && numValue < 24) {
            setHours(numValue);
        }
    };

    const handleMinutesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setInputMinutes(value);

        // Validate and update minutes
        const numValue = parseInt(value, 10);
        if (!isNaN(numValue) && numValue >= 0 && numValue < 60) {
            setMinutes(numValue);
        }
    };

    // Handle selection
    const handleSelect = () => {
        onSelect(hours, minutes);
    };

    // Toggle between display and edit mode
    const toggleEditMode = () => {
        setEditMode(!editMode);
    };

    return (
        <div className={cn("p-4 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg", className)}>
            <div className="flex justify-center items-center space-x-4">
                {/* Hours Column */}
                <div className="flex flex-col items-center">
                    {!editMode ? (
                        <>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => adjustHours(1)}
                                className="mb-2"
                            >
                                <ChevronUp className="h-4 w-4" />
                            </Button>
                            <div
                                className="text-2xl font-bold w-12 text-center cursor-pointer"
                                onClick={toggleEditMode}
                            >
                                {hours.toString().padStart(2, '0')}
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => adjustHours(-1)}
                                className="mt-2"
                            >
                                <ChevronDown className="h-4 w-4" />
                            </Button>
                        </>
                    ) : (
                        <Input
                            type="number"
                            min="0"
                            max="23"
                            value={inputHours}
                            onChange={handleHoursChange}
                            onBlur={toggleEditMode}
                            className="w-16 text-center text-2xl h-12"
                        />
                    )}
                </div>

                {/* Separator */}
                <div className="text-2xl">:</div>

                {/* Minutes Column */}
                <div className="flex flex-col items-center">
                    {!editMode ? (
                        <>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => adjustMinutes(1)}
                                className="mb-2"
                            >
                                <ChevronUp className="h-4 w-4" />
                            </Button>
                            <div
                                className="text-2xl font-bold w-12 text-center cursor-pointer"
                                onClick={toggleEditMode}
                            >
                                {minutes.toString().padStart(2, '0')}
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => adjustMinutes(-1)}
                                className="mt-2"
                            >
                                <ChevronDown className="h-4 w-4" />
                            </Button>
                        </>
                    ) : (
                        <Input
                            type="number"
                            min="0"
                            max="59"
                            value={inputMinutes}
                            onChange={handleMinutesChange}
                            onBlur={toggleEditMode}
                            className="w-16 text-center text-2xl h-12"
                        />
                    )}
                </div>
            </div>

            {/* Select Button */}
            <div className="mt-4 flex justify-end">
                <Button
                    onClick={handleSelect}
                    className="w-full"
                >
                    Chọn giờ
                </Button>
            </div>
        </div>
    );
};