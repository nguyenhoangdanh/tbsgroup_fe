import React from 'react'
import AuthLayout from '@/components/common/layouts/auth/AuthLayout'
import AuthImage from '@/components/common/layouts/auth/AuthImage'
import LoginForm from './form'

export const LoginContainer = () => {
  return (
    <AuthLayout
      title="Login"
      isLogin
      imageChildren={<AuthImage />}
    >
      <LoginForm />
    </AuthLayout>
  )
}
