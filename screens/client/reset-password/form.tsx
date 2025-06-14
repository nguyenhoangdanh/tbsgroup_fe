'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { CircleCheckBig } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';

import { UserStatusEnum } from '@/common/enum';
import { FormController } from '@/components/common/fields';
import { FieldInput } from '@/components/common/fields/FieldInput';
import SubmitButton from '@/components/SubmitButton';
import { useAuthManager } from '@/hooks/auth/useAuthManager';
import { defaultResetPasswordValues, resetPasswordSchema, ResetPasswordType } from '@/schemas/auth';
import stableToast from '@/utils/stableToast';


const ResetPasswordForm = React.memo(() => {

  const isFirstRender = useRef(true);

  const router = useRouter();
  const {
    user,
    isLoading,
    login,
    resetPasswordData,
    requestPasswordReset: originalRequestPasswordReset,
    resetPassword: originalResetPassword,
    isAuthenticated,
    clearResetPasswordData,
    error
  } = useAuthManager();

  console.log('ResetPasswordForm props:', resetPasswordData)

  // Component state
  const [verified, setVerified] = useState<boolean>(false);
  const [userName, setUserName] = useState<string>('');

  // Track form field values directly in state to ensure reactive updates
  const [formFieldsComplete, setFormFieldsComplete] = useState({
    employeeId: false,
    cardId: false,
    password: false,
    confirmPassword: false
  });

  // Process tracking
  const processedData = useRef({
    resetPasswordData: null as string | null,
    error: null as string | null,
    userActivation: false,
  });

  // Form initialization
  const methods = useForm<ResetPasswordType>({
    defaultValues: defaultResetPasswordValues,
    resolver: zodResolver(resetPasswordSchema),
    mode: 'onChange',
  });

  // Update form field completion status whenever values change
  useEffect(() => {
    const subscription = methods.watch((formValues) => {
      setFormFieldsComplete({
        employeeId: Boolean(formValues.employeeId),
        cardId: Boolean(formValues.cardId),
        password: Boolean(formValues.password),
        confirmPassword: Boolean(formValues.confirmPassword)
      });

      console.log("Form values updated:", {
        employeeId: Boolean(formValues.employeeId),
        cardId: Boolean(formValues.cardId),
        password: Boolean(formValues.password),
        confirmPassword: Boolean(formValues.confirmPassword)
      });
    });

    return () => subscription.unsubscribe();
  }, [methods]);

  // Stabilized functions
  const requestPasswordReset = useCallback(async (data: { employeeId: string, cardId: string }) => {
      await originalRequestPasswordReset(data);
  }, [originalRequestPasswordReset]);

  const resetPassword = useCallback(async (params: any) => {
      await originalResetPassword(params);
  }, [originalResetPassword]);

  const handleLogin = useCallback(async (credentials: { username: string, password: string }) => {
      await login(credentials);
  }, [login]);

  // Form submission handler with stable dependencies
  const onSubmit: SubmitHandler<ResetPasswordType> = useCallback(async (data) => {
    // Step 1: Request password reset with employee ID and card ID
    if (data.employeeId && data.cardId && !verified) {
      try {
        // Reset toast tracking before new request
        processedData.current.resetPasswordData = null;
        await requestPasswordReset({
          employeeId: data.employeeId,
          cardId: data.cardId,
        });
      } catch (error: any) {
        stableToast.error(error.message || 'Không thể yêu cầu đặt lại mật khẩu');
      }
    }
    // Step 2: Reset password with new password
    else if (verified && data.password && data.confirmPassword) {
      try {
        const resetParams = resetPasswordData?.resetToken && !isAuthenticated
          ? {
            resetToken: resetPasswordData.resetToken,
            password: data.password,
            confirmPassword: data.confirmPassword,
          }
          : {
            username: resetPasswordData?.username || userName,
            password: data.password,
            confirmPassword: data.confirmPassword,
          };

        await resetPassword(resetParams);

        stableToast.success('Đổi mật khẩu thành công');

        // Auto login after successful password reset
        setTimeout(async () => {
          try {
            if (!isAuthenticated && data.password) {
              await handleLogin({
                username: resetPasswordData?.username || userName,
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
        stableToast.error(resetError.message || 'Không thể đổi mật khẩu');
      }
    }
  }, [
    verified,
    userName,
    resetPasswordData,
    isAuthenticated,
    requestPasswordReset,
    resetPassword,
    handleLogin,
    router
  ]);

  // Handle password reset request response
  useEffect(() => {
    // Skip the effect on the first render
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (!resetPasswordData) return;

    // Serialize to ensure object comparison - use a more reliable key
    const dataId =
      resetPasswordData?.username ||
      resetPasswordData?.resetToken ||
      Date.now().toString();
    const dataString = `${dataId}-${JSON.stringify(resetPasswordData)}`;

    // Only process if we haven't processed this data before
    if (processedData.current.resetPasswordData !== dataString) {
      processedData.current.resetPasswordData = dataString;

      if (resetPasswordData && resetPasswordData.username) {
        setVerified(true);
        setUserName(resetPasswordData.username);

        // Clear form fields for password entry
        methods.setValue('employeeId', '');
        methods.setValue('cardId', '');

        stableToast.success(
          resetPasswordData.message || 'Vui lòng nhập mật khẩu mới',
        );
      } else if (!resetPasswordData?.username) {
        const errorMessage = resetPasswordData?.message || 'Không thể xác thực thông tin';
        stableToast.error(
          errorMessage,
        );
      }
    }
  }, [resetPasswordData]);

  // Handle user with pending activation
  useEffect(() => {
    // Skip on first render 
    if (isFirstRender.current) {
      return;
    }

    const userHasPendingActivation =
      user?.status === UserStatusEnum.PENDING_ACTIVATION &&
      isAuthenticated &&
      !processedData.current.userActivation;

    if (userHasPendingActivation) {
      processedData.current.userActivation = true;
      setVerified(true);
      setUserName(user.username || '');
      methods.setValue('password', '');
      methods.setValue('confirmPassword', '');
    }
  }, [user?.status, isAuthenticated, methods]);

  // Handle errors
  useEffect(() => {
    // Skip on first render
    if (isFirstRender.current) {
      return;
    }

    if (!error || processedData.current.error === error) return;

    processedData.current.error = error;

    stableToast.error(error);
  }, [error]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearResetPasswordData();
      processedData.current = {
        resetPasswordData: null,
        error: null,
        userActivation: false,
      };
    };
  }, []);

  // Memoize form parts
  const verificationForm = useMemo(() => (
    <div className="flex flex-col gap-4">
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
  ), [methods.control]);

  const passwordForm = useMemo(() => (
    <div className="flex flex-col gap-4">
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
  ), [methods.control]);

  // Calculate button disabled state based on direct state tracking
  const isButtonDisabled = useMemo(() => {
    const formComplete = verified
      ? formFieldsComplete.password && formFieldsComplete.confirmPassword
      : formFieldsComplete.employeeId && formFieldsComplete.cardId;

    console.log("Button state calculation:", {
      isLoading,
      verified,
      formComplete,
      formFieldsComplete,
      result: isLoading || !formComplete
    });

    return isLoading || !formComplete;
  }, [isLoading, verified, formFieldsComplete]);

  // Memoize form content
  const formContent = useMemo(() => {
    console.log("Rendering form content with disabled:", isButtonDisabled);

    return (
      <div className="flex flex-col gap-4 px-8">
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

        {verified ? passwordForm : verificationForm}

        <SubmitButton
          name={verified ? "Đổi mật khẩu" : "Xác thực"}
          isLoading={isLoading}
          disabled={isButtonDisabled}
        />
      </div>
    );
  }, [verified, userName, passwordForm, verificationForm, isLoading, isButtonDisabled]);

  return (
    <FormController form={methods} onSubmit={onSubmit}>
      {formContent}
    </FormController>
  );
});

ResetPasswordForm.displayName = 'ResetPasswordForm';

export default ResetPasswordForm;