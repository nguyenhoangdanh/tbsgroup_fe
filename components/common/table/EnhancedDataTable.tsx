'use client';

import React, { memo, useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { flexRender } from '@tanstack/react-table';
import {
  ChevronDown,
  ChevronRight,
  AlertCircle,
  RefreshCw,
  Loader2,
  Database,
  Search,
  X,
} from 'lucide-react';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { useTheme } from 'next-themes';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { cn } from '@/lib/utils';
import { DialogType, useDialog } from '@/contexts/DialogProvider';

import { TableToolbar } from './components/TableToolbar';
import { TablePagination } from './components/TablePagination';
import { TableActions } from './components/TableActions';
import { useTableContext } from './context/TableContext';

import {
  BaseTableData,
  EnhancedDataTableProps,
  TableSize,
  TableColumn,
  ActionConfig,
  FilterConfig,
  BulkActionConfig,
  ExportFormat,
  DialogFormProps
} from './types/enhanced-types';
import { useDataTable } from './hooks/useDataTable';

// Enhanced Loading Component with three different variants
const LoadingOverlay = memo(({ 
  loading, 
  text = 'Đang tải dữ liệu...',
  variant = 'skeleton',
  rows = 5,
  columns = 4
}: {
  loading: boolean;
  text?: string;
  variant?: 'skeleton' | 'spinner' | 'pulse';
  rows?: number;
  columns?: number;
}) => {
  if (!loading) return null;

  if (variant === 'spinner') {
    return (
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">{text}</p>
        </div>
      </div>
    );
  }

  if (variant === 'pulse') {
    return (
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-12 w-12 rounded-full border-4 border-primary animate-pulse-slow" />
          <p className="text-sm text-muted-foreground animate-pulse">{text}</p>
        </div>
      </div>
    );
  }

  // Skeleton variant (default)
  return (
    <div className="w-full space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-[250px]" />
        <Skeleton className="h-8 w-[150px]" />
      </div>
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              {Array.from({ length: columns }).map((_, index) => (
                <TableHead key={index}>
                  <Skeleton className="h-4 w-full" />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: rows }).map((_, rowIndex) => (
              <TableRow key={rowIndex}>
                {Array.from({ length: columns }).map((_, colIndex) => (
                  <TableCell key={colIndex}>
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-[200px]" />
        <Skeleton className="h-8 w-[300px]" />
      </div>
    </div>
  );
});

// Enhanced Error State Component
const ErrorState = memo(({ 
  error, 
  onRetry, 
  onReset 
}: {
  error: Error | string;
  onRetry?: () => void;
  onReset?: () => void;
}) => (
  <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-8 text-center">
    <div className="flex justify-center mb-4">
      <AlertCircle className="h-12 w-12 text-destructive" />
    </div>
    <h3 className="text-lg font-semibold mb-2 text-destructive">
      Đã xảy ra lỗi
    </h3>
    <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
      {typeof error === 'string' ? error : error.message}
    </p>
    <div className="flex justify-center gap-3">
      {onRetry && (
        <Button 
          onClick={onRetry} 
          variant="outline" 
          className="gap-1"
        >
          <RefreshCw className="h-4 w-4 mr-1" />
          Thử lại
        </Button>
      )}
      {onReset && (
        <Button 
          onClick={onReset} 
          variant="destructive" 
          className="gap-1"
        >
          <X className="h-4 w-4 mr-1" />
          Đặt lại
        </Button>
      )}
    </div>
  </div>
));

// Enhanced Empty State Component
const EmptyState = memo(({ 
  title = 'Không có dữ liệu',
  description = 'Không tìm thấy dữ liệu phù hợp với tiêu chí tìm kiếm.',
  action,
  icon = Database
}: {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
}) => {
  const IconComponent = icon;
  
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <IconComponent className="h-12 w-12 text-muted-foreground/50 mb-4" />
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground text-center mb-6 max-w-md">
        {description}
      </p>
      {action}
    </div>
  );
});

// Main EnhancedDataTable Component
export function EnhancedDataTable<T extends BaseTableData>({
  // Essential props
  data,
  columns,
  tableId = 'data-table',
  title,
  description,
  
  // Loading states
  loading = false,
  loadingConfig = {
    variant: 'skeleton',
    rows: 5,
    columns: 5,
    showHeader: true,
  },
  
  // Pagination
  pagination = {
    type: 'client',
    pageSize: 10,
    pageSizeOptions: [10, 20, 50, 100],
    showSizeChanger: true,
    showQuickJumper: false,
    showTotal: true,
    showPageInfo: true,
    position: 'bottom',
  },
  total,
  serverPagination = false,
  
  // Selection
  selection = {
    enabled: false,
    multiple: true,
    preserveSelectedRowsOnPageChange: false,
    selectAll: true,
    rowSelectionType: 'checkbox',
  },
  selectedRowKeys,
  
  // Sorting
  sorting = [],
  serverSorting = false,
  
  // Filtering
  filters = [],
  filterValues = {},
  serverFiltering = false,
  globalSearch = {
    enabled: true,
    placeholder: 'Tìm kiếm...',
    debounceMs: 300,
  },
  
  // Grouping
  grouping = {
    enabled: false,
  },
  expandedRowKeys = [],
  
  // Actions
  actions = [],
  bulkActions = [],
  actionColumn,
  
  // Export
  export: exportConfig = {
    enabled: false,
    formats: ['csv', 'excel', 'pdf'],
  },
  
  // Dialog/Modal
  dialog,
  createForm,
  editForm,
  viewForm,
  deleteForm,
  
  // Events
  eventHandlers,
  
  // Styling & Layout
  className,
  tableClassName,
  size = 'md',
  bordered = true,
  showHeader = true,
  sticky = false,
  striped = true,
  hover = true,
  
  // Advanced features
  resizableColumns = false,
  dragSortable = false,
  columnOrdering = false,
  
  // Performance
  optimization = {
    debounceSearch: 300,
    debounceFilter: 300,
    memoizeRows: true,
  },
  
  // Accessibility
  accessible = true,
  ariaLabel,
  ariaDescription,
  
  // Server-side features
  serverData,
  
  // Error handling
  error,
  onError,
  
  // Custom renderers
  emptyStateRenderer,
  errorStateRenderer,
  toolbarRenderer,
  
  // Responsive
  responsive = true,
  breakpoints = {
    mobile: 640,
    tablet: 1024,
    desktop: 1280,
  },
  
  // Theme
  theme = 'auto',
  
  ...props
}: EnhancedDataTableProps<T>) {
  // Dialog context for form handling
  const dialogContext = useDialog();
  
  // Media queries for responsive design
  const isMobile = useMediaQuery(`(max-width: ${breakpoints.mobile}px)`);
  const isTablet = useMediaQuery(`(min-width: ${breakpoints.mobile + 1}px) and (max-width: ${breakpoints.tablet}px)`);
  const isDesktop = useMediaQuery(`(min-width: ${breakpoints.tablet + 1}px)`);
  
  // Get current theme (light/dark)
  const { theme: currentTheme } = useTheme();
  const actualTheme = theme === 'auto' ? currentTheme : theme;
  
  // Create reference to track search input changes
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // Get device type for responsive layout
  const deviceType = isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop';
  
  // Initialize the data table with our configuration
  const tableState = useDataTable({
    data,
    columns: columns as any,
    pagination: {
      type: serverPagination ? 'server' : 'client',
      pageSize: pagination.pageSize,
      current: pagination.current,
      pageSizeOptions: pagination.pageSizeOptions,
      showSizeChanger: pagination.showSizeChanger,
      showTotal: pagination.showTotal,
    },
    total,
    selection: {
      ...selection
    },
    sorting: sorting,
    filters: filters,
    filterValues,
    globalSearch: {
      ...globalSearch,
    },
    grouping: grouping.enabled ? {
      ...grouping
    } : undefined,
    eventHandlers,
    serverData,
    optimization,
    selectedRowKeys,
    expandedRowKeys,
  });
  
  // Get table instance and states
  const { 
    table,
    loading: tableLoading, 
    error: tableError,
    data: tableData,
    filteredData,
    selectedRows,
    pagination: paginationState,
    sorting: sortingState,
    filters: filtersState,
    selectedRowKeys: tableSelectedKeys,
    expandedRowKeys: tableExpandedKeys,
    columnVisibility,
    setPage,
    setPageSize,
    setSort,
    setFilter,
    setFilters,
    clearFilters,
    setSelectedRowKeys,
    setExpandedRowKeys,
    setColumnVisibility,
    refresh,
    reset,
    selectAll,
    selectNone,
    selectInvert,
    selectPage,
    setGlobalFilter,
    clearGlobalFilter,
  } = tableState;

  // Track dialog state for forms
  const [dialogState, setDialogState] = useState<{
    open: boolean;
    mode: 'create' | 'edit' | 'view' | 'delete';
    data?: T;
    loading: boolean;
  }>({
    open: false,
    mode: 'create',
    loading: false,
  });

  // Handle opening dialog for different actions
  const openDialog = useCallback((mode: 'create' | 'edit' | 'view' | 'delete', data?: T) => {
    // Determine which form to show based on mode
    let FormComponent;
    let title;
    
    switch (mode) {
      case 'create':
        FormComponent = createForm;
        title = 'Tạo mới';
        break;
      case 'edit':
        FormComponent = editForm;
        title = 'Chỉnh sửa';
        break;
      case 'view':
        FormComponent = viewForm;
        title = 'Xem chi tiết';
        break;
      case 'delete':
        FormComponent = deleteForm;
        title = 'Xóa';
        break;
    }
    
    if (!FormComponent) return;
    
    setDialogState({
      open: true,
      mode,
      data,
      loading: false,
    });
    
    // Use the app's dialog context to show the dialog
    dialogContext.showDialog(
      title,
      // Render form with proper props
      (onClose) => (
        <FormComponent
          data={data}
          mode={mode}
          onSubmit={async (updatedData) => {
            setDialogState(prev => ({ ...prev, loading: true }));
            try {
              // Call appropriate handler based on mode
              if (mode === 'create' && eventHandlers?.onCreate) {
                await eventHandlers.onCreate(updatedData);
              } else if (mode === 'edit' && eventHandlers?.onEdit) {
                await eventHandlers.onEdit(updatedData);
              } else if (mode === 'delete' && eventHandlers?.onDelete) {
                await eventHandlers.onDelete(updatedData.id as string);
              }
              
              // Refresh table data
              refresh();
              onClose();
            } catch (error) {
              console.error('Form submission error:', error);
              // If there's an error handler, call it
              if (onError) {
                onError(error instanceof Error ? error : new Error('Unknown error'));
              }
            } finally {
              setDialogState(prev => ({ ...prev, loading: false }));
            }
          }}
          onCancel={() => {
            onClose();
          }}
          loading={dialogState.loading}
        />
      ),
      DialogType.FORM,
      {
        showCloseButton: true,
        preventOutsideClick: dialogState.loading,
      }
    );
  }, [createForm, editForm, viewForm, deleteForm, dialogContext, eventHandlers, onError, refresh]);
  
  // Handle action clicks
  const handleActionClick = useCallback((type: string, record: T) => {
    switch (type) {
      case 'create':
        openDialog('create');
        break;
      case 'edit':
        openDialog('edit', record);
        break;
      case 'view':
        openDialog('view', record);
        break;
      case 'delete':
        openDialog('delete', record);
        break;
      default:
        // For custom actions, find the action config and call its onClick
        const actionConfig = actions.find(action => action.type === type);
        if (actionConfig && actionConfig.onClick) {
          actionConfig.onClick(record);
        }
    }
  }, [actions, openDialog]);
  
  // Handle bulk action clicks
  const handleBulkAction = useCallback((action: BulkActionConfig) => {
    if (action.onClick) {
      action.onClick(selectedRows);
    }
  }, [selectedRows]);
  
  // Map actions to ActionConfig format
  const tableActions = useMemo(() => {
    return actions.map(action => ({
      ...action,
      onClick: (record: T) => handleActionClick(action.type, record)
    }));
  }, [actions, handleActionClick]);
  
  // Handle column visibility toggle
  const handleToggleColumnVisibility = useCallback((columnId: string) => {
    setColumnVisibility(prev => ({
      ...prev,
      [columnId]: !prev[columnId]
    }));
  }, [setColumnVisibility]);
  
  // Format columns for toolbar visibility options
  const visibilityColumns = useMemo(() => {
    return columns
      .filter(column => column.id !== 'select' && column.id !== 'actions')
      .map(column => ({
        id: column.id as string,
        label: typeof column.header === 'string' ? column.header : column.id as string,
        visible: columnVisibility[column.id as string] !== false,
      }));
  }, [columns, columnVisibility]);
  
  // Handle export action
  const handleExport = useCallback((format: ExportFormat) => {
    // This would connect to your export functionality
    if (eventHandlers?.onExport) {
      eventHandlers.onExport(format, filteredData);
    }
  }, [eventHandlers, filteredData]);
  
  // Handle refresh action
  const handleRefresh = useCallback(() => {
    refresh();
  }, [refresh]);
  
  // Determine if table is empty
  const isEmpty = filteredData.length === 0;
  
  // Determine loading and error states
  const isLoading = loading || tableLoading;
  const hasError = error || tableError;
  
  // Calculate table size class based on size prop
  const sizeClass = useMemo(() => {
    switch (size) {
      case 'sm': return 'text-xs p-1.5';
      case 'lg': return 'text-base p-4';
      default: return 'text-sm p-2.5'; // md size (default)
    }
  }, [size]);
  
  // Generate CSS classes for the table
  const tableClasses = useMemo(() => {
    return cn(
      'w-full relative',
      bordered && 'border',
      striped && 'striped',
      hover && 'hover',
      tableClassName
    );
  }, [bordered, hover, striped, tableClassName]);
  
  // Effect to update selection when selectedRowKeys prop changes
  useEffect(() => {
    if (selectedRowKeys && JSON.stringify(selectedRowKeys) !== JSON.stringify(tableSelectedKeys)) {
      setSelectedRowKeys(selectedRowKeys);
    }
  }, [selectedRowKeys, tableSelectedKeys, setSelectedRowKeys]);

  // Effect to update expanded rows when expandedRowKeys prop changes
  useEffect(() => {
    if (expandedRowKeys && JSON.stringify(expandedRowKeys) !== JSON.stringify(tableExpandedKeys)) {
      setExpandedRowKeys(expandedRowKeys);
    }
  }, [expandedRowKeys, tableExpandedKeys, setExpandedRowKeys]);

  // Cleanup function when component unmounts
  useEffect(() => {
    return () => {
      // Any cleanup if needed
    };
  }, []);
  
  // Disable text selection in header if drag sorting is enabled
  const headerStyle = dragSortable ? { userSelect: 'none' } : undefined;
  
  // Render appropriate content based on loading/error state
  if (hasError && errorStateRenderer) {
    return errorStateRenderer(hasError);
  }
  
  if (isEmpty && emptyStateRenderer && !isLoading) {
    return emptyStateRenderer();
  }
  
  // If filter is active and data is empty, show specific empty state
  const isFilterActive = Object.values(filtersState).some(v => v !== undefined && v !== '');
  
  // Render the table
  return (
    <div className={cn("space-y-4", className)} id={tableId}>
      {/* Table Toolbar Section */}
      {toolbarRenderer ? (
        toolbarRenderer(
          <TableToolbar 
            title={title}
            description={description}
            globalSearch={globalSearch.enabled ? {
              enabled: true,
              value: table.getState().globalFilter || '',
              placeholder: globalSearch.placeholder,
              onSearch: setGlobalFilter,
            } : undefined}
            filters={filters.length > 0 ? {
              configs: filters,
              values: filtersState,
              onFilterChange: setFilter,
              onClearFilters: clearFilters,
            } : undefined}
            export={exportConfig.enabled && filteredData.length > 0 ? {
              enabled: true,
              formats: exportConfig.formats as ExportFormat[],
              data: filteredData,
              columns: columns,
              filename: exportConfig.filename,
              title: exportConfig.title,
            } : undefined}
            columnVisibility={{
              columns: visibilityColumns,
              onToggle: handleToggleColumnVisibility,
            }}
            actions={{
              create: {
                enabled: !!createForm,
                onClick: () => openDialog('create'),
              },
              refresh: {
                enabled: true,
                onClick: handleRefresh,
                loading: isLoading,
              },
            }}
            bulkActions={selectedRows.length > 0 ? {
              configs: bulkActions,
              selectedCount: selectedRows.length,
              onAction: handleBulkAction,
            } : undefined}
          />
        )
      ) : (
        <TableToolbar 
          title={title}
          description={description}
          globalSearch={globalSearch.enabled ? {
            enabled: true,
            value: table.getState().globalFilter || '',
            placeholder: globalSearch.placeholder,
            onSearch: setGlobalFilter,
          } : undefined}
          filters={filters.length > 0 ? {
            configs: filters,
            values: filtersState,
            onFilterChange: setFilter,
            onClearFilters: clearFilters,
          } : undefined}
          export={exportConfig.enabled && filteredData.length > 0 ? {
            enabled: true,
            formats: exportConfig.formats as ExportFormat[],
            data: filteredData,
            columns: columns,
            filename: exportConfig.filename,
            title: exportConfig.title,
          } : undefined}
          columnVisibility={{
            columns: visibilityColumns,
            onToggle: handleToggleColumnVisibility,
          }}
          actions={{
            create: {
              enabled: !!createForm,
              onClick: () => openDialog('create'),
            },
            refresh: {
              enabled: true,
              onClick: handleRefresh,
              loading: isLoading,
            },
          }}
          bulkActions={selectedRows.length > 0 ? {
            configs: bulkActions,
            selectedCount: selectedRows.length,
            onAction: handleBulkAction,
          } : undefined}
        />
      )}
      
      {/* Main Table Section */}
      <div className="relative">
        {isLoading && (
          <LoadingOverlay 
            loading={true}
            variant={loadingConfig.variant}
            text={loadingConfig.text}
            rows={loadingConfig.rows}
            columns={loadingConfig.columns || columns.length}
          />
        )}
        
        {hasError && !errorStateRenderer && (
          <ErrorState 
            error={hasError} 
            onRetry={refresh} 
            onReset={reset} 
          />
        )}
        
        {!hasError && isEmpty && !isLoading && !emptyStateRenderer && (
          <EmptyState 
            title={isFilterActive ? "Không tìm thấy dữ liệu" : "Không có dữ liệu"}
            description={
              isFilterActive 
                ? "Không tìm thấy dữ liệu phù hợp với bộ lọc hiện tại."
                : "Chưa có dữ liệu nào được tạo. Bạn có thể tạo dữ liệu mới."
            }
            action={createForm && (
              <Button onClick={() => openDialog('create')}>
                Tạo mới
              </Button>
            )}
          />
        )}
        
        {!hasError && (!isEmpty || isLoading) && (
          <div className={tableClasses}>
            {/* Handle horizontal scrolling for wide tables */}
            <ScrollArea className={sticky ? "h-[calc(100vh-300px)]" : ""}>
              <Table>
                {showHeader && (
                  <TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                      <TableRow key={headerGroup.id} style={headerStyle}>
                        {headerGroup.headers.map((header) => {
                          // Skip rendering columns that should be hidden on this device
                          const column = header.column.columnDef as TableColumn;
                          if (column.hideOn?.includes(deviceType)) {
                            return null;
                          }
                          
                          return (
                            <TableHead 
                              key={header.id}
                              style={{ 
                                width: column.width,
                                minWidth: column.minWidth,
                                maxWidth: column.maxWidth,
                                textAlign: column.align || 'left'
                              }}
                              className={cn(
                                column.fixed === 'left' && 'sticky left-0 z-10',
                                column.fixed === 'right' && 'sticky right-0 z-10'
                              )}
                            >
                              {header.isPlaceholder ? null : (
                                <div 
                                  className={cn(
                                    "flex items-center gap-1", 
                                    column.sortable !== false && "cursor-pointer select-none",
                                    header.column.getCanSort() && "cursor-pointer select-none"
                                  )}
                                  onClick={header.column.getCanSort() ? header.column.getToggleSortingHandler() : undefined}
                                >
                                  {flexRender(header.column.columnDef.header, header.getContext())}
                                  
                                  {header.column.getCanSort() && (
                                    <ChevronDown 
                                      className={cn(
                                        "h-4 w-4",
                                        header.column.getIsSorted() === "asc" && "transform rotate-180",
                                        header.column.getIsSorted() === "desc" && "transform rotate-0",
                                        !header.column.getIsSorted() && "opacity-0 group-hover:opacity-100"
                                      )}
                                    />
                                  )}
                                </div>
                              )}
                            </TableHead>
                          );
                        })}
                      </TableRow>
                    ))}
                  </TableHeader>
                )}
                <TableBody>
                  {table.getRowModel().rows.map((row) => {
                    // Check if this is a group row
                    const isGroupRow = row.original.isGroupRow;
                    const isChildRow = row.original.isChildRow;
                    
                    return (
                      <TableRow 
                        key={row.id} 
                        data-state={row.getIsSelected() ? "selected" : undefined}
                        className={cn(
                          isGroupRow && "bg-muted/50 font-medium",
                          isChildRow && "pl-10"
                        )}
                      >
                        {row.getVisibleCells().map((cell) => {
                          // Skip rendering cells for columns that should be hidden on this device
                          const column = cell.column.columnDef as TableColumn;
                          if (column.hideOn?.includes(deviceType)) {
                            return null;
                          }
                          
                          // Special handling for group rows
                          if (isGroupRow && cell.column.id !== 'select') {
                            if (cell.column.id === grouping.field) {
                              return (
                                <TableCell 
                                  key={cell.id}
                                  colSpan={row.getVisibleCells().length - (selection.enabled ? 1 : 0)}
                                  className="font-medium"
                                >
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-6 p-1"
                                    onClick={() => {
                                      const groupValue = row.original.groupValue;
                                      const isExpanded = tableExpandedKeys.includes(groupValue);
                                      if (isExpanded) {
                                        setExpandedRowKeys(tableExpandedKeys.filter(k => k !== groupValue));
                                      } else {
                                        setExpandedRowKeys([...tableExpandedKeys, groupValue]);
                                      }
                                    }}
                                  >
                                    {row.original.isExpanded ? 
                                      <ChevronDown className="h-4 w-4 mr-2" /> : 
                                      <ChevronRight className="h-4 w-4 mr-2" />
                                    }
                                    {row.original.groupValue} ({row.original.groupCount})
                                  </Button>
                                </TableCell>
                              );
                            }
                            return null;
                          }
                          
                          // For action column, render the actions
                          if (cell.column.id === 'actions') {
                            return (
                              <TableCell 
                                key={cell.id}
                                align="right"
                                className={sizeClass}
                                style={{ 
                                  textAlign: column.align || 'right',
                                  width: column.width,
                                  minWidth: column.minWidth,
                                  maxWidth: column.maxWidth
                                }}
                              >
                                {actionColumn?.render ? (
                                  actionColumn.render(row.original, tableActions)
                                ) : (
                                  <TableActions
                                    actions={tableActions}
                                    record={row.original}
                                    position={isMobile ? 'dropdown' : 'inline'}
                                    maxInlineActions={isMobile ? 1 : 3}
                                  />
                                )}
                              </TableCell>
                            );
                          }
                          
                          // Default cell rendering
                          return (
                            <TableCell 
                              key={cell.id}
                              className={cn(
                                sizeClass,
                                column.ellipsis && "truncate",
                              )}
                              style={{ 
                                textAlign: column.align || 'left',
                                width: column.width,
                                minWidth: column.minWidth,
                                maxWidth: column.maxWidth
                              }}
                            >
                              {column.render ? 
                                column.render(
                                  flexRender(cell.column.columnDef.cell, cell.getContext()), 
                                  row.original, 
                                  row.index
                                ) : 
                                flexRender(cell.column.columnDef.cell, cell.getContext())
                              }
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>
        )}
      </div>

      {/* Pagination Section */}
      {!isEmpty && pagination && (pagination.position === 'bottom' || pagination.position === 'both') && (
        <TablePagination
          current={paginationState.current}
          pageSize={paginationState.pageSize}
          total={paginationState.total}
          totalPages={paginationState.totalPages}
          pageSizeOptions={pagination.pageSizeOptions}
          showSizeChanger={pagination.showSizeChanger}
          showQuickJumper={pagination.showQuickJumper}
          showTotal={pagination.showTotal}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          disabled={isLoading}
        />
      )}
    </div>
  );
}

// Add display name for better debugging
EnhancedDataTable.displayName = 'EnhancedDataTable';

export default memo(EnhancedDataTable) as typeof EnhancedDataTable;