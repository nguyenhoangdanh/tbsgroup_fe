"use client";

import React, { useEffect, useState } from "react";
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
    onSubmit?: (data: TRoleSchema) => Promise<void | boolean>;
    refetchData?: () => void;
    isReadOnly?: boolean;
}

const RoleForm: React.FC<RoleFormProps> = ({
    roleData,
    onSubmit,
    refetchData,
    isReadOnly = false,
}) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { hideDialog } = useDialog();

    // Initialize form with zod validation
    const form = useForm<TRoleSchema>({
        resolver: zodResolver(roleSchema),
        defaultValues: roleData ? {
            id: roleData.id,
            code: roleData.code,
            name: roleData.name,
            description: roleData.description || "",
            level: roleData.level || 0,
            isSystem: roleData.isSystem || false,
            createdAt: roleData.createdAt,
            updatedAt: roleData.updatedAt,
        } : defaultRoleValues,
    });

    // Update form when roleData changes
    useEffect(() => {
        if (roleData) {
            form.reset({
                id: roleData.id,
                code: roleData.code,
                name: roleData.name,
                description: roleData.description || "",
                level: roleData.level || 0,
                isSystem: roleData.isSystem || false,
                createdAt: roleData.createdAt,
                updatedAt: roleData.updatedAt,
            });
        } else {
            form.reset(defaultRoleValues);
        }
    }, [roleData, form]);

    // Form submission handler
    const handleSubmit = async (values: TRoleSchema) => {
        if (isReadOnly) return;

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
    };

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
                />
            </form>
        </Form>
    );
};

export default RoleForm;