import React from 'react';
import { ColumnDef } from '@tanstack/react-table';

// ==================== Base Types ====================
export interface BaseTableData {
  id: string | number;
  [key: string]: any;
}

export type ExportFormat = 'csv' | 'excel' | 'pdf' | 'json';

export type TableSize = 'small' | 'medium' | 'large';

export type SortDirection = 'asc' | 'desc' | false;

export type TableTheme = 'light' | 'dark' | 'auto';

// ==================== Enhanced Column Types ====================
export interface TableColumn<T = any> extends ColumnDef<T> {
  // Export settings
  exportable?: boolean;
  exportFormatter?: (value: any) => string | number;
  
  // Display settings
  sortable?: boolean;
  filterable?: boolean;
  searchable?: boolean;
  resizable?: boolean;
  
  // Layout settings
  width?: number | string;
  minWidth?: number;
  maxWidth?: number;
  fixed?: 'left' | 'right';
  ellipsis?: boolean;
  tooltip?: boolean;
  align?: 'left' | 'center' | 'right';
  
  // Custom renderers
  render?: (value: any, record: T, index: number) => React.ReactNode;
  
  // Validation for filters
  validator?: (value: any) => boolean;
}

// ==================== Enhanced Pagination Types ====================
export interface PaginationConfig {
  type: 'client' | 'server' | 'infinite';
  current?: number;
  pageSize: number;
  total?: number;
  pageSizeOptions?: number[];
  showSizeChanger?: boolean;
  showQuickJumper?: boolean;
  showTotal?: boolean;
  showPageInfo?: boolean;
  position?: 'top' | 'bottom' | 'both';
  hideOnSinglePage?: boolean;
  simple?: boolean;
  responsive?: boolean;
}

// ==================== Enhanced Selection Types ====================
export interface SelectionConfig {
  enabled: boolean;
  multiple?: boolean;
  preserveSelectedRowsOnPageChange?: boolean;
  selectAll?: boolean;
  checkStrictly?: boolean;
  selectedRowKeys?: (string | number)[];
  rowSelectionType?: 'checkbox' | 'radio';
  getCheckboxProps?: (record: any) => { disabled?: boolean };
  onSelectionChange?: (selectedRows: any[], selectedRowKeys: (string | number)[]) => void;
}

// ==================== Enhanced Filter Types ====================
export interface FilterOption {
  label: string;
  value: any;
  disabled?: boolean;
}

export interface FilterConfig {
  key: string;
  label: string;
  type: 'text' | 'select' | 'number' | 'date' | 'dateRange' | 'boolean' | 'custom';
  placeholder?: string;
  options?: FilterOption[];
  multiple?: boolean;
  component?: React.ComponentType<any>;
  validator?: (value: any) => boolean;
  defaultValue?: any;
  clearable?: boolean;
}

// ==================== Enhanced Search Types ====================
export interface GlobalSearchConfig {
  enabled: boolean;
  placeholder?: string;
  debounceMs?: number;
  clearable?: boolean;
  searchableFields?: string[];
  customSearchFn?: (record: any, searchValue: string) => boolean;
}

// ==================== Enhanced Sorting Types ====================
export interface SortConfig {
  field: string;
  direction: SortDirection;
  priority?: number;
}

export interface SortingConfig {
  enabled?: boolean;
  multiple?: boolean;
  defaultSort?: SortConfig[];
  serverSide?: boolean;
}

// ==================== Enhanced Grouping Types ====================
export interface GroupingConfig {
  enabled: boolean;
  field?: string;
  collapsible?: boolean;
  defaultExpanded?: boolean;
  customGroupRenderer?: (group: any) => React.ReactNode;
  aggregations?: {
    field: string;
    type: 'count' | 'sum' | 'avg' | 'min' | 'max';
  }[];
}

// ==================== Enhanced Action Types ====================
export interface ActionConfig {
  type: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  onClick: (record: any) => void | Promise<void>;
  condition?: (record: any) => boolean;
  loading?: boolean;
  disabled?: boolean;
  confirmation?: {
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
  };
}

