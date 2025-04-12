// components/TimeSheetForm.tsx
"use client";
import React, { useState, useEffect, useMemo } from "react";
import { useForm, useFieldArray, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Form } from "@/components/ui/form";
import { Card, CardContent } from "@/components/ui/card";

import TimeSheetHeader from "./TimeSheetHeader";
import FormActions from "@/components/common/Form/FormAction";

import {
    timeSheetSchema,
    TimeSheetType,
    defaultTimeSheet,
    calculateTotalHours,
    getSlotsFromTimeRange
} from "@/schemas/timesheet";
import TimeSheetEntryList from "./TimeSheetEntry/TimeSheetEntryList";
import TimeRangePicker from "./TimeRangePicker";
import CustomTimeDialog from "./CustomTimeDialog";

interface TimeSheetFormProps {
    initialData?: TimeSheetType;
    onSubmit?: (data: TimeSheetType) => Promise<boolean | void>;
    isReadOnly?: boolean;
    data?: TimeSheetType;
    isSubmitting?: boolean;
    onClose?: () => void;
}

const TimeSheetForm: React.FC<TimeSheetFormProps> = ({
    initialData,
    onSubmit: propOnSubmit,
    isReadOnly = false,
    data,
    isSubmitting: propIsSubmitting = false,
    onClose
}) => {
    // Local state
    const [localIsSubmitting, setLocalIsSubmitting] = useState(false);
    const [showTimeRangePicker, setShowTimeRangePicker] = useState(false);
    const [selectedEntry, setSelectedEntry] = useState<string | null>(null);
    const [showCustomTimeDialog, setShowCustomTimeDialog] = useState(false);
    const [customTimeRange, setCustomTimeRange] = useState({
        startHours: 8,
        startMinutes: 0,
        endHours: 17,
        endMinutes: 0
    });

    // Use the form data that was passed via props
    const formData = useMemo(() => {
        if (data || initialData) return data || initialData;
        return defaultTimeSheet;
    }, [data, initialData]);

    // Initialize form with values
    const form = useForm<TimeSheetType>({
        resolver: zodResolver(timeSheetSchema),
        defaultValues: formData,
    });

    // Update form when data changes
    useEffect(() => {
        form.reset(formData);
    }, [form, formData]);

    // Setup field array for dynamic entries
    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "entries",
    });

    // Get form watch function
    const watchEntries = form.watch("entries");

    // Calculate totals whenever slots change
    useEffect(() => {
        watchEntries.forEach((entry, index) => {
            if (entry.slots) {
                const total = calculateTotalHours(entry.slots);
                form.setValue(`entries.${index}.total`, total);
            }
        });

        // Update the total hours for the timesheet
        const totalHours = watchEntries.reduce((sum, entry) => sum + (entry.total || 0), 0);
        form.setValue("totalHours", totalHours);
    }, [watchEntries, form]);

    // Calculate total hours for display
    const totalHours = useMemo(() => {
        return watchEntries.reduce((sum, entry) => sum + (entry.total || 0), 0);
    }, [watchEntries]);

    // Handle form submission
    const handleSubmit = async (values: TimeSheetType) => {
        if (isReadOnly || propIsSubmitting || localIsSubmitting) return;

        try {
            setLocalIsSubmitting(true);
            if (propOnSubmit) {
                await propOnSubmit(values);
            }
        } catch (error) {
            console.error("Error submitting timesheet:", error);
        } finally {
            setLocalIsSubmitting(false);
        }
    };

    // Handle adding a new entry
    const handleAddEntry = () => {
        append({
            id: crypto.randomUUID(),
            taskCode: "",
            taskId: "",
            taskName: "",
            target: "",
            note: "",
            slots: {},
            reasons: { VT: false, CN: false, CL: false, MM: false },
            total: 0,
        });
    };

    // Handle time picker open
    const handleTimePickerOpen = (entryId: string) => {
        setSelectedEntry(entryId);
        setShowTimeRangePicker(true);
    };

    // Handle custom time selection
    const handleTimeRangeSelect = (
        startHours: number,
        startMinutes: number,
        endHours: number,
        endMinutes: number
    ) => {
        if (!selectedEntry) {
            setCustomTimeRange({ startHours, startMinutes, endHours, endMinutes });
            setShowCustomTimeDialog(false);
            return;
        }

        // Find entry index
        const entryIndex = fields.findIndex(entry => entry.id === selectedEntry);
        if (entryIndex === -1) return;

        // Get slots based on time range
        const newSlots = getSlotsFromTimeRange(startHours, startMinutes, endHours, endMinutes);

        // Update form
        form.setValue(`entries.${entryIndex}.slots`, newSlots);
        setShowTimeRangePicker(false);
        setSelectedEntry(null);
    };

    // Apply custom time range to all entries
    const applyCustomTimeToAll = () => {
        const { startHours, startMinutes, endHours, endMinutes } = customTimeRange;
        const newSlots = getSlotsFromTimeRange(startHours, startMinutes, endHours, endMinutes);

        fields.forEach((_, index) => {
            form.setValue(`entries.${index}.slots`, { ...newSlots });
        });
        setShowCustomTimeDialog(false);
    };

    // Duplicate entry function
    const duplicateEntry = (index: number) => {
        const entry = form.getValues(`entries.${index}`);
        append({
            ...entry,
            id: crypto.randomUUID()
        });
    };

    // Clear entry slots function
    const clearEntrySlots = (index: number) => {
        form.setValue(`entries.${index}.slots`, {});
    };

    // Get current date formatted
    const formattedDate = useMemo(() => {
        const today = new Date();
        return `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`;
    }, []);

    // Handle custom time range change
    const handleCustomTimeRangeChange = (
        startHours: number,
        startMinutes: number,
        endHours: number,
        endMinutes: number
    ) => {
        setCustomTimeRange({ startHours, startMinutes, endHours, endMinutes });
    };

    return (
        <div className="w-full max-w-4xl mx-auto overflow-auto">
            <Card className="shadow-sm overflow-visible">
                <CardContent className="pt-4">
                    <FormProvider {...form}>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                                {/* Timesheet Header with Employee Information */}
                                <TimeSheetHeader
                                    totalHours={totalHours}
                                    isReadOnly={isReadOnly}
                                    isSubmitting={propIsSubmitting || localIsSubmitting}
                                    formattedDate={formattedDate}
                                    onCustomTimeClick={() => setShowCustomTimeDialog(true)}
                                />
                                <div className="border-t pt-4">
                                    <h3 className="text-sm font-medium mb-2">Danh sách công đoạn</h3>
                                    {/* Task Entries List */}
                                    <div className="max-h-[50vh] overflow-y-auto">
                                        <TimeSheetEntryList
                                            fields={fields}
                                            isReadOnly={isReadOnly}
                                            isSubmitting={propIsSubmitting || localIsSubmitting}
                                            onAddEntry={handleAddEntry}
                                            onTimePickerOpen={handleTimePickerOpen}
                                            onDuplicate={duplicateEntry}
                                            onClearSlots={clearEntrySlots}
                                            onRemove={remove}
                                        />
                                    </div>
                                </div>
                                {/* Form actions */}
                                {/* <div className="mt-6"> */}
                                <div className="border-t pt-4">
                                    <FormActions
                                        isSubmitting={propIsSubmitting || localIsSubmitting}
                                        isReadOnly={isReadOnly}
                                        submitLabel={{
                                            create: "Lưu phiếu",
                                            update: "Cập nhật phiếu",
                                            loading: "Đang xử lý..."
                                        }}
                                    />
                                </div>
                            </form>
                        </Form>
                    </FormProvider>

                    {/* Time Range Picker Popover */}
                    <Popover open={showTimeRangePicker} onOpenChange={setShowTimeRangePicker}>
                        <PopoverContent className="w-auto p-0" align="center">
                            <div className="p-2 bg-gray-50 dark:bg-gray-800">
                                <h3 className="text-sm font-medium">Chọn khoảng thời gian</h3>
                            </div>
                            <TimeRangePicker
                                onSelect={handleTimeRangeSelect}
                                startHours={8}
                                startMinutes={0}
                                endHours={17}
                                endMinutes={0}
                                label="Chọn khoảng thời gian làm việc"
                            />
                        </PopoverContent>
                    </Popover>

                    {/* Custom Time Dialog */}
                    <CustomTimeDialog
                        open={showCustomTimeDialog}
                        onOpenChange={setShowCustomTimeDialog}
                        customTimeRange={customTimeRange}
                        onTimeRangeChange={handleCustomTimeRangeChange}
                        onApplyToAll={applyCustomTimeToAll}
                    />
                </CardContent>
            </Card>
        </div>
    );
};

export default TimeSheetForm;