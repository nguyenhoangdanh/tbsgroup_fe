
'use client';
import React from "react";
import { FormProvider, SubmitHandler, useForm } from "react-hook-form";
import { zodResolver } from '@hookform/resolvers/zod';
import { defaultResetPasswordValues, resetPasswordSchema, ResetPasswordType } from "@/schemas/auth";
import { FieldInput } from "@/components/common/Form/FieldInput";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { loginMutationFn, LoginType, logoutMutationFn, requestResetPasswordMutationFn, resetPasswordMutationFn, updateStatusMutationFn, VerifyDataType, verifyMutationFn } from "@/apis/user/user.api";
import { toast } from "@/hooks/use-toast";
import SubmitButton from "@/components/SubmitButton";
import useAuth from "@/hooks/useAuth";
import LazyLoader from "@/components/common/LazyLoader";
import { ArrowLeft, ChevronLeft, CircleCheckBig } from "lucide-react";
import { UserStatusEnum } from "@/common/enum";
import useAuthManager from "@/hooks/useAuthManager";

const ResetPasswordForm = () => {
    const router = useRouter();
    const {
        user,
        isLoading,
        login,
        requestPasswordReset,
        resetPassword,
        needsPasswordReset,
        isAuthenticated,
    } = useAuthManager();
    // const [isLoading, setIsLoading] = React.useState<boolean>(false);
    const [verified, setVerified] = React.useState<boolean>(false);
    const [resetToken, setResetToken] = React.useState<string | null>(null);
    const [userName, setUserName] = React.useState<string>("");

    const methods = useForm<ResetPasswordType>({
        defaultValues: defaultResetPasswordValues,
        resolver: zodResolver(resetPasswordSchema),
        mode: "onChange",
    });

    const onSubmit: SubmitHandler<ResetPasswordType> = async (data) => {

        if (data.employeeId && data.cardId && !verified) {
            try {
                const result = await requestPasswordReset({
                    employeeId: data.employeeId,
                    cardId: data.cardId,
                });

                // Xử lý kết quả từ API theo cấu trúc đã cung cấp
                if (result && result.success) {
                    setResetToken(result.data.resetToken);
                    setVerified(true);
                    setUserName(result.data.username);

                    // Clear the form fields for password entry
                    methods.setValue('employeeId', '');
                    methods.setValue('cardId', '');

                    toast({
                        title: 'Thành công',
                        description: result.data.message || 'Vui lòng nhập mật khẩu mới',
                    });
                }
            } catch (error: any) {
                toast({
                    title: 'Lỗi',
                    description: error.message || 'Không thể yêu cầu đặt lại mật khẩu',
                    variant: 'destructive',
                });
                console.error('Lỗi yêu cầu đặt lại mật khẩu:', error);
            }
        }
        else if (verified && data.password && data.confirmPassword) {
            try {
                const resetParams = resetToken
                    ? {
                        resetToken,
                        password: data.password,
                        confirmPassword: data.confirmPassword,
                    }
                    : {
                        username: userName,
                        password: data.password,
                        confirmPassword: data.confirmPassword,
                    };

                await resetPassword(resetParams);

                toast({
                    title: 'Thành công',
                    description: 'Đổi mật khẩu thành công',
                });

                setTimeout(async () => {
                    if (!isAuthenticated) {
                        await login({
                            username: userName,
                            password: data.password || '',
                        }, {
                            message: 'Đổi mật khẩu thành công',
                        });
                    } else {
                        window.location.href = '/home';
                    }
                }, 500);


            } catch (resetError: any) {
                toast({
                    title: 'Lỗi',
                    description: resetError.message || 'Không thể đổi mật khẩu',
                    variant: 'destructive',
                });
                console.error('Lỗi đổi mật khẩu:', resetError);
            }
        }
    };


    React.useEffect(() => {
        if (user?.status === UserStatusEnum.PENDING_ACTIVATION || (
            isAuthenticated && user
        )) {
            methods.setValue('password', '');
            methods.setValue('confirmPassword', '');
            setVerified(true);
            setUserName(user.username);
        }
    }, [user]);

    return (
        <FormProvider {...methods}>
            <form onSubmit={methods.handleSubmit(onSubmit)}>
                <div className="flex flex-col gap-10 px-8">
                    {!verified ? (
                        <p className="text-md text-center">
                            Vui lòng xác thực thông tin của bạn để đổi mật khẩu
                        </p>
                    ) : (
                        <p className="text-md text-center flex items-center justify-center gap-1">
                            <CircleCheckBig size={20} color="green" />
                            <span className="ml-2">
                                Đã xác thực tài khoản {userName && `(${userName})`}
                            </span>
                        </p>
                    )}
                    {user?.status === UserStatusEnum.PENDING_ACTIVATION || verified ? (
                        <div className="flex flex-col gap-5">
                            <FieldInput
                                control={methods.control}
                                name="password"
                                label="Mật khẩu"
                                type="password"
                            />
                            <FieldInput
                                control={methods.control}
                                name="confirmPassword"
                                label="Xác nhận mật khẩu"
                                type="password"
                            />
                        </div>
                    ) : (
                        <div className="flex flex-col gap-5">
                            <FieldInput
                                control={methods.control}
                                name="employeeId"
                                label="Mã nhân viên"
                                placeholder="Vui lòng nhập mã số nhân viên của bạn..."
                            />
                            <FieldInput
                                control={methods.control}
                                name="cardId"
                                label="CCCD"
                                placeholder="Vui lòng nhập số CCCD của bạn..."
                            />
                        </div>
                    )}
                    <SubmitButton
                        name="Xác nhận"
                        isLoading={isLoading}
                        disabled={isLoading || (!verified
                            ? !methods.watch('employeeId') || !methods.watch('cardId')
                            : !methods.watch('password') || !methods.watch('confirmPassword')
                        )}
                    />
                </div>
            </form>
        </FormProvider >
    );
};

export default ResetPasswordForm;