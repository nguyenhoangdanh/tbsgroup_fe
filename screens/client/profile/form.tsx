'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import React from 'react';
import { FormProvider, SubmitHandler, useForm } from 'react-hook-form';

import { resetPasswordMutationFn } from '@/apis/user/user.api';
import { FieldInput } from '@/components/common/Form/FieldInput';
import { toast } from 'react-toast-kit';
import { defaultUserValues, TUserSchema, userSchema } from '@/schemas/user';
import { useAuthManager } from '@/hooks/auth/useAuthManager';

const UserProfileForm = () => {
  const { user } = useAuthManager();
  const router = useRouter();
  const methods = useForm<TUserSchema>({
    defaultValues: defaultUserValues,
    resolver: zodResolver(userSchema),
  });
  const { mutate } = useMutation({
    mutationFn: resetPasswordMutationFn,
  });

  const onSubmit: SubmitHandler<TUserSchema> = async data => {
    mutate(data, {
      onSuccess: () => {
        toast({
          title: 'Thành công',
          description: 'Đăng nhập thành công',
        });
        router.push('/home');
      },
      onError: error => {
        toast({
          title: 'Lỗi',
          description: error.message || 'Có lỗi xảy ra',
          variant: 'error',
        });
      },
    });
  };

  React.useEffect(() => {
    if (!user) return;
    if (user) {
      methods.setValue('username', user.username);
      methods.setValue('employeeId', user.employeeId);
      methods.setValue('roleId', user.roleId);
      methods.setValue('fullName', user.fullName);
      methods.setValue('cardId', user.cardId);
    }
  }, [user, methods]);

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
            label="Họ và tên"
            name="fullName"
            placeholder="Nhập họ và tên"
          />
          <FieldInput control={methods.control} label="CCCD/CMND" name="cardId" />
          <FieldInput
            control={methods.control}
            label="Vai trò"
            name="roleId"
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
