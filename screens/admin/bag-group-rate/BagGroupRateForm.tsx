"use client";

import React, { useState, useCallback, memo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form } from "@/components/ui/form";
import { FieldInput } from "@/components/common/Form/FieldInput";
import { FieldTextarea } from "@/components/common/Form/FieldTextarea";
import FormActions from "@/components/common/Form/FormAction";
import { useDialog } from "@/context/DialogProvider";
import { FieldCombobox } from "@/components/common/Form/FieldCombobox";
import { useBagGroupRateContext } from "@/hooks/group/bag-group-rate/BagGroupRateContext";
import UnifiedFormField from '../../../components/common/Form/custom/UnifiedFormField';
import { BagGroupRateContextBridge } from "./BagGroupRateContextBridge";

// Define schema validation
const bagGroupRateSchema = z.object({
    id: z.string().optional(),
    handBagId: z.string({ required_error: "Vui lòng chọn mã túi" }),
    groupId: z.string({ required_error: "Vui lòng chọn nhóm" }),
    outputRate: z.preprocess(
        // Tiền xử lý giá trị đầu vào
        (val) => (val === "" ? undefined : Number(val)),
        // Sau đó áp dụng schema số
        z.number({ required_error: "Vui lòng nhập năng suất" })
            .min(0, { message: "Năng suất không thể là số âm" })
    ),
    notes: z.string().optional(),
    active: z.boolean().default(true),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
});

export type BagGroupRateSchema = z.infer<typeof bagGroupRateSchema>;

// Default values
const defaultValues: BagGroupRateSchema = {
    handBagId: "",
    groupId: "",
    outputRate: 0,
    notes: "",
    active: true,
};

interface BagGroupRateFormProps {
    onSubmit?: (data?: BagGroupRateSchema) => Promise<void | boolean>;
    refetchData?: () => void;
    data?: any;
    isSubmitting?: boolean;
    isReadOnly?: boolean;
    onClose?: () => void;
}

// Main form component with Context Bridge wrapper
const BagGroupRateForm: React.FC<BagGroupRateFormProps> = memo((props) => {
    return (
        <BagGroupRateContextBridge>
            <BagGroupRateFormContent {...props} />
        </BagGroupRateContextBridge>
    );
});

// Content component that uses the context
const BagGroupRateFormContent: React.FC<BagGroupRateFormProps> = memo(({
    onSubmit,
    refetchData,
    data: dialogData,
    isSubmitting: dialogIsSubmitting = false,
    isReadOnly: dialogIsReadOnly = false,
    onClose
}) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { hideDialog, dialog } = useDialog();
    const { handBags, groups } = useBagGroupRateContext();

    // Use values from props first, then fall back to dialog context
    const isReadOnly = dialogIsReadOnly || dialog?.isReadOnly || false;
    const currentData = dialogData || dialog?.data || null;
    const isDialogSubmitting = dialogIsSubmitting || isSubmitting;

    // Prepare options for comboboxes
    const handBagOptions = handBags?.map(bag => ({
        value: bag.id,
        label: `${bag.code} - ${bag.name}`
    })) || [];

    const groupOptions = groups?.map(group => ({
        value: group.id,
        label: `${group.code} - ${group.name}`
    })) || [];

    // Initialize form
    const form = useForm<BagGroupRateSchema>({
        resolver: zodResolver(bagGroupRateSchema),
        defaultValues: currentData ? {
            id: currentData.id,
            handBagId: currentData.handBagId,
            groupId: currentData.groupId,
            outputRate: currentData.outputRate,
            notes: currentData.notes || "",
            active: currentData.active !== undefined ? currentData.active : true,
        } : {
            ...defaultValues,
        },
    });

    // Handle form submission
    const handleSubmit = useCallback(async (values: BagGroupRateSchema) => {
        if (isReadOnly || isDialogSubmitting) return;

        try {
            setIsSubmitting(true);
            console.log("Đang lưu dữ liệu năng suất:", values);

            if (onSubmit) {
                const result = await onSubmit(values);

                // If result is true, close dialog
                if (result === true) {
                    onClose ? onClose() : hideDialog();
                }
            }

            // If there's a refetch function, call it
            if (refetchData) {
                refetchData();
            }
        } catch (error) {
            console.error("Lỗi khi lưu dữ liệu năng suất:", error);
        } finally {
            setIsSubmitting(false);
        }
    }, [isReadOnly, isDialogSubmitting, onSubmit, hideDialog, refetchData, onClose]);

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FieldCombobox
                        control={form.control}
                        name="handBagId"
                        label="Mã túi xách"
                        placeholder="Chọn mã túi xách"
                        options={handBagOptions}
                        disabled={isDialogSubmitting || isReadOnly || !!currentData?.id}
                        required
                    />

                    <FieldCombobox
                        control={form.control}
                        name="groupId"
                        label="Nhóm"
                        placeholder="Chọn nhóm"
                        options={groupOptions}
                        disabled={isDialogSubmitting || isReadOnly || !!currentData?.id}
                        required
                    />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FieldInput
                        control={form.control}
                        name="outputRate"
                        label="Năng suất (sản phẩm/giờ)"
                        placeholder="Nhập năng suất"
                        type="number"
                        min={0}
                        step={0.1}
                        disabled={isDialogSubmitting || isReadOnly}
                        required
                    />

                    <UnifiedFormField
                        type="switch"
                        control={form.control}
                        name="active"
                        label="Trạng thái"
                        description="Kích hoạt / Vô hiệu hóa năng suất này"
                        disabled={isDialogSubmitting || isReadOnly}
                    />
                </div>

                <FieldTextarea
                    control={form.control}
                    name="notes"
                    label="Ghi chú"
                    placeholder="Nhập ghi chú về năng suất này"
                    disabled={isDialogSubmitting || isReadOnly}
                    rows={4}
                />

                <FormActions
                    isSubmitting={isDialogSubmitting}
                    isReadOnly={isReadOnly}
                    isEdit={!!currentData?.id}
                />
            </form>
        </Form>
    );
});

BagGroupRateForm.displayName = "BagGroupRateForm";
BagGroupRateFormContent.displayName = "BagGroupRateFormContent";

export default BagGroupRateForm;