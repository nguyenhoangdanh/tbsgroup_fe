'use client';

import React from 'react';

import { LineProvider } from '@/hooks/line/LineContext';
import PermissionGuard from '@/hooks/permission/PermissionGuard';
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