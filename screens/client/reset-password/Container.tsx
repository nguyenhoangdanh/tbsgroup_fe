import AuthLayout from '@/components/common/layouts/auth/AuthLayout'
import ResetPasswordForm from './form'
import AuthImage from '@/components/common/layouts/auth/AuthImage'

export const ResetPasswordContainer = () => {
    return (
        <AuthLayout
            title="Thay đổi mật khẩu"
            imageChildren={<AuthImage />}
        >
            <ResetPasswordForm />
        </AuthLayout>
    )
}


