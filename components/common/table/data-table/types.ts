// Complete types.ts with proper typing and no 'any' types

import { ColumnDef, Row, Table as TableInstance, RowSelectionState } from "@tanstack/react-table";
import { DialogChildrenProps } from "@/context/DialogProvider";

export type TActions = "create" | "edit" | "delete" | "read-only";

export interface BaseData {
  id: string;
  isGroupRow?: boolean;
  isChildRow?: boolean;
  groupValue?: string;
  groupCount?: number;
  isExpanded?: boolean;
  [key: string]: unknown;
}

export interface GroupedData<T extends BaseData> {
  id: string;
  isGroupRow: boolean;
  groupValue: string;
  groupName?: string;
  groupCount: number;
  isExpanded: boolean;
  originalData?: T;
}

export interface DataTableProps<TData extends BaseData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  title: string;
  description?: string;
  createFormComponent?: React.ReactNode | ((props: DialogChildrenProps<unknown>) => React.ReactNode);
  editFormComponent?: React.ReactNode | ((props: DialogChildrenProps<unknown>) => React.ReactNode);
  viewFormComponent?: React.ReactNode | ((props: DialogChildrenProps<unknown>) => React.ReactNode);
  createClickAction?: () => void;
  editClickAction?: ((data: TData) => void) | (() => void);
  viewClickAction?: (data: TData) => void;
  refetchData?: () => void;
  onDelete?: (id: string) => Promise<void>;
  onBatchDelete?: (ids: string[]) => Promise<void>;
  onEdit?: (data: TData) => void;
  onSelected?: (ids: string[]) => void;
  actions: TActions[];
  searchColumn?: keyof TData | string;
  searchPlaceholder?: string;
  customSearchFunction?: (item: TData, searchValue: string) => boolean;
  exportData?: boolean;
  exportFormats?: Array<"csv" | "excel" | "pdf">;
  isLoading?: boolean;
  children?: React.ReactNode;
  initialPageIndex?: number;
  initialPageSize?: number;
  totalItems?: number;
  serverSidePagination?: boolean;
  onPageChange?: (pageIndex: number, pageSize: number) => void;
  disablePagination?: boolean;
  serverPageSize?: number;

  // Row grouping props
  enableRowGrouping?: boolean;
  groupByField?: keyof TData | string;
  initialExpandedGroups?: boolean;
  enableBatchUpdate?: boolean;
  enableBatchDelete?: boolean;
  forceGrouping?: boolean;
}

// Define proper types for components that were using 'any'

export interface GroupRowProps<TData extends BaseData> {
  row: Row<TData>;
  columns: ColumnDef<TData, unknown>[];
  toggleGroup: (groupValue: string) => void;
  actions: TActions[];
  pageIndex: number;
  pageSize: number;
}

export interface DataTableBodyProps<TData extends BaseData> {
  table: TableInstance<TData>;
  columns: ColumnDef<TData, unknown>[];
  actions: TActions[];
  pageIndex: number;
  pageSize: number;
  toggleGroup: (groupValue: string) => void;
  onEdit?: (data: TData) => void;
  onDelete?: (id: string) => Promise<void>;
  refetchData?: () => void;
  editFormComponent?: React.ReactNode | ((props: DialogChildrenProps<unknown>) => React.ReactNode);
  viewFormComponent?: React.ReactNode | ((props: DialogChildrenProps<unknown>) => React.ReactNode);
  editClickAction?: ((data: TData) => void) | (() => void);
  className?: string;
}

export interface DataRowProps<TData extends BaseData> {
  row: Row<TData>;
  rowIndex: number;
  columns: ColumnDef<TData, unknown>[];
  actions: TActions[];
  pageIndex: number;
  pageSize: number;
  onEdit?: (data: TData) => void;
  onDelete?: (id: string) => Promise<void>;
  refetchData?: () => void;
  editFormComponent?: React.ReactNode | ((props: DialogChildrenProps<unknown>) => React.ReactNode);
  viewFormComponent?: React.ReactNode | ((props: DialogChildrenProps<unknown>) => React.ReactNode);
  editClickAction?: ((data: TData) => void) | (() => void);
}

export interface GroupControlsProps<TData extends BaseData> {
  enableRowGrouping: boolean;
  expandedGroups: Record<string, boolean>;
  processedData: (TData | GroupedData<TData>)[];
  enableBatchUpdate?: boolean;
  table: TableInstance<TData>;
  showDialog: (options: unknown) => void;
  editFormComponent?: React.ReactNode | ((props: DialogChildrenProps<unknown>) => React.ReactNode);
  expandAllGroups: () => void;
  collapseAllGroups: () => void;
  searchActive?: boolean;
}

export interface TablePaginationProps {
  disablePagination: boolean;
  pageIndex: number;
  pageSize: number;
  pageCount: number;
  currentPage: number;
  startRow: number;
  endRow: number;
  totalRows: number;
  isDataFetching: boolean;
  serverSidePagination: boolean;
  table: TableInstance<unknown>;
  pageSizeOptions: number[];
  setPageIndex: (index: number) => void;
  setPageSize: (size: number) => void;
  isPaginationChange: React.MutableRefObject<boolean>;
}

export interface TableToolbarProps<TData extends BaseData, TValue> {
  searchValue: string;
  setSearchValue: (value: string) => void;
  searchColumn?: keyof TData | string;
  searchPlaceholder?: string;
  table: TableInstance<TData>;
  exportData?: boolean;
  exportFormats?: Array<"csv" | "excel" | "pdf">;
  data: TData[];
  columns: ColumnDef<TData, TValue>[];
  title: string;
}

export interface DataTableHeaderProps<TData extends BaseData, TValue> {
  table: TableInstance<TData>;
  columns: ColumnDef<TData, TValue>[];
  actions: TActions[];
}

export interface BatchDeleteButtonProps<TData extends BaseData> {
  table: TableInstance<TData>;
  onBatchDelete?: (ids: string[]) => Promise<void>;
  refetchData?: () => void;
  showDialog: (options: unknown) => void;
}

export interface UseTableGroupingProps<TData extends BaseData> {
  data: TData[];
  enableRowGrouping?: boolean;
  groupByField?: keyof TData | string;
  initialExpandedGroups?: boolean;
  forceGrouping?: boolean;
  searchValue?: string;
  searchColumn?: keyof TData | string;
  customSearchFunction?: (item: TData, searchValue: string) => boolean;
}

export interface UseTableGroupingReturn<TData extends BaseData> {
  expandedGroups: Record<string, boolean>;
  toggleGroup: (groupValue: string) => void;
  expandAllGroups: () => void;
  collapseAllGroups: () => void;
  processedData: (TData | GroupedData<TData>)[];
  searchActive: boolean;
}

export interface UseServerPaginationProps {
  initialPageIndex?: number;
  initialPageSize?: number;
  serverSidePagination?: boolean;
  onPageChange?: (pageIndex: number, pageSize: number) => void;
  serverPageSize?: number;
}

export interface UseServerPaginationReturn {
  pageIndex: number;
  pageSize: number;
  setPageIndex: (index: number) => void;
  setPageSize: (size: number) => void;
  isDataFetching: boolean;
  isPaginationChange: React.MutableRefObject<boolean>;
  resetDataFetching: () => void;
}