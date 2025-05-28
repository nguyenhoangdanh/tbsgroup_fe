// form.tsx - Updated version with correct type handling

'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { CircleCheckBig } from 'lucide-react';
import React from 'react';
import { FormProvider, SubmitHandler, useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';

import { UserStatusEnum } from '@/common/enum';
import { FieldInput } from '@/components/common/Form/FieldInput';
import { toast } from 'react-toast-kit';
import SubmitButton from '@/components/SubmitButton';
import { defaultResetPasswordValues, resetPasswordSchema, ResetPasswordType } from '@/schemas/auth';
import { useAuthManager } from '@/hooks/auth/useAuthManager';

const ResetPasswordForm = () => {
  const router = useRouter();
  const {
    user,
    isLoading,
    login,
    resetPasswordData,
    requestPasswordReset,
    resetPassword,
    isAuthenticated,
    clearResetPasswordData,
    error
  } = useAuthManager();

  const [verified, setVerified] = React.useState<boolean>(false);
  const [userName, setUserName] = React.useState<string>('');

  const methods = useForm<ResetPasswordType>({
    defaultValues: defaultResetPasswordValues,
    resolver: zodResolver(resetPasswordSchema),
    mode: 'onChange',
  });

  const onSubmit: SubmitHandler<ResetPasswordType> = async (data) => {
    // Step 1: Request password reset with employee ID and card ID
    if (data.employeeId && data.cardId && !verified) {
      try {
        await requestPasswordReset({
          employeeId: data.employeeId,
          cardId: data.cardId,
        });
        // The result will be handled in useEffect
      } catch (error: any) {
        toast({
          title: 'Lỗi',
          description: error.message || 'Không thể yêu cầu đặt lại mật khẩu',
          variant: 'error',
        });
      }
    }
    // Step 2: Reset password with new password
    else if (verified && data.password && data.confirmPassword) {
      try {
        // Build reset params based on available data
        const resetParams = resetPasswordData?.data?.resetToken
          ? {
            resetToken: resetPasswordData.data.resetToken,
            password: data.password,
            confirmPassword: data.confirmPassword,
          }
          : {
            username: resetPasswordData?.data?.username || userName,
            password: data.password,
            confirmPassword: data.confirmPassword,
          };
        
        await resetPassword(resetParams);

        toast({
          title: 'Thành công',
          description: 'Đổi mật khẩu thành công',
        });

        // Auto login after successful password reset
        setTimeout(async () => {
          try {
            if (!isAuthenticated && data.password) {
              await login({
                username: resetPasswordData?.data?.username || userName,
                password: data.password,
              });
              router.push('/');
            } else {
              router.push('/home');
            }
          } catch (loginError) {
            console.error('Auto login failed:', loginError);
            router.push('/login');
          }
        }, 1000);

      } catch (resetError: any) {
        toast({
          title: 'Lỗi',
          description: resetError.message || 'Không thể đổi mật khẩu',
          variant: 'error',
        });
      }
    }
  };
  // Handle password reset request response
  React.useEffect(() => {
    if (resetPasswordData?.success && resetPasswordData.data) {
      setVerified(true);
      setUserName(resetPasswordData.data.username);

      // Clear form fields for password entry
      methods.setValue('employeeId', '');
      methods.setValue('cardId', '');

      toast({
        title: 'Thành công',
        description: resetPasswordData.data.message || 'Vui lòng nhập mật khẩu mới',
      });
    } else if (resetPasswordData && !resetPasswordData.success) {
      // Extract error message from ApiResponse structure
      const errorMessage = extractErrorMessage(resetPasswordData.error) || 'Không thể xác thực thông tin';
      toast({
        title: 'Lỗi',
        description: errorMessage,
        variant: 'error',
      });
    }
  }, [resetPasswordData, methods]);

  // Handle user with pending activation
  React.useEffect(() => {
    if (user?.status === UserStatusEnum.PENDING_ACTIVATION && isAuthenticated) {
      setVerified(true);
      setUserName(user.username || '');
      methods.setValue('password', '');
      methods.setValue('confirmPassword', '');
    }
  }, [user, isAuthenticated, methods]);

  // Handle errors
  React.useEffect(() => {
    if (error) {
      toast({
        title: 'Lỗi',
        description: error,
        variant: 'error',
      });
    }
  }, [error]);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      clearResetPasswordData();
    };
  }, [clearResetPasswordData]);

  // Helper function to extract error message
  const extractErrorMessage = (error: string | { error: string; message: string; statusCode: number } | undefined): string | null => {
    if (!error) return null;

    if (typeof error === 'string') {
      return error;
    }

    if (typeof error === 'object' && 'message' in error) {
      return error.message;
    }

    return 'An unknown error occurred';
  };

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

          {verified ? (
            <div className="flex flex-col gap-5">
              <FieldInput
                control={methods.control}
                name="password"
                label="Mật khẩu mới"
                type="password"
                placeholder="Nhập mật khẩu mới..."
              />
              <FieldInput
                control={methods.control}
                name="confirmPassword"
                label="Xác nhận mật khẩu"
                type="password"
                placeholder="Nhập lại mật khẩu mới..."
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
            name={verified ? "Đổi mật khẩu" : "Xác thực"}
            isLoading={isLoading}
            disabled={
              isLoading ||
              (!verified
                ? !methods.watch('employeeId') || !methods.watch('cardId')
                : !methods.watch('password') || !methods.watch('confirmPassword'))
            }
          />
        </div>
      </form>
    </FormProvider>
  );
};

export default ResetPasswordForm;