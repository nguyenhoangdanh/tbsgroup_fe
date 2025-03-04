// Form.tsx
'use client';
import React from "react";
import { FormProvider, SubmitHandler, useForm } from "react-hook-form";
import { zodResolver } from '@hookform/resolvers/zod';
import { FieldInput } from "@/components/common/Form/FieldInput";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { resetPasswordMutationFn } from "@/apis/user/user.api";
import { toast } from "@/hooks/use-toast";
import SubmitButton from "@/components/SubmitButton";
import { defaultUserValues, TUserSchema, userSchema } from "@/schemas/user";
import useAuth from "@/hooks/useAuth";

const UserProfileForm = () => {
    const { user } = useAuth();
    const router = useRouter();
    const [isLoading, setIsLoading] = React.useState<boolean>(false);
    const methods = useForm<TUserSchema>({
        defaultValues: defaultUserValues,
        resolver: zodResolver(userSchema),
    });
    const { mutate } = useMutation({
        mutationFn: resetPasswordMutationFn,
    });

    const onSubmit: SubmitHandler<TUserSchema> = async (data) => {
        setIsLoading(true);
        // mutate(data, {
        //     onSuccess: (data) => {
        //         toast({
        //             title: 'Thành công',
        //             description: 'Đăng nhập thành công',
        //         });
        //         router.push('/home');
        //     },
        //     onError: (error) => {
        //         toast({
        //             title: 'Lỗi',
        //             description: error.message || 'Có lỗi xảy ra',
        //             variant: 'destructive',
        //         });
        //     },
        //     onSettled: () => {
        //         setIsLoading(false);
        //     },
        // });
    };

    React.useEffect(() => {
        if (!user) return;
        if (user) {
            methods.setValue('username', user.username);
            methods.setValue('employeeId', user.employeeId);
            methods.setValue('position', user.position);
            methods.setValue('department', user.department);
            methods.setValue('role', user.role);
        }
    }, [user, methods]);

    console.log('user', user);

    return (
        <FormProvider {...methods}>
            <form onSubmit={methods.handleSubmit(onSubmit)}>
                <div className="flex flex-col gap-4 px-8">
                    <FieldInput
                        control={methods.control}
                        label="Tên đăng nhập"
                        name="username"
                        placeholder="Nhập tên đăng nhập"
                    />
                    <FieldInput
                        control={methods.control}
                        label="Mã nhân viên"
                        name="employeeId"
                        placeholder="Nhập mã nhân viên"
                    />
                    <FieldInput
                        control={methods.control}
                        label="Chức vụ"
                        name="position"
                        placeholder="Nhập chức vụ"
                    />
                    <FieldInput
                        control={methods.control}
                        label="Phòng ban"
                        name="department"
                        placeholder="Nhập phòng ban"
                    />
                    <FieldInput
                        control={methods.control}
                        label="Vai trò"
                        name="role"
                        placeholder="Nhập vai trò"
                    />
                    {/* <SubmitButton
                        isLoading={isLoading}
                        name="Xác nhận"
                    /> */}
                </div>
            </form>
        </FormProvider>
    );
};

export default UserProfileForm;