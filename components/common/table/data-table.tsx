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
import { ChevronDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Download, FileSpreadsheet, FileText, FileType, Search } from "lucide-react";

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
import { useDialog } from "@/context/DialogProvider";
import { extractPlainValue, removeVietnameseAccents } from "@/utils";


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
  createFormComponent?: React.ReactNode;
  editFormComponent?: React.ReactNode;
  viewFormComponent?: React.ReactNode;
  refetchData?: () => void;
  onDelete?: (id: string) => Promise<void>;
  onEdit?: (data: TData) => void;
  onSelected?: (ids: string[]) => void;
  actions: TActions[];
  searchColumn?: string;
  searchPlaceholder?: string;
  exportData?: boolean;
  exportFormats?: Array<"csv" | "excel" | "pdf">;
  isLoading?: boolean;
  children?: React.ReactNode;

  // Thêm hai props mới cho phân trang server-side
  initialPageIndex?: number;  // Thêm prop cho trang ban đầu (zero-based)
  initialPageSize?: number;   // Giữ nguyên
  totalItems?: number;        // Giữ nguyên
  serverSidePagination?: boolean; // Giữ nguyên
  onPageChange?: (pageIndex: number, pageSize: number) => void; // Cập nhật tham số để rõ ràng hơn
  disablePagination?: boolean; // Thêm tuỳ chọn tắt phân trang
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
  onEdit,
  onSelected,
  searchColumn,
  searchPlaceholder = "Tìm kiếm...",
  exportData = false,
  exportFormats = ["csv", "excel", "pdf"],
  isLoading = false,
  children,
  initialPageIndex = 0, // Thêm giá trị mặc định cho initialPageIndex
  initialPageSize = 10,
  totalItems,
  serverSidePagination = false,
  onPageChange,
  disablePagination = false,
}: DataTableProps<TData, TValue>) {

  const { theme } = useTheme();
  const { dialog } = useDialog();
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  // Tạo biến state riêng cho giá trị tìm kiếm
  const [searchValue, setSearchValue] = React.useState("");


  // Thêm state cho input chuyển trang
  const [gotoPage, setGotoPage] = React.useState("");
  // Thêm ref để tránh gọi onPageChange khi component mount
  const isInitialRender = React.useRef(true);
  // 3. Khởi tạo tableRef để tránh lỗi circular dependency
  const tableRef = React.useRef<any>(null);

  // Tạo state riêng cho kết quả lọc
  const [filteredData, setFilteredData] = React.useState<TData[]>(data);

  // Xử lý tìm kiếm thủ công
  React.useEffect(() => {
    if (!searchValue.trim() || !searchColumn) {
      setFilteredData(data);
      return;
    }

    // Lọc dữ liệu thủ công
    const filtered = data.filter(item => {
      // Lấy giá trị của cột cần tìm kiếm
      const columnValue = item[searchColumn];

      // Nếu không có giá trị, bỏ qua
      if (columnValue == null) return false;

      // Chuẩn hóa cả giá trị cột và giá trị tìm kiếm
      const normalizedColumnValue = removeAccents(String(columnValue).toLowerCase());
      const normalizedSearchValue = removeAccents(String(searchValue).toLowerCase());

      // Kiểm tra nếu giá trị cột chứa giá trị tìm kiếm
      return normalizedColumnValue.includes(normalizedSearchValue);
    });

    setFilteredData(filtered);
  }, [data, searchValue, searchColumn]);

  // 5. Cải tiến logic khởi tạo table với xử lý phân trang tốt hơn
  const table = useReactTable({
    data: filteredData,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: disablePagination ? undefined : getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },

    // Cải tiến cấu hình phân trang
    initialState: {
      pagination: {
        pageIndex: initialPageIndex,
        pageSize: initialPageSize,
      },
    },

    // Xử lý phân trang server-side
    manualPagination: serverSidePagination,

    // Cải tiến cách tính pageCount để tránh bị lỗi khi không có dữ liệu
    pageCount: serverSidePagination
      ? totalItems != null
        ? Math.max(1, Math.ceil(totalItems / initialPageSize))
        : undefined
      : undefined, // Để undefined để tự động tính từ filteredData.length với client-side pagination
  });

  // Gán table cho tableRef để có thể sử dụng trong các effect
  tableRef.current = table;

  // 6. Cải tiến callback xử lý thay đổi trang và pageSize
  React.useEffect(() => {
    if (!serverSidePagination || !onPageChange) {
      return;
    }

    // Lấy state pagination hiện tại
    const { pageIndex, pageSize } = table.getState().pagination;

    // Trong lần render đầu tiên, kiểm tra xem có cần cập nhật không
    if (isInitialRender.current) {
      console.log("Initial render, checking if we need to sync page size");

      // Nếu pageSize từ prop khác với pageSize trong state, cập nhật
      if (initialPageSize !== pageSize) {
        console.log(`Initial pageSize mismatch: state=${pageSize}, prop=${initialPageSize}`);
        // Không gọi onPageChange ở đây để tránh API call không cần thiết
      }

      isInitialRender.current = false;
      return;
    }

    console.log(`Pagination state changed: pageIndex=${pageIndex}, pageSize=${pageSize}`);

    // Gọi callback với pageIndex và pageSize mới
    onPageChange(pageIndex, pageSize);

  }, [
    serverSidePagination,
    onPageChange,
    initialPageSize,
    // Sử dụng các giá trị cụ thể từ state pagination thay vì toàn bộ đối tượng table
    // Điều này đảm bảo effect chỉ chạy khi giá trị pagination thực sự thay đổi
    table.getState().pagination.pageIndex,
    table.getState().pagination.pageSize
  ]);

  // Các tùy chọn cho số mục trên mỗi trang
  const pageSizeOptions = [5, 10, 20, 50, 100];

  // Hàm xử lý khi thay đổi số mục trên mỗi trang
  const handlePageSizeChange = React.useCallback(
    (newPageSize: number) => {
      table.setPageSize(newPageSize);
      // table.setPageIndex(0); // Có thể thêm để reset về trang đầu khi thay đổi pageSize
    },
    [table]
  );

  // 6. Cải tiến hàm render nút phân trang - thêm xử lý cho nhiều trang
  const renderPaginationButtons = () => {
    if (disablePagination) return null;

    const currentPage = table.getState().pagination.pageIndex;
    const pageCount = table.getPageCount();

    // Nếu không có trang, hiển thị nút mặc định không có chức năng
    if (pageCount <= 0) {
      return (
        <Button
          key={0}
          variant="default"
          size="sm"
          disabled
          className="w-8 h-8 p-0"
        >
          1
        </Button>
      );
    }

    // Nếu có ít hơn hoặc bằng 7 trang, hiển thị tất cả
    if (pageCount <= 7) {
      return Array.from({ length: pageCount }, (_, i) => (
        <Button
          key={i}
          variant={currentPage === i ? "default" : "outline"}
          size="sm"
          onClick={() => table.setPageIndex(i)}
          className="w-8 h-8 p-0"
        >
          {i + 1}
        </Button>
      ));
    }

    // Mẫu hiển thị: First ... [Current-1] Current [Current+1] ... Last
    const pages = [];

    // Luôn hiển thị trang đầu
    pages.push(
      <Button
        key={0}
        variant={currentPage === 0 ? "default" : "outline"}
        size="sm"
        onClick={() => table.setPageIndex(0)}
        className="w-8 h-8 p-0"
      >
        1
      </Button>
    );

    // Logic hiển thị trang với các trường hợp đầu, giữa, cuối
    if (currentPage <= 3) {
      // Gần đầu: hiển thị các trang 2, 3, 4
      for (let i = 1; i <= 3; i++) {
        if (i < pageCount - 1) {
          pages.push(
            <Button
              key={i}
              variant={currentPage === i ? "default" : "outline"}
              size="sm"
              onClick={() => table.setPageIndex(i)}
              className="w-8 h-8 p-0"
            >
              {i + 1}
            </Button>
          );
        }
      }
      // Thêm dấu chấm lửng nếu cần
      if (pageCount > 5) {
        pages.push(
          <span
            key="ellipsis1"
            className="px-2 flex items-center"
            aria-hidden
          >
            ...
          </span>
        );
      }
    } else if (currentPage >= pageCount - 4) {
      // Gần cuối: hiển thị dấu chấm lửng và 3 trang cuối
      if (pageCount > 5) {
        pages.push(
          <span
            key="ellipsis1"
            className="px-2 flex items-center"
            aria-hidden
          >
            ...
          </span>
        );
      }

      for (let i = pageCount - 4; i < pageCount - 1; i++) {
        pages.push(
          <Button
            key={i}
            variant={currentPage === i ? "default" : "outline"}
            size="sm"
            onClick={() => table.setPageIndex(i)}
            className="w-8 h-8 p-0"
          >
            {i + 1}
          </Button>
        );
      }
    } else {
      // Ở giữa: hiển thị dấu chấm lửng, trang hiện tại và các trang lân cận
      pages.push(
        <span
          key="ellipsis1"
          className="px-2 flex items-center"
          aria-hidden
        >
          ...
        </span>
      );

      // Hiển thị trang trước, hiện tại và sau
      for (let i = currentPage - 1; i <= currentPage + 1; i++) {
        pages.push(
          <Button
            key={i}
            variant={currentPage === i ? "default" : "outline"}
            size="sm"
            onClick={() => table.setPageIndex(i)}
            className="w-8 h-8 p-0"
          >
            {i + 1}
          </Button>
        );
      }

      pages.push(
        <span
          key="ellipsis2"
          className="px-2 flex items-center"
          aria-hidden
        >
          ...
        </span>
      );
    }

    // Luôn hiển thị trang cuối
    if (pageCount > 1) {
      pages.push(
        <Button
          key={pageCount - 1}
          variant={currentPage === pageCount - 1 ? "default" : "outline"}
          size="sm"
          onClick={() => table.setPageIndex(pageCount - 1)}
          className="w-8 h-8 p-0"
        >
          {pageCount}
        </Button>
      );
    }

    return pages;
  };

  // 7. Cải tiến hàm xử lý chuyển trang thủ công
  const handleGotoPage = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const pageNumber = parseInt(gotoPage, 10);
      if (!isNaN(pageNumber) && pageNumber >= 1 && pageNumber <= table.getPageCount()) {
        table.setPageIndex(pageNumber - 1);

        // Nếu là server-side pagination, không cần trigger effect riêng
        // vì table.setPageIndex sẽ thay đổi pageIndex, kích hoạt effect trên
      }

      // Reset input sau khi xử lý
      setGotoPage("");
    }
  };

  // 8. Phần render phân trang cải tiến
  const renderPagination = () => {
    if (disablePagination) return null;

    const pageCount = table.getPageCount();
    const { pageIndex, pageSize } = table.getState().pagination;

    // Tính toán số dòng hiển thị
    const startRow = pageIndex * pageSize + 1;
    const endRow = Math.min(
      (pageIndex + 1) * pageSize,
      serverSidePagination && totalItems ? totalItems : filteredData.length
    );

    const totalRows = serverSidePagination && totalItems ? totalItems : filteredData.length;

    return (
      <div className="flex flex-col lg:flex-row items-center justify-between gap-4 py-4">
        {/* Thông tin hiển thị và dropdown pageSize */}
        <div className="flex flex-col sm:flex-row items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <span>
              Hiển thị {totalRows > 0 ? startRow : 0}-
              {totalRows > 0 ? endRow : 0} trên {totalRows} dòng
            </span>
          </div>

          {/* Dropdown chọn số mục trên mỗi trang */}
          <div className="flex items-center whitespace-nowrap">
            <span className="text-sm mr-2">Hiển thị</span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-2 flex items-center gap-1 min-w-[65px]"
                >
                  {pageSize}
                  <ChevronDown className="h-4 w-4 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center">
                {pageSizeOptions.map((size) => (
                  <DropdownMenuCheckboxItem
                    key={size}
                    className="cursor-pointer"
                    checked={pageSize === size}
                    onCheckedChange={() => handlePageSizeChange(size)}
                  >
                    {size} dòng
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <span className="text-sm ml-2">mỗi trang</span>
          </div>
        </div>

        {/* Thông tin về số dòng đã chọn */}
        <div className="text-sm text-muted-foreground text-center">
          Đã chọn {table.getFilteredSelectedRowModel().rows.length} / {" "}
          {table.getFilteredRowModel().rows.length} dòng
        </div>

        {/* Các phần còn lại của phân trang giữ nguyên */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-center lg:justify-end">
          {/* Đi đến trang cụ thể */}
          <div className="flex items-center gap-1 mr-2">
            <span className="text-sm whitespace-nowrap">Đến trang</span>
            <Input
              type="number"
              min={1}
              max={Math.max(1, pageCount)}
              value={gotoPage}
              onChange={(e) => setGotoPage(e.target.value)}
              onKeyDown={handleGotoPage}
              className="w-14 h-8 text-center"
            />
          </div>

          {/* Các nút phân trang - phần này giữ nguyên */}
          <div className="flex items-center gap-1">
            {/* Nút đến trang đầu */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
              className="w-8 h-8 p-0"
              title="Trang đầu tiên"
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>

            {/* Nút trang trước */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="w-8 h-8 p-0"
              title="Trang trước"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            {/* Các nút số trang */}
            <div className="flex items-center">
              {renderPaginationButtons()}
            </div>

            {/* Nút trang sau */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="w-8 h-8 p-0"
              title="Trang sau"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>

            {/* Nút đến trang cuối */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.setPageIndex(Math.max(0, pageCount - 1))}
              disabled={!table.getCanNextPage()}
              className="w-8 h-8 p-0"
              title="Trang cuối cùng"
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>

            {/* Hiển thị thông tin trang */}
            <span className="text-sm whitespace-nowrap ml-2">
              Trang {pageIndex + 1} / {Math.max(1, pageCount)}
            </span>
          </div>
        </div>
      </div>
    );
  };


  // Callback to handle row selection changes
  React.useEffect(() => {
    if (onSelected) {
      const selectedIds = table
        .getFilteredSelectedRowModel()
        .rows.map((row) => row.original.id);
      onSelected(selectedIds);
    }
  }, [onSelected, rowSelection, table]);

  const exportExcel = <TData extends Record<string, any>>(
    data: TData[],
    columns: ColumnDef<TData, any>[],
    title: string
  ) => {
    try {
      // Trích xuất dữ liệu thuần túy
      const { headers, rows } = prepareExportData(data, columns);

      // Tạo tên file
      const fileName = `${title.toLowerCase().replace(/\s+/g, "-")}-${new Date().toISOString().split("T")[0]}`;

      // Tạo worksheet
      const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Data");

      // Xuất file
      XLSX.writeFile(workbook, `${fileName}.xlsx`);
      console.log('Xuất Excel thành công với', rows.length, 'dòng');
    } catch (error) {
      console.error('Lỗi khi tạo Excel:', error);
      alert('Có lỗi xảy ra khi tạo file Excel.');
    }
  };

  // 3. Cập nhật hàm xuất CSV
  const exportCSV = <TData extends Record<string, any>>(
    data: TData[],
    columns: ColumnDef<TData, any>[],
    title: string
  ) => {
    try {
      // Trích xuất dữ liệu thuần túy
      const { headers, rows } = prepareExportData(data, columns);

      // Tạo tên file
      const fileName = `${title.toLowerCase().replace(/\s+/g, "-")}-${new Date().toISOString().split("T")[0]}`;

      // Tạo nội dung CSV
      const csvContent = [
        headers.join(","),
        ...rows.map(row => row.join(","))
      ].join("\n");

      // Tạo blob và tải xuống
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `${fileName}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      console.log('Xuất CSV thành công với', rows.length, 'dòng');
    } catch (error) {
      console.error('Lỗi khi tạo CSV:', error);
      alert('Có lỗi xảy ra khi tạo file CSV.');
    }
  };
  const exportDataToFormat = <TData extends Record<string, any>>(
    format: "csv" | "excel" | "pdf",
    data: TData[],
    columns: ColumnDef<TData, any>[],
    title: string
  ) => {
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

  // 2. Sửa đổi hàm handleExportData trong component DataTable của bạn
  // Thay thế toàn bộ hàm hiện tại với hàm này:
  const handleExportData = (format: "csv" | "excel" | "pdf") => {
    if (!data.length) return;

    // Gọi hàm xuất dữ liệu mới
    exportDataToFormat(format, data, columns, title);
  };


  // Hàm chuẩn bị dữ liệu cho việc xuất - phiên bản có xử lý tiếng Việt
  function prepareExportData<TData>(
    data: TData[],
    columns: ColumnDef<TData, any>[],
    shouldRemoveAccents: boolean = false
  ): { headers: string[], rows: string[][] } {
    // Lấy tiêu đề cột, bỏ qua cột select và action
    const visibleColumns = columns.filter(col =>
      col.id !== 'select' &&
      col.id !== 'actions' &&
      col.id !== 'action'
    );

    // Trích xuất tiêu đề thuần túy
    const headers = visibleColumns.map(col => {
      let headerText = '';
      if (typeof col.header === 'function') {
        headerText = col.id || '';
      } else {
        headerText = extractPlainValue(col.header) || col.id || '';
      }

      // Xử lý tiếng Việt nếu cần
      return shouldRemoveAccents ? removeVietnameseAccents(headerText) : headerText;
    });

    // Trích xuất dữ liệu hàng
    const rows = data.map(row => {
      return visibleColumns.map(col => {
        // Lấy giá trị từ cell
        let cellValue;

        // Nếu cột có accessorKey
        if ('accessorKey' in col && typeof col.accessorKey === 'string') {
          cellValue = row[col.accessorKey as keyof TData];
        }
        // Nếu cột có accessorFn
        else if ('accessorFn' in col && typeof col.accessorFn === 'function') {
          cellValue = col.accessorFn(row, 0);
        }
        // Nếu cột có cell là hàm
        else if (col.cell && typeof col.cell === 'function') {
          cellValue = col.id ? row[col.id as keyof TData] : '';
        }
        // Mặc định, sử dụng ID của cột
        else if (col.id) {
          cellValue = row[col.id as keyof TData];
        } else {
          cellValue = '';
        }

        // Trích xuất giá trị thuần túy
        let plainValue = extractPlainValue(cellValue);

        // Xử lý tiếng Việt nếu cần
        return shouldRemoveAccents ? removeVietnameseAccents(plainValue) : plainValue;
      });
    });

    return { headers, rows };
  }


  const exportPDF = <TData extends Record<string, any>>(
    data: TData[],
    columns: ColumnDef<TData, any>[],
    title: string
  ) => {
    try {
      // Trích xuất dữ liệu thuần túy và chuyển đổi tiếng Việt sang không dấu
      const { headers, rows } = prepareExportData(data, columns, true); // true = remove accents

      // Xử lý tiêu đề không dấu
      const normalizedTitle = removeVietnameseAccents(title);
      const fileName = `${normalizedTitle.toLowerCase().replace(/\s+/g, "-")}-${new Date().toISOString().split("T")[0]}`;

      // Tạo PDF
      const doc = new jsPDF();

      // Thêm tiêu đề
      doc.text(normalizedTitle, 14, 10);

      // Sử dụng autoTable với dữ liệu đã được xử lý
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

      // Lưu file
      doc.save(`${fileName}.pdf`);
      console.log('Xuất PDF thành công với', rows.length, 'dòng');
    } catch (error) {
      console.error('Lỗi khi tạo PDF:', error);
      alert('Có lỗi xảy ra khi tạo file PDF.');
    }
  };

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
        isLoading={isLoading && !dialog.open}
        darkMode={theme === "dark"}
        loadingTime={3000}
        skeletonLoadingTime={3500}
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

          {/* Phần bảng */}
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
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
                    >
                      <TableCell key="select" className="py-2">
                        {row.index + 1}
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
                            // onEdit={(data) => console.log('Edit', data)}
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
                      colSpan={columns.length + (actions.length ? 1 : 0)}
                      className="h-24 text-center"
                    >
                      Không có dữ liệu.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Cải tiến phần phân trang */}
          {!disablePagination && renderPagination()}
        </div>
      </PageLoader>
    </div>
  );
}