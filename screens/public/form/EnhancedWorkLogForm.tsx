"use client";
import React, { useEffect, useCallback, useMemo, useState, useRef } from "react";
import { z } from "zod";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { FieldCombobox } from "@/components/common/Form/FieldCombobox";
import { FieldInput } from "@/components/common/Form/FieldInput";
import { FieldSelect } from "@/components/common/Form/FieldSelect";
import { FieldTextarea } from "@/components/common/Form/FieldTextarea";
import FormActions from "@/components/common/Form/FormAction";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { v4 as uuidv4 } from 'uuid';
import { useEnhancedWorkLogService } from "./workLogService";

// Define production record type
type ProductionRecord = Record<string, number>;

// Define schema for performance reasons
const performanceReasonSchema = z.object({
    material: z.string().optional().nullable(),
    technology: z.string().optional().nullable(),
    quality: z.string().optional().nullable(),
    machinery: z.string().optional().nullable(),
});

// Define schema for work entry
const workEntrySchema = z.object({
    id: z.string().optional(),
    bagCode: z.string().min(1, "Vui lòng chọn mã túi"),
    operationCode: z.string(),
    operationName: z.string().min(1, "Vui lòng chọn công đoạn"),
    hourlyTarget: z.number().min(0, "Chỉ tiêu giờ không được âm"),
    production: z.record(z.string(), z.coerce.number().min(0, "Sản lượng không được âm")),
    totalProduction: z.number().min(0, "Tổng sản lượng không được âm"),
    performanceReason: performanceReasonSchema,
});

// Define schema for the entire form
const enhancedWorkLogSchema = z.object({
    id: z.string().optional(),
    date: z.string().min(1, "Vui lòng chọn ngày"),
    employeeId: z.string().min(1, "Vui lòng chọn nhân viên"),
    employeeCode: z.string(),
    employeeName: z.string(),
    department: z.string(),
    cardNumber: z.string(),
    workingTime: z.string().min(1, "Vui lòng chọn thời gian làm việc"),
    entries: z.array(workEntrySchema).min(1, "Cần ít nhất một công việc"),
    status: z.enum(["pending", "approved", "rejected"]).default("pending"),
});

// Initial values for a new production record
const initialProduction: ProductionRecord = {
    "7:30-8:30": 0,
    "8:30-9:30": 0,
    "9:30-10:30": 0,
    "10:30-11:30": 0,
    "12:30-13:30": 0,
    "13:30-14:30": 0,
    "14:30-15:30": 0,
    "15:30-16:30": 0,
    "17:00-18:00": 0,
    "18:00-19:00": 0,
    "19:00-20:00": 0,
};

// Time slots for different working time options
const TIME_SLOTS = {
    "8_hours": ["7:30-8:30", "8:30-9:30", "9:30-10:30", "10:30-11:30", "12:30-13:30", "13:30-14:30", "14:30-15:30", "15:30-16:30"],
    "9.5_hours": ["7:30-8:30", "8:30-9:30", "9:30-10:30", "10:30-11:30", "12:30-13:30", "13:30-14:30", "14:30-15:30", "15:30-16:30", "17:00-18:00"],
    "11_hours": ["7:30-8:30", "8:30-9:30", "9:30-10:30", "10:30-11:30", "12:30-13:30", "13:30-14:30", "14:30-15:30", "15:30-16:30", "17:00-18:00", "18:00-19:00", "19:00-20:00"],
};

const BREAK_TIME_TEXT = {
    "8_hours": "Thời gian nghỉ: 11:30-12:30",
    "9.5_hours": "Thời gian nghỉ: 11:30-12:30",
    "11_hours": "Thời gian nghỉ: 11:30-12:30, 16:30-17:00",
};

export type EnhancedWorkLogFormValues = z.infer<typeof enhancedWorkLogSchema>;

// Small component to display compact employee info
const CompactInfoDisplay: React.FC<{
    label: string;
    value: string | number;
}> = ({ label, value }) => (
    <div className="flex items-center text-sm">
        <span className="font-medium mr-2">{label}:</span>
        <span>{value || "—"}</span>
    </div>
);

interface EnhancedWorkLogFormProps {
    isEdit?: boolean;
    isReadOnly?: boolean;
    defaultValues?: Partial<EnhancedWorkLogFormValues>;
    onSubmit?: (data: EnhancedWorkLogFormValues) => Promise<boolean>;
}

