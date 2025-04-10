"use client";

import * as React from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ChevronDown, ChevronDownIcon, ChevronRight, ChevronRightIcon, Download, EditIcon, FileSpreadsheet, FileText, FileType, FolderIcon, Search, Trash } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { CreateActionDialog } from "./actions/popup-create";
import * as XLSX from 'xlsx';
import { jsPDF } from "jspdf"
import autoTable from 'jspdf-autotable'
import ButtonGroupAction from "./actions/button-group-actions";
import { useTheme } from "next-themes";
import { DialogChildrenProps, DialogType, useDialog } from "@/context/DialogProvider";
import { extractPlainValue, removeVietnameseAccents } from "@/utils";
import { toast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useLoading } from "../loading/LoadingProvider";
import TableSkeletonLoader from "../loading/TableSkeletonLoader";
// import './table.css';

// Explicitly define types and actions
export type TActions = "create" | "edit" | "delete" | "read-only";

export interface BaseData {
  id: string;
  isGroupRow?: boolean;
  isChildRow?: boolean;
  groupValue?: string;
  groupCount?: number;
  isExpanded?: boolean;
  _children?: any[];
  [key: string]: any;
}

interface GroupedData<T extends BaseData> {
  id: string;
  isGroupRow: boolean;
  groupValue: string; // Không optional nữa
  groupName?: string;
  groupCount: number;
  isExpanded: boolean;
  originalData?: T;
}

interface DataTableProps<TData extends BaseData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  title: string;
  description?: string;
  createFormComponent?: React.ReactNode | ((props: DialogChildrenProps<any>) => React.ReactNode);
  editFormComponent?: React.ReactNode | ((props: DialogChildrenProps<any>) => React.ReactNode);
  viewFormComponent?: React.ReactNode | ((props: DialogChildrenProps<any>) => React.ReactNode);
  createClickAction?: () => void;
  editClickAction?: ((data: TData) => void) | (() => void);
  viewClickAction?: (data: TData) => void;
  refetchData?: () => void;
  onDelete?: (id: string) => Promise<void>;
  onBatchDelete?: (ids: string[]) => Promise<void>;
  onEdit?: (data: TData) => void;
  onSelected?: (ids: string[]) => void;
  actions?: TActions[];
  searchColumn?: string;
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

  // New props for grouping
  enableRowGrouping?: boolean;
  groupByField?: string;
  initialExpandedGroups?: boolean; // Whether groups should start expanded
  enableBatchUpdate?: boolean; // Enable batch update for grouped items
  enableBatchDelete?: boolean; // Enable batch delete for grouped items
  forceGrouping?: boolean; // Force grouping even for single items
}

// Hàm chuyển đổi tiếng Việt không dấu
export default function removeAccents(str: string) {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
}

