"use client";

import React, { useState, useCallback, memo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form } from "@/components/ui/form";
import { FieldInput } from "@/components/common/Form/FieldInput";
import { FieldTextarea } from "@/components/common/Form/FieldTextarea";
import { FieldCheckbox } from "@/components/common/Form/FieldCheckbox";
import FormActions from "@/components/common/Form/FormAction";
import { useDialog } from "@/context/DialogProvider";
import { FieldCombobox } from "@/components/common/Form/FieldCombobox";
import { FieldColorPicker } from "@/components/common/Form/FieldColorPicker";
import { FieldDateTimePicker } from "@/components/common/Form/FieldDateTimePicker";
import dayjs from "dayjs";
import { FieldTimeRangePicker } from "@/components/common/Form/FieldTimeRangePicker";
import { FieldRangeDateTimePicker } from "@/components/common/Form/FieldRangeDateTimePicker";

// Define schema validation for the process
const bagProcessSchema = z.object({
    id: z.string().optional(),
    code: z.string().min(2, { message: "Mã công đoạn phải có ít nhất 2 ký tự" }),
    name: z.string().min(2, { message: "Tên công đoạn phải có ít nhất 2 ký tự" }),
    description: z.string().optional(),
    processType: z.string().optional(),
    orderIndex: z.coerce.number().int().optional(), // Integer only
    standardOutput: z.coerce.number()
        .nonnegative({ message: "Sản lượng tiêu chuẩn phải là số dương" })
        .refine(n => String(n).split('.')[1]?.length <= 2, {
            message: "Sản lượng tiêu chuẩn chỉ được phép có tối đa 2 chữ số thập phân"
        })
        .optional(),
    cycleDuration: z.coerce.number().int().optional(), // Integer only
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
    teamId: z.string().optional(),
    color: z.string().optional(),
    eventDateTime: z.date().optional(),
    workHours: z.object({
        startDate: z.date().optional(),
        endDate: z.date().optional(),
    }).optional(),
    eventPeriod: z.object({
        startDate: z.date().optional(),
        endDate: z.date().optional(),
    }).optional(),
});

type BagProcessSchema = z.infer<typeof bagProcessSchema>;

// Default values for the form
const defaultBagProcessValues: BagProcessSchema = {
    code: "",
    name: "",
    description: "",
    processType: "",
};

interface BagProcessFormProps {
    onSubmit?: (data: BagProcessSchema) => Promise<void | boolean>;
    refetchData?: () => void;
}

const BagProcessForm: React.FC<BagProcessFormProps> = memo(({
    onSubmit,
    refetchData,
}) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { hideDialog, dialog, isReadOnly } = useDialog();

    // Initialize form with default values or data from dialog
    const form = useForm<BagProcessSchema>({
        resolver: zodResolver(bagProcessSchema),
        defaultValues: dialog.data ? {
            id: dialog.data.id,
            code: dialog.data.code,
            name: dialog.data.name,
            description: dialog.data.description,
            processType: dialog.data.processType,
            orderIndex: dialog.data.orderIndex,
            standardOutput: dialog.data.standardOutput,
            cycleDuration: dialog.data.cycleDuration,
        } : defaultBagProcessValues,
    });

    // Handle form submission
    const handleSubmit = useCallback(async (values: BagProcessSchema) => {
        if (isReadOnly || isSubmitting) return;

        try {
            setIsSubmitting(true);
            console.log("Saving process data:", values);

            if (onSubmit) {
                const result = await onSubmit(values);

                // If result is true, close the dialog
                if (result === true) {
                    hideDialog();
                }
            }

            // If refetch data function is provided
            if (refetchData) {
                refetchData();
            }
        } catch (error) {
            console.error("Error saving process data:", error);
        } finally {
            setIsSubmitting(false);
        }
    }, [isReadOnly, isSubmitting, onSubmit, hideDialog, refetchData]);

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FieldInput
                        control={form.control}
                        name="code"
                        label="Mã công đoạn"
                        placeholder="Nhập mã công đoạn"
                        disabled={isSubmitting || isReadOnly}
                        required
                    />

                    <FieldInput
                        control={form.control}
                        name="name"
                        label="Tên công đoạn"
                        placeholder="Nhập tên công đoạn"
                        disabled={isSubmitting || isReadOnly}
                        required
                    />
                </div>

                <FieldTextarea
                    control={form.control}
                    name="description"
                    label="Mô tả"
                    placeholder="Nhập mô tả về công đoạn"
                    disabled={isSubmitting || isReadOnly}
                    rows={4}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FieldInput
                        control={form.control}
                        name="processType"
                        label="Loại công đoạn"
                        placeholder="Nhập loại công đoạn"
                        disabled={isSubmitting || isReadOnly}
                    />

                    <FieldInput
                        control={form.control}
                        name="orderIndex"
                        label="Thứ tự"
                        placeholder="Nhập thứ tự công đoạn"
                        type="number"
                        disabled={isSubmitting || isReadOnly}
                    />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FieldInput
                        control={form.control}
                        name="standardOutput"
                        label="Sản lượng tiêu chuẩn"
                        placeholder="Nhập sản lượng tiêu chuẩn"
                        type="number"
                        disabled={isSubmitting || isReadOnly}
                    />

                    <FieldCombobox
                        control={form.control}
                        name="teamId"
                        label="Thuộc tổ"
                        placeholder="Chọn tổ"
                        options={[
                            { value: '1', label: 'Team A' },
                            { value: '2', label: 'Team B' }
                        ]}
                        disabled={isSubmitting}
                        required
                    />

                    <FieldColorPicker
                        control={form.control}
                        name="color"
                        label="Chọn màu"
                        customColors={['#FF0000', '#00FF00', '#0000FF']}
                    />

                    <FieldDateTimePicker
                        control={form.control}
                        name="eventDateTime"
                        label="Thời gian sự kiện"
                        minDate={new Date()}
                        maxDate={dayjs().add(1, 'month').toDate()}
                        required
                    />

                    <FieldTimeRangePicker
                        name="workHours"
                        label="Giờ làm việc"
                        control={form.control}
                        required
                        allowSameTime={false}
                    // rules={{
                    //     validate: (value) => {
                    //         // Custom validation logic
                    //         return true;
                    //     }
                    // }}
                    />

                    <FieldRangeDateTimePicker
                        name="eventPeriod"
                        label="Thời gian sự kiện"
                        control={form.control}
                        required
                        minDate={new Date()}
                        allowSameDateTime={false}
                    />
                </div>

                <FormActions
                    isSubmitting={isSubmitting}
                    isReadOnly={isReadOnly}
                    isEdit={!!dialog.data?.id}
                />
            </form>
        </Form>
    );
});

export default memo(BagProcessForm);