export interface BulkActionConfig {
  type: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  onClick: (selectedRows: any[]) => void | Promise<void>;
  condition?: (selectedRows: any[]) => boolean;
  confirmation?: {
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
  };
}

export interface ActionColumnConfig {
  title?: string;
  width?: number | string;
  fixed?: 'left' | 'right';
  render?: (record: any, actions: ActionConfig[]) => React.ReactNode;
}

// ==================== Enhanced Export Types ====================
export interface ExportConfig {
  enabled: boolean;
  formats: ExportFormat[];
  filename?: string;
  title?: string;
  customExporter?: (data: any[], format: ExportFormat) => void;
  includeFilters?: boolean;
  includeSelection?: boolean;
}

// ==================== Enhanced Dialog Types ====================
export interface DialogConfig {
  enabled: boolean;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full';
  fullScreen?: boolean;
  preventOutsideClick?: boolean;
  showCloseButton?: boolean;
}

export interface DialogFormProps<T = any> {
  data?: T;
  onSubmit: (data: T) => void | Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  mode: 'create' | 'edit' | 'view' | 'delete';
}

// ==================== Enhanced Event Handler Types ====================
export interface TableEventHandlers<T = any> {
  // Row events
  onRowClick?: (record: T, index: number, event: React.MouseEvent) => void;
  onRowDoubleClick?: (record: T, index: number, event: React.MouseEvent) => void;
  onRowHover?: (record: T, index: number) => void;
  onRowSelect?: (record: T, selected: boolean, selectedRows: T[]) => void;
  
  // Cell events
  onCellClick?: (record: T, columnKey: string, value: any, event: React.MouseEvent) => void;
  onCellDoubleClick?: (record: T, columnKey: string, value: any, event: React.MouseEvent) => void;
  
  // Table events
  onSort?: (field: string, direction: SortDirection) => void;
  onFilter?: (filters: Record<string, any>) => void;
  onSearch?: (searchValue: string) => void;
  onPageChange?: (page: number, pageSize: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  onSelectionChange?: (selectedRows: T[], selectedRowKeys: (string | number)[]) => void;
  onColumnResize?: (columnKey: string, width: number) => void;
  onColumnReorder?: (columnKeys: string[]) => void;
  
  // Data events
  onDataChange?: (data: T[]) => void;
  onError?: (error: Error) => void;
  onLoading?: (loading: boolean) => void;
}

// ==================== Enhanced Loading Types ====================
export interface LoadingConfig {
  variant?: 'skeleton' | 'spinner' | 'pulse';
  text?: string;
  rows?: number;
  columns?: number;
  showHeader?: boolean;
  overlay?: boolean;
}

// ==================== Enhanced Server Data Types ====================
export interface ServerDataConfig {
  url: string;
  method?: 'GET' | 'POST';
  headers?: Record<string, string>;
  params?: Record<string, any>;
  transform?: (response: any) => {
    data: any[];
    total: number;
    page: number;
    pageSize: number;
  };
  onError?: (error: Error) => void;
}

// ==================== Enhanced Performance Types ====================
export interface OptimizationConfig {
  debounceSearch?: number;
  debounceFilter?: number;
  virtualScrolling?: boolean;
  lazyLoading?: boolean;
  memoizeRows?: boolean;
  renderOptimization?: boolean;
}

// ==================== Enhanced Accessibility Types ====================
export interface AccessibilityConfig {
  enabled?: boolean;
  ariaLabel?: string;
  ariaDescription?: string;
  keyboardNavigation?: boolean;
  screenReaderSupport?: boolean;
  focusManagement?: boolean;
}

// ==================== Enhanced Responsive Types ====================
export interface ResponsiveConfig {
  enabled?: boolean;
  breakpoints?: {
    mobile: number;
    tablet: number;
    desktop: number;
  };
  mobileLayout?: 'cards' | 'list' | 'accordion';
  hiddenColumns?: {
    mobile?: string[];
    tablet?: string[];
  };
}

// ==================== Enhanced Return Types ====================
export interface UseTableReturn<T extends BaseTableData> {
  // Table instance
  table: any; // React Table instance
  
