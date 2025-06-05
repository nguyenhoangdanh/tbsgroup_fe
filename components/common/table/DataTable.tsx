import React, { memo, useMemo, useState, useCallback, useEffect } from 'react';
import { flexRender } from '@tanstack/react-table';

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
import { 
  ChevronDown, 
  ChevronRight, 
  AlertCircle, 
  RefreshCw,
  Loader2,
  Database
} from 'lucide-react';

import { BaseTableData, DataTableProps, TableSize } from '../types';
import { useDataTable } from '../hooks/useDataTable';
import { useTableDialog } from '../hooks/useTableDialog';
import { useTableExport } from '../hooks/useTableExport';
import { TableToolbar } from './TableToolbar';
import { TablePagination } from './TablePagination';
import { TableActions } from './TableActions';
import { TableSkeletonLoader } from '../../loading/TableSkeletonLoader';

// Enhanced Loading Component
const LoadingOverlay = memo(({ 
  loading, 
  text = 'Đang tải dữ liệu...',
  variant = 'skeleton' 
}: {
  loading: boolean;
  text?: string;
  variant?: 'skeleton' | 'spinner' | 'pulse';
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

  return null;
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
  <div className="flex flex-col items-center justify-center py-12 px-4">
    <AlertCircle className="h-12 w-12 text-destructive mb-4" />
    <h3 className="text-lg font-semibold mb-2">Đã xảy ra lỗi</h3>
    <p className="text-sm text-muted-foreground text-center mb-6 max-w-md">
      {error instanceof Error ? error.message : error}
    </p>
    <div className="flex gap-2">
      {onRetry && (
        <Button onClick={onRetry} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Thử lại
        </Button>
      )}
      {onReset && (
        <Button onClick={onReset} variant="ghost" size="sm">
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

// Main DataTable Component
export function DataTable<T extends BaseTableData>({
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
    rows: 10,
    columns: columns.length,
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
    clearable: true,
  },
  
  // Grouping
  grouping,
  expandedRowKeys,
  
  // Actions
  actions = [],
  bulkActions = [],
  actionColumn,
  
  // Export
  export: exportConfig,
  
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
  size = 'medium',
  bordered = true,
  showHeader = true,
  sticky = false,
  striped = false,
  hover = true,
  
  // Advanced features
  resizableColumns = false,
  dragSortable = false,
  columnOrdering = false,
  
  // Performance
  optimization,
  
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
    mobile: 768,
    tablet: 1024,
    desktop: 1280,
  },
  
  // Theme
  theme = 'auto',
  
  ...props
}: DataTableProps<T>) {
  
  // Local state for responsive behavior
  const [screenSize, setScreenSize] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');
  
  // Enhanced data table hook
  const tableState = useDataTable({
    data,
    columns,
    pagination: {
      ...pagination,
      type: serverPagination ? 'server' : pagination.type,
    },
    total,
    selection,
    sorting,
    filters,
    filterValues,
    globalSearch,
    grouping,
    eventHandlers,
    serverData,
    optimization,
    selectedRowKeys,
    expandedRowKeys,
  });

  const dialogState = useTableDialog<T>();

  // Enhanced export functionality
  const exportState = useTableExport({
    data: tableState.filteredData,
    columns,
    filename: exportConfig?.filename || `${tableId}-export`,
    title: title,
  });

  // Handle responsive behavior
  useEffect(() => {
    if (!responsive) return;

    const handleResize = () => {
      const width = window.innerWidth;
      if (width < breakpoints.mobile) {
        setScreenSize('mobile');
      } else if (width < breakpoints.tablet) {
        setScreenSize('tablet');
      } else {
        setScreenSize('desktop');
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [responsive, breakpoints]);

  // Size class mapping with responsive considerations
  const getSizeClass = useCallback(() => {
    const sizeMap: Record<TableSize, string> = {
      small: 'text-xs',
      medium: 'text-sm',
      large: 'text-base',
    };
    
    // Adjust size for mobile
    if (screenSize === 'mobile' && size === 'large') {
      return sizeMap.medium;
    }
    if (screenSize === 'mobile' && size === 'medium') {
      return sizeMap.small;
    }
    
    return sizeMap[size];
  }, [size, screenSize]);

  // Enhanced cell padding based on size
  const getCellPadding = useCallback(() => {
    const paddingMap: Record<TableSize, string> = {
      small: 'p-2',
      medium: 'p-3',
      large: 'p-4',
    };
    
    if (screenSize === 'mobile') {
      return 'p-2';
    }
    
    return paddingMap[size];
  }, [size, screenSize]);

  // Memoized toolbar configuration
  const toolbarConfig = useMemo(() => ({
    title,
    description,
    globalSearch: globalSearch?.enabled ? {
      enabled: true,
      value: tableState.table.getState().globalFilter || '',
      placeholder: globalSearch.placeholder,
      onSearch: (value: string) => tableState.setGlobalFilter(value),
    } : undefined,
    filters: filters.length > 0 ? {
      configs: filters,
      values: tableState.filters,
      onFilterChange: tableState.setFilter,
      onClearFilters: tableState.clearFilters,
    } : undefined,
    export: exportConfig?.enabled ? {
      enabled: true,
      formats: exportConfig.formats,
      data: tableState.filteredData,
      columns,
      filename: exportConfig.filename,
      title: exportConfig.title || title,
    } : undefined,
    columnVisibility: {
      columns: columns.map(col => ({
        id: col.id || col.accessorKey as string,
        label: typeof col.header === 'string' ? col.header : col.id || '',
        visible: tableState.columnVisibility[col.id || col.accessorKey as string] !== false,
      })),
      onToggle: (columnId: string) => {
        tableState.setColumnVisibility({
          ...tableState.columnVisibility,
          [columnId]: !tableState.columnVisibility[columnId],
        });
      },
    },
    actions: {
      refresh: eventHandlers?.onPageChange ? {
        enabled: true,
        onClick: () => tableState.refresh(),
        loading: loading,
      } : undefined,
    },
    bulkActions: bulkActions.length > 0 ? {
      configs: bulkActions,
      selectedCount: tableState.selectedRows.length,
      onAction: async (action) => {
        try {
          await action.onClick(tableState.selectedRows);
        } catch (err) {
          onError?.(err as Error);
        }
      },
    } : undefined,
  }), [
    title, description, globalSearch, filters, exportConfig, columns,
    tableState, bulkActions, eventHandlers, loading, onError
  ]);

  // Handle errors
  useEffect(() => {
    if (tableState.error) {
      onError?.(tableState.error);
    }
  }, [tableState.error, onError]);

  // Render loading state
  if (loading && loadingConfig.variant === 'skeleton') {
    return (
      <div className={`space-y-4 ${className || ''}`}>
        {(title || description) && (
          <div>
            {title && <div className="h-6 bg-muted rounded w-48 mb-2" />}
            {description && <div className="h-4 bg-muted rounded w-72" />}
          </div>
        )}
        <TableSkeletonLoader
          rows={loadingConfig.rows || 10}
          columns={loadingConfig.columns || columns.length}
          showHeader={loadingConfig.showHeader}
        />
      </div>
    );
  }

  // Render error state
  if (error || tableState.error) {
    const errorToShow = error || tableState.error!;
    
    if (errorStateRenderer) {
      return errorStateRenderer(errorToShow);
    }
    
    return (
      <div className={`space-y-4 ${className || ''}`}>
        {toolbarRenderer ? toolbarRenderer(<TableToolbar {...toolbarConfig} />) : <TableToolbar {...toolbarConfig} />}
        <div className="rounded-lg border bg-card">
          <ErrorState
            error={errorToShow}
            onRetry={() => tableState.refresh()}
            onReset={() => tableState.reset()}
          />
        </div>
      </div>
    );
  }

  // Check if data is empty
  const isEmpty = !tableState.data || tableState.data.length === 0;
  
  return (
    <div 
      className={`space-y-4 ${className || ''}`}
      role={accessible ? 'region' : undefined}
      aria-label={accessible ? (ariaLabel || `${title || 'Data'} table`) : undefined}
      aria-description={accessible ? ariaDescription : undefined}
    >
      {/* Enhanced Toolbar */}
      {toolbarRenderer ? toolbarRenderer(<TableToolbar {...toolbarConfig} />) : <TableToolbar {...toolbarConfig} />}

      {/* Main Table Container */}
      <div className={`rounded-lg border bg-card ${getSizeClass()} relative overflow-hidden`}>
        {/* Loading overlay for spinner variant */}
        <LoadingOverlay loading={loading} variant={loadingConfig.variant} text={loadingConfig.text} />
        
        {isEmpty ? (
          // Empty state
          emptyStateRenderer ? emptyStateRenderer() : (
            <EmptyState
              title="Không có dữ liệu"
              description={tableState.filters && Object.keys(tableState.filters).length > 0 
                ? "Không tìm thấy dữ liệu phù hợp với bộ lọc hiện tại."
                : "Chưa có dữ liệu để hiển thị."
              }
              action={
                Object.keys(tableState.filters).length > 0 ? (
                  <Button onClick={tableState.clearFilters} variant="outline" size="sm">
                    Xóa bộ lọc
                  </Button>
                ) : undefined
              }
            />
          )
        ) : (
          // Table content
          <div className={`overflow-auto ${responsive ? 'max-w-full' : ''}`}>
            <Table className={`${bordered ? 'border-collapse' : ''} ${tableClassName || ''}`}>
              {/* Table Header */}
              {showHeader && (
                <TableHeader className={sticky ? 'sticky top-0 bg-background z-10' : ''}>
                  {tableState.table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id} className={striped ? 'even:bg-muted/50' : ''}>
                      {/* Selection checkbox column */}
                      {selection?.enabled && (
                        <TableHead className={`w-12 ${getCellPadding()}`}>
                          <Checkbox
                            checked={tableState.table.getIsAllPageRowsSelected()}
                            onCheckedChange={(value) => tableState.table.toggleAllPageRowsSelected(!!value)}
                            aria-label="Chọn tất cả"
                          />
                        </TableHead>
                      )}
                      
                      {/* Data columns */}
                      {headerGroup.headers.map((header) => {
                        const canSort = header.column.getCanSort();
                        const sortDirection = header.column.getIsSorted();
                        
                        return (
                          <TableHead 
                            key={header.id}
                            className={`
                              whitespace-nowrap ${getCellPadding()}
                              ${canSort ? 'cursor-pointer select-none hover:bg-muted/50' : ''}
                              ${header.column.columnDef.align === 'center' ? 'text-center' : ''}
                              ${header.column.columnDef.align === 'right' ? 'text-right' : ''}
                            `}
                            style={{
                              width: header.column.columnDef.width,
                              minWidth: header.column.columnDef.minWidth,
                              maxWidth: header.column.columnDef.maxWidth,
                            }}
                            onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                          >
                            <div className="flex items-center gap-2">
                              {header.isPlaceholder
                                ? null
                                : flexRender(header.column.columnDef.header, header.getContext())
                              }
                              {canSort && (
                                <span className="text-muted-foreground">
                                  {sortDirection === 'asc' ? '↑' : sortDirection === 'desc' ? '↓' : '↕'}
                                </span>
                              )}
                            </div>
                          </TableHead>
                        );
                      })}
                      
                      {/* Actions column */}
                      {actions.length > 0 && (
                        <TableHead className={`whitespace-nowrap ${getCellPadding()}`}>
                          {actionColumn?.title || 'Thao tác'}
                        </TableHead>
                      )}
                    </TableRow>
                  ))}
                </TableHeader>
              )}

              {/* Table Body */}
              <TableBody>
                {tableState.table.getRowModel().rows.map((row, index) => {
                  const isSelected = row.getIsSelected();
                  const isGroupRow = (row.original as any)?.isGroupRow;
                  const isChildRow = (row.original as any)?.isChildRow;
                  
                  return (
                    <TableRow
                      key={row.id}
                      data-state={isSelected ? 'selected' : undefined}
                      className={`
                        ${striped && index % 2 === 1 ? 'bg-muted/30' : ''}
                        ${hover ? 'hover:bg-muted/50' : ''}
                        ${isSelected ? 'bg-primary/10' : ''}
                        ${isGroupRow ? 'bg-muted font-medium' : ''}
                        ${isChildRow ? 'bg-muted/20' : ''}
                        transition-colors duration-150
                      `}
                      onClick={(event) => {
                        eventHandlers?.onRowClick?.(row.original, index, event);
                      }}
                      onDoubleClick={(event) => {
                        eventHandlers?.onRowDoubleClick?.(row.original, index, event);
                      }}
                      onMouseEnter={() => {
                        eventHandlers?.onRowHover?.(row.original, index);
                      }}
                    >
                      {/* Selection checkbox */}
                      {selection?.enabled && (
                        <TableCell className={getCellPadding()}>
                          {!isGroupRow && (
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={(value) => row.toggleSelected(!!value)}
                              aria-label={`Chọn dòng ${index + 1}`}
                            />
                          )}
                        </TableCell>
                      )}
                      
                      {/* Data cells */}
                      {row.getVisibleCells().map((cell, cellIndex) => {
                        const column = cell.column;
                        const isFirstColumn = cellIndex === 0;
                        
                        // Group row rendering
                        if (isGroupRow && isFirstColumn) {
                          const groupData = row.original as any;
                          return (
                            <TableCell
                              key={cell.id}
                              colSpan={row.getVisibleCells().length + (actions.length > 0 ? 1 : 0)}
                              className={`${getCellPadding()} font-medium`}
                            >
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={() => {
                                    // Toggle group expansion
                                    if (groupData.groupValue) {
                                      const isExpanded = tableState.expandedRowKeys.includes(groupData.groupValue);
                                      const newExpanded = isExpanded
                                        ? tableState.expandedRowKeys.filter(key => key !== groupData.groupValue)
                                        : [...tableState.expandedRowKeys, groupData.groupValue];
                                      tableState.setExpandedRowKeys(newExpanded);
                                    }
                                  }}
                                >
                                  {groupData.isExpanded ? (
                                    <ChevronDown className="h-4 w-4" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4" />
                                  )}
                                </Button>
                                <span>{groupData.groupName || groupData.groupValue}</span>
                                <Badge variant="secondary" className="ml-2">
                                  {groupData.groupCount}
                                </Badge>
                              </div>
                            </TableCell>
                          );
                        }
                        
                        // Skip other cells for group rows
                        if (isGroupRow && !isFirstColumn) {
                          return null;
                        }
                        
                        return (
                          <TableCell
                            key={cell.id}
                            className={`
                              ${getCellPadding()}
                              ${isChildRow ? 'pl-8' : ''}
                              ${column.columnDef.align === 'center' ? 'text-center' : ''}
                              ${column.columnDef.align === 'right' ? 'text-right' : ''}
                              ${(column.columnDef as any).ellipsis ? 'truncate max-w-0' : ''}
                            `}
                            onClick={(event) => {
                              const columnId = column.id || column.columnDef.accessorKey as string;
                              const value = cell.getValue();
                              eventHandlers?.onCellClick?.(row.original, columnId, value, event);
                            }}
                          >
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        );
                      })}
                      
                      {/* Actions cell */}
                      {actions.length > 0 && !isGroupRow && (
                        <TableCell className={getCellPadding()}>
                          {actionColumn?.render ? (
                            actionColumn.render(row.original, actions)
                          ) : (
                            <TableActions
                              actions={actions}
                              record={row.original}
                              position={screenSize === 'mobile' ? 'dropdown' : 'inline'}
                              maxInlineActions={screenSize === 'mobile' ? 1 : 3}
                            />
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Enhanced Pagination */}
      {!isEmpty && pagination && (pagination.position === 'bottom' || pagination.position === 'both') && (
        <TablePagination
          current={tableState.pagination.current}
          pageSize={tableState.pagination.pageSize}
          total={tableState.pagination.total}
          totalPages={tableState.pagination.totalPages}
          pageSizeOptions={pagination.pageSizeOptions}
          showSizeChanger={pagination.showSizeChanger}
          showQuickJumper={pagination.showQuickJumper}
          showTotal={pagination.showTotal}
          onPageChange={tableState.setPage}
          onPageSizeChange={tableState.setPageSize}
          disabled={loading}
        />
      )}
    </div>
  );
}

// Add display name for better debugging
DataTable.displayName = 'DataTable';

export default memo(DataTable) as typeof DataTable;