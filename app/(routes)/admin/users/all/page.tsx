'use client';

import React from 'react';

import PermissionGuard from '@/hooks/permission/PermissionGuard';
import { RoleProvider } from '@/hooks/roles/roleContext';
import { UserProvider } from '@/hooks/users';
import UserContainer from '@/screens/admin/user/Container';

export default function UserPage() {
  return (
    <PermissionGuard pageCode="PAGE">
      <UserProvider>
        <RoleProvider>
          <UserContainer />
        </RoleProvider>
      </UserProvider>
    </PermissionGuard>
  );
}
