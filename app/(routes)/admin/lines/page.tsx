'use client';

import React from 'react';

import PermissionGuard from '@/hooks/permission/PermissionGuard';
import { LineProvider } from '@/hooks/line/LineContext';
import LineContainer from '@/screens/admin/line/Container';

export default function LinePage() {
  return (
    //<PermissionGuard pageCode="LINES_PAGE">
      <LineProvider
        config={{
          enableAutoRefresh: true,
          prefetchRelatedData: true,
          cacheStrategy: 'conservative',
        }}
      >
        <LineContainer />
      </LineProvider>
   // </PermissionGuard>
  );
}