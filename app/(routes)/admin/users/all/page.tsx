'use client';

import React from 'react';

import PermissionGuard from '@/hooks/permission/PermissionGuard';
import { RoleProvider } from '@/hooks/roles/roleContext';
import { UserProvider } from '@/hooks/users/UserContext';
import UserContainer from '@/screens/admin/user/Container';

export default function UserPage() {
  return (
    <PermissionGuard pageCode="USERS_PAGE">
      <RoleProvider>
        <UserProvider
          config={{
            enableAutoRefresh: true,
            prefetchRelatedData: true,
            cacheStrategy: 'aggressive',
          }}
        >
          <UserContainer />
        </UserProvider>
      </RoleProvider>
    </PermissionGuard>
  );
}
