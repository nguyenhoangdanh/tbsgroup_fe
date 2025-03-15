import AuthLayout from '@/components/common/layouts/auth/AuthLayout'
import ResetPasswordForm from './form'
import AuthImage from '@/components/common/layouts/auth/AuthImage'
import { Suspense } from 'react'
import LazyLoader from '@/components/common/LazyLoader'

export const ResetPasswordContainer = () => {
    return (
        <AuthLayout
            title="Thay đổi mật khẩu"
            imageChildren={<AuthImage isGoBack={true} />}
        >
            <Suspense fallback={<LazyLoader />}>
                <ResetPasswordForm />
            </Suspense>
        </AuthLayout>
    )
}


