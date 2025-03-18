"use client";
import { defaultLoginValues, loginSchema, TLoginSchema } from "@/schemas/auth";
import { FieldInput } from "@/components/common/Form/FieldInput";
import SubmitButton from "@/components/SubmitButton";
import { zodResolver } from "@hookform/resolvers/zod";
import React from "react";
import { FormProvider, SubmitHandler, useForm } from "react-hook-form";
import useAuthManager from "@/hooks/useAuthManager";
import { FieldCheckbox } from "@/components/common/Form/FieldCheckbox";

const LoginForm = () => {
    const { login, isLoading } = useAuthManager();
    const methods = useForm<TLoginSchema>({
        defaultValues: defaultLoginValues,
        resolver: zodResolver(loginSchema),
    });

    const onSubmit: SubmitHandler<TLoginSchema> = async (data) => {
        await login(data);
    };
    return (
        <FormProvider {...methods}>
            <form onSubmit={methods.handleSubmit(onSubmit)}>
                <div className="flex flex-col gap-5 px-8">
                    <FieldInput
                        control={methods.control}
                        name="username"
                        label="MSNV"
                        disabled={isLoading}
                        placeholder="Vui lòng nhập mã số nhân viên của bạn..."
                    />
                    <FieldInput
                        control={methods.control}
                        name="password"
                        label="Mật khẩu"
                        type="password"
                        disabled={isLoading}
                        placeholder="Vui lòng nhập mật khẩu..."
                    />
                    <FieldCheckbox
                        control={methods.control}
                        name="rememberMe"
                        label="Ghi nho"
                    />
                    <SubmitButton
                        disabled={isLoading}
                        isLoading={isLoading}
                        name="Đăng nhập"
                        className="border-none"
                    />
                </div>
                {!isLoading && (
                    <div className="flex justify-center mt-4">
                        <a href="/reset-password" className="text-blue-500
                    hover:underline">
                            Quên mật khẩu?
                        </a>
                    </div>
                )}
            </form>
        </FormProvider>
    );
};

export default LoginForm;

