"use client";

import React, { useState, useEffect, useCallback, memo, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form";
import { TRoleSchema, roleSchema, defaultRoleValues } from "@/schemas/role";
import { useDialog } from "@/context/DialogProvider";
import { FieldInput } from "@/components/common/Form/FieldInput";
import { FieldTextarea } from "@/components/common/Form/FieldTextarea";
import { FieldCheckbox } from "@/components/common/Form/FieldCheckbox";
import FormActions from "@/components/common/Form/FormAction";
import { RoleType } from "@/apis/roles/role.api";

interface RoleFormProps {
    roleData?: RoleType | null;
    setRoleData?: () => void;
    onSubmit?: (data: TRoleSchema) => Promise<void | boolean>;
    refetchData?: () => void;
    isReadOnly?: boolean;
}


const RoleForm: React.FC<RoleFormProps> = memo(({
    roleData,
    onSubmit,
    refetchData,
    isReadOnly = false,
    setRoleData,
}) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { hideDialog, dialog, updateDialogData } = useDialog();

    // Lưu trữ values hiện tại trong ref để tránh stale closures
    const currentValuesRef = useRef<TRoleSchema | null>(null);

    // Initialize form with defaultValues
    const form = useForm<TRoleSchema>({
        resolver: zodResolver(roleSchema),
        defaultValues: roleData ? {
            id: roleData.id,
            code: roleData.code,
            name: roleData.name,
            description: roleData.description || "",
            level: roleData.level || 0,
            isSystem: roleData.isSystem || false,
        } : defaultRoleValues,
    });

    // Theo dõi giá trị form hiện tại
    const formValues = form.watch();

    // Cập nhật ref khi form values thay đổi
    useEffect(() => {
        currentValuesRef.current = formValues;
    }, [formValues]);

    // Memoize the reset function - chỉ thay đổi khi form thay đổi
    const resetForm = useCallback((values: TRoleSchema) => {
        form.reset(values);
        currentValuesRef.current = values;
    }, [form]);

    // Update form when roleData changes - với log tốt hơn
    useEffect(() => {
        // Log the received roleData for debugging
        console.log("RoleForm received roleData:", roleData?.id);

        if (roleData) {
            console.log("RoleForm resetForm with roleData:", roleData.id);
            resetForm({
                id: roleData.id,
                code: roleData.code,
                name: roleData.name,
                description: roleData.description || "",
                level: roleData.level || 0,
                isSystem: roleData.isSystem || false,
            });
        }
        else if (dialog.data) {
            resetForm({
                id: dialog.data.id,
                code: dialog.data.code,
                name: dialog.data.name,
                description: dialog.data.description || "",
                level: dialog.data.level || 0,
                isSystem: dialog.data.isSystem || false,
            })
        }
        else {
            console.log("RoleForm resetForm to defaults (no roleData)");
            resetForm(defaultRoleValues);
        }
    }, [roleData, resetForm]);

    // Reset data when dialog closes
    useEffect(() => {
        if (!dialog.open && setRoleData) {
            setRoleData();
        }
    }, [dialog.open, setRoleData]);

    // Tối ưu form submission handler with useCallback
    const handleSubmit = useCallback(async (values: TRoleSchema) => {
        if (isReadOnly || isSubmitting) return;

        try {
            setIsSubmitting(true);

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

    // Tối ưu cancel handler with useCallback
    const handleCancelClick = useCallback(() => {
        if (setRoleData) {
            setRoleData();
        }
        form.reset(defaultRoleValues);
        hideDialog();
    }, [form, hideDialog, setRoleData]);


    console.log("Rendering RoleForm with roleData------------------------------------:", dialog.data);

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FieldInput
                        control={form.control}
                        name="code"
                        label="Mã vai trò"
                        placeholder="Nhập mã vai trò"
                        disabled={isSubmitting || isReadOnly}
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

                    <FieldInput
                        control={form.control}
                        name="level"
                        label="Cấp độ"
                        placeholder="Nhập cấp độ"
                        disabled={isSubmitting || isReadOnly}
                    />

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
                    isEdit={!!roleData}
                    onCancel={handleCancelClick}
                />
            </form>
        </Form>
    );
});


export default memo(RoleForm, (prevProps, nextProps) => {
    // Better comparison logic
    if (prevProps.roleData?.id !== nextProps.roleData?.id) {
        return false; // Different ID means always re-render
    }

    // Only if IDs match, check other properties
    if (prevProps.roleData && nextProps.roleData) {
        return (
            prevProps.roleData.code === nextProps.roleData.code &&
            prevProps.roleData.name === nextProps.roleData.name &&
            prevProps.isReadOnly === nextProps.isReadOnly
        );
    }

    // If one has data and the other doesn't, always re-render
    return prevProps.roleData === nextProps.roleData;
});