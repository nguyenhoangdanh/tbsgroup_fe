// Form.tsx
'use client';
import React from "react";
import { FormProvider, SubmitHandler, useForm } from "react-hook-form";
import { zodResolver } from '@hookform/resolvers/zod';
import { defaultResetPasswordValues, resetPasswordSchema, ResetPasswordType } from "@/schemas/auth";
import { FieldInput } from "@/components/common/Form/FieldInput";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { logoutMutationFn, resetPasswordMutationFn, updateStatusMutationFn, VerifyDataType, verifyMutationFn } from "@/apis/user/user.api";
import { toast } from "@/hooks/use-toast";
import SubmitButton from "@/components/SubmitButton";
import useAuth from "@/hooks/useAuth";
import LazyLoader from "@/components/common/LazyLoader";
import { CircleCheckBig } from "lucide-react";
import { set } from "date-fns";
const ResetPasswordForm = () => {
    const router = useRouter();
    const { user, isLoading: loading } = useAuth();
    const [isLoading, setIsLoading] = React.useState<boolean>(false);
    const [verified, setVerified] = React.useState<boolean>(false);
    const methods = useForm<ResetPasswordType>({
        defaultValues: defaultResetPasswordValues,
        resolver: zodResolver(resetPasswordSchema),
        mode: "onChange",
    });
    // const { mutate } = useMutation({
    //     mutationFn: resetPasswordMutationFn,
    // });

    // const { mutate: mutateVerify } = useMutation({
    //     mutationFn: verifyMutationFn,
    // })

    // const { mutate: mutateUpdateStatus } = useMutation({
    //     mutationFn: updateStatusMutationFn,
    // })

    // const { mutate: mutateLogout } = useMutation({
    //     mutationFn: logoutMutationFn,
    // });

    // const checkVerified = async (data: VerifyDataType) => {
    //     setIsLoading(true);
    //     mutateVerify(data, {
    //         onSuccess: (data) => {
    //             toast({
    //                 title: 'Thành công',
    //                 description: 'Xác thực thành công',
    //             });
    //             setVerified(true);
    //             methods.reset();
    //             methods.setValue('password', '');
    //             methods.setValue('confirmPassword', '');
    //         },
    //         onError: (error) => {
    //             toast({
    //                 title: 'Lỗi',
    //                 description: error.message || 'Có lỗi xảy ra',
    //                 variant: 'destructive',
    //             });
    //         },
    //         onSettled: () => {
    //             setIsLoading(false);
    //         },
    //     });

    // };

    // Xác thực thông tin
    const verifyMutation = useMutation({
        mutationFn: verifyMutationFn,
        onSuccess: () => {
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
        }
    })

    // Đổi mật khẩu
    const resetPasswordMutation = useMutation({
        mutationFn: resetPasswordMutationFn,
        onSuccess: () => {
            toast({
                title: 'Thành công',
                description: 'Đổi mật khẩu thành công',
            });

            if (user?.status === 'first_login') {
                updateStatusMutation.mutate({ status: 'active' });
            } else {
                logoutMutation.mutate();
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
        }
    });

    // Cập nhật trạng thái người dùng sau khi đổi mật khẩu
    const updateStatusMutation = useMutation({
        mutationFn: updateStatusMutationFn,
        onSuccess: () => {
            logoutMutation.mutate();
        },
        onError: (error) => {
            toast({
                title: 'Lỗi',
                description: error.message || 'Có lỗi xảy ra',
                variant: 'destructive',
            });
        },
    });

    // Đăng xuất sau khi đổi mật khẩu
    const logoutMutation = useMutation({
        mutationFn: logoutMutationFn,
        onSuccess: () => {
            router.push('/login');
        },
        onError: (error) => {
            toast({
                title: 'Lỗi',
                description: error.message || 'Có lỗi xảy ra',
                variant: 'destructive',
            });
        },
    });;

    const checkVerified = (data: VerifyDataType) => {
        verifyMutation.mutate(data);
    };

    const onSubmit: SubmitHandler<ResetPasswordType> = async (data) => {
        if (data.employeeId && data.cardId && user?.status !== 'first_login' && !verified) {
            setIsLoading(true);
            checkVerified({ employeeId: data.employeeId, cardId: data.cardId });
            return;
        }

        setIsLoading(true);

        resetPasswordMutation.mutate({
            password: data.password,
            username: user?.username,
        });
    };

    React.useEffect(() => {
        if (user?.status === 'first_login') {
            methods.setValue('password', '');
            methods.setValue('confirmPassword', '');
            setVerified(true);
        }
    }, [user?.status]);


    // const onSubmit: SubmitHandler<ResetPasswordType> = async (data) => {
    //     setIsLoading(true);
    //     console.log('data', data);
    //     if (data.employeeId && data.cardId && user?.status !== 'first_login' && !verified) {
    //         checkVerified({
    //             employeeId: data.employeeId,
    //             cardId: data.cardId,
    //         });
    //         return; // Dừng lại cho đến khi xác thực xong
    //     }
    //     data = {
    //         password: data.password,
    //         username: user?.username,
    //     }

    //     mutate(data, {
    //         onSuccess: (data) => {
    //             toast({
    //                 title: 'Thành công',
    //                 description: 'Đổi mật khẩu thành công',
    //             });
    //             if (user?.status === 'first_login') {
    //                 mutateUpdateStatus({
    //                     status: 'active',
    //                 },
    //                     {
    //                         onSuccess: (data) => {
    //                             // toast({
    //                             //     title: 'Thành công',
    //                             //     description: 'Cập nhật trạng thái thành công',
    //                             // });
    //                         },
    //                         onError: (error) => {
    //                             toast({
    //                                 title: 'Lỗi',
    //                                 description: error.message || 'Có lỗi xảy ra',
    //                                 variant: 'destructive',
    //                             });
    //                         },
    //                         onSettled: () => {
    //                             setIsLoading(false);
    //                         },
    //                     });
    //             }
    //             mutateLogout(undefined, {
    //                 onSuccess: (data) => {
    //                     // toast({
    //                     //     title: 'Thành công',
    //                     //     description: 'Đăng xuất thành công',
    //                     // });
    //                     router.push('/login');
    //                 },
    //                 onError: (error) => {
    //                     toast({
    //                         title: 'Lỗi',
    //                         description: error.message || 'Có lỗi xảy ra',
    //                         variant: 'destructive',
    //                     });
    //                 },
    //                 onSettled: () => {
    //                     setIsLoading(false);
    //                 },
    //             });
    //         },
    //         onError: (error) => {
    //             toast({
    //                 title: 'Lỗi',
    //                 description: error.message || 'Có lỗi xảy ra',
    //                 variant: 'destructive',
    //             });
    //         },
    //         onSettled: () => {
    //             setIsLoading(false);
    //         },
    //     });
    // };

    return (
        <FormProvider {...methods}>
            <form onSubmit={methods.handleSubmit(onSubmit)}>
                {loading ? (
                    <LazyLoader />
                ) : (
                    <div className="flex flex-col gap-10 px-8">
                        {!verified ? (
                            <p className="text-md text-center">
                                Vui lòng xác thực thông tin của bạn để đổi mật khẩu
                            </p>
                        ) : (
                            <p className="text-md text-center flex items-center justify-center gap-1">
                                <CircleCheckBig size={20} color="green" />
                                <span className="ml-2">
                                    Đã xác thực
                                </span>
                            </p>
                        )}
                        {user?.status === 'first_login' || verified ? (
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
                                />
                                <FieldInput
                                    control={methods.control}
                                    name="cardId"
                                    label="CCCD"
                                />
                            </div>
                        )}
                        <SubmitButton
                            isLoading={isLoading}
                            disabled={isLoading || !methods.formState.isValid}
                            name="Xác nhận"
                        />
                    </div>
                )}
            </form>
        </FormProvider >
    );
};

export default ResetPasswordForm;