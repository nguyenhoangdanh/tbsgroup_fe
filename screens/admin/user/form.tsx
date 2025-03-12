"use client";

import React, { useEffect, useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "@/hooks/use-toast";
import { useDialog } from "@/context/DialogProvider"; // Import useDialog
import { User } from "@/apis/user/user.api";
import { defaultUserValues, TUserSchema, userSchema } from "@/schemas/user";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { RoleType } from "@/apis/roles/role.api";

interface UserFormProps {
    userData?: User;
    refetchData?: () => void;
    onClose?: () => void;
    isSubmitting?: boolean;
    isReadOnly?: boolean;
    onSubmit?: (data: TUserSchema) => Promise<void | boolean>;
    roles: RoleType[];
}

const UserForm = ({
    userData,
    refetchData,
    onClose,
    isSubmitting: externalIsSubmitting,
    isReadOnly = false,
    onSubmit: externalOnSubmit,
    roles,
}: UserFormProps) => {
    const [isLocalSubmitting, setIsLocalSubmitting] = useState(false);


    // Get hideDialog from context
    const { hideDialog } = useDialog();

    // Use either external or local submitting state
    const isSubmitting = externalIsSubmitting !== undefined ? externalIsSubmitting : isLocalSubmitting;

    const form = useForm<TUserSchema>({
        defaultValues: defaultUserValues,
        resolver: zodResolver(userSchema),
    });

    useEffect(() => {
        if (userData) {
            form.reset({
                id: userData.id,
                username: userData.username || "",
                fullName: userData.fullName || "",
                employeeId: userData.employeeId || "",
                cardId: userData.cardId || "",
                role: userData.role || "",
                status: userData.status || "",
            });
        } else {
            form.reset(defaultUserValues);
        }
    }, [userData, form]);

    const handleSubmit = async (values: TUserSchema) => {
        if (isReadOnly) return;

        try {
            setIsLocalSubmitting(true);

            // Kết hợp dữ liệu form với ID hiện tại (nếu có)
            const submitData: TUserSchema = {
                ...values,
                id: userData?.id || "", // Đảm bảo có ID nếu đang chỉnh sửa
            };

            if (externalOnSubmit) {
                // Gọi hàm onSubmit từ props
                const result = await externalOnSubmit(submitData);

                // Nếu có kết quả trả về là true, đóng dialog
                if (result === true) {
                    hideDialog();
                }
            } else {
                // Không có xử lý submit bên ngoài
                toast({
                    title: "Không có xử lý cho dữ liệu form",
                    variant: "destructive",
                });
            }

            // Nếu có hàm refetch, gọi để làm mới dữ liệu
            if (refetchData) {
                refetchData();
            }

        } catch (error) {
            console.error("Lỗi khi lưu dữ liệu người dùng:", error);
            toast({
                title: "Lỗi khi lưu dữ liệu người dùng",
                description: "Vui lòng thử lại sau",
                variant: "destructive",
            });
        } finally {
            setIsLocalSubmitting(false);
        }
    };

    // Handle cancel button click
    const handleCancel = () => {
        console.log("Cancel button clicked");

        // Call onClose if provided
        if (onClose) {
            onClose();
        }

        // Always hide dialog when cancel is clicked
        hideDialog();
    };

    return (
        <FormProvider {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                                <Input
                                    placeholder="Nhập username"
                                    {...field}
                                    disabled={isSubmitting || isReadOnly}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Họ và tên</FormLabel>
                            <FormControl>
                                <Input
                                    placeholder="Nhập họ và tên"
                                    {...field}
                                    disabled={isSubmitting || isReadOnly}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="employeeId"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Mã nhân viên</FormLabel>
                            <FormControl>
                                <Input
                                    placeholder="Nhập mã nhân viên"
                                    {...field}
                                    disabled={isSubmitting || isReadOnly}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="cardId"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Số CCCD/CMND</FormLabel>
                            <FormControl>
                                <Input
                                    placeholder="Nhập số CCCD/CMND"
                                    {...field}
                                    disabled={isSubmitting || isReadOnly}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Vai trò</FormLabel>
                            {/* <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                value={field.value}
                                disabled={isSubmitting || isReadOnly}
                            >
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Chọn vai trò" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="ADMIN">Admin</SelectItem>
                                    <SelectItem value="USER">User</SelectItem>
                                    <SelectItem value="EDITOR">Editor</SelectItem>
                                </SelectContent>
                            </Select> */}
                            <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                value={field.value}
                                disabled={isSubmitting || isReadOnly}
                            >
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Chọn vai trò" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {roles?.map((role) => (
                                        <SelectItem key={role.id} value={role.id}>
                                            {role.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Trạng thái</FormLabel>
                            <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                value={field.value}
                                disabled={isSubmitting || isReadOnly}
                            >
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Chọn trạng thái" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="ACTIVE">Hoạt động</SelectItem>
                                    <SelectItem value="INACTIVE">Không hoạt động</SelectItem>
                                    <SelectItem value="PENDING">Chờ duyệt</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="flex justify-end gap-2 pt-2">
                    {!isReadOnly ? (
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="bg-green-800 hover:bg-green-700"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Đang xử lý...
                                </>
                            ) : userData ? (
                                "Cập nhật"
                            ) : (
                                "Tạo mới"
                            )}
                        </Button>
                    ) : null}

                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleCancel}
                        disabled={isSubmitting}
                    >
                        {isReadOnly ? "Đóng" : "Hủy"}
                    </Button>
                </div>
            </form>
        </FormProvider>
    );
};

export default UserForm;