import { Suspense } from 'react';

import ResetPasswordForm from './form';

import AuthImage from '@/components/common/layouts/auth/AuthImage';
import AuthLayout from '@/components/common/layouts/auth/AuthLayout';
import LazyLoader from '@/components/common/loading/LazyLoader';

export const ResetPasswordContainer = () => {
  return (
    <AuthLayout title="Thay đổi mật khẩu" imageChildren={<AuthImage isGoBack={true} />}>
      <Suspense fallback={<LazyLoader />}>
        <ResetPasswordForm />
      </Suspense>
    </AuthLayout>
  );
};
