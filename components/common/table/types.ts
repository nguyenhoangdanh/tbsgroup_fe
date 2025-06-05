import { ColumnDef } from '@tanstack/react-table';
import { LucideIcon } from 'lucide-react';
import { ReactNode } from 'react';

// ========================= CORE TYPES =========================
export type TableActions = 'create' | 'edit' | 'delete' | 'view' | 'bulk-edit' | 'bulk-delete' | 'export' | 'duplicate' | 'custom';
export type SortDirection = 'asc' | 'desc' | false;
export type FilterType = 'text' | 'select' | 'date' | 'dateRange' | 'number' | 'boolean' | 'range' | 'multiSelect';
export type ExportFormat = 'csv' | 'excel' | 'pdf' | 'json';
export type LoadingVariant = 'skeleton' | 'spinner' | 'pulse' | 'custom';
export type PaginationType = 'client' | 'server' | 'infinite';
export type TableSize = 'small' | 'medium' | 'large';
export type ActionPosition = 'dropdown' | 'inline' | 'floating' | 'fixed';

// ========================= DATA INTERFACES =========================
export interface BaseTableData {
  id: string | number;
  [key: string]: any;
}

export interface GroupedRowData extends BaseTableData {
  isGroupRow?: boolean;
  isChildRow?: boolean;
  groupValue?: string;
  groupName?: string;
  groupCount?: number;
  isExpanded?: boolean;
  children?: BaseTableData[];
  parentId?: string | number;
  level?: number;
}

// ========================= COLUMN CONFIGURATION =========================
export interface TableColumn<T = any> extends ColumnDef<T> {
  // Search & Filter
  searchable?: boolean;
  filterable?: boolean;
  filterType?: FilterType;
  filterOptions?: Array<{ label: string; value: any }>;
  
  // Sorting
  sortable?: boolean;
  sortType?: 'alphanumeric' | 'datetime' | 'basic';
  
  // Export
  exportable?: boolean;
  exportFormatter?: (value: any) => string;
  
  // Layout
  resizable?: boolean;
  pinnable?: boolean;
  groupable?: boolean;
  width?: number | string;
  minWidth?: number;
  maxWidth?: number;
  
  // Appearance
  align?: 'left' | 'center' | 'right';
  ellipsis?: boolean;
  
  // Custom rendering
  summary?: (data: T[]) => ReactNode;
  tooltip?: string | ((record: T) => string);
}

// ========================= CONFIGURATION INTERFACES =========================
export interface FilterConfig {
  key: string;
  type: FilterType;
  label: string;
  options?: Array<{ label: string; value: any; disabled?: boolean }>;
  placeholder?: string;
  multiple?: boolean;
  searchable?: boolean;
  defaultValue?: any;
  validator?: (value: any) => boolean;
  dependencies?: string[]; // Dependent filters
}

export interface SortConfig {
  field: string;
  direction: SortDirection;
  priority?: number;
}

export interface PaginationConfig {
  type: PaginationType;
  pageSize: number;
  pageSizeOptions: number[];
  showSizeChanger: boolean;
  showQuickJumper: boolean;
  showTotal: boolean;
  showPageInfo: boolean;
  position: 'top' | 'bottom' | 'both';
  simple?: boolean;
  current?: number;
  total?: number;
}

export interface GroupingConfig {
  enabled: boolean;
  field?: string;
  expandedByDefault: boolean;
  collapsible: boolean;
  showGroupCount: boolean;
  showGroupSummary: boolean;
  customGroupRenderer?: (group: GroupedRowData) => ReactNode;
  customSummaryRenderer?: (group: GroupedRowData) => ReactNode;
}

export interface SelectionConfig {
  enabled: boolean;
  multiple: boolean;
  preserveSelectedRowsOnPageChange: boolean;
  selectAll: boolean;
  selectAllPages?: boolean;
  checkStrictly?: boolean;
  getCheckboxProps?: (record: BaseTableData) => any;
  rowSelectionType?: 'checkbox' | 'radio';
}

export interface ExportConfig {
  enabled: boolean;
  formats: ExportFormat[];
  filename?: string;
  includeFilters: boolean;
  includeSelection?: boolean;
  customExportData?: (data: BaseTableData[]) => BaseTableData[];
  customHeaders?: Record<string, string>;
}

export interface LoadingConfig {
  variant: LoadingVariant;
  rows?: number;
  columns?: number;
  showHeader?: boolean;
  delay?: number;
  text?: string;
  overlay?: boolean;
}

// ========================= ACTION INTERFACES =========================
export interface ActionConfig {
  type: TableActions;
  label?: string;
  icon?: LucideIcon;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  position?: ActionPosition;
  condition?: (record: BaseTableData) => boolean;
  onClick?: (record: BaseTableData) => void | Promise<void>;
  confirmation?: {
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'warning' | 'danger' | 'info';
  };
  tooltip?: string;
  disabled?: (record: BaseTableData) => boolean;
  loading?: (record: BaseTableData) => boolean;
}

export interface BulkActionConfig {
  type: 'bulk-edit' | 'bulk-delete' | 'bulk-export' | 'bulk-approve' | 'bulk-reject' | 'custom';
  label: string;
  icon?: LucideIcon;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  condition?: (selectedRows: BaseTableData[]) => boolean;
  onClick: (selectedRows: BaseTableData[]) => void | Promise<void>;
  confirmation?: {
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'warning' | 'danger' | 'info';
  };
  maxSelection?: number;
  minSelection?: number;
}

