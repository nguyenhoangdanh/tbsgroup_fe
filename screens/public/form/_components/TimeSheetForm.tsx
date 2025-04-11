import React, { useState, useEffect, useMemo } from "react";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import { Download, Plus, Trash, Clock, CalendarDays, Copy, XCircle } from "lucide-react";
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { FieldInput } from "@/components/common/Form/FieldInput";
import FormActions from "@/components/common/Form/FormAction";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

import {
    timeSheetSchema,
    TimeSheetType,
    defaultTimeSheet,
    TIME_SLOTS,
    REASON_OPTIONS,
    calculateTotalHours,
    getSlotsFromTimeRange
} from "@/schemas/timesheet";
import { TimeRangePicker } from "@/components/common/Form/TimeRangePicker";
import { Checkbox } from "@/components/ui/checkbox";

interface TimeSheetFormProps {
    onSubmit?: (data: TimeSheetType) => Promise<void | boolean>;
    isReadOnly?: boolean;
    initialData?: Partial<TimeSheetType>;
    formId?: string;
}

const TimeSheetForm: React.FC<TimeSheetFormProps> = ({
    onSubmit,
    isReadOnly = false,
    initialData,
    formId = "timesheet-form"
}) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showTimeRangePicker, setShowTimeRangePicker] = useState(false);
    const [selectedEntry, setSelectedEntry] = useState<string | null>(null);
    const [showCustomTimeDialog, setShowCustomTimeDialog] = useState(false);
    const [customTimeRange, setCustomTimeRange] = useState({
        startHours: 8,
        startMinutes: 0,
        endHours: 17,
        endMinutes: 0
    });

    // Initialize form with values
    const form = useForm<TimeSheetType>({
        resolver: zodResolver(timeSheetSchema),
        defaultValues: initialData ? { ...defaultTimeSheet, ...initialData } : defaultTimeSheet,
    });

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
    }, [watchEntries, form]);

    // Memoize total hours for the entire sheet
    const totalHours = useMemo(() => {
        return watchEntries.reduce((sum, entry) => sum + (entry.total || 0), 0);
    }, [watchEntries]);

    // Handle form submission
    const handleSubmit = async (values: TimeSheetType) => {
        if (isReadOnly || isSubmitting) return;

        try {
            setIsSubmitting(true);
            if (onSubmit) {
                await onSubmit(values);
            }
        } catch (error) {
            console.error("Error submitting timesheet:", error);
        } finally {
            setIsSubmitting(false);
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

    // Export to Excel/PDF function (placeholder)
    const exportTimesheet = () => {
        console.log("Exporting timesheet:", form.getValues());
        alert("Tính năng xuất phiếu sẽ được phát triển trong phiên bản tiếp theo.");
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

    return (
        <div className="bg-white dark:bg-gray-950 rounded-lg p-4 shadow-sm">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                    <img
                        src="/logo.png"
                        alt="TBS"
                        className="h-10 w-10 object-contain"
                        onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect width='20' height='14' x='2' y='7' rx='2' ry='2'/%3E%3Cpath d='M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16'/%3E%3C/svg%3E";
                        }}
                    />
                    <div>
                        <h2 className="text-xl font-semibold">PHIẾU THEO DÕI CÔNG ĐOẠN</h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400">GIAO CHỈ TIÊU CÁ NHÂN</p>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-sm font-medium">MS: P11H1HB034</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                        BĐ, ngày {formattedDate}
                    </div>
                </div>
            </div>

            <Form {...form}>
                <form id={formId} onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                    {/* Header Information */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <FieldInput
                                control={form.control}
                                name="employeeName"
                                label="HỌ TÊN"
                                placeholder="Nhập họ tên"
                                disabled={isReadOnly || isSubmitting}
                                required
                            />

                            <FieldInput
                                control={form.control}
                                name="employeeId"
                                label="MÃ SỐ THẺ"
                                placeholder="Nhập mã số thẻ"
                                disabled={isReadOnly || isSubmitting}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <FieldInput
                                control={form.control}
                                name="department"
                                label="ĐƠN VỊ"
                                placeholder="Nhập đơn vị"
                                disabled={isReadOnly || isSubmitting}
                                required
                            />

                            <FieldInput
                                control={form.control}
                                name="level"
                                label="TRÌNH ĐỘ"
                                placeholder="Nhập trình độ"
                                disabled={isReadOnly || isSubmitting}
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="grid grid-cols-1 gap-2">
                                <div>
                                    <FieldInput
                                        control={form.control}
                                        name="supervisor"
                                        label="QUẢN KÝ TÊN"
                                        placeholder=""
                                        disabled={isReadOnly || isSubmitting}
                                    />
                                </div>

                                <div>
                                    <FieldInput
                                        control={form.control}
                                        name="teamLeader"
                                        label="NHÓM TRƯỞNG KÝ TÊN"
                                        placeholder=""
                                        disabled={isReadOnly || isSubmitting}
                                    />
                                </div>

                                <div>
                                    <FieldInput
                                        control={form.control}
                                        name="shiftLeader"
                                        label="CHUYỀN TRƯỞNG KÝ TÊN"
                                        placeholder=""
                                        disabled={isReadOnly || isSubmitting}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Date Selection and Summary */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <Badge variant="outline" className="px-3 py-1.5 text-sm">
                            Tổng số giờ: <span className="font-bold ml-1">{totalHours}</span>
                        </Badge>

                        <div className="flex items-center gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setShowCustomTimeDialog(true)}
                                className="flex items-center gap-1"
                                disabled={isReadOnly || isSubmitting}
                            >
                                <Clock className="h-4 w-4" />
                                <span>Chọn TG</span>
                            </Button>

                            <div className="flex items-center w-48">
                                <CalendarDays className="mr-2 h-4 w-4 text-gray-500" />
                                <Controller
                                    control={form.control}
                                    name="date"
                                    render={({ field }) => (
                                        <Input
                                            type="date"
                                            {...field}
                                            className="h-9"
                                            disabled={isReadOnly || isSubmitting}
                                        />
                                    )}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Task Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-gray-100 dark:bg-gray-800">
                                    <th className="border p-2 text-sm font-medium text-left w-10">STT</th>
                                    <th className="border p-2 text-sm font-medium text-left w-20">MÃ TÚI</th>
                                    <th className="border p-2 text-sm font-medium text-left w-20">MÃ C.ĐOẠN</th>
                                    <th className="border p-2 text-sm font-medium text-left w-56">TÊN C.ĐOẠN SẢN XUẤT</th>
                                    <th className="border p-2 text-sm font-medium text-center w-16">CHỈ TIÊU GIỜ</th>
                                    <th className="border p-2 text-sm font-medium text-center w-16">Đ.GIÁ</th>
                                    <th colSpan={11} className="border p-2 text-sm font-medium text-center">
                                        KẾT QUẢ THỰC HIỆN TRONG NGÀY
                                    </th>
                                    <th className="border p-2 text-sm font-medium text-center w-16">TỔNG CỘNG</th>
                                    <th colSpan={4} className="border p-2 text-sm font-medium text-center">
                                        NGUYÊN NHÂN
                                    </th>
                                    <th className="border p-2 text-sm font-medium text-center w-20">Thao tác</th>
                                </tr>
                                <tr className="bg-gray-50 dark:bg-gray-900">
                                    <th className="border p-1"></th>
                                    <th className="border p-1"></th>
                                    <th className="border p-1"></th>
                                    <th className="border p-1"></th>
                                    <th className="border p-1"></th>
                                    <th className="border p-1"></th>
                                    {TIME_SLOTS.map((slot) => (
                                        <th key={slot.id} className="border p-1 text-xs text-center w-12">
                                            {slot.label}
                                        </th>
                                    ))}
                                    <th className="border p-1"></th>
                                    <th className="border p-1 text-xs text-center">VT</th>
                                    <th className="border p-1 text-xs text-center">CN</th>
                                    <th className="border p-1 text-xs text-center">CL</th>
                                    <th className="border p-1 text-xs text-center">MM</th>
                                    <th className="border p-1"></th>
                                </tr>
                            </thead>
                            <tbody>
                                <AnimatePresence>
                                    {fields.map((entry, index) => (
                                        <motion.tr
                                            key={entry.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
                                            transition={{ duration: 0.2 }}
                                            className="hover:bg-gray-50 dark:hover:bg-gray-900"
                                        >
                                            <td className="border p-2 text-center">{index + 1}</td>
                                            <td className="border p-1">
                                                <Controller
                                                    control={form.control}
                                                    name={`entries.${index}.taskCode`}
                                                    render={({ field }) => (
                                                        <Input
                                                            {...field}
                                                            className="h-8 text-sm w-full"
                                                            disabled={isReadOnly || isSubmitting}
                                                        />
                                                    )}
                                                />
                                            </td>
                                            <td className="border p-1">
                                                <Controller
                                                    control={form.control}
                                                    name={`entries.${index}.taskId`}
                                                    render={({ field }) => (
                                                        <Input
                                                            {...field}
                                                            className="h-8 text-sm w-full"
                                                            disabled={isReadOnly || isSubmitting}
                                                        />
                                                    )}
                                                />
                                            </td>
                                            <td className="border p-1">
                                                <Controller
                                                    control={form.control}
                                                    name={`entries.${index}.taskName`}
                                                    render={({ field }) => (
                                                        <Input
                                                            {...field}
                                                            className="h-8 text-sm w-full"
                                                            disabled={isReadOnly || isSubmitting}
                                                        />
                                                    )}
                                                />
                                            </td>
                                            <td className="border p-1">
                                                <Controller
                                                    control={form.control}
                                                    name={`entries.${index}.target`}
                                                    render={({ field }) => (
                                                        <Input
                                                            {...field}
                                                            className="h-8 text-sm w-full text-center"
                                                            disabled={isReadOnly || isSubmitting}
                                                        />
                                                    )}
                                                />
                                            </td>
                                            <td className="border p-1">
                                                <Controller
                                                    control={form.control}
                                                    name={`entries.${index}.note`}
                                                    render={({ field }) => (
                                                        <Input
                                                            {...field}
                                                            className="h-8 text-sm w-full text-center"
                                                            disabled={isReadOnly || isSubmitting}
                                                        />
                                                    )}
                                                />
                                            </td>

                                            {/* Time slots checkboxes */}
                                            {TIME_SLOTS.map((slot) => (
                                                <td key={`${entry.id}-${slot.id}`} className="border p-1 text-center">
                                                    <Controller
                                                        control={form.control}
                                                        name={`entries.${index}.slots.${slot.id}`}
                                                        render={({ field: { onChange, value, ref } }) => (
                                                            <div className="flex justify-center items-center">
                                                                <Checkbox
                                                                    id={`slot-${entry.id}-${slot.id}`}
                                                                    checked={value || false}
                                                                    onCheckedChange={onChange}
                                                                    ref={ref as React.RefObject<HTMLButtonElement>}
                                                                    disabled={isReadOnly || isSubmitting}
                                                                    className="h-4 w-4 rounded border-gray-300 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                                                                />
                                                            </div>
                                                        )}
                                                    />
                                                </td>
                                            ))}

                                            {/* Total hours */}
                                            <td className="border p-1 text-center font-medium">
                                                {form.watch(`entries.${index}.total`) || 0}
                                            </td>

                                            {/* Reason checkboxes */}
                                            {REASON_OPTIONS.map((reason) => (
                                                <td key={`${entry.id}-${reason.value}`} className="border p-1 text-center">
                                                    <Controller
                                                        control={form.control}
                                                        name={`entries.${index}.reasons.${reason.value}`}
                                                        render={({ field: { onChange, value, ref } }) => (
                                                            <div className="flex justify-center items-center">
                                                                <Checkbox
                                                                    id={`reason-${entry.id}-${reason.value}`}
                                                                    checked={value || false}
                                                                    onCheckedChange={onChange}
                                                                    ref={ref as React.RefObject<HTMLButtonElement>}
                                                                    disabled={isReadOnly || isSubmitting}
                                                                    className="h-4 w-4 rounded border-gray-300 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                                                                />
                                                            </div>
                                                        )}
                                                    />
                                                </td>
                                            ))}

                                            {/* Actions */}
                                            <td className="border p-1">
                                                {!isReadOnly && (
                                                    <div className="flex justify-center items-center gap-1">
                                                        <TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Button
                                                                        type="button"
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        className="h-7 w-7 p-0"
                                                                        onClick={() => {
                                                                            setSelectedEntry(entry.id);
                                                                            setShowTimeRangePicker(true);
                                                                        }}
                                                                        disabled={isSubmitting}
                                                                    >
                                                                        <Clock className="h-3.5 w-3.5 text-blue-500" />
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p>Chọn thời gian</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>

                                                        <TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Button
                                                                        type="button"
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        className="h-7 w-7 p-0"
                                                                        onClick={() => duplicateEntry(index)}
                                                                        disabled={isSubmitting}
                                                                    >
                                                                        <Copy className="h-3.5 w-3.5 text-green-500" />
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p>Nhân bản</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>

                                                        <TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Button
                                                                        type="button"
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        className="h-7 w-7 p-0"
                                                                        onClick={() => clearEntrySlots(index)}
                                                                        disabled={isSubmitting}
                                                                    >
                                                                        <XCircle className="h-3.5 w-3.5 text-orange-500" />
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p>Xóa giờ</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>

                                                        {fields.length > 1 && (
                                                            <TooltipProvider>
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <Button
                                                                            type="button"
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            className="h-7 w-7 p-0"
                                                                            onClick={() => remove(index)}
                                                                            disabled={isSubmitting}
                                                                        >
                                                                            <Trash className="h-3.5 w-3.5 text-red-500" />
                                                                        </Button>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>
                                                                        <p>Xóa dòng</p>
                                                                    </TooltipContent>
                                                                </Tooltip>
                                                            </TooltipProvider>
                                                        )}
                                                    </div>
                                                )}
                                            </td>
                                        </motion.tr>
                                    ))}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    </div>

                    {/* Legend for abbreviations */}
                    <div className="flex flex-wrap justify-start gap-6 text-sm text-gray-600 dark:text-gray-400">
                        <div>VT = VẬT TƯ</div>
                        <div>CN = CÔNG NGHỆ</div>
                        <div>CL = CHẤT LƯỢNG</div>
                        <div>MM = MÁY MÓC - THIẾT BỊ</div>
                    </div>

                    {/* Buttons */}
                    <div className="flex justify-between items-center">
                        {!isReadOnly && (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleAddEntry}
                                disabled={isSubmitting}
                                className="flex items-center gap-1"
                            >
                                <Plus className="h-4 w-4" />
                                <span>Thêm công đoạn</span>
                            </Button>
                        )}

                        <div className="flex gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={exportTimesheet}
                                className="flex items-center gap-1"
                            >
                                <Download className="h-4 w-4" />
                                <span>Xuất phiếu</span>
                            </Button>
                        </div>
                    </div>

                    {/* Form actions */}
                    <FormActions
                        isSubmitting={isSubmitting}
                        isReadOnly={isReadOnly}
                        submitLabel={{
                            create: "Lưu phiếu",
                            update: "Cập nhật phiếu",
                            loading: "Đang xử lý..."
                        }}
                    />
                </form>
            </Form>

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
            <Dialog open={showCustomTimeDialog} onOpenChange={setShowCustomTimeDialog}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Áp dụng khoảng thời gian cho tất cả</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <TimeRangePicker
                            onSelect={(startHours, startMinutes, endHours, endMinutes) => {
                                setCustomTimeRange({ startHours, startMinutes, endHours, endMinutes });
                            }}
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
                            onClick={() => setShowCustomTimeDialog(false)}
                        >
                            Hủy
                        </Button>
                        <Button
                            type="button"
                            onClick={applyCustomTimeToAll}
                        >
                            Áp dụng cho tất cả
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default TimeSheetForm;