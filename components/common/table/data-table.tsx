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
import { ChevronDown, Download, FileSpreadsheet, FileText, FileType, Search, Trash } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
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
import PageLoader from '../PageLoader';
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

// Explicitly define types and actions
export type TActions = "create" | "edit" | "delete" | "read-only";

export interface BaseData {
  id: string;
  [key: string]: any;
}

interface DataTableProps<TData extends BaseData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  title: string;
  description?: string;
  createFormComponent?: React.ReactNode | ((props: DialogChildrenProps<any>) => React.ReactNode);
  editFormComponent?: React.ReactNode | ((props: DialogChildrenProps<any>) => React.ReactNode);
  viewFormComponent?: React.ReactNode | ((props: DialogChildrenProps<any>) => React.ReactNode);
  refetchData?: () => void;
  onDelete?: (id: string) => Promise<void>;
  onBatchDelete?: (ids: string[]) => Promise<void>;
  onEdit?: (data: TData) => void;
  onSelected?: (ids: string[]) => void;
  actions: TActions[];
  searchColumn?: string;
  searchPlaceholder?: string;
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
}

// Hàm chuyển đổi tiếng Việt không dấu
function removeAccents(str: string) {
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

  // Filter data based on search
  const filteredData = React.useMemo(() => {
    if (!searchValue.trim() || !searchColumn) {
      return data;
    }

    return data.filter(item => {
      const columnValue = item[searchColumn];
      if (columnValue == null) return false;

      const normalizedColumnValue = removeAccents(String(columnValue).toLowerCase());
      const normalizedSearchValue = removeAccents(String(searchValue).toLowerCase());

      return normalizedColumnValue.includes(normalizedSearchValue);
    });
  }, [data, searchValue, searchColumn]);

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
      onPageChange(initialServerPage, serverPageSize);
      return;
    }

    const serverPageIndex = getServerPageForClientPage(pageIndex, pageSize);

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
    setIsDataFetching(false);
  }, [data]);;


  // Track selected rows
  React.useEffect(() => {
    if (onSelected) {
      const selectedIds = table
        .getFilteredSelectedRowModel()
        .rows.map((row) => row.original.id);
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

            const selectedIds = selectedRows.map(row => row.original.id);

            showDialog({
              type: DialogType.DELETE,
              title: `Xóa ${selectedCount} dòng đã chọn?`,
              description: "Thao tác này không thể hoàn tác.",
              onSubmit: async () => {
                try {
                  await onBatchDelete(selectedIds);
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

  // Main render
  return (
    <div className="min-h-[calc(100vh-2rem)] flex-1 rounded-xl bg-white dark:bg-gray-950 md:min-h-min border border-gray-200 shadow-sm p-2 sm:p-4">
      <div className="flex flex-col sm:flex-row gap-2 justify-between items-start sm:items-center mb-4">
        <span className="text-lg font-semibold">{title}</span>
        {actions.includes("create") && !isLoading && (
          <CreateActionDialog
            name={title}
            description={description}
            children={createFormComponent}
          />
        )}
        {isLoading && (
          <div className="h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        )}
      </div>

      <PageLoader
        skeletonColumns={columns.length + (actions.includes("edit") || actions.includes("delete") || actions.includes("read-only") ? 1 : 0)}
        skeletonRows={initialPageSize}
        showTableSkeleton={true}
        // isLoading={isLoading && !dialog.open}
        isLoading={isLoading && !isPaginationChange.current && !dialog.open}
        darkMode={theme === "dark"}
        loadingTime={2000}
        skeletonLoadingTime={2500}
      >
        <div className="w-full">
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
                          {column.id}
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
                    {(actions.includes("edit") || actions.includes("delete") || actions.includes("read-only")) && (
                      <TableHead key="actions" className="whitespace-nowrap">Thao tác</TableHead>
                    )}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row, rowIndex) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
                    >
                      <TableCell key="select" className="py-2">
                        {pageIndex * pageSize + rowIndex + 1}
                      </TableCell>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className="py-2">
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                      {(actions.includes("edit") || actions.includes("delete") || actions.includes("read-only")) && (
                        <TableCell key={`${row.id}-actions`} className="py-2">
                          <ButtonGroupAction
                            actions={actions}
                            onEdit={(data) => onEdit && onEdit(data)}
                            onDelete={async (id) => onDelete && await onDelete(id)}
                            onRefetchData={refetchData}
                            rowData={row.original}
                            editComponent={editFormComponent}
                            viewComponent={viewFormComponent}
                          />
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length + (actions.includes("edit") || actions.includes("delete") || actions.includes("read-only") ? 2 : 1)}
                      className="h-24 text-center"
                    >
                      Không có dữ liệu.
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
      </PageLoader>
    </div>
  );
}



































// "use client";

// import * as React from "react";
// import {
//   ColumnDef,
//   ColumnFiltersState,
//   SortingState,
//   VisibilityState,
//   flexRender,
//   getCoreRowModel,
//   getFilteredRowModel,
//   getPaginationRowModel,
//   getSortedRowModel,
//   useReactTable,
// } from "@tanstack/react-table";
// import { ChevronDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Download, FileSpreadsheet, FileText, FileType, Search, Trash } from "lucide-react";

// import { Button } from "@/components/ui/button";
// import {
//   DropdownMenu,
//   DropdownMenuCheckboxItem,
//   DropdownMenuContent,
//   DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu";
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from "@/components/ui/table";
// import { Input } from "@/components/ui/input";
// import { CreateActionDialog } from "./actions/popup-create";
// import * as XLSX from 'xlsx';
// import { jsPDF } from "jspdf"
// import autoTable from 'jspdf-autotable'
// import ButtonGroupAction from "./actions/button-group-actions";
// import PageLoader from '../PageLoader';
// import { useTheme } from "next-themes";
// import { DialogChildrenProps, DialogType, useDialog } from "@/context/DialogProvider";
// import { extractPlainValue, removeVietnameseAccents } from "@/utils";
// import { toast } from "@/hooks/use-toast";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import {
//   Pagination,
//   PaginationContent,
//   PaginationEllipsis,
//   PaginationItem,
//   PaginationLink,
//   PaginationNext,
//   PaginationPrevious,
// } from "@/components/ui/pagination";


// // Explicitly define types and actions
// export type TActions = "create" | "edit" | "delete" | "read-only";

// export interface BaseData {
//   id: string;
//   [key: string]: any;
// }

// interface DataTableProps<TData extends BaseData, TValue> {
//   columns: ColumnDef<TData, TValue>[];
//   data: TData[];
//   title: string;
//   description?: string;
//   // createFormComponent?: React.ReactNode;
//   // editFormComponent?: React.ReactNode;
//   // viewFormComponent?: React.ReactNode;
//   createFormComponent?: React.ReactNode | ((props: DialogChildrenProps<any>) => React.ReactNode);
//   editFormComponent?: React.ReactNode | ((props: DialogChildrenProps<any>) => React.ReactNode);
//   viewFormComponent?: React.ReactNode | ((props: DialogChildrenProps<any>) => React.ReactNode);
//   refetchData?: () => void;
//   onDelete?: (id: string) => Promise<void>;
//   onBatchDelete?: (ids: string[]) => Promise<void>;
//   onEdit?: (data: TData) => void;
//   onSelected?: (ids: string[]) => void;
//   actions: TActions[];
//   searchColumn?: string;
//   searchPlaceholder?: string;
//   exportData?: boolean;
//   exportFormats?: Array<"csv" | "excel" | "pdf">;
//   isLoading?: boolean;
//   children?: React.ReactNode;

//   // Thêm hai props mới cho phân trang server-side
//   initialPageIndex?: number;  // Thêm prop cho trang ban đầu (zero-based)
//   initialPageSize?: number;   // Giữ nguyên
//   totalItems?: number;        // Giữ nguyên
//   serverSidePagination?: boolean; // Giữ nguyên
//   onPageChange?: (pageIndex: number, pageSize: number) => void; // Cập nhật tham số để rõ ràng hơn
//   disablePagination?: boolean; // Thêm tuỳ chọn tắt phân trang

//   serverPageSize?: number;
// }
// // Hàm chuyển đổi tiếng Việt không dấu
// function removeAccents(str: string) {
//   return str
//     .normalize('NFD')
//     .replace(/[\u0300-\u036f]/g, '')
//     .replace(/đ/g, 'd')
//     .replace(/Đ/g, 'D');
// }

// export function DataTable<TData extends BaseData, TValue>({
//   columns,
//   data,
//   title,
//   description,
//   createFormComponent,
//   editFormComponent,
//   viewFormComponent,
//   actions,
//   refetchData,
//   onDelete,
//   onBatchDelete,
//   onEdit,
//   onSelected,
//   searchColumn,
//   searchPlaceholder = "Tìm kiếm...",
//   exportData = false,
//   exportFormats = ["csv", "excel", "pdf"],
//   isLoading = false,
//   children,
//   initialPageIndex = 0, // Thêm giá trị mặc định cho initialPageIndex
//   initialPageSize = 10,
//   totalItems,
//   serverSidePagination = false,
//   onPageChange,
//   disablePagination = false,
//   serverPageSize = 20,
// }: DataTableProps<TData, TValue>) {

//   const { theme } = useTheme();
//   const { dialog } = useDialog();
//   const [sorting, setSorting] = React.useState<SortingState>([]);
//   const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
//   const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
//   const [rowSelection, setRowSelection] = React.useState({});

//   // Tạo biến state riêng cho giá trị tìm kiếm
//   const [searchValue, setSearchValue] = React.useState("");


//   // Thêm state cho input chuyển trang
//   const [gotoPage, setGotoPage] = React.useState("");
//   // Thêm ref để tránh gọi onPageChange khi component mount
//   const isInitialRender = React.useRef(true);
//   // 3. Khởi tạo tableRef để tránh lỗi circular dependency
//   const tableRef = React.useRef<any>(null);

//   // Tạo state riêng cho kết quả lọc
//   const [filteredData, setFilteredData] = React.useState<TData[]>(data);

//   // Xử lý tìm kiếm thủ công
//   React.useEffect(() => {
//     if (!searchValue.trim() || !searchColumn) {
//       setFilteredData(data);
//       return;
//     }

//     // Lọc dữ liệu thủ công
//     const filtered = data.filter(item => {
//       // Lấy giá trị của cột cần tìm kiếm
//       const columnValue = item[searchColumn];

//       // Nếu không có giá trị, bỏ qua
//       if (columnValue == null) return false;

//       // Chuẩn hóa cả giá trị cột và giá trị tìm kiếm
//       const normalizedColumnValue = removeAccents(String(columnValue).toLowerCase());
//       const normalizedSearchValue = removeAccents(String(searchValue).toLowerCase());

//       // Kiểm tra nếu giá trị cột chứa giá trị tìm kiếm
//       return normalizedColumnValue.includes(normalizedSearchValue);
//     });

//     setFilteredData(filtered);
//   }, [data, searchValue, searchColumn]);

//   // 5. Cải tiến logic khởi tạo table với xử lý phân trang tốt hơn
//   const table = useReactTable({
//     data: filteredData,
//     columns,
//     onSortingChange: setSorting,
//     onColumnFiltersChange: setColumnFilters,
//     getCoreRowModel: getCoreRowModel(),
//     getPaginationRowModel: disablePagination ? undefined : getPaginationRowModel(),
//     getSortedRowModel: getSortedRowModel(),
//     getFilteredRowModel: getFilteredRowModel(),
//     onColumnVisibilityChange: setColumnVisibility,
//     onRowSelectionChange: setRowSelection,
//     state: {
//       sorting,
//       columnFilters,
//       columnVisibility,
//       rowSelection,
//     },

//     // Cải tiến cấu hình phân trang
//     initialState: {
//       pagination: {
//         pageIndex: initialPageIndex,
//         pageSize: initialPageSize,
//       },
//     },

//     // Xử lý phân trang server-side
//     manualPagination: serverSidePagination,

//     // Cải tiến cách tính pageCount để tránh bị lỗi khi không có dữ liệu
//     pageCount: serverSidePagination
//       ? totalItems != null
//         ? Math.max(1, Math.ceil(totalItems / initialPageSize))
//         : undefined
//       : undefined, // Để undefined để tự động tính từ filteredData.length với client-side pagination
//   });

//   // Gán table cho tableRef để có thể sử dụng trong các effect
//   tableRef.current = table;

//   // 6. Cải tiến callback xử lý thay đổi trang và pageSize
//   React.useEffect(() => {
//     if (!serverSidePagination || !onPageChange) {
//       return;
//     }

//     // Lấy state pagination hiện tại
//     const { pageIndex, pageSize } = table.getState().pagination;

//     // Trong lần render đầu tiên, kiểm tra xem có cần cập nhật không
//     if (isInitialRender.current) {
//       console.log("Initial render, checking if we need to sync page size");

//       // Nếu pageSize từ prop khác với pageSize trong state, cập nhật
//       if (initialPageSize !== pageSize) {
//         console.log(`Initial pageSize mismatch: state=${pageSize}, prop=${initialPageSize}`);
//         // Không gọi onPageChange ở đây để tránh API call không cần thiết
//       }

//       isInitialRender.current = false;
//       return;
//     }

//     console.log(`Pagination state changed: pageIndex=${pageIndex}, pageSize=${pageSize}`);

//     // Gọi callback với pageIndex và pageSize mới
//     onPageChange(pageIndex, pageSize);

//   }, [
//     serverSidePagination,
//     onPageChange,
//     initialPageSize,
//     // Sử dụng các giá trị cụ thể từ state pagination thay vì toàn bộ đối tượng table
//     // Điều này đảm bảo effect chỉ chạy khi giá trị pagination thực sự thay đổi
//     table.getState().pagination.pageIndex,
//     table.getState().pagination.pageSize
//   ]);

//   // Các tùy chọn cho số mục trên mỗi trang
//   const pageSizeOptions = [5, 10, 20, 50, 100];

//   // Hàm xử lý khi thay đổi số mục trên mỗi trang
//   const handlePageSizeChange = React.useCallback(
//     (newPageSize: number) => {
//       table.setPageSize(newPageSize);
//       // table.setPageIndex(0); // Có thể thêm để reset về trang đầu khi thay đổi pageSize
//     },
//     [table]
//   );

//   const renderBatchDeleteButton = () => {
//     const selectedRows = table.getFilteredSelectedRowModel().rows;
//     const selectedCount = selectedRows.length;

//     if (selectedCount === 0) return null;

//     // Get your dialog context - đã có sẵn trong component
//     const { showDialog } = useDialog();

//     return (
//       <div className="flex items-center gap-2 my-2">
//         <span className="text-sm font-medium">
//           {selectedCount} dòng đã chọn
//         </span>
//         <Button
//           variant="destructive"
//           size="sm"
//           onClick={() => {
//             if (!onBatchDelete) return;

//             const selectedIds = selectedRows.map(row => row.original.id);

//             // Hiển thị dialog xác nhận trước khi xóa
//             showDialog({
//               type: DialogType.DELETE,
//               title: `Xóa ${selectedCount} dòng đã chọn?`,
//               description: "Thao tác này không thể hoàn tác.",
//               onSubmit: async () => {
//                 try {
//                   await onBatchDelete(selectedIds);
//                   setRowSelection({});
//                   if (refetchData) refetchData();

//                   toast({
//                     title: "Xóa hàng loạt thành công",
//                     description: `${selectedCount} mục đã được xóa`,
//                     variant: "default"
//                   });
//                   return true;
//                 } catch (error) {
//                   console.error("Lỗi khi xóa hàng loạt:", error);
//                   toast({
//                     title: "Xóa hàng loạt thất bại",
//                     description: error instanceof Error ? error.message : "Đã xảy ra lỗi",
//                     variant: "destructive"
//                   });
//                   throw error;
//                 }
//               }
//             });
//           }}
//           className="flex items-center gap-1"
//         >
//           <Trash className="h-4 w-4" />
//           <span>Xóa đã chọn</span>
//         </Button>
//       </div>
//     );
//   };

//   // 6. Cải tiến hàm render nút phân trang - thêm xử lý cho nhiều trang
//   const renderPaginationButtons = () => {
//     if (disablePagination) return null;

//     const currentPage = table.getState().pagination.pageIndex;
//     const pageCount = table.getPageCount();

//     // Nếu không có trang, hiển thị nút mặc định không có chức năng
//     if (pageCount <= 0) {
//       return (
//         <Button
//           key={0}
//           variant="default"
//           size="sm"
//           disabled
//           className="w-8 h-8 p-0"
//         >
//           1
//         </Button>
//       );
//     }

//     // Nếu có ít hơn hoặc bằng 7 trang, hiển thị tất cả
//     if (pageCount <= 7) {
//       return Array.from({ length: pageCount }, (_, i) => (
//         <Button
//           key={i}
//           variant={currentPage === i ? "default" : "outline"}
//           size="sm"
//           onClick={() => table.setPageIndex(i)}
//           className="w-8 h-8 p-0"
//         >
//           {i + 1}
//         </Button>
//       ));
//     }

//     // Mẫu hiển thị: First ... [Current-1] Current [Current+1] ... Last
//     const pages = [];

//     // Luôn hiển thị trang đầu
//     pages.push(
//       <Button
//         key={0}
//         variant={currentPage === 0 ? "default" : "outline"}
//         size="sm"
//         onClick={() => table.setPageIndex(0)}
//         className="w-8 h-8 p-0"
//       >
//         1
//       </Button>
//     );

//     // Logic hiển thị trang với các trường hợp đầu, giữa, cuối
//     if (currentPage <= 3) {
//       // Gần đầu: hiển thị các trang 2, 3, 4
//       for (let i = 1; i <= 3; i++) {
//         if (i < pageCount - 1) {
//           pages.push(
//             <Button
//               key={i}
//               variant={currentPage === i ? "default" : "outline"}
//               size="sm"
//               onClick={() => table.setPageIndex(i)}
//               className="w-8 h-8 p-0"
//             >
//               {i + 1}
//             </Button>
//           );
//         }
//       }
//       // Thêm dấu chấm lửng nếu cần
//       if (pageCount > 5) {
//         pages.push(
//           <span
//             key="ellipsis1"
//             className="px-2 flex items-center"
//             aria-hidden
//           >
//             ...
//           </span>
//         );
//       }
//     } else if (currentPage >= pageCount - 4) {
//       // Gần cuối: hiển thị dấu chấm lửng và 3 trang cuối
//       if (pageCount > 5) {
//         pages.push(
//           <span
//             key="ellipsis1"
//             className="px-2 flex items-center"
//             aria-hidden
//           >
//             ...
//           </span>
//         );
//       }

//       for (let i = pageCount - 4; i < pageCount - 1; i++) {
//         pages.push(
//           <Button
//             key={i}
//             variant={currentPage === i ? "default" : "outline"}
//             size="sm"
//             onClick={() => table.setPageIndex(i)}
//             className="w-8 h-8 p-0"
//           >
//             {i + 1}
//           </Button>
//         );
//       }
//     } else {
//       // Ở giữa: hiển thị dấu chấm lửng, trang hiện tại và các trang lân cận
//       pages.push(
//         <span
//           key="ellipsis1"
//           className="px-2 flex items-center"
//           aria-hidden
//         >
//           ...
//         </span>
//       );

//       // Hiển thị trang trước, hiện tại và sau
//       for (let i = currentPage - 1; i <= currentPage + 1; i++) {
//         pages.push(
//           <Button
//             key={i}
//             variant={currentPage === i ? "default" : "outline"}
//             size="sm"
//             onClick={() => table.setPageIndex(i)}
//             className="w-8 h-8 p-0"
//           >
//             {i + 1}
//           </Button>
//         );
//       }

//       pages.push(
//         <span
//           key="ellipsis2"
//           className="px-2 flex items-center"
//           aria-hidden
//         >
//           ...
//         </span>
//       );
//     }

//     // Luôn hiển thị trang cuối
//     if (pageCount > 1) {
//       pages.push(
//         <Button
//           key={pageCount - 1}
//           variant={currentPage === pageCount - 1 ? "default" : "outline"}
//           size="sm"
//           onClick={() => table.setPageIndex(pageCount - 1)}
//           className="w-8 h-8 p-0"
//         >
//           {pageCount}
//         </Button>
//       );
//     }

//     return pages;
//   };

//   // 7. Cải tiến hàm xử lý chuyển trang thủ công
//   const handleGotoPage = (e: React.KeyboardEvent<HTMLInputElement>) => {
//     if (e.key === 'Enter') {
//       const pageNumber = parseInt(gotoPage, 10);
//       if (!isNaN(pageNumber) && pageNumber >= 1 && pageNumber <= table.getPageCount()) {
//         table.setPageIndex(pageNumber - 1);

//         // Nếu là server-side pagination, không cần trigger effect riêng
//         // vì table.setPageIndex sẽ thay đổi pageIndex, kích hoạt effect trên
//       }

//       // Reset input sau khi xử lý
//       setGotoPage("");
//     }
//   };

//   // 8. Phần render phân trang cải tiến
//   const renderPagination = () => {
//     if (disablePagination) return null;

//     const pageCount = table.getPageCount() || 1;
//     const { pageIndex, pageSize } = table.getState().pagination;
//     const currentPage = pageIndex + 1;

//     const startRow = pageIndex * pageSize + 1;
//     const endRow = Math.min(
//       (pageIndex + 1) * pageSize,
//       serverSidePagination && totalItems ? totalItems : filteredData.length
//     );
//     const totalRows = serverSidePagination && totalItems ? totalItems : filteredData.length;

//     // Tạo danh sách các trang hiển thị
//     const getPageRange = () => {
//       // Luôn hiển thị trang đầu, trang cuối, trang hiện tại và trang xung quanh trang hiện tại
//       const range: (number | 'ellipsis')[] = [];

//       if (pageCount <= 7) {
//         // Hiển thị tất cả trang nếu ít hơn 7
//         for (let i = 1; i <= pageCount; i++) {
//           range.push(i);
//         }
//       } else {
//         // Luôn hiển thị trang đầu
//         range.push(1);

//         // Xử lý khoảng giữa
//         if (currentPage <= 3) {
//           // Gần đầu
//           range.push(2, 3, 4, 'ellipsis');
//         } else if (currentPage >= pageCount - 2) {
//           // Gần cuối
//           range.push('ellipsis', pageCount - 3, pageCount - 2, pageCount - 1);
//         } else {
//           // Ở giữa
//           range.push('ellipsis', currentPage - 1, currentPage, currentPage + 1, 'ellipsis');
//         }

//         // Luôn hiển thị trang cuối
//         range.push(pageCount);
//       }

//       return range;
//     };

//     const pageRange = getPageRange();

//     return (
//       <div className="flex flex-col space-y-4 lg:flex-row lg:items-center justify-between py-4">
//         <div className="flex flex-col sm:flex-row items-center gap-4 text-sm text-muted-foreground">
//           <div className="flex items-center gap-2">
//             <span>
//               Hiển thị {totalRows > 0 ? startRow : 0}-
//               {totalRows > 0 ? endRow : 0} trên {totalRows} dòng
//             </span>
//           </div>

//           {/* Select số mục trên mỗi trang */}
//           <div className="flex items-center whitespace-nowrap">
//             <span className="text-sm mr-2">Hiển thị</span>
//             <Select
//               value={String(pageSize)}
//               onValueChange={(value) => table.setPageSize(Number(value))}
//             >
//               <SelectTrigger className="h-8 w-20">
//                 <SelectValue>{pageSize}</SelectValue>
//               </SelectTrigger>
//               <SelectContent>
//                 {pageSizeOptions.map((size) => (
//                   <SelectItem key={size} value={String(size)}>
//                     {size} dòng
//                   </SelectItem>
//                 ))}
//               </SelectContent>
//             </Select>
//             <span className="text-sm ml-2">mỗi trang</span>
//           </div>
//         </div>

//         {/* Thông tin về số dòng đã chọn */}
//         <div className="text-sm text-muted-foreground text-center">
//           Đã chọn {table.getFilteredSelectedRowModel().rows.length} / {" "}
//           {table.getFilteredRowModel().rows.length} dòng
//         </div>

//         {/* Phân trang bằng Shadcn UI Pagination */}
//         <Pagination>
//           <PaginationContent>
//             <PaginationItem>
//               <PaginationPrevious
//                 onClick={() => table.previousPage()}
//                 // disabled={!table.getCanPreviousPage()}
//                 aria-disabled={!table.getCanPreviousPage()}
//                 className={!table.getCanPreviousPage() ? "pointer-events-none opacity-50" : "cursor-pointer"}
//               />
//             </PaginationItem>

//             {pageRange.map((page, index) =>
//               page === 'ellipsis' ? (
//                 <PaginationItem key={`ellipsis-${index}`}>
//                   <PaginationEllipsis />
//                 </PaginationItem>
//               ) : (
//                 <PaginationItem key={page}>
//                   <PaginationLink
//                     isActive={page === currentPage}
//                     onClick={() => table.setPageIndex(Number(page) - 1)}
//                   >
//                     {page}
//                   </PaginationLink>
//                 </PaginationItem>
//               )
//             )}

//             <PaginationItem>
//               <PaginationNext
//                 onClick={() => table.nextPage()}
//                 // disabled={!table.getCanNextPage()}
//                 aria-disabled={!table.getCanNextPage()}
//                 className={!table.getCanNextPage() ? "pointer-events-none opacity-50" : "cursor-pointer"}
//               />
//             </PaginationItem>
//           </PaginationContent>
//         </Pagination>
//       </div>
//     );
//   };


//   // Callback to handle row selection changes
//   React.useEffect(() => {
//     if (onSelected) {
//       const selectedIds = table
//         .getFilteredSelectedRowModel()
//         .rows.map((row) => row.original.id);
//       onSelected(selectedIds);
//     }
//   }, [onSelected, rowSelection, table]);

//   const exportExcel = <TData extends Record<string, any>>(
//     data: TData[],
//     columns: ColumnDef<TData, any>[],
//     title: string
//   ) => {
//     try {
//       // Trích xuất dữ liệu thuần túy
//       const { headers, rows } = prepareExportData(data, columns);

//       // Tạo tên file
//       const fileName = `${title.toLowerCase().replace(/\s+/g, "-")}-${new Date().toISOString().split("T")[0]}`;

//       // Tạo worksheet
//       const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
//       const workbook = XLSX.utils.book_new();
//       XLSX.utils.book_append_sheet(workbook, worksheet, "Data");

//       // Xuất file
//       XLSX.writeFile(workbook, `${fileName}.xlsx`);
//       console.log('Xuất Excel thành công với', rows.length, 'dòng');
//     } catch (error) {
//       console.error('Lỗi khi tạo Excel:', error);
//       alert('Có lỗi xảy ra khi tạo file Excel.');
//     }
//   };

//   // 3. Cập nhật hàm xuất CSV
//   const exportCSV = <TData extends Record<string, any>>(
//     data: TData[],
//     columns: ColumnDef<TData, any>[],
//     title: string
//   ) => {
//     try {
//       // Trích xuất dữ liệu thuần túy
//       const { headers, rows } = prepareExportData(data, columns);

//       // Tạo tên file
//       const fileName = `${title.toLowerCase().replace(/\s+/g, "-")}-${new Date().toISOString().split("T")[0]}`;

//       // Tạo nội dung CSV
//       const csvContent = [
//         headers.join(","),
//         ...rows.map(row => row.join(","))
//       ].join("\n");

//       // Tạo blob và tải xuống
//       const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
//       const url = URL.createObjectURL(blob);

//       const link = document.createElement("a");
//       link.href = url;
//       link.download = `${fileName}.csv`;
//       document.body.appendChild(link);
//       link.click();
//       document.body.removeChild(link);
//       URL.revokeObjectURL(url);

//       console.log('Xuất CSV thành công với', rows.length, 'dòng');
//     } catch (error) {
//       console.error('Lỗi khi tạo CSV:', error);
//       alert('Có lỗi xảy ra khi tạo file CSV.');
//     }
//   };
//   const exportDataToFormat = <TData extends Record<string, any>>(
//     format: "csv" | "excel" | "pdf",
//     data: TData[],
//     columns: ColumnDef<TData, any>[],
//     title: string
//   ) => {
//     if (!data.length) return;

//     switch (format) {
//       case "csv":
//         exportCSV(data, columns, title);
//         break;
//       case "excel":
//         exportExcel(data, columns, title);
//         break;
//       case "pdf":
//         exportPDF(data, columns, title);
//         break;
//     }
//   };

//   // 2. Sửa đổi hàm handleExportData trong component DataTable của bạn
//   // Thay thế toàn bộ hàm hiện tại với hàm này:
//   const handleExportData = (format: "csv" | "excel" | "pdf") => {
//     if (!data.length) return;

//     // Gọi hàm xuất dữ liệu mới
//     exportDataToFormat(format, data, columns, title);
//   };


//   // Hàm chuẩn bị dữ liệu cho việc xuất - phiên bản có xử lý tiếng Việt
//   function prepareExportData<TData>(
//     data: TData[],
//     columns: ColumnDef<TData, any>[],
//     shouldRemoveAccents: boolean = false
//   ): { headers: string[], rows: string[][] } {
//     // Lấy tiêu đề cột, bỏ qua cột select và action
//     const visibleColumns = columns.filter(col =>
//       col.id !== 'select' &&
//       col.id !== 'actions' &&
//       col.id !== 'action'
//     );

//     // Trích xuất tiêu đề thuần túy
//     const headers = visibleColumns.map(col => {
//       let headerText = '';
//       if (typeof col.header === 'function') {
//         headerText = col.id || '';
//       } else {
//         headerText = extractPlainValue(col.header) || col.id || '';
//       }

//       // Xử lý tiếng Việt nếu cần
//       return shouldRemoveAccents ? removeVietnameseAccents(headerText) : headerText;
//     });

//     // Trích xuất dữ liệu hàng
//     const rows = data.map(row => {
//       return visibleColumns.map(col => {
//         // Lấy giá trị từ cell
//         let cellValue;

//         // Nếu cột có accessorKey
//         if ('accessorKey' in col && typeof col.accessorKey === 'string') {
//           cellValue = row[col.accessorKey as keyof TData];
//         }
//         // Nếu cột có accessorFn
//         else if ('accessorFn' in col && typeof col.accessorFn === 'function') {
//           cellValue = col.accessorFn(row, 0);
//         }
//         // Nếu cột có cell là hàm
//         else if (col.cell && typeof col.cell === 'function') {
//           cellValue = col.id ? row[col.id as keyof TData] : '';
//         }
//         // Mặc định, sử dụng ID của cột
//         else if (col.id) {
//           cellValue = row[col.id as keyof TData];
//         } else {
//           cellValue = '';
//         }

//         // Trích xuất giá trị thuần túy
//         let plainValue = extractPlainValue(cellValue);

//         // Xử lý tiếng Việt nếu cần
//         return shouldRemoveAccents ? removeVietnameseAccents(plainValue) : plainValue;
//       });
//     });

//     return { headers, rows };
//   }


//   const exportPDF = <TData extends Record<string, any>>(
//     data: TData[],
//     columns: ColumnDef<TData, any>[],
//     title: string
//   ) => {
//     try {
//       // Trích xuất dữ liệu thuần túy và chuyển đổi tiếng Việt sang không dấu
//       const { headers, rows } = prepareExportData(data, columns, true); // true = remove accents

//       // Xử lý tiêu đề không dấu
//       const normalizedTitle = removeVietnameseAccents(title);
//       const fileName = `${normalizedTitle.toLowerCase().replace(/\s+/g, "-")}-${new Date().toISOString().split("T")[0]}`;

//       // Tạo PDF
//       const doc = new jsPDF();

//       // Thêm tiêu đề
//       doc.text(normalizedTitle, 14, 10);

//       // Sử dụng autoTable với dữ liệu đã được xử lý
//       autoTable(doc, {
//         head: [headers],
//         body: rows,
//         startY: 20,
//         headStyles: {
//           fillColor: [41, 128, 185],
//           textColor: 255,
//           fontStyle: 'bold'
//         },
//         styles: {
//           font: 'helvetica',
//           fontSize: 10,
//           cellPadding: 3
//         },
//         theme: 'grid'
//       });

//       // Lưu file
//       doc.save(`${fileName}.pdf`);
//       console.log('Xuất PDF thành công với', rows.length, 'dòng');
//     } catch (error) {
//       console.error('Lỗi khi tạo PDF:', error);
//       alert('Có lỗi xảy ra khi tạo file PDF.');
//     }
//   };

//   return (
//     <div className="min-h-[calc(100vh-2rem)] flex-1 rounded-xl bg-white dark:bg-gray-950 md:min-h-min border border-gray-200 shadow-sm p-2 sm:p-4">
//       <div className="flex flex-col sm:flex-row gap-2 justify-between items-start sm:items-center mb-4">
//         <span className="text-lg font-semibold">{title}</span>
//         {actions.includes("create") && !isLoading && (
//           <CreateActionDialog
//             name={title}
//             description={description}
//             children={createFormComponent}
//           />
//         )}
//         {isLoading && (
//           <div className="h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
//         )}
//       </div>
//       <PageLoader
//         skeletonColumns={columns.length + (actions.includes("edit") || actions.includes("delete") || actions.includes("read-only") ? 1 : 0)}
//         skeletonRows={initialPageSize}
//         showTableSkeleton={true}
//         isLoading={isLoading && !dialog.open}
//         darkMode={theme === "dark"}
//         loadingTime={2000}
//         skeletonLoadingTime={2500}
//       >
//         <div className="w-full">
//           <div className="flex flex-col sm:flex-row sm:items-center justify-between py-2 sm:py-4 gap-2">
//             <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center w-full sm:w-auto">
//               {searchColumn && (
//                 <div className="relative w-full sm:max-w-sm">
//                   <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
//                   <Input
//                     placeholder={searchPlaceholder}
//                     value={searchValue}
//                     onChange={(e) => setSearchValue(e.target.value)}
//                     className="pl-8 w-full"
//                   />
//                 </div>
//               )}
//               {exportData && data.length > 0 && (
//                 <DropdownMenu>
//                   <DropdownMenuTrigger asChild>
//                     <Button
//                       variant="outline"
//                       size="sm"
//                       className="flex items-center gap-1 w-full sm:w-auto justify-center"
//                     >
//                       <Download className="h-4 w-4" />
//                       <span className="sm:inline">Xuất dữ liệu</span>
//                       <ChevronDown className="h-4 w-4 ml-1" />
//                     </Button>
//                   </DropdownMenuTrigger>
//                   <DropdownMenuContent align="end">
//                     {(!exportFormats || exportFormats.includes("csv")) && (
//                       <DropdownMenuCheckboxItem
//                         className="cursor-pointer"
//                         onClick={() => handleExportData("csv")}
//                       >
//                         <FileText className="h-4 w-4 mr-2 text-blue-500" />
//                         CSV (.csv)
//                       </DropdownMenuCheckboxItem>
//                     )}
//                     {(!exportFormats || exportFormats.includes("excel")) && (
//                       <DropdownMenuCheckboxItem
//                         className="cursor-pointer"
//                         onClick={() => handleExportData("excel")}
//                       >
//                         <FileSpreadsheet className="h-4 w-4 mr-2 text-green-500" />
//                         Excel (.xlsx)
//                       </DropdownMenuCheckboxItem>
//                     )}
//                     {(!exportFormats || exportFormats.includes("pdf")) && (
//                       <DropdownMenuCheckboxItem
//                         className="cursor-pointer"
//                         onClick={() => handleExportData("pdf")}
//                       >
//                         <FileType className="h-4 w-4 mr-2 text-red-500" />
//                         PDF (.pdf)
//                       </DropdownMenuCheckboxItem>
//                     )}
//                   </DropdownMenuContent>
//                 </DropdownMenu>
//               )}
//             </div>
//             <div className="flex gap-2 w-full sm:w-auto">
//               <DropdownMenu>
//                 <DropdownMenuTrigger asChild>
//                   <Button variant="outline" className="w-full sm:ml-auto sm:w-auto">
//                     <span className="mr-1">Cột</span><ChevronDown className="h-4 w-4" />
//                   </Button>
//                 </DropdownMenuTrigger>
//                 <DropdownMenuContent align="end">
//                   {table
//                     .getAllColumns()
//                     .filter((column) => column.getCanHide())
//                     .map((column) => {
//                       return (
//                         <DropdownMenuCheckboxItem
//                           key={column.id}
//                           className="capitalize"
//                           checked={column.getIsVisible()}
//                           onCheckedChange={(value) =>
//                             column.toggleVisibility(!!value)
//                           }
//                         >
//                           {column.id}
//                         </DropdownMenuCheckboxItem>
//                       );
//                     })}
//                 </DropdownMenuContent>
//               </DropdownMenu>
//             </div>
//           </div>

//           {/* Phần bảng */}
//           <div className="overflow-x-auto border rounded-md">
//             <Table>
//               <TableHeader>
//                 {table.getHeaderGroups().map((headerGroup) => (
//                   <TableRow key={headerGroup.id}>
//                     <TableHead key="select" className="whitespace-nowrap">
//                       STT
//                     </TableHead>
//                     {headerGroup.headers.map((header) => (
//                       <TableHead key={header.id} className="whitespace-nowrap">
//                         {header.isPlaceholder
//                           ? null
//                           : flexRender(
//                             header.column.columnDef.header,
//                             header.getContext()
//                           )}
//                       </TableHead>
//                     ))}
//                     {(actions.includes("edit") || actions.includes("delete") || actions.includes("read-only")) && (
//                       <TableHead key="actions" className="whitespace-nowrap">Thao tác</TableHead>
//                     )}
//                   </TableRow>
//                 ))}
//               </TableHeader>
//               <TableBody>
//                 {table.getRowModel().rows?.length ? (
//                   table.getRowModel().rows.map((row) => (
//                     <TableRow
//                       key={row.id}
//                       data-state={row.getIsSelected() && "selected"}
//                     >
//                       <TableCell key="select" className="py-2">
//                         {row.index + 1}
//                       </TableCell>
//                       {row.getVisibleCells().map((cell) => (
//                         <TableCell key={cell.id} className="py-2">
//                           {flexRender(
//                             cell.column.columnDef.cell,
//                             cell.getContext()
//                           )}
//                         </TableCell>
//                       ))}
//                       {(actions.includes("edit") || actions.includes("delete") || actions.includes("read-only")) && (
//                         <TableCell key={`${row.id}-actions`} className="py-2">
//                           <ButtonGroupAction
//                             actions={actions}
//                             onEdit={(data) => onEdit && onEdit(data)}
//                             // onEdit={(data) => console.log('Edit', data)}
//                             onDelete={async (id) => onDelete && await onDelete(id)}
//                             onRefetchData={refetchData}
//                             rowData={row.original}
//                             editComponent={editFormComponent}
//                             viewComponent={viewFormComponent}
//                           />
//                         </TableCell>
//                       )}
//                     </TableRow>
//                   ))
//                 ) : (
//                   <TableRow>
//                     <TableCell
//                       colSpan={columns.length + (actions.length ? 1 : 0)}
//                       className="h-24 text-center"
//                     >
//                       Không có dữ liệu.
//                     </TableCell>
//                   </TableRow>
//                 )}
//               </TableBody>
//             </Table>
//           </div>

//           {renderBatchDeleteButton()}

//           {/* Cải tiến phần phân trang */}
//           {!disablePagination && renderPagination()}
//         </div>
//       </PageLoader>
//     </div>
//   );
// }