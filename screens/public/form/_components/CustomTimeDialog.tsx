// components/TimeRangePicker/CustomTimeDialog.tsx
import React from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import TimeRangePicker from "./TimeRangePicker";
import { ScrollableDialogContent } from "./ScrollableDialog";

interface CustomTimeDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    customTimeRange: {
        startHours: number;
        startMinutes: number;
        endHours: number;
        endMinutes: number;
    };
    onTimeRangeChange: (startHours: number, startMinutes: number, endHours: number, endMinutes: number) => void;
    onApplyToAll: () => void;
}

const CustomTimeDialog: React.FC<CustomTimeDialogProps> = ({
    open,
    onOpenChange,
    customTimeRange,
    onTimeRangeChange,
    onApplyToAll,
}) => {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <ScrollableDialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Áp dụng khoảng thời gian cho tất cả</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                    <TimeRangePicker
                        onSelect={onTimeRangeChange}
                        startHours={customTimeRange.startHours}
                        startMinutes={customTimeRange.startMinutes}
                        endHours={customTimeRange.endHours}
                        endMinutes={customTimeRange.endMinutes}
                        label="Chọn khoảng thời gian"
                    />
                </div>
                <DialogFooter className="flex gap-2 justify-end">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                    >
                        Hủy
                    </Button>
                    <Button
                        type="button"
                        onClick={onApplyToAll}
                    >
                        Áp dụng cho tất cả
                    </Button>
                </DialogFooter>
            </ScrollableDialogContent>
        </Dialog>
    );
};

export default CustomTimeDialog;