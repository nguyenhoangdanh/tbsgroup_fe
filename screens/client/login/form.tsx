'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { useEffect } from 'react';
import { FormProvider, SubmitHandler, useForm } from 'react-hook-form';

import { FieldCheckbox } from '@/components/common/Form/FieldCheckbox';
import { FieldInput } from '@/components/common/Form/FieldInput';
import SubmitButton from '@/components/SubmitButton';
import useAuthManager from '@/hooks/useAuthManager';
import { defaultLoginValues, loginSchema, TLoginSchema } from '@/schemas/auth';

const LoginForm = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { loginWithCredentials, isLoading, isAuthenticated } = useAuthManager();
  const methods = useForm<TLoginSchema>({
    defaultValues: defaultLoginValues,
    resolver: zodResolver(loginSchema),
  });
  const callbackUrl = searchParams.get('callbackUrl') || '/';
  const onSubmit: SubmitHandler<TLoginSchema> = async data => {
    // await login(data);
    loginWithCredentials(data);
    localStorage.setItem('lastLoginTime', new Date().toISOString());
  };

  // Effect to handle authentication status changes
  useEffect(() => {
    if (isAuthenticated) {
      router.push(callbackUrl);
    }
  }, [isAuthenticated, router, callbackUrl, isLoading]);
  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)}>
        <div className="flex flex-col gap-5 px-8">
          <FieldInput
            control={methods.control}
            name="username"
            label="Mã số nhân viên"
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
            label="Ghi nhớ"
            className="border-none"
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
            <a
              href="/reset-password"
              className="text-blue-500
                    hover:underline"
            >
              Quên mật khẩu?
            </a>
          </div>
        )}
      </form>
    </FormProvider>
  );
};

export default LoginForm;
