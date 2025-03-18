"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form";
import { useDialog } from "@/context/DialogProvider";
import { FieldInput } from "@/components/common/Form/FieldInput";
import FormActions from "@/components/common/Form/FormAction";
import { defaultUserValues, TUserSchema, userSchema } from "@/schemas/user";
import { SelectField } from "@/components/common/Form/SelectField";
import { Checkbox } from "@/components/ui/checkbox";
import { FieldCheckbox } from "@/components/common/Form/FieldCheckbox";

interface UserFormProps {
    userData?: TUserSchema | null;
    onSubmit?: (data: TUserSchema) => Promise<void | boolean>;
    refetchData?: () => void;
    isReadOnly?: boolean;
    roles: { value: string; label: string }[];
}

const UserForm: React.FC<UserFormProps> = ({
    userData,
    onSubmit,
    refetchData,
    isReadOnly = false,
    roles,
}) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { hideDialog } = useDialog();

    // Initialize form with zod validation
    const form = useForm<TUserSchema>({
        resolver: zodResolver(userSchema),
        defaultValues: userData ? {
            id: userData.id,
            username: userData.username,
            employeeId: userData.employeeId,
            role: userData.role,
            password: userData.password,
            status: userData.status,
            fullName: userData.fullName,
            cardId: userData.cardId,
        } : defaultUserValues,
    });



    // Form submission handler
    const handleSubmit = async (values: TUserSchema) => {
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

    // // Gọi API lấy danh sách roles với TanStack Query
    // const rolesQuery = listRoles({
    //     page: 1,
    //     limit: 100,
    // });

    // // Chuyển đổi dữ liệu roles thành options cho SelectField
    // const roleOptions = React.useMemo(() => {
    //     if (!rolesQuery.data?.data) return [];

    //     return rolesQuery.data.data.map(role => ({
    //         value: role.id,
    //         label: role.name
    //     }));
    // }, [rolesQuery.data]);

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FieldInput
                        control={form.control}
                        name="username"
                        label="Tên đăng nhập"
                        placeholder="Nhập tên đăng nhập"
                        disabled={isSubmitting || isReadOnly}
                        required
                    />

                    <FieldInput
                        control={form.control}
                        name="fullName"
                        label="Họ và tên"
                        placeholder="Nhập họ và tên"
                        disabled={isSubmitting || isReadOnly}
                        required
                    />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                    <FieldInput
                        control={form.control}
                        name="cardId"
                        label="Số CCCD"
                        placeholder="Nhập số CCCD"
                        disabled={isSubmitting || isReadOnly}
                    />

                    <FieldInput
                        control={form.control}
                        name="employeeId"
                        label="Mã nhân viên"
                        placeholder="Nhập mã nhân viên"
                        disabled={isSubmitting || isReadOnly}
                    />
                    <SelectField
                        control={form.control}
                        name="role"
                        label="Vai trò"
                        options={roles}
                        disabled={isSubmitting || isReadOnly}
                        required
                    />
                </div>

                <FormActions
                    isSubmitting={isSubmitting}
                    isReadOnly={isReadOnly}
                    isEdit={!!userData}
                />
            </form>
        </Form>
    );
};

export default UserForm;