// Production input component to reduce rerenders
const ProductionInput: React.FC<{
    timeSlot: string;
    value: number;
    onChange: (value: number) => void;
    disabled?: boolean;
}> = React.memo(({ timeSlot, value, onChange, disabled }) => {
    return (
        <div className="flex items-center space-x-2">
            <label className="w-20 text-sm font-medium">{timeSlot}</label>
            <input
                type="number"
                min={0}
                placeholder="0"
                disabled={disabled}
                value={value.toString()}
                onChange={(e) => {
                    const numValue = parseInt(e.target.value, 10) || 0;
                    onChange(numValue);
                }}
                className="w-full flex-1 border border-gray-300 rounded-md px-3 py-2 transition-all focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
        </div>
    );
});

ProductionInput.displayName = 'ProductionInput';

// The main enhanced work log form component
const EnhancedWorkLogForm: React.FC<EnhancedWorkLogFormProps> = ({
    isEdit = false,
    defaultValues,
    isReadOnly = false,
    onSubmit
}) => {
    // State for showing employee details
    const [showEmployeeDetails, setShowEmployeeDetails] = useState(
        !!defaultValues?.employeeId
    );

    // Get service data
    const {
        employees,
        bagCodes,
        operations,
        workingTimeOptions,
        getEmployeeDetails,
        getOperationDetails
    } = useEnhancedWorkLogService();

    // Initialize form with default values or empty ones
    const form = useForm<EnhancedWorkLogFormValues>({
        resolver: zodResolver(enhancedWorkLogSchema),
        defaultValues: {
            id: undefined,
            date: new Date().toISOString().split('T')[0],
            employeeId: "",
            employeeCode: "",
            employeeName: "",
            department: "",
            cardNumber: "",
            workingTime: "",
            entries: defaultValues?.entries?.length ? defaultValues.entries : [{
                id: uuidv4(),
                bagCode: "",
                operationCode: "",
                operationName: "",
                hourlyTarget: 0,
                production: { ...initialProduction },
                totalProduction: 0,
                performanceReason: {
                    material: "",
                    technology: "",
                    quality: "",
                    machinery: "",
                }
            }],
            status: "pending",
            ...defaultValues
        },
        mode: "onBlur",
    });

    // Extract form methods
    const { control, watch, setValue, handleSubmit, formState: { isSubmitting } } = form;

    // Setup field array for entries
    const { fields, append, remove } = useFieldArray({
        control,
        name: "entries",
    });

    // Watch important fields
    const selectedEmployeeId = watch("employeeId");
    const selectedWorkingTime = watch("workingTime");
    const entries = watch("entries");

    // Fetch employee details when employee is selected
    useEffect(() => {
        if (selectedEmployeeId) {
            const employee = getEmployeeDetails(selectedEmployeeId);
            if (employee) {
                setValue("employeeCode", employee.code);
                setValue("employeeName", employee.name);
                setValue("department", employee.department);
                setValue("cardNumber", employee.cardNumber);
                setShowEmployeeDetails(true);
            }
        }
    }, [selectedEmployeeId, getEmployeeDetails, setValue]);

    // Calculate total production for an entry
    const calculateTotalProduction = useCallback((production: ProductionRecord): number => {
        return Object.values(production).reduce(
            (sum, value) => sum + (typeof value === 'string' ? parseInt(value, 10) || 0 : (value || 0)),
            0
        );
    }, []);

    // Get time slots based on working time
    const timeSlots = useMemo(() => {
        if (!selectedWorkingTime) return [];
        return TIME_SLOTS[selectedWorkingTime as keyof typeof TIME_SLOTS] || [];
    }, [selectedWorkingTime]);

    // Get break time text
    const breakTimeText = useMemo(() => {
        if (!selectedWorkingTime) return "";
        return BREAK_TIME_TEXT[selectedWorkingTime as keyof typeof BREAK_TIME_TEXT] || "";
    }, [selectedWorkingTime]);

    // Handle production change for a specific entry and time slot
    const handleProductionChange = useCallback((entryIndex: number, timeSlot: string, value: number) => {
        // Update the production for this time slot
        setValue(`entries.${entryIndex}.production.${timeSlot}`, value, { shouldValidate: false });

        // Get the current production
        const currentProduction = { ...entries[entryIndex].production, [timeSlot]: value };

        // Calculate and update total production
        const total = calculateTotalProduction(currentProduction);
        setValue(`entries.${entryIndex}.totalProduction`, total, { shouldValidate: true });
    }, [entries, setValue, calculateTotalProduction]);

    // Handle operation selection
    const handleOperationChange = useCallback((entryIndex: number, operationName: string) => {
        setValue(`entries.${entryIndex}.operationName`, operationName);

        // Get operation details and update hourly target and operation code
        const operation = getOperationDetails(operationName);
        if (operation) {
            setValue(`entries.${entryIndex}.hourlyTarget`, operation.hourlyTarget);
            setValue(`entries.${entryIndex}.operationCode`, operation.code);
        }
    }, [setValue, getOperationDetails]);

    // Update production time slots when working time changes
    useEffect(() => {
        if (selectedWorkingTime) {
            // Get valid time slots for selected working time
            const validTimeSlots = TIME_SLOTS[selectedWorkingTime as keyof typeof TIME_SLOTS] || [];

            // Update each entry's production
            entries.forEach((entry, index) => {
                const updatedProduction = { ...entry.production };

                // Reset slots that are not valid for the selected working time
                Object.keys(updatedProduction).forEach(slot => {
                    if (!validTimeSlots.includes(slot)) {
                        updatedProduction[slot] = 0;
                    }
                });

                setValue(`entries.${index}.production`, updatedProduction);

                // Recalculate total
                const total = calculateTotalProduction(updatedProduction);
                setValue(`entries.${index}.totalProduction`, total);
            });
        }
    }, [selectedWorkingTime, entries, setValue, calculateTotalProduction]);

    // Add a new entry
    const addEntry = useCallback(() => {
        append({
            id: uuidv4(),
            bagCode: "",
            operationCode: "",
            operationName: "",
            hourlyTarget: 0,
            production: { ...initialProduction },
            totalProduction: 0,
            performanceReason: {
                material: "",
                technology: "",
                quality: "",
                machinery: "",
            }
        });
    }, [append]);

    // Handle form submission
    const handleFormSubmit = async (data: EnhancedWorkLogFormValues) => {
        if (onSubmit && !isReadOnly) {
            return await onSubmit(data);
        }
        return false;
    };

    return (
        <Card className="w-full">
            <CardContent>
                <form
                    onSubmit={handleSubmit(handleFormSubmit)}
                    className="space-y-6 flex flex-col gap-4"
                >
                    {/* Section 1: Thông tin nhân viên */}
                    <div className="border rounded-md p-4">
                        <h3 className="text-lg font-medium mb-2">1. Thông tin nhân viên</h3>
                        <Separator className="mb-4" />

                        <div className="space-y-4">
                            <FieldCombobox
                                name="employeeId"
                                label="Họ tên nhân viên"
                                control={control}
                                options={employees.map(emp => ({ value: emp.id, label: emp.name }))}
                                placeholder="Chọn nhân viên"
                                required
                                searchPlaceholder="Tìm kiếm nhân viên..."
                                disabled={isReadOnly}
                            />

                            {showEmployeeDetails && (
                                <div className="grid grid-cols-3 gap-4 mt-2">
                                    <CompactInfoDisplay
                                        label="Mã nhân viên"
                                        value={watch("employeeCode")}
                                    />
                                    <CompactInfoDisplay
                                        label="Mã số thẻ"
                                        value={watch("cardNumber")}
                                    />
                                    <CompactInfoDisplay
                                        label="Đơn vị"
                                        value={watch("department")}
                                    />
                                </div>
                            )}

                            <FieldInput
                                name="date"
                                label="Ngày"
                                control={control}
                                type="date"
                                required
                                disabled={isReadOnly}
                            />
                        </div>
                    </div>

                    {/* Section 2: Thông tin công việc */}
                    <div className="border rounded-md p-4">
                        <h3 className="text-lg font-medium mb-2">2. Thông tin công việc</h3>
                        <Separator className="mb-4" />

                        <div className="mb-4">
                            <FieldSelect
                                name="workingTime"
                                label="Thời gian làm việc"
                                control={control}
                                options={workingTimeOptions}
                                placeholder="Chọn thời gian làm việc"
                                required
                                disabled={isReadOnly}
                            />
                            {breakTimeText && (
                                <div className="text-sm text-gray-500 italic mt-2">
                                    {breakTimeText}
                                </div>
                            )}
                        </div>

                        {/* Work entries section */}
                        <div className="space-y-6">
                            {fields.map((field, index) => (
                                <div key={field.id} className="border p-4 rounded-md relative">
                                    {/* Entry header with remove button */}
                                    <div className="flex justify-between items-center mb-4">
                                        <h4 className="font-medium">Công việc #{index + 1}</h4>
                                        {!isReadOnly && fields.length > 1 && (
                                            <Button
                                                type="button"
                                                variant="destructive"
                                                size="sm"
                                                onClick={() => remove(index)}
                                                className="absolute top-2 right-2"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                                        <FieldCombobox
                                            name={`entries.${index}.bagCode`}
                                            label="Mã túi"
                                            control={control}
                                            options={bagCodes}
                                            placeholder="Chọn mã túi"
                                            required
                                            searchPlaceholder="Tìm kiếm mã túi..."
                                            disabled={isReadOnly}
                                        />

                                        <FieldCombobox
                                            name={`entries.${index}.operationName`}
                                            label="Tên công đoạn"
                                            control={control}
                                            options={operations.map(op => ({ value: op.name, label: op.name }))}
                                            placeholder="Chọn công đoạn"
                                            required
                                            searchPlaceholder="Tìm kiếm công đoạn..."
                                            disabled={isReadOnly}
                                            onChange={(value) => handleOperationChange(index, value)}
                                        />

                                        <div className="flex items-center justify-between">
                                            <CompactInfoDisplay
                                                label="Mã công đoạn"
                                                value={watch(`entries.${index}.operationCode`)}
                                            />
                                            <CompactInfoDisplay
                                                label="Chỉ tiêu giờ"
                                                value={watch(`entries.${index}.hourlyTarget`)}
                                            />
                                        </div>
                                    </div>

                                    {/* Production details */}
                                    {selectedWorkingTime && (
                                        <div className="mt-4">
                                            <h5 className="font-medium mb-2">Chi tiết sản lượng:</h5>
                                            <div className="grid grid-cols-2 gap-4">
                                                {timeSlots.map((timeSlot) => (
                                                    <ProductionInput
                                                        key={timeSlot}
                                                        timeSlot={timeSlot}
                                                        value={watch(`entries.${index}.production.${timeSlot}`) || 0}
                                                        onChange={(value) => handleProductionChange(index, timeSlot, value)}
                                                        disabled={isReadOnly}
                                                    />
                                                ))}
                                            </div>

                                            <div className="flex justify-end mt-4">
                                                <div className="flex items-center space-x-2">
                                                    <label className="font-medium">Tổng cộng:</label>
                                                    <div className="w-32 bg-gray-50 border border-gray-300 rounded-md px-3 py-2 text-right dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300">
                                                        {watch(`entries.${index}.totalProduction`)}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Performance reasons */}
                                    <div className="mt-4">
                                        <h5 className="font-medium mb-2">Nguyên nhân (nếu có):</h5>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <FieldTextarea
                                                name={`entries.${index}.performanceReason.material`}
                                                label="Nguyên nhân vật tư"
                                                control={control}
                                                placeholder="Nhập nguyên nhân vật tư..."
                                                disabled={isReadOnly}
                                            />
                                            <FieldTextarea
                                                name={`entries.${index}.performanceReason.technology`}
                                                label="Nguyên nhân công nghệ"
                                                control={control}
                                                placeholder="Nhập nguyên nhân công nghệ..."
                                                disabled={isReadOnly}
                                            />
                                            <FieldTextarea
                                                name={`entries.${index}.performanceReason.quality`}
                                                label="Nguyên nhân chất lượng"
                                                control={control}
                                                placeholder="Nhập nguyên nhân chất lượng..."
                                                disabled={isReadOnly}
                                            />
                                            <FieldTextarea
                                                name={`entries.${index}.performanceReason.machinery`}
                                                label="Nguyên nhân máy móc"
                                                control={control}
                                                placeholder="Nhập nguyên nhân máy móc..."
                                                disabled={isReadOnly}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {/* Add entry button */}
                            {!isReadOnly && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={addEntry}
                                    className="w-full"
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Thêm công việc mới
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Form actions */}
                    {!isReadOnly && (
                        <FormActions
                            isSubmitting={isSubmitting}
                            isEdit={isEdit}
                            submitLabel={{
                                create: "Tạo mới",
                                update: "Cập nhật",
                                loading: "Đang xử lý..."
                            }}
                        />
                    )}
                </form>
            </CardContent>
        </Card>
    );
};

export default React.memo(EnhancedWorkLogForm);