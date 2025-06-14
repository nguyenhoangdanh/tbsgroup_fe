'use client';

import React from 'react';

import { DepartmentProvider } from '@/hooks/department/DepartmentContext';
import { FactoryProvider } from '@/hooks/factory/FactoryContext';
import PermissionGuard from '@/hooks/permission/PermissionGuard';
import FactoryContainer from '@/screens/admin/factory/Container';

export default function FactoryPage() {
  return (
    // <PermissionGuard pageCode="FACTORIES_PAGE">
      <DepartmentProvider
        config={{
          enableAutoRefresh: true,
          prefetchRelatedData: true,
          cacheStrategy: 'conservative',
        }}
      >
        <FactoryProvider
          config={{
            enableAutoRefresh: true,
            prefetchRelatedData: true,
            cacheStrategy: 'conservative',
          }}
        >
          <FactoryContainer />
        </FactoryProvider>
      </DepartmentProvider>
    // </PermissionGuard>
  );
}
