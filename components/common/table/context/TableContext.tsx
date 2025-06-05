'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { BaseTableData, UseTableReturn } from '../types/enhanced-types';

// Define the context type
export interface TableContextType<T extends BaseTableData = BaseTableData> {
  tableState: UseTableReturn<T> | null;
}

// Create the context with a default value
const TableContext = createContext<TableContextType>({
  tableState: null,
});

// Provider props interface
interface TableProviderProps<T extends BaseTableData = BaseTableData> {
  children: ReactNode;
  value: UseTableReturn<T>;
}

// Provider component
export function TableProvider<T extends BaseTableData>({
  children,
  value,
}: TableProviderProps<T>) {
  return (
    <TableContext.Provider value={{ tableState: value }}>
      {children}
    </TableContext.Provider>
  );
}

// Hook to use the table context
export function useTableContext<T extends BaseTableData>() {
  const context = useContext(TableContext);
  
  if (!context.tableState) {
    throw new Error('useTableContext must be used within a TableProvider');
  }
  
  return context.tableState as UseTableReturn<T>;
}