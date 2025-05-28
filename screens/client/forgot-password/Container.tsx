import React from 'react';

import ForgotPassword from './ForgotPassword';

import AuthImage from '@/components/common/layouts/auth/AuthImage';
import AuthLayout from '@/components/common/layouts/auth/AuthLayout';

export const ForgotPasswordContainer = () => {
  return (
    <AuthLayout title="Quên mật khẩu" imageChildren={<AuthImage />}>
      <ForgotPassword />
    </AuthLayout>
  );
};
