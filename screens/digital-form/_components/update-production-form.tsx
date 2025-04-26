// components/update-production-form.tsx
"use client"

import { useState, useCallback } from "react"
import { useForm as useHookForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Loader2 } from "lucide-react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Worker, AttendanceStatus } from "@/common/types/worker"
import { TIME_SLOTS } from "@/common/constants/time-slots"

interface UpdateProductionFormProps {
    worker: Worker;
    onUpdateHourlyData: (workerId: string, timeSlot: string, quantity: number) => Promise<boolean>;
    onUpdateAttendanceStatus: (workerId: string, status: AttendanceStatus) => Promise<boolean>;
    currentTimeSlot: string | null;
    onSuccess?: () => void;
    disabled?: boolean;
}

// Validation schema for production updates
const productionSchema = z.object({
    timeSlot: z.string({
        required_error: "Vui lòng chọn khung giờ",
    }),
    quantity: z.coerce
        .number({
            required_error: "Vui lòng nhập số lượng",
            invalid_type_error: "Vui lòng nhập số",
        })
        .min(0, "Số lượng không được âm")
        .int("Vui lòng nhập số nguyên"),
});

// Validation schema for attendance status
const attendanceSchema = z.object({
    status: z.nativeEnum(AttendanceStatus, {
        required_error: "Vui lòng chọn trạng thái",
    }),
});

export function UpdateProductionForm({
    worker,
    onUpdateHourlyData,
    onUpdateAttendanceStatus,
    currentTimeSlot,
    onSuccess,
    disabled = false
}: UpdateProductionFormProps) {
    // State for active tab and loading states
    const [activeTab, setActiveTab] = useState<"production" | "attendance">("production");
    const [isSubmittingProduction, setIsSubmittingProduction] = useState(false);
    const [isSubmittingAttendance, setIsSubmittingAttendance] = useState(false);

    // Initialize production form with defaults
    const productionForm = useHookForm<z.infer<typeof productionSchema>>({
        resolver: zodResolver(productionSchema),
        defaultValues: {
            timeSlot: currentTimeSlot || TIME_SLOTS[0].label,
            quantity: 0,
        },
    });

    // Initialize attendance form with current status
    const attendanceForm = useHookForm<z.infer<typeof attendanceSchema>>({
        resolver: zodResolver(attendanceSchema),
        defaultValues: {
            status: worker.attendanceStatus,
        },
    });

    // Handler for production update
    const onSubmitProduction = useCallback(async (values: z.infer<typeof productionSchema>) => {
        if (isSubmittingProduction || disabled) return;

        try {
            setIsSubmittingProduction(true);

            const success = await onUpdateHourlyData(
                worker.id,
                values.timeSlot,
                values.quantity
            );

            if (success) {
                // Reset only the quantity field
                productionForm.setValue('quantity', 0);
                productionForm.clearErrors('quantity');

                // Call onSuccess callback if provided
                if (onSuccess) onSuccess();
            }
        } catch (error) {
            console.error("Error updating production:", error);
        } finally {
            setIsSubmittingProduction(false);
        }
    }, [isSubmittingProduction, disabled, onUpdateHourlyData, worker.id, productionForm, onSuccess]);

    // Handler for attendance status update
    const onSubmitAttendance = useCallback(async (values: z.infer<typeof attendanceSchema>) => {
        if (isSubmittingAttendance || disabled) return;

        // Skip if status hasn't changed
        if (values.status === worker.attendanceStatus) {
            if (onSuccess) onSuccess();
            return;
        }

        try {
            setIsSubmittingAttendance(true);

            const success = await onUpdateAttendanceStatus(worker.id, values.status);

            if (success && onSuccess) {
                onSuccess();
            }
        } catch (error) {
            console.error("Error updating attendance status:", error);
        } finally {
            setIsSubmittingAttendance(false);
        }
    }, [isSubmittingAttendance, disabled, onUpdateAttendanceStatus, worker.id, worker.attendanceStatus, onSuccess]);

    // Get the selected time slot's current value
    const selectedTimeSlot = productionForm.watch("timeSlot");
    const currentValue = worker.hourlyData[selectedTimeSlot] || 0;

    return (
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "production" | "attendance")}>
            <TabsList className="grid grid-cols-2 mb-4">
                <TabsTrigger value="production">Sản lượng</TabsTrigger>
                <TabsTrigger value="attendance">Trạng thái</TabsTrigger>
            </TabsList>

            <TabsContent value="production">
                <Form {...productionForm}>
                    <form onSubmit={productionForm.handleSubmit(onSubmitProduction)} className="space-y-4">
                        <FormField
                            control={productionForm.control}
                            name="timeSlot"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Khung giờ</FormLabel>
                                    <Select
                                        onValueChange={(value) => {
                                            field.onChange(value);
                                            // Reset quantity when changing time slot
                                            productionForm.setValue('quantity', 0);
                                        }}
                                        value={field.value}
                                        disabled={disabled}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Chọn khung giờ" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {TIME_SLOTS.map((slot) => (
                                                <SelectItem key={slot.id} value={slot.label}>
                                                    {slot.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {selectedTimeSlot && (
                            <div className="text-sm">
                                Sản lượng hiện tại: <span className="font-medium">{currentValue}</span>
                            </div>
                        )}

                        <FormField
                            control={productionForm.control}
                            name="quantity"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Số lượng</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            {...field}
                                            min="0"
                                            step="1"
                                            autoComplete="off"
                                            inputMode="numeric"
                                            disabled={disabled}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <Button type="submit" disabled={isSubmittingProduction || disabled} className="w-full">
                            {isSubmittingProduction ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Đang cập nhật...
                                </>
                            ) : (
                                "Cập nhật sản lượng"
                            )}
                        </Button>
                    </form>
                </Form>
            </TabsContent>

            <TabsContent value="attendance">
                <Form {...attendanceForm}>
                    <form onSubmit={attendanceForm.handleSubmit(onSubmitAttendance)} className="space-y-4">
                        <FormField
                            control={attendanceForm.control}
                            name="status"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Trạng thái chuyên cần</FormLabel>
                                    <FormControl>
                                        <RadioGroup
                                            onValueChange={(value) => field.onChange(value as AttendanceStatus)}
                                            value={field.value}
                                            className="space-y-2"
                                            disabled={disabled}
                                        >
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value={AttendanceStatus.PRESENT} id="present" />
                                                <label htmlFor="present" className="text-sm">Có mặt</label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value={AttendanceStatus.ABSENT} id="absent" />
                                                <label htmlFor="absent" className="text-sm">Vắng mặt</label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value={AttendanceStatus.LATE} id="late" />
                                                <label htmlFor="late" className="text-sm">Đi muộn</label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value={AttendanceStatus.EARLY_LEAVE} id="early-leave" />
                                                <label htmlFor="early-leave" className="text-sm">Về sớm</label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value={AttendanceStatus.LEAVE_APPROVED} id="leave-approved" />
                                                <label htmlFor="leave-approved" className="text-sm">Nghỉ phép</label>
                                            </div>
                                        </RadioGroup>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <Button type="submit" disabled={isSubmittingAttendance || disabled} className="w-full">
                            {isSubmittingAttendance ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Đang cập nhật...
                                </>
                            ) : (
                                "Cập nhật trạng thái"
                            )}
                        </Button>
                    </form>
                </Form>
            </TabsContent>
        </Tabs>
    );
}