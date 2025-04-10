import React, { Suspense } from 'react'
import AuthLayout from '@/components/common/layouts/auth/AuthLayout'
import AuthImage from '@/components/common/layouts/auth/AuthImage'
import LoginForm from './form'
import LazyLoader from '@/components/common/loading/LazyLoader'

export const LoginContainer = () => {
  return (
    <AuthLayout
      title="Đăng nhập"
      isLogin
      imageChildren={<AuthImage />}
    >
      <Suspense fallback={<LazyLoader />}>
        <LoginForm />
      </Suspense>
    </AuthLayout>
  )
}
