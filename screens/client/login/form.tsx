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
import Cookies from 'js-cookie';
import { useRouter } from "next/navigation";

const LoginForm = () => {
    const router = useRouter();
    const [isLoading, setIsLoading] = React.useState<boolean>(false);
    const methods = useForm<TLoginSchema>({
        defaultValues: defaultLoginValues,
        resolver: zodResolver(loginSchema),
    });

    const { mutate } = useMutation({
        mutationFn: loginMutationFn,
    });

    const onSubmit: SubmitHandler<TLoginSchema> = async (data) => {
        setIsLoading(true);
        mutate(data, {
            onSuccess: (data) => {
                Cookies.set('accessToken', data.data);
                toast({
                    title: 'Thành công',
                    description: 'Đăng nhập thành công',
                });
                router.push('/home');
            },
            onError: (error) => {
                console.log('error', error);
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
                <div className="flex flex-col gap-4 px-8">
                    <FieldInput
                        control={methods.control}
                        name="username"
                        label="Tên đăng nhập"
                    />
                    <FieldInput
                        control={methods.control}
                        name="password"
                        label="Mật khẩu"
                        type="password"
                    />
                    <SubmitButton
                        isLoading={isLoading}
                        name="Đăng nhập"
                    />
                </div>
            </form>
        </FormProvider>
    );
};

export default LoginForm;

