import { RoleProvider } from '@/hooks/roles/roleContext'
import { UserProvider } from '@/hooks/users'
import UserContainer from '@/screens/admin/user/Container'
import React from 'react'

export default function UserPage() {
    return (
        <UserProvider>
            <RoleProvider>
                <UserContainer />
            </RoleProvider>
        </UserProvider>
    )
}
