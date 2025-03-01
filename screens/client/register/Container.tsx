import AuthLayout from '@/components/layout/auth/AuthLayout'
import React from 'react'
import RegisterForm from './form'
import AuthImage from '@/components/layout/auth/AuthImage'

export const RegisterContainer = () => {
  return (
    <AuthLayout
      imageChildren={<AuthImage />}
      title="Register"
    >
      <RegisterForm />
    </AuthLayout>
  )
}
