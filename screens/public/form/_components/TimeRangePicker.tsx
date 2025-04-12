// components/TimeRangePicker/TimeRangePicker.tsx
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface TimeRangePickerProps {
    startHours: number;
    startMinutes: number;
    endHours: number;
    endMinutes: number;
    label?: string;
    onSelect: (startHours: number, startMinutes: number, endHours: number, endMinutes: number) => void;
}

export const TimeRangePicker: React.FC<TimeRangePickerProps> = ({
    startHours = 8,
    startMinutes = 0,
    endHours = 17,
    endMinutes = 0,
    label = "Select time range",
    onSelect,
}) => {
    // State for time values
    const [timeRange, setTimeRange] = useState({
        startHours,
        startMinutes,
        endHours,
        endMinutes,
    });

    // Generate hours options (0-23)
    const hoursOptions = Array.from({ length: 24 }, (_, i) => i);

    // Generate minutes options (0, 15, 30, 45)
    const minutesOptions = [0, 15, 30, 45];

    // Handle time change
    const handleTimeChange = (field: keyof typeof timeRange, value: number) => {
        setTimeRange((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    // Handle selection confirmation
    const handleConfirm = () => {
        onSelect(
            timeRange.startHours,
            timeRange.startMinutes,
            timeRange.endHours,
            timeRange.endMinutes
        );
    };

    return (
        <div className="p-4">
            {label && <h3 className="mb-3 text-sm font-medium">{label}</h3>}

            <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="space-y-2">
                    <Label className="text-xs">Thời gian bắt đầu</Label>
                    <div className="flex items-center gap-2">
                        <Select
                            value={timeRange.startHours.toString()}
                            onValueChange={(value) => handleTimeChange("startHours", parseInt(value))}
                        >
                            <SelectTrigger className="flex-1">
                                <SelectValue placeholder="Giờ" />
                            </SelectTrigger>
                            <SelectContent>
                                {hoursOptions.map((hour) => (
                                    <SelectItem key={`start-hour-${hour}`} value={hour.toString()}>
                                        {hour.toString().padStart(2, "0")}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <span>:</span>

                        <Select
                            value={timeRange.startMinutes.toString()}
                            onValueChange={(value) => handleTimeChange("startMinutes", parseInt(value))}
                        >
                            <SelectTrigger className="flex-1">
                                <SelectValue placeholder="Phút" />
                            </SelectTrigger>
                            <SelectContent>
                                {minutesOptions.map((minute) => (
                                    <SelectItem key={`start-minute-${minute}`} value={minute.toString()}>
                                        {minute.toString().padStart(2, "0")}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label className="text-xs">Thời gian kết thúc</Label>
                    <div className="flex items-center gap-2">
                        <Select
                            value={timeRange.endHours.toString()}
                            onValueChange={(value) => handleTimeChange("endHours", parseInt(value))}
                        >
                            <SelectTrigger className="flex-1">
                                <SelectValue placeholder="Giờ" />
                            </SelectTrigger>
                            <SelectContent>
                                {hoursOptions.map((hour) => (
                                    <SelectItem key={`end-hour-${hour}`} value={hour.toString()}>
                                        {hour.toString().padStart(2, "0")}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <span>:</span>

                        <Select
                            value={timeRange.endMinutes.toString()}
                            onValueChange={(value) => handleTimeChange("endMinutes", parseInt(value))}
                        >
                            <SelectTrigger className="flex-1">
                                <SelectValue placeholder="Phút" />
                            </SelectTrigger>
                            <SelectContent>
                                {minutesOptions.map((minute) => (
                                    <SelectItem key={`end-minute-${minute}`} value={minute.toString()}>
                                        {minute.toString().padStart(2, "0")}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            <div className="flex justify-end">
                <Button onClick={handleConfirm}>Xác nhận</Button>
            </div>
        </div>
    );
};

export default TimeRangePicker;