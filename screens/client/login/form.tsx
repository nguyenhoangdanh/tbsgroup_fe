'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { useEffect } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';
import { toast } from 'react-toast-kit';
import SubmitButton from '@/components/SubmitButton';
import { defaultLoginValues, loginSchema, TLoginSchema } from '@/schemas/auth';
import { useAuthManager } from '@/hooks/auth/useAuthManager';
import FieldInput from '@/components/common/fields/FieldInput';
import { FieldCheckbox, FormController } from '@/components/common/fields';

const LoginForm = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isLoading, isAuthenticated } = useAuthManager();
  const methods = useForm<TLoginSchema>({
    defaultValues: defaultLoginValues,
    resolver: zodResolver(loginSchema),
  });
  const callbackUrl = searchParams.get('callbackUrl') || '/';

  const onSubmit: SubmitHandler<TLoginSchema> = async (data) => {
    // Remove the duplicate localStorage call - saga handles this
    login(data);
  };

  // Handle successful authentication
  useEffect(() => {
    if (isAuthenticated) {
      
      router.push(callbackUrl);
    }
  }, [isAuthenticated, router, callbackUrl]);

  return (
    <FormController form={methods} onSubmit={onSubmit}>
        <div className="flex flex-col gap-4 px-8">
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
          noBorder
          className='p-0'
          />
          <SubmitButton
            disabled={isLoading}
            isLoading={isLoading}
            name="Đăng nhập"
            className="border-none"
          />
        </div>
        {!isLoading && (
          <div className="flex justify-center">
            <a
              href="/reset-password"
            className="text-blue-500 hover:underline"
            >
              Quên mật khẩu?
            </a>
          </div>
        )}
    </FormController>
  );
};

export default LoginForm;