"use client";

import React, { useState, useCallback, memo, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form";
import { TUserSchema, userSchema, defaultUserValues } from "@/schemas/user";
import { useDialog } from "@/contexts/DialogProvider";
import { FieldInput } from "@/components/common/Form/FieldInput";
import FormActions from "@/components/common/Form/FormAction";
import { FieldSelect } from "@/components/common/Form/FieldSelect";

interface UserFormProps {
    onSubmit?: (data: TUserSchema) => Promise<void | boolean>;
    refetchData?: () => void;
    isReadOnly?: boolean;
    roles: { value: string; label: string }[];
}

const UserForm: React.FC<UserFormProps> = memo(({
    onSubmit,
    refetchData,
    isReadOnly = false,
    roles,
}) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { hideDialog, dialog } = useDialog();

    // Determine if the form is in edit mode (dialog.data exists)
    const isEditMode = !!dialog.data?.id;

    // Check if readonly is set by dialog or props
    const effectiveReadOnly = isReadOnly || dialog.type === 'view';


    const userTypeSchema = dialog.data?.id ? userSchema.omit({ password: true }) : userSchema;

    // Initialize form with values from dialog if available, otherwise defaults
    const form = useForm<TUserSchema>({
        resolver: zodResolver(userTypeSchema),
        defaultValues: dialog.data ? {
            id: dialog.data.id,
            username: dialog.data.username,
            fullName: dialog.data.fullName || "",
            employeeId: dialog.data.employeeId || "",
            cardId: dialog.data.cardId || "",
            roleId: dialog.data.roleId || "",
            status: dialog.data.status || "PENDING_ACTIVATION",
        } : defaultUserValues,
    });


    const employeeId = form.watch("employeeId");

    useEffect(() => {
        // Chỉ cập nhật username nếu không trong chế độ chỉnh sửa và employeeId không rỗng
        if ((!isEditMode || !isReadOnly) && employeeId) {
            form.setValue("username", employeeId);
        }
    }, [employeeId, form, isEditMode, isReadOnly]);

    // Form submission handler with useCallback
    const handleSubmit = useCallback(async (values: TUserSchema) => {
        if (effectiveReadOnly || isSubmitting) return;

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
            console.error("Lỗi khi lưu dữ liệu người dùng:", error);
        } finally {
            setIsSubmitting(false);
        }
    }, [effectiveReadOnly, isSubmitting, onSubmit, hideDialog, refetchData]);

    // Status options for user
    const statusOptions = [
        { value: "ACTIVE", label: "Hoạt động" },
        { value: "INACTIVE", label: "Không hoạt động" },
        { value: "PENDING_ACTIVATION", label: "Chờ duyệt" }
    ];

    console.log("UserForm rendered with values:", form.getValues())

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="hidden">
                        <FieldInput
                            control={form.control}
                            name="username"
                            label="Tên đăng nhập"
                            placeholder="Nhập tên đăng nhập"
                            disabled={isSubmitting || effectiveReadOnly || isEditMode}
                            required
                        />
                    </div>

                    <FieldInput
                        control={form.control}
                        name="fullName"
                        label="Họ và tên"
                        placeholder="Nhập họ và tên"
                        disabled={isSubmitting || effectiveReadOnly}
                        required
                    />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FieldInput
                        control={form.control}
                        name="employeeId"
                        label="Mã nhân viên"
                        placeholder="Nhập mã nhân viên"
                        disabled={isSubmitting || effectiveReadOnly}
                    />

                    <FieldInput
                        control={form.control}
                        name="cardId"
                        label="Số CCCD"
                        placeholder="Nhập số CCCD"
                        disabled={isSubmitting || effectiveReadOnly}
                    />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FieldSelect
                        control={form.control}
                        name="roleId"
                        label="Vai trò"
                        options={roles}
                        disabled={isSubmitting || effectiveReadOnly}
                        required
                    />

                    <FieldSelect
                        control={form.control}
                        name="status"
                        label="Trạng thái"
                        options={statusOptions}
                        disabled={isSubmitting || effectiveReadOnly}
                        required
                    />
                </div>

                {/* {!isEditMode && (
                    <FieldInput
                        control={form.control}
                        name="password"
                        label="Mật khẩu"
                        type="password"
                        placeholder="Nhập mật khẩu"
                        disabled={isSubmitting || effectiveReadOnly}
                        required
                    />
                )} */}

                <FormActions
                    isSubmitting={isSubmitting}
                    isReadOnly={effectiveReadOnly}
                    isEdit={isEditMode}
                />
            </form>
        </Form>
    );
});

// Add displayName for debugging
UserForm.displayName = "UserForm";

export default UserForm;