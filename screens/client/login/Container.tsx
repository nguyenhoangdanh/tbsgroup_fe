import React, { Suspense } from 'react';


import AuthImage from '@/components/common/layouts/auth/AuthImage';
import AuthLayout from '@/components/common/layouts/auth/AuthLayout';
import LazyLoader from '@/components/common/loading/LazyLoader';

import LoginForm from './form';

export const LoginContainer = () => {
  return (
    <AuthLayout title="Đăng nhập" isLogin imageChildren={<AuthImage />}>
      <Suspense fallback={<LazyLoader />}>
        <LoginForm />
      </Suspense>
    </AuthLayout>
  );
};