  // Data states
  data: T[];
  filteredData: T[];
  selectedRows: T[];
  
  // UI states
  loading: boolean;
  error: Error | null;
  
  // Pagination state
  pagination: {
    current: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  
  // Other states
  sorting: SortConfig[];
  filters: Record<string, any>;
  selectedRowKeys: (string | number)[];
  expandedRowKeys: (string | number)[];
  columnVisibility: Record<string, boolean>;
  
  // Actions
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  setSort: (field: string, direction: SortDirection) => void;
  setSorting: (sorting: SortConfig[]) => void;
  setFilter: (key: string, value: any) => void;
  setFilters: (filters: Record<string, any>) => void;
  clearFilters: () => void;
  setSelectedRowKeys: (keys: (string | number)[]) => void;
  setExpandedRowKeys: (keys: (string | number)[]) => void;
  setColumnVisibility: (visibility: Record<string, boolean>) => void;
  refresh: () => void;
  reset: () => void;
  
  // Bulk operations
  selectAll: () => void;
  selectNone: () => void;
  selectInvert: () => void;
  selectPage: () => void;
  
  // Export operations
  exportData: (format: ExportFormat, options?: any) => void;
  
  // Search operations
  setGlobalFilter: (value: string) => void;
  clearGlobalFilter: () => void;
}

// ==================== Main DataTable Props ====================
export interface DataTableProps<T extends BaseTableData = BaseTableData> {
  // Essential props
  data: T[];
  columns: TableColumn<T>[];
  tableId?: string;
  title?: string;
  description?: string;
  
  // Loading states
  loading?: boolean;
  loadingConfig?: LoadingConfig;
  
  // Pagination
  pagination?: PaginationConfig;
  total?: number;
  serverPagination?: boolean;
  
  // Selection
  selection?: SelectionConfig;
  selectedRowKeys?: (string | number)[];
  
  // Sorting
  sorting?: SortConfig[];
  serverSorting?: boolean;
  
  // Filtering
  filters?: FilterConfig[];
  filterValues?: Record<string, any>;
  serverFiltering?: boolean;
  globalSearch?: GlobalSearchConfig;
  
  // Grouping
  grouping?: GroupingConfig;
  expandedRowKeys?: (string | number)[];
  
  // Actions
  actions?: ActionConfig[];
  bulkActions?: BulkActionConfig[];
  actionColumn?: ActionColumnConfig;
  
  // Export
  export?: ExportConfig;
  
  // Dialog/Modal
  dialog?: DialogConfig;
  createForm?: React.ComponentType<DialogFormProps<T>>;
  editForm?: React.ComponentType<DialogFormProps<T>>;
  viewForm?: React.ComponentType<DialogFormProps<T>>;
  deleteForm?: React.ComponentType<DialogFormProps<T>>;
  
  // Events
  eventHandlers?: TableEventHandlers<T>;
  
  // Styling & Layout
  className?: string;
  tableClassName?: string;
  size?: TableSize;
  bordered?: boolean;
  showHeader?: boolean;
  sticky?: boolean;
  striped?: boolean;
  hover?: boolean;
  
  // Advanced features
  resizableColumns?: boolean;
  dragSortable?: boolean;
  columnOrdering?: boolean;
  
  // Performance
  optimization?: OptimizationConfig;
  
  // Accessibility
  accessible?: boolean;
  ariaLabel?: string;
  ariaDescription?: string;
  
  // Server-side features
  serverData?: ServerDataConfig;
  
  // Error handling
  error?: Error | string;
  onError?: (error: Error) => void;
  
  // Custom renderers
  emptyStateRenderer?: () => React.ReactNode;
  errorStateRenderer?: (error: Error | string) => React.ReactNode;
  toolbarRenderer?: (toolbar: React.ReactNode) => React.ReactNode;
  
  // Responsive
  responsive?: boolean;
  breakpoints?: {
    mobile: number;
    tablet: number;
    desktop: number;
  };
  
  // Theme
  theme?: TableTheme;
}