export function DataTable<TData extends BaseData, TValue>({
  columns,
  data,
  title,
  description,
  createFormComponent,
  editFormComponent,
  viewFormComponent,
  createClickAction,
  editClickAction,
  viewClickAction,
  actions,
  refetchData,
  onDelete,
  onBatchDelete,
  onEdit,
  onSelected,
  searchColumn,
  searchPlaceholder = "Tìm kiếm...",
  exportData = false,
  exportFormats = ["csv", "excel", "pdf"],
  isLoading = false,
  children,
  initialPageIndex = 0,
  initialPageSize = 10,
  totalItems,
  serverSidePagination = false,
  onPageChange,
  disablePagination = false,
  serverPageSize = 20,
  customSearchFunction,

  // New props for grouping
  enableRowGrouping = false,
  groupByField,
  initialExpandedGroups = false,
  enableBatchUpdate = false,
  enableBatchDelete = false,
  forceGrouping = false,
}: DataTableProps<TData, TValue>) {
  const { theme } = useTheme();
  const { dialog, showDialog } = useDialog();

  // Table state
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [searchValue, setSearchValue] = React.useState("");

  // Pagination state
  const [pageIndex, setPageIndex] = React.useState(initialPageIndex);
  const [pageSize, setPageSize] = React.useState(initialPageSize);

  // For tracking server page
  const isFirstRender = React.useRef(true);
  const tableRef = React.useRef<any>(null);

  // 1. Add a ref to track pagination changes
  const isPaginationChange = React.useRef(false);
  const [isDataFetching, setIsDataFetching] = React.useState(false);


  const { startLoading, stopLoading, isLoading: isTableLoading, configs } = useLoading();
  const loadingKey = `table-data-${title.replace(/\s+/g, "-").toLowerCase()}`;

  React.useEffect(() => {
    if (isLoading) {
      startLoading(loadingKey, {
        variant: "table",
        skeletonConfig: { columns: columns.length + (actions ? 1 : 0), rows: initialPageSize },
      });
    } else {
      stopLoading(loadingKey);
    }
  }, [isLoading, startLoading, stopLoading, columns.length, initialPageSize, actions]);

  // Filter data based on search
  const filteredData = React.useMemo(() => {
    if (!searchValue.trim() || !searchColumn) {
      return data;
    }

    return data.filter(item => {
      // Use custom search function if provided
      if (customSearchFunction) {
        return customSearchFunction(item, searchValue);
      }

      const columnValue = item[searchColumn];
      if (columnValue == null) return false;

      const normalizedColumnValue = removeAccents(String(columnValue).toLowerCase());
      const normalizedSearchValue = removeAccents(String(searchValue).toLowerCase());

      return normalizedColumnValue.includes(normalizedSearchValue);
    });
  }, [data, searchValue, searchColumn, customSearchFunction]);



  // =============================== Grouping Logic =============================== //
  const [expandedGroups, setExpandedGroups] = React.useState<Record<string, boolean>>({});

  // Add this function to transform data
  const processedData = React.useMemo(() => {
    if (!enableRowGrouping || !groupByField) {
      return data;
    }

    // Group the data by the specified field
    const groupedByField = data.reduce<Record<string, TData[]>>((acc, item) => {
      // Safely get the group value and convert to string
      const groupValue = item[groupByField] != null ? String(item[groupByField]) : 'undefined';
      if (!acc[groupValue]) acc[groupValue] = [];
      acc[groupValue].push(item);
      return acc;
    }, {});

    // Create a flattened array with group rows
    const result: (TData | GroupedData<TData>)[] = [];

    Object.entries(groupedByField).forEach(([groupValue, items]) => {
      // Skip empty group values
      if (groupValue === 'undefined' || groupValue === '') {
        items.forEach(item => {
          result.push(item);
        });
        return;
      }

      // Only create a group if there's more than one item
      if (items.length <= 1 && !forceGrouping) {
        items.forEach(item => {
          result.push(item);
        });
        return;
      }

      const isExpanded = expandedGroups[groupValue] === true;
      const nameField = `${groupByField}Name`;
      const nameValue = items[0] && nameField in items[0] ? String(items[0][nameField]) : '';

      // Add the group row
      const groupRow: GroupedData<TData> = {
        id: `group-${groupValue}`,
        isGroupRow: true,
        groupValue: groupValue,
        groupName: nameValue,
        groupCount: items.length,
        isExpanded: isExpanded
      };

      result.push(groupRow);

      // Add child rows if expanded
      if (isExpanded) {
        items.forEach(item => {
          // Mark as child row so we can add styling
          const childItem = {
            ...item,
            isChildRow: true
          };
          result.push(childItem);
        });
      }
    });

    return result;
  }, [data, groupByField, expandedGroups, enableRowGrouping, forceGrouping]);


  const toggleGroup = React.useCallback((groupValue: string) => {
    if (!groupValue) {
      console.error("Attempted to toggle group with no groupValue");
      return;
    }

    console.log("Toggling group:", groupValue, "Current state:", expandedGroups[groupValue]);

    // Use functional update to avoid race conditions
    setExpandedGroups(prev => {
      const newState = { ...prev };
      newState[groupValue] = !prev[groupValue];

      console.log("New expanded groups state:", newState);
      return newState;
    });
  }, [expandedGroups]); // Include expandedGroups in dependencies

  // Fix for expandAllGroups and collapseAllGroups
  const expandAllGroups = React.useCallback(() => {
    // Find all unique group values in the data
    const allGroups: Record<string, boolean> = {};

    data.forEach(item => {
      if (item && groupByField && item[groupByField] != null) {
        const groupValue = String(item[groupByField]);
        if (groupValue) {
          allGroups[groupValue] = true;
        }
      }
    });

    setExpandedGroups(allGroups);
  }, [data, groupByField]);

  const collapseAllGroups = React.useCallback(() => {
    setExpandedGroups({});
  }, []);


  // Initialize expandedGroups with proper initial values
  React.useEffect(() => {
    if (enableRowGrouping && groupByField && data?.length > 0) {
      // Create a set of unique group values
      const uniqueGroups = new Set<string>();

      data.forEach(item => {
        if (item && groupByField && item[groupByField] != null) {
          const groupValue = String(item[groupByField]);
          if (groupValue && groupValue !== 'undefined') {
            uniqueGroups.add(groupValue);
          }
        }
      });

      // Initialize expanded state based on initialExpandedGroups prop
      const initialState: Record<string, boolean> = {};
      uniqueGroups.forEach(group => {
        initialState[group] = initialExpandedGroups;
      });

      console.log("Initializing expanded groups:", initialState);
      setExpandedGroups(initialState);
    }
  }, [data, groupByField, enableRowGrouping, initialExpandedGroups]);
  // ============================================================================== //



  // Manually handle the client-side pagination
  const displayData = React.useMemo(() => {
    // Bỏ điều kiện serverSidePagination
    if (disablePagination) {
      return filteredData;
    }

    const start = pageIndex * pageSize;
    const end = Math.min(start + pageSize, filteredData.length);

    return filteredData.slice(start, end);
  }, [filteredData, pageIndex, pageSize, disablePagination]);

  // Calculate which server page we need based on client page
  const getServerPageForClientPage = React.useCallback((clientPageIndex: number, clientPageSize: number) => {
    if (!serverSidePagination) return 0;

    const firstItemIndex = clientPageIndex * clientPageSize;
    const serverPageIndex = Math.floor(firstItemIndex / serverPageSize);

    return serverPageIndex;
  }, [serverPageSize, serverSidePagination]);

  // Initialize table
  const table = useReactTable({
    data: displayData,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      pagination: {
        pageIndex,
        pageSize,
      },
    },
    pageCount: serverSidePagination
      ? totalItems != null
        ? Math.ceil(totalItems / pageSize)
        : undefined
      : Math.ceil(filteredData.length / pageSize),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: (updater) => {
      const newState = typeof updater === 'function'
        ? updater({ pageIndex, pageSize })
        : updater;

      setPageIndex(newState.pageIndex);
      setPageSize(newState.pageSize);
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: (!serverSidePagination && !disablePagination) ? getPaginationRowModel() : undefined,
    manualPagination: true, // We're manually handling pagination
  });

  // Assign to ref for debugging
  tableRef.current = table;

  // Effect for pagination changes
  // React.useEffect(() => {
  //   if (!serverSidePagination || !onPageChange) return;

  //   if (isFirstRender.current) {
  //     isFirstRender.current = false;

  //     // Ensure we start with correct page on first load
  //     const initialServerPage = getServerPageForClientPage(initialPageIndex, initialPageSize);
  //     onPageChange(initialServerPage, serverPageSize);
  //     return;
  //   }

  //   // Calculate which server page we need
  //   const serverPageIndex = getServerPageForClientPage(pageIndex, pageSize);

  //   // Call API with server pagination params
  //   onPageChange(serverPageIndex, serverPageSize);
  // }, [
  //   pageIndex,
  //   pageSize,
  //   serverSidePagination,
  //   onPageChange,
  //   serverPageSize,
  //   getServerPageForClientPage,
  //   initialPageIndex,
  //   initialPageSize
  // ]);


  React.useEffect(() => {
    if (!serverSidePagination || !onPageChange) return;

    if (isFirstRender.current) {
      isFirstRender.current = false;
      const initialServerPage = getServerPageForClientPage(initialPageIndex, initialPageSize);

      // Bật loading khi bắt đầu fetch data
      startLoading(loadingKey, {
        variant: "table",
        delay: 300,
        skeletonConfig: {
          columns: columns.length + (actions ? 1 : 0),
          rows: pageSize
        },
        message: "Đang tải dữ liệu bảng...",
        customClass: "w-full"
      });
      onPageChange(initialServerPage, serverPageSize);
      return;
    }

    const serverPageIndex = getServerPageForClientPage(pageIndex, pageSize);

    startLoading(loadingKey, {
      variant: "table",
      delay: 300,
      skeletonConfig: {
        columns: columns.length + (actions ? 1 : 0),
        rows: pageSize
      },
      message: "Đang tải dữ liệu bảng...",
      customClass: "w-full"
    });

    // Only set fetching state, don't trigger full page loader
    setIsDataFetching(true);

    // Call API with server pagination params
    onPageChange(serverPageIndex, serverPageSize);

    // Safety timeout to reset loading state
    const timeoutId = setTimeout(() => {
      setIsDataFetching(false);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [
    pageIndex,
    pageSize,
    serverSidePagination,
    onPageChange,
    serverPageSize,
    getServerPageForClientPage,
    initialPageIndex,
    initialPageSize
  ])


  // 4. Add a new effect to handle data changes
  React.useEffect(() => {
    // Reset pagination flag whenever data changes
    isPaginationChange.current = false;

    // Reset data fetching state
    setIsDataFetching(false)
    // Tắt loading khi có data mới
    stopLoading(loadingKey);;
  }, [data, stopLoading]);;


  // Track selected rows
  // React.useEffect(() => {
  //   if (onSelected) {
  //     const selectedIds = table
  //       .getFilteredSelectedRowModel()
  //       .rows.map((row) => row.original.id);
  //     onSelected(selectedIds);
  //   }
  // }, [onSelected, rowSelection, table]);
  React.useEffect(() => {
    if (onSelected) {
      const selectedRows = table.getFilteredSelectedRowModel().rows;
      // Filter out group rows and only include actual data rows
      const selectedIds = selectedRows
        .filter(row => !row.original?.isGroupRow)
        .map(row => row.original.id);

      onSelected(selectedIds);
    }
  }, [onSelected, rowSelection, table]);

  // Available page sizes
  const pageSizeOptions = [5, 10, 20, 50, 100];

  // Calculate metadata for display
  const totalRows = serverSidePagination && totalItems ? totalItems : filteredData.length;
  const startRow = Math.min(pageIndex * pageSize + 1, totalRows);
  const endRow = Math.min((pageIndex + 1) * pageSize, totalRows);
  const pageCount = Math.max(1, Math.ceil(totalRows / pageSize));
  const currentPage = pageIndex + 1;
  // PART 2: Render Functions and Export Logic

  // Batch delete button
  const renderBatchDeleteButton = () => {
    const selectedRows = table.getFilteredSelectedRowModel().rows;
    const selectedCount = selectedRows.length;

    if (selectedCount === 0) return null;



    return (
      <div className="flex items-center gap-2 my-2">
        <span className="text-sm font-medium">
          {selectedCount} dòng đã chọn
        </span>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => {
            if (!onBatchDelete) return;

            // Trong phần renderBatchDeleteButton()
            const selectedRowIds = selectedRows.map(row => {
              return row.original?.isGroupRow ? null : row.original.id;
            }).filter(id => id !== null) as string[];

            showDialog({
              type: DialogType.BATCH_DELETE,
              title: `Xóa ${selectedCount} dòng đã chọn?`,
              description: "Thao tác này không thể hoàn tác.",
              onSubmit: async () => {
                try {
                  await onBatchDelete(selectedRowIds);
                  setRowSelection({});
                  if (refetchData) refetchData();

                  toast({
                    title: "Xóa hàng loạt thành công",
                    description: `${selectedCount} mục đã được xóa`,
                    variant: "default"
                  });
                  return true;
                } catch (error) {
                  console.error("Lỗi khi xóa hàng loạt:", error);
                  toast({
                    title: "Xóa hàng loạt thất bại",
                    description: error instanceof Error ? error.message : "Đã xảy ra lỗi",
                    variant: "destructive"
                  });
                  throw error;
                }
              }
            });
          }}
          className="flex items-center gap-1"
        >
          <Trash className="h-4 w-4" />
          <span>Xóa đã chọn</span>
        </Button>
      </div>
    );
  };

  // Pagination component with proper page range
  const renderPagination = () => {
    if (disablePagination) return null;

    // Generate pagination range with intelligent ellipsis
    const getPageRange = () => {
      const range: (number | 'ellipsis')[] = [];

      if (pageCount <= 7) {
        // If fewer than 7 pages, show all
        for (let i = 1; i <= pageCount; i++) {
          range.push(i);
        }
      } else {
        // Always show first page
        range.push(1);

        // Determine which pages to show based on current page
        if (currentPage <= 3) {
          range.push(2, 3, 4, 'ellipsis');
        } else if (currentPage >= pageCount - 2) {
          range.push('ellipsis', pageCount - 3, pageCount - 2, pageCount - 1);
        } else {
          range.push('ellipsis', currentPage - 1, currentPage, currentPage + 1, 'ellipsis');
        }

        // Always show last page
        if (pageCount > 1) {
          range.push(pageCount);
        }
      }

      return range;
    };

    const pageRange = getPageRange();

    const handlePreviousPage = () => {
      if (pageIndex > 0) {
        isPaginationChange.current = true;
        setPageIndex(pageIndex - 1);
      }
    };

    const handleNextPage = () => {
      if (pageIndex < pageCount - 1) {
        isPaginationChange.current = true;
        setPageIndex(pageIndex + 1);
      }
    };

    const handlePageClick = (page: number) => {
      isPaginationChange.current = true;
      setPageIndex(page - 1);
    };

    const handlePageSizeChange = (value: string) => {
      isPaginationChange.current = true;
      const newSize = Number(value);
      setPageSize(newSize);
      setPageIndex(0);
    };


    return (
      <div className="flex flex-col space-y-4 lg:flex-row lg:items-center justify-between py-4">
        {/* Page info and page size selector */}
        <div className="flex flex-col sm:flex-row items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <span>
              Hiển thị {totalRows > 0 ? startRow : 0}-
              {totalRows > 0 ? endRow : 0} trên {totalRows} dòng
            </span>
          </div>

          <div className="flex items-center whitespace-nowrap">
            <span className="text-sm mr-2">Hiển thị</span>
            <Select
              value={String(pageSize)}
              onValueChange={handlePageSizeChange}
            >
              <SelectTrigger className="h-8 w-20">
                <SelectValue>{pageSize}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size} dòng
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-sm ml-2">mỗi trang</span>
          </div>
        </div>

        {/* Selected rows info */}
        <div className="text-sm text-muted-foreground text-center">
          Đã chọn {table.getFilteredSelectedRowModel().rows.length} / {" "}
          {table.getFilteredRowModel().rows.length} dòng
        </div>

        {/* Pagination */}
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={handlePreviousPage}
                aria-disabled={pageIndex === 0}
                className={pageIndex === 0 ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>

            {pageRange.map((page, index) =>
              page === 'ellipsis' ? (
                <PaginationItem key={`ellipsis-${index}`}>
                  <PaginationEllipsis />
                </PaginationItem>
              ) : (
                <PaginationItem key={page}>
                  <PaginationLink
                    isActive={page === currentPage}
                    onClick={() => handlePageClick(Number(page))}
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              )
            )}

            <PaginationItem>
              <PaginationNext
                onClick={handleNextPage}
                aria-disabled={pageIndex >= pageCount - 1}
                className={pageIndex >= pageCount - 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>

        {/* Optional loading indicator for server-side pagination */}
        {serverSidePagination && isDataFetching && (
          <div className="flex items-center justify-center py-2">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2"></div>
            <span className="text-sm text-muted-foreground">Đang tải dữ liệu...</span>
          </div>
        )}
      </div>
    );
  };

  // Export data functions
  function prepareExportData<TData>(
    data: TData[],
    columns: ColumnDef<TData, any>[],
    shouldRemoveAccents: boolean = false
  ): { headers: string[], rows: string[][] } {
    const visibleColumns = columns.filter(col =>
      col.id !== 'select' &&
      col.id !== 'actions' &&
      col.id !== 'action'
    );

    const headers = visibleColumns.map(col => {
      let headerText = '';
      if (typeof col.header === 'function') {
        headerText = col.id || '';
      } else {
        headerText = extractPlainValue(col.header) || col.id || '';
      }

      return shouldRemoveAccents ? removeVietnameseAccents(headerText) : headerText;
    });

    const rows = data.map(row => {
      return visibleColumns.map(col => {
        let cellValue;

        if ('accessorKey' in col && typeof col.accessorKey === 'string') {
          cellValue = row[col.accessorKey as keyof TData];
        }
        else if ('accessorFn' in col && typeof col.accessorFn === 'function') {
          cellValue = col.accessorFn(row, 0);
        }
        else if (col.cell && typeof col.cell === 'function') {
          cellValue = col.id ? row[col.id as keyof TData] : '';
        }
        else if (col.id) {
          cellValue = row[col.id as keyof TData];
        } else {
          cellValue = '';
        }

        let plainValue = extractPlainValue(cellValue);
        return shouldRemoveAccents ? removeVietnameseAccents(plainValue) : plainValue;
      });
    });

    return { headers, rows };
  }

  const exportExcel = <TData extends Record<string, any>>(
    data: TData[],
    columns: ColumnDef<TData, any>[],
    title: string
  ) => {
    try {
      const { headers, rows } = prepareExportData(data, columns);
      const fileName = `${title.toLowerCase().replace(/\s+/g, "-")}-${new Date().toISOString().split("T")[0]}`;
      const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Data");
      XLSX.writeFile(workbook, `${fileName}.xlsx`);
    } catch (error) {
      console.error('Lỗi khi tạo Excel:', error);
      toast({
        title: 'Xuất Excel thất bại',
        description: error instanceof Error ? error.message : 'Đã xảy ra lỗi khi xuất dữ liệu',
        variant: 'destructive'
      });
    }
  };

  const exportCSV = <TData extends Record<string, any>>(
    data: TData[],
    columns: ColumnDef<TData, any>[],
    title: string
  ) => {
    try {
      const { headers, rows } = prepareExportData(data, columns);
      const fileName = `${title.toLowerCase().replace(/\s+/g, "-")}-${new Date().toISOString().split("T")[0]}`;
      const csvContent = [
        headers.join(","),
        ...rows.map(row => row.join(","))
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${fileName}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Lỗi khi tạo CSV:', error);
      toast({
        title: 'Xuất CSV thất bại',
        description: error instanceof Error ? error.message : 'Đã xảy ra lỗi khi xuất dữ liệu',
        variant: 'destructive'
      });
    }
  };

  const exportPDF = <TData extends Record<string, any>>(
    data: TData[],
    columns: ColumnDef<TData, any>[],
    title: string
  ) => {
    try {
      const { headers, rows } = prepareExportData(data, columns, true);
      const normalizedTitle = removeVietnameseAccents(title);
      const fileName = `${normalizedTitle.toLowerCase().replace(/\s+/g, "-")}-${new Date().toISOString().split("T")[0]}`;
      const doc = new jsPDF();
      doc.text(normalizedTitle, 14, 10);
      autoTable(doc, {
        head: [headers],
        body: rows,
        startY: 20,
        headStyles: {
          fillColor: [41, 128, 185],
          textColor: 255,
          fontStyle: 'bold'
        },
        styles: {
          font: 'helvetica',
          fontSize: 10,
          cellPadding: 3
        },
        theme: 'grid'
      });
      doc.save(`${fileName}.pdf`);
    } catch (error) {
      console.error('Lỗi khi tạo PDF:', error);
      toast({
        title: 'Xuất PDF thất bại',
        description: error instanceof Error ? error.message : 'Đã xảy ra lỗi khi xuất dữ liệu',
        variant: 'destructive'
      });
    }
  };

  const handleExportData = (format: "csv" | "excel" | "pdf") => {
    if (!data.length) return;

    switch (format) {
      case "csv":
        exportCSV(data, columns, title);
        break;
      case "excel":
        exportExcel(data, columns, title);
        break;
      case "pdf":
        exportPDF(data, columns, title);
        break;
    }
  };

  const GroupControls = () => {
    if (!enableRowGrouping) return null;

    const hasExpandedGroups = Object.values(expandedGroups).some(Boolean);
    const hasCollapsedGroups = processedData.some(
      row => row.isGroupRow && !row.isExpanded
    );

    return (
      <div className="flex gap-2 mb-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex items-center gap-1">
              <FolderIcon className="h-4 w-4 mr-1" />
              Nhóm
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem
              onClick={expandAllGroups}
              disabled={!hasCollapsedGroups}
            >
              <ChevronDownIcon className="h-4 w-4 mr-2" />
              Mở rộng tất cả
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={collapseAllGroups}
              disabled={!hasExpandedGroups}
            >
              <ChevronRightIcon className="h-4 w-4 mr-2" />
              Thu gọn tất cả
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {enableBatchUpdate && (
          <Button
            onClick={() => {
              // Get all selected rows that belong to the same group
              const selectedRowIds = table.getFilteredSelectedRowModel().rows
                .filter(row => !row.original?.isGroupRow)
                .map(row => row.original.id);

              if (selectedRowIds.length === 0) return;

              // Show batch edit form
              showDialog({
                type: DialogType.EDIT,
                title: "Chỉnh sửa hàng loạt",
                data: { selectedIds: selectedRowIds },
                children: editFormComponent
              });
            }}
            variant="outline"
            disabled={table.getFilteredSelectedRowModel().rows.length === 0}
            className="flex items-center gap-1"
          >
            <EditIcon className="h-4 w-4 mr-1" />
            Chỉnh sửa hàng loạt
          </Button>
        )}
      </div>
    );
  };


  // Main render
  return (
    <div className="min-h-[calc(100vh-2rem)] flex-1 rounded-xl bg-white dark:bg-gray-950 md:min-h-min border border-gray-200 shadow-sm p-2 sm:p-4">
      <div className="flex flex-col sm:flex-row gap-2 justify-between items-start sm:items-center mb-4">
        <span className="text-lg font-semibold">{title}</span>

        {actions && actions.includes("create") && !isLoading && (
          <CreateActionDialog
            name={title}
            description={description}
            children={createFormComponent}
            onClick={createClickAction}
          />
        )}
        {/* {isLoading && (
          <div className="h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        )} */}
      </div>


      <div className="w-full">
        {enableRowGrouping && <GroupControls />}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between py-2 sm:py-4 gap-2">
          <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center w-full sm:w-auto">
            {searchColumn && (
              <div className="relative w-full sm:max-w-sm">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={searchPlaceholder}
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  className="pl-8 w-full"
                />
              </div>
            )}

            {exportData && data.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1 w-full sm:w-auto justify-center"
                  >
                    <Download className="h-4 w-4" />
                    <span className="sm:inline">Xuất dữ liệu</span>
                    <ChevronDown className="h-4 w-4 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {(!exportFormats || exportFormats.includes("csv")) && (
                    <DropdownMenuCheckboxItem
                      className="cursor-pointer"
                      onClick={() => handleExportData("csv")}
                    >
                      <FileText className="h-4 w-4 mr-2 text-blue-500" />
                      CSV (.csv)
                    </DropdownMenuCheckboxItem>
                  )}
                  {(!exportFormats || exportFormats.includes("excel")) && (
                    <DropdownMenuCheckboxItem
                      className="cursor-pointer"
                      onClick={() => handleExportData("excel")}
                    >
                      <FileSpreadsheet className="h-4 w-4 mr-2 text-green-500" />
                      Excel (.xlsx)
                    </DropdownMenuCheckboxItem>
                  )}
                  {(!exportFormats || exportFormats.includes("pdf")) && (
                    <DropdownMenuCheckboxItem
                      className="cursor-pointer"
                      onClick={() => handleExportData("pdf")}
                    >
                      <FileType className="h-4 w-4 mr-2 text-red-500" />
                      PDF (.pdf)
                    </DropdownMenuCheckboxItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Column visibility dropdown */}
          <div className="flex gap-2 w-full sm:w-auto">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full sm:ml-auto sm:w-auto">
                  <span className="mr-1">Cột</span><ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {table
                  .getAllColumns()
                  .filter((column) => column.getCanHide())
                  .map((column) => {
                    return (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        className="capitalize"
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) =>
                          column.toggleVisibility(!!value)
                        }
                      >
                        {/* {column.getName()} */}
                        {typeof column.columnDef.header === "string"
                          ? column.columnDef.header
                          : column.id}
                      </DropdownMenuCheckboxItem>
                    );
                  })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Table */}

        <div className="overflow-x-auto border rounded-md">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  <TableHead key="select" className="whitespace-nowrap">
                    STT
                  </TableHead>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} className="whitespace-nowrap">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                    </TableHead>
                  ))}
                  {(actions && (actions.includes("edit") || actions.includes("delete") || actions.includes("read-only"))) && (
                    <TableHead key="actions" className="whitespace-nowrap">Thao tác</TableHead>
                  )}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {/* {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row, rowIndex) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
                    >
                      <TableCell key="select" className="py-2">
                        {enableRowGrouping && row.original?.isGroupRow
                          ? <span className="text-xs text-muted-foreground">Nhóm</span>
                          : pageIndex * pageSize + rowIndex + 1}
                      </TableCell> */}
              {/* {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className="py-2">
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))} */}
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row, rowIndex) => {
                  const isGroupRow = row.original?.isGroupRow === true;
                  const isChildRow = row.original?.isChildRow === true;

                  return (
                    <TableRow
                      key={isGroupRow ? `group-${row.original.groupValue}` : row.id}
                      data-state={row.getIsSelected() && "selected"}
                      className={`${isGroupRow ? 'group-row' : ''} ${isChildRow ? 'child-row' : ''}`}
                    // className={isChildRow ? "bg-muted/30" : ""}
                    >
                      <TableCell key="select" className="py-2">
                        {isGroupRow
                          ? <span className="text-xs text-muted-foreground">Nhóm</span>
                          : pageIndex * pageSize + rowIndex + 1}
                      </TableCell>

                      {row.getVisibleCells().map((cell) => {
                        const column = cell.column;

                        // Handle group row special case
                        if (isGroupRow) {
                          // For the first column, show the group header with expand/collapse button
                          if (column.id === columns[0].id) {
                            return (
                              <TableCell key={cell.id} className="py-2">
                                <div className="flex items-center">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => row.original.groupValue && toggleGroup(row.original.groupValue)}
                                    className="h-6 w-6 mr-1 p-0"
                                  >
                                    {row.original.isExpanded ? (
                                      <ChevronDown className="h-4 w-4" />
                                    ) : (
                                      <ChevronRight className="h-4 w-4" />
                                    )}
                                  </Button>
                                  <span className="font-medium">
                                    {row.original.groupName || row.original.groupValue}
                                  </span>
                                  <span className="ml-2 px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-xs rounded-full">
                                    {row.original.groupCount}
                                  </span>
                                </div>
                              </TableCell>
                            );
                          }
                          // Other columns in group row should be empty
                          return <TableCell key={cell.id} className="py-2"></TableCell>;
                        }

                        // Child row styling for the first column
                        if (isChildRow && column.id === columns[0].id) {
                          return (
                            <TableCell key={cell.id} className="py-2 pl-8">
                              {flexRender(column.columnDef.cell, cell.getContext())}
                            </TableCell>
                          );
                        }

                        // Standard cell rendering
                        return (
                          <TableCell key={cell.id} className="py-2">
                            {flexRender(column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        );
                      })}
                      {(actions && (actions.includes("edit") || actions.includes("delete") || actions.includes("read-only"))) && (
                        <TableCell key={`${row.id}-actions`} className="py-2">
                          {!isGroupRow && (
                            <ButtonGroupAction
                              actions={actions}
                              onEdit={(data) => onEdit && onEdit(data)}
                              onDelete={async (id) => onDelete && await onDelete(id)}
                              onRefetchData={refetchData}
                              rowData={row.original}
                              editComponent={editFormComponent}
                              viewComponent={viewFormComponent}
                              editClick={editClickAction}
                            />
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  )
                })
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length + ((actions ?? []).includes("edit") || (actions ?? []).includes("delete") || (actions ?? []).includes("read-only") ? 2 : 1)}
                    className="h-24 text-center"
                  >
                    {Object.entries(configs).map(([key, config]) => (
                      <TableSkeletonLoader key={key} config={config} onExitComplete={() => stopLoading(key)} />
                    ))}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {renderBatchDeleteButton()}

        {/* Phân trang với ShadcnUI */}
        {!disablePagination && renderPagination()}


      </div>
    </div>
  );
}