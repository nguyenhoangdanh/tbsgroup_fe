import { Suspense, memo, useMemo } from 'react';

import ResetPasswordForm from './form';

import AuthImage from '@/components/common/layouts/auth/AuthImage';
import AuthLayout from '@/components/common/layouts/auth/AuthLayout';
import LazyLoader from '@/components/common/loading/LazyLoader';

// Memoize the container component to prevent unnecessary re-renders
export const ResetPasswordContainer = memo(() => {
  console.log('ResetPasswordContainer rendered');
  
  // Memoize both the auth image and form components to prevent re-renders
  const memoizedAuthImage = useMemo(() => <AuthImage isGoBack={true} />, []);
  const memoizedForm = useMemo(() => (
    <Suspense fallback={<LazyLoader />}>
      <ResetPasswordForm />
    </Suspense>
  ), []);

  return (
    <AuthLayout 
      title="Thay đổi mật khẩu" 
      imageChildren={memoizedAuthImage}
    >
      {memoizedForm}
    </AuthLayout>
  );
});

ResetPasswordContainer.displayName = 'ResetPasswordContainer';
