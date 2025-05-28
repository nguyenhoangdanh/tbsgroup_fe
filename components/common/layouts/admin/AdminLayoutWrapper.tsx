'use client';

import React from 'react';

import AdminLayout from '@/components/common/layouts/admin/AdminLayout';
import { SidebarProvider } from '@/components/ui/sidebar';

const AdminLayoutWrapper = React.memo(({ children }: { children: React.ReactNode }) => {
  return (
    <SidebarProvider>
      <AdminLayout>{children}</AdminLayout>
    </SidebarProvider>
  );
});

AdminLayoutWrapper.displayName = 'AdminLayoutWrapper';

export default AdminLayoutWrapper;
