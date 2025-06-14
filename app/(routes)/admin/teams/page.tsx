'use client';

import React from 'react';

import PermissionGuard from '@/hooks/permission/PermissionGuard';
import { TeamProvider } from '@/hooks/teams';
import TeamContainer from '@/screens/admin/team/Container';

export default function TeamsPage() {
  return (
    // <PermissionGuard pageCode="TEAMS_PAGE">
      <TeamProvider
        config={{
          enableAutoRefresh: true,
          prefetchRelatedData: true,
          cacheStrategy: 'conservative',
        }}
      >
        <TeamContainer />
      </TeamProvider>
    // </PermissionGuard>
  );
}
