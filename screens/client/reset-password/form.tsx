// Form.tsx
'use client';
import React from "react";
import { FormProvider, SubmitHandler, useForm } from "react-hook-form";
import { zodResolver } from '@hookform/resolvers/zod';
import { defaultResetPasswordValues, resetPasswordSchema, ResetPasswordType } from "@/schemas/auth";
import { FieldInput } from "@/components/common/Form/FieldInput";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { resetPasswordMutationFn, updateStatusMutationFn, VerifyDataType, verifyMutationFn } from "@/apis/user/user.api";
import { toast } from "@/hooks/use-toast";
import SubmitButton from "@/components/SubmitButton";
import useAuth from "@/hooks/useAuth";
import LazyLoader from "@/components/common/LazyLoader";
const ResetPasswordForm = () => {
    const router = useRouter();
    const { user, isLoading: loading } = useAuth();
    const [isLoading, setIsLoading] = React.useState<boolean>(false);
    const [verified, setVerified] = React.useState<boolean>(false);
    const methods = useForm<ResetPasswordType>({
        defaultValues: defaultResetPasswordValues,
        resolver: zodResolver(resetPasswordSchema),
    });
    const { mutate } = useMutation({
        mutationFn: resetPasswordMutationFn,
    });

    const { mutate: mutateVerify } = useMutation({
        mutationFn: verifyMutationFn,
    })

    const { mutate: mutateUpdateStatus } = useMutation({
        mutationFn: updateStatusMutationFn,
    });

    const checkVerified = async (data: VerifyDataType) => {
        setIsLoading(true);
        mutateVerify(data, {
            onSuccess: (data) => {
                toast({
                    title: 'Thành công',
                    description: 'Xác thực thành công',
                });
                setVerified(true);
                methods.reset();
            },
            onError: (error) => {
                toast({
                    title: 'Lỗi',
                    description: error.message || 'Có lỗi xảy ra',
                    variant: 'destructive',
                });
            },
            onSettled: () => {
                setIsLoading(false);
            },
        });

    };


    const onSubmit: SubmitHandler<ResetPasswordType> = async (data) => {
        setIsLoading(true);
        if (data.employeeId && data.cardId && user?.status !== 'first_login' && !verified) {
            checkVerified({
                employeeId: data.employeeId,
                cardId: data.cardId,
            });
            return; // Dừng lại cho đến khi xác thực xong
        }
        data = {
            password: data.password,
            username: user?.username,
        }

        mutate(data, {
            onSuccess: (data) => {
                toast({
                    title: 'Thành công',
                    description: 'Đổi mật khẩu thành công',
                });
                if (user?.status === 'first_login') {
                    mutateUpdateStatus({
                        status: 'active',
                    },
                        {
                            onSuccess: (data) => {
                                toast({
                                    title: 'Thành công',
                                    description: 'Cập nhật trạng thái thành công',
                                });
                                router.push('/home');
                            },
                            onError: (error) => {
                                toast({
                                    title: 'Lỗi',
                                    description: error.message || 'Có lỗi xảy ra',
                                    variant: 'destructive',
                                });
                            },
                            onSettled: () => {
                                setIsLoading(false);
                            },
                        });
                }
            },
            onError: (error) => {
                toast({
                    title: 'Lỗi',
                    description: error.message || 'Có lỗi xảy ra',
                    variant: 'destructive',
                });
            },
            onSettled: () => {
                setIsLoading(false);
            },
        });
    };

    return (
        <FormProvider {...methods}>
            <form onSubmit={methods.handleSubmit(onSubmit)}>
                {loading ? (
                    <LazyLoader />
                ) : (
                    <div className="flex flex-col gap-4 px-8">
                        {user?.status === 'first_login' || verified ? (
                            <>
                                <FieldInput
                                    control={methods.control}
                                    name="password"
                                    label="Mật khẩu"
                                />
                                <FieldInput
                                    control={methods.control}
                                    name="confirmPassword"
                                    label="Xác nhận mật khẩu"
                                />
                            </>
                        ) : (
                            <>
                                <FieldInput
                                    control={methods.control}
                                    name="employeeId"
                                    label="Mã nhân viên"
                                />
                                <FieldInput
                                    control={methods.control}
                                    name="cardId"
                                    label="Mã thẻ"
                                />
                            </>
                        )}
                        <SubmitButton
                            isLoading={isLoading}
                            name="Xác nhận"
                        />
                    </div>
                )}
            </form>
        </FormProvider >
    );
};

export default ResetPasswordForm;