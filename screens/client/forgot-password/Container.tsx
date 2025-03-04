import React from 'react'
import ForgotPassword from './ForgotPassword'
import AuthLayout from '@/components/common/layouts/auth/AuthLayout'
import AuthImage from '@/components/common/layouts/auth/AuthImage'

export const ForgotPasswordContainer = () => {
    return (
        <AuthLayout
            title="Quên mật khẩu"
            imageChildren={<AuthImage />}
        >
            <ForgotPassword />
        </AuthLayout>
    )
}

