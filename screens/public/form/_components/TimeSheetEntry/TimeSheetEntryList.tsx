// components/TimeSheetEntryList.tsx
"use client";
import React from "react";
import { AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import EntryItem from "./EntryItem";
import { REASON_OPTIONS } from "@/schemas/timesheet";

interface TimeSheetEntryListProps {
    fields: any[];
    isReadOnly?: boolean;
    isSubmitting?: boolean;
    onAddEntry: () => void;
    onTimePickerOpen: (entryId: string) => void;
    onDuplicate: (index: number) => void;
    onClearSlots: (index: number) => void;
    onRemove: (index: number) => void;
}

const TimeSheetEntryList: React.FC<TimeSheetEntryListProps> = ({
    fields,
    isReadOnly = false,
    isSubmitting = false,
    onAddEntry,
    onTimePickerOpen,
    onDuplicate,
    onClearSlots,
    onRemove,
}) => {
    return (
        <div className="mb-4 overflow-y-auto max-h-[85vh]">
            {fields.length === 0 && (
                <div className="text-center py-6 text-gray-500">
                    Không có công đoạn. Vui lòng thêm công đoạn để bắt đầu.
                </div>
            )}

            <AnimatePresence>
                {fields.map((entry, index) => (
                    <EntryItem
                        key={entry.id}
                        entry={entry}
                        index={index}
                        isReadOnly={isReadOnly}
                        isSubmitting={isSubmitting}
                        onTimePickerOpen={onTimePickerOpen}
                        onDuplicate={onDuplicate}
                        onClearSlots={onClearSlots}
                        onRemove={onRemove}
                        fields={fields}
                    />
                ))}
            </AnimatePresence>

            {/* Legend */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-gray-600 dark:text-gray-400 mb-2 mt-3">
                {REASON_OPTIONS.map((reason) => (
                    <div key={reason.value}>{reason.label} = {reason.description}</div>
                ))}
            </div>

            {/* Add entry button */}
            {!isReadOnly && (
                <Button
                    type="button"
                    variant="outline"
                    onClick={onAddEntry}
                    disabled={isSubmitting}
                    className="flex items-center gap-1 w-full md:w-auto mt-2"
                >
                    <Plus className="h-4 w-4" />
                    <span>Thêm công đoạn</span>
                </Button>
            )}
        </div>
    );
};

export default TimeSheetEntryList;