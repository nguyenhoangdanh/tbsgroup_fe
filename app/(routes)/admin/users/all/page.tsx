import AccessDeniedMessage from '@/components/common/notifications/AccessDeniedMessage'
import PermissionGuard from '@/hooks/permission/PermissionGuard'
import { RoleProvider } from '@/hooks/roles/roleContext'
import { UserProvider } from '@/hooks/users'
import UserContainer from '@/screens/admin/user/Container'
import React from 'react'

export default function UserPage() {
    return (
        <PermissionGuard
            pageCode="PAGE"
            useDefaultAccessDenied={true}
        >
            <UserProvider>
                <RoleProvider>
                    <UserContainer />
                </RoleProvider>
            </UserProvider>
        </PermissionGuard>
    )
}
