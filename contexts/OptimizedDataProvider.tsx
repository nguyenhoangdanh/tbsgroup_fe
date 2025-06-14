'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { memo, useMemo } from 'react';
import { DataTableProvider, DataTableProviderConfig } from 'react-table-power';

// Tạo QueryClient với cấu hình tối ưu
const createQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

interface OptimizedDataProviderProps {
  children: React.ReactNode;
}

// Single provider thay vì multiple nested providers
const OptimizedDataProvider = memo(({ children }: OptimizedDataProviderProps) => {
  const queryClient = useMemo(() => createQueryClient(), []);

    const dataTableConfig: DataTableProviderConfig = useMemo(() => ({
    theme: {
      theme: 'system',
      variant: 'default',
      colorScheme: 'neutral',
      borderRadius: 'md',
    },
    size: 'medium',
    striped: true,
    hover: true,
    dialog: {
      closeOnClickOutside: false,
      closeOnEsc: true,
      width: '650px',
    },
    loading: {
      variant: 'skeleton'
    }
  }), []);

  return (
    <QueryClientProvider client={queryClient}>
      <DataTableProvider config={dataTableConfig}>
        {children}
      </DataTableProvider>
    </QueryClientProvider>
  );
});

OptimizedDataProvider.displayName = 'OptimizedDataProvider';

export default OptimizedDataProvider;
