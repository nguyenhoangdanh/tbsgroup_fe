"use client";
import { loginMutationFn } from "@/apis/user/user.api";
import { defaultLoginValues, loginSchema, TLoginSchema } from "@/schemas/auth";
import { FieldInput } from "@/components/common/Form/FieldInput";
import SubmitButton from "@/components/SubmitButton";
import { toast } from "@/hooks/use-toast";
import { useDispatchType } from "@/lib/dispatch.utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import React from "react";
import { FormProvider, SubmitHandler, useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { UserStatusEnum } from "@/common/enum"
import Cookies from 'js-cookie';
import useAuthManager from "@/hooks/useAuthManager";
import { logoutMutationFn } from '../../../apis/user/user.api';

const LoginForm = () => {
    const router = useRouter();
    const { login, isLoading } = useAuthManager();
    // const [isLoading, setIsLoading] = React.useState<boolean>(false);
    const methods = useForm<TLoginSchema>({
        defaultValues: defaultLoginValues,
        resolver: zodResolver(loginSchema),
    });

    const { mutate } = useMutation({
        mutationFn: loginMutationFn,
    });

    const onSubmit: SubmitHandler<TLoginSchema> = async (data) => {
        // setIsLoading(true);
        await login(data);
        // mutate(data, {
        //     onSuccess: (data) => {
        //         // Kiểm tra trạng thái người dùng
        //         if (data.data.requiredResetPassword) {
        //             toast({
        //                 title: 'Cần đổi mật khẩu',
        //                 description: 'Bạn cần đổi mật khẩu trước khi tiếp tục',
        //             });
        //             router.push('/reset-password');
        //         } else {
        //             toast({
        //                 title: 'Thành công',
        //                 description: 'Đăng nhập thành công',
        //             });
        //             router.push('/home');
        //         }
        //     },
        //     onError: (error) => {
        //         console.log('error', error);
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
    return (
        <FormProvider {...methods}>
            <form onSubmit={methods.handleSubmit(onSubmit)}>
                <div className="flex flex-col gap-5 px-8">
                    <FieldInput
                        control={methods.control}
                        name="username"
                        label="Tên đăng nhập"
                        disabled={isLoading}
                    />
                    <FieldInput
                        control={methods.control}
                        name="password"
                        label="Mật khẩu"
                        type="password"
                        disabled={isLoading}
                    />
                    <SubmitButton
                        disabled={isLoading}
                        isLoading={isLoading}
                        name="Đăng nhập"
                    />
                </div>
                <div className="flex justify-center mt-4">
                    <a href="/reset-password" className="text-blue-500
                    hover:underline">
                        Quên mật khẩu?
                    </a>
                </div>
            </form>
        </FormProvider>
    );
};

export default LoginForm;

