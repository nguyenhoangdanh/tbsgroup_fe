import AuthLayout from '@/components/layout/auth/AuthLayout'
import React from 'react'
import AuthImage from '@/components/layout/auth/AuthImage'
import ForgotPassword from './ForgotPassword'

export const ForgotPasswordContainer = () => {
    return (
        <AuthLayout
            title="Forgot Password"
            imageChildren={<AuthImage />}
        >
            <ForgotPassword />
        </AuthLayout>
    )
}