// ========================= SEARCH & FILTER INTERFACES =========================
export interface GlobalSearchConfig {
  enabled: boolean;
  placeholder?: string;
  searchableFields?: string[];
  customSearchFn?: (record: BaseTableData, searchValue: string) => boolean;
  debounceMs?: number;
  clearable?: boolean;
  highlightMatches?: boolean;
}

// ========================= DIALOG INTERFACES =========================
export interface DialogFormProps<T = BaseTableData> {
  data?: T;
  mode: 'create' | 'edit' | 'view';
  onSubmit?: (data: T) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  errors?: Record<string, string>;
}

export interface DialogConfig {
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full';
  fullWidth?: boolean;
  preventOutsideClick?: boolean;
  showCloseButton?: boolean;
  customHeader?: ReactNode;
  customFooter?: ReactNode;
  destroyOnClose?: boolean;
}

// ========================= EVENT INTERFACES =========================
export interface TableEventHandlers<T = BaseTableData> {
  onRowClick?: (record: T, index: number, event: React.MouseEvent) => void;
  onRowDoubleClick?: (record: T, index: number, event: React.MouseEvent) => void;
  onRowHover?: (record: T, index: number) => void;
  onCellClick?: (record: T, field: string, value: any, event: React.MouseEvent) => void;
  onSort?: (field: string, direction: SortDirection) => void;
  onFilter?: (filters: Record<string, any>) => void;
  onPageChange?: (page: number, pageSize: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  onSelectionChange?: (selectedRows: T[], selectedRowKeys: (string | number)[]) => void;
  onExpandedRowsChange?: (expandedRowKeys: (string | number)[]) => void;
  onColumnResize?: (columnId: string, width: number) => void;
  onColumnReorder?: (columnOrder: string[]) => void;
}

// ========================= API INTERFACES =========================
export interface ServerDataConfig {
  endpoint?: string;
  method?: 'GET' | 'POST';
  headers?: Record<string, string>;
  pagination?: {
    pageParam: string;
    pageSizeParam: string;
    totalParam: string;
  };
  sorting?: {
    fieldParam: string;
    directionParam: string;
  };
  filtering?: {
    filterParam: string;
  };
  search?: {
    searchParam: string;
  };
  transform?: {
    request?: (params: any) => any;
    response?: (data: any) => { data: BaseTableData[]; total: number; page?: number };
  };
  onError?: (error: Error) => void;
  retryCount?: number;
  timeout?: number;
}

// ========================= PERFORMANCE INTERFACES =========================
export interface VirtualScrollConfig {
  enabled: boolean;
  itemHeight: number;
  overscan?: number;
  scrollToAlignment?: 'auto' | 'smart' | 'center' | 'end' | 'start';
}

export interface OptimizationConfig {
  memoizeRows?: boolean;
  virtualization?: VirtualScrollConfig;
  debounceSearch?: number;
  debounceResize?: number;
  lazyLoad?: boolean;
  rowKey?: string | ((record: BaseTableData) => string | number);
}

// ========================= MAIN PROPS INTERFACE =========================
export interface DataTableProps<T extends BaseTableData = BaseTableData> {
  // Essential props
  data: T[];
  columns: TableColumn<T>[];
  
  // Identification & Metadata
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
  actionColumn?: {
    title?: string;
    width?: number;
    fixed?: 'left' | 'right';
    render?: (record: T, actions: ActionConfig[]) => ReactNode;
  };
  
  // Export
  export?: ExportConfig;
  
  // Dialog/Modal
  dialog?: DialogConfig;
  createForm?: (props: DialogFormProps<T>) => ReactNode;
  editForm?: (props: DialogFormProps<T>) => ReactNode;
  viewForm?: (props: DialogFormProps<T>) => ReactNode;
  deleteForm?: (props: DialogFormProps<T>) => ReactNode;
  
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
  
  // Performance & Optimization
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
  emptyStateRenderer?: () => ReactNode;
  errorStateRenderer?: (error: Error) => ReactNode;
  toolbarRenderer?: (defaultToolbar: ReactNode) => ReactNode;
  
  // Responsive
  responsive?: boolean;
  breakpoints?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
  };
  
  // Theme
  theme?: 'light' | 'dark' | 'auto';
}

// ========================= HOOK RETURN TYPES =========================
export interface UseTableReturn<T extends BaseTableData = BaseTableData> {
  // Table instance
  table: any; // TanStack table instance
  
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
  setFilter: (field: string, value: any) => void;
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

export interface TableContextValue<T extends BaseTableData = BaseTableData> {
  tableProps: DataTableProps<T>;
  tableState: UseTableReturn<T>;
  dialogState: {
    open: boolean;
    mode: 'create' | 'edit' | 'view' | 'delete' | null;
    data: T | null;
    openDialog: (mode: 'create' | 'edit' | 'view' | 'delete', data?: T) => void;
    closeDialog: () => void;
  };
}

// ========================= UTILITY TYPES =========================
export interface TableTheme {
  colors: {
    primary: string;
    secondary: string;
    success: string;
    warning: string;
    error: string;
    background: string;
    foreground: string;
    border: string;
    muted: string;
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  typography: {
    fontFamily: string;
    fontSize: Record<TableSize, string>;
    fontWeight: {
      normal: number;
      medium: number;
      semibold: number;
      bold: number;
    };
  };
}

export interface TableBreakpoints {
  mobile: number;
  tablet: number;
  desktop: number;
  wide: number;
}

export interface TableMetrics {
  renderTime: number;
  dataSize: number;
  filteredSize: number;
  selectedSize: number;
  pageRenderTime: number;
}

// ========================= BACKWARD COMPATIBILITY =========================
// Keep old types for backward compatibility
export interface BaseData extends BaseTableData {}
export type TActions = TableActions;