'use client';

import React from 'react';

import PermissionGuard from '@/hooks/permission/PermissionGuard';
import { GroupProvider } from '@/hooks/group/GroupContext';
import GroupContainer from '@/screens/admin/group/Container';

export default function GroupPage() {
  return (
    // <PermissionGuard pageCode="GROUPS_PAGE">
      <GroupProvider
        config={{
          enableAutoRefresh: true,
          prefetchRelatedData: true,
          cacheStrategy: 'conservative',
        }}
      >
        <GroupContainer />
      </GroupProvider>
    // </PermissionGuard>
  );
}
