import { DepartmentDetails } from '@/screens/admin/department/DepartmentDetails';
import { DepartmentProvider } from '@/hooks/department/DepartmentContext';
import React from 'react';

interface DepartmentDetailPageProps {
  params: {
    departmentId: string;
  };
}

export default function DepartmentDetailPage({ params }: DepartmentDetailPageProps) {
  return (
    <DepartmentProvider
      config={{
        enableAutoRefresh: true,
        prefetchRelatedData: false, // Không cần prefetch khi xem chi tiết
        cacheStrategy: 'conservative',
      }}
    >
      <DepartmentDetails departmentId={params.departmentId} />
    </DepartmentProvider>
  );
}
