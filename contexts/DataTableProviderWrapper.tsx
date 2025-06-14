'use client';

import React from 'react';
import { DataTableProvider, FormHandlingProvider } from 'react-table-power';
import { useTheme } from 'next-themes';

const DataTableProviderWrapper = ({ children }: { children: React.ReactNode }) => {
  // Get the current theme from next-themes to pass to the DataTableProvider
  const { theme } = useTheme();

  console.log('Current theme:', theme);

  return (
    <DataTableProvider
      config={{
        // Cấu hình mặc định cho tất cả DataTable
        theme: {
          theme: theme,
          variant: 'default',
          colorScheme: 'neutral',
          borderRadius: 'md',
        },
        size: 'medium',
        striped: true,
        hover: true,
        // Cấu hình dialog mặc định - điều quan trọng nhất
        dialog: {
          closeOnClickOutside: false,
          closeOnEsc: true,
          width: '650px',
        },
        // CRITICAL FIX: Use skeleton variant consistently
        loading: {
          variant: 'skeleton',
          // skeletonRows: 5,
          // skeletonColumns: 5,
        }
      }}
    >
      <FormHandlingProvider>{children}</FormHandlingProvider>
    </DataTableProvider>
  );
};

export default DataTableProviderWrapper;
