"use client";

import React, { useState, useCallback, memo, } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form";
import { TRoleSchema, roleSchema, defaultRoleValues } from "@/schemas/role";
import { useDialog } from "@/context/DialogProvider";
import { FieldInput } from "@/components/common/Form/FieldInput";
import { FieldTextarea } from "@/components/common/Form/FieldTextarea";
import { FieldCheckbox } from "@/components/common/Form/FieldCheckbox";
import FormActions from "@/components/common/Form/FormAction";
import useAuthManager from "@/hooks/useAuthManager";

interface RoleFormProps {
    onSubmit?: (data: TRoleSchema) => Promise<void | boolean>;
    refetchData?: () => void;
}

const RoleForm: React.FC<RoleFormProps> = memo(({
    onSubmit,
    refetchData,
}) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { hideDialog, dialog, isReadOnly } = useDialog();
    const { user } = useAuthManager();

    // Initialize form with defaultValues
    const form = useForm<TRoleSchema>({
        resolver: zodResolver(roleSchema),
        defaultValues: dialog.data ? {
            id: dialog.data.id,
            code: dialog.data.code,
            name: dialog.data.name,
            description: dialog.data.description || "",
            isSystem: dialog.data.isSystem || false,
        } : defaultRoleValues,
    });

    // Tối ưu form submission handler with useCallback
    const handleSubmit = useCallback(async (values: TRoleSchema) => {
        if (isReadOnly || isSubmitting) return;

        try {
            setIsSubmitting(true);
            console.log("Lưu dữ liệu vai trò:", values);

            if (onSubmit) {
                const result = await onSubmit(values);

                // If result is true, close the dialog
                if (result === true) {
                    hideDialog();
                }
            }

            // Refetch data if needed
            if (refetchData) {
                refetchData();
            }
        } catch (error) {
            console.error("Lỗi khi lưu dữ liệu vai trò:", error);
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
                        label="Mã vai trò"
                        placeholder="Nhập mã vai trò"
                        disabled={isSubmitting || isReadOnly || dialog.data?.code === "SUPER_ADMIN" || (user?.role === "ADMIN" && dialog.data?.code === "ADMIN")}
                        required
                    />

                    <FieldInput
                        control={form.control}
                        name="name"
                        label="Tên vai trò"
                        placeholder="Nhập tên vai trò"
                        disabled={isSubmitting || isReadOnly}
                        required
                    />
                </div>


                <FieldTextarea
                    control={form.control}
                    name="description"
                    label="Mô tả"
                    placeholder="Nhập mô tả vai trò"
                    disabled={isSubmitting || isReadOnly}
                    rows={4}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">


                    <FieldCheckbox
                        control={form.control}
                        name="isSystem"
                        label="Vai trò hệ thống"
                        description="Các vai trò hệ thống chỉ có thể được quản lý bởi quản trị viên"
                        disabled={isSubmitting || isReadOnly}
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


export default memo(RoleForm);