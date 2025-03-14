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
import { ChevronDown, Download, FileSpreadsheet, Search } from "lucide-react";

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
import { DialogChildrenProps } from "@/context/DialogProvider";


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
  initialPageSize?: number;
  isLoading?: boolean;
  children?: React.ReactNode;
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
  initialPageSize = 10,
  isLoading = false,
  children,
}: DataTableProps<TData, TValue>) {

  const { theme } = useTheme();
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  // Tạo biến state riêng cho giá trị tìm kiếm
  const [searchValue, setSearchValue] = React.useState("");

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

  // Tạo table với dữ liệu đã lọc
  const table = useReactTable({
    data: filteredData,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
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
    initialState: {
      pagination: {
        pageSize: initialPageSize,
      },
    },
  });

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

  // Hàm trích xuất giá trị thuần túy từ các cell (bao gồm cả React components)
  function extractPlainValue(value: any): string {
    if (value === null || value === undefined) {
      return '';
    }

    // Nếu là function (thường là cell render function)
    if (typeof value === 'function') {
      return '';
    }

    // Xử lý giá trị ngày tháng
    if (value instanceof Date) {
      return formatDate(value);
    }

    // Kiểm tra xem chuỗi có phải là ngày tháng không
    if (typeof value === 'string') {
      // Kiểm tra các mẫu ngày tháng phổ biến (ISO, US, etc.)
      const dateRegex = /^\d{4}-\d{2}-\d{2}|^\d{2}\/\d{2}\/\d{4}/;
      if (dateRegex.test(value)) {
        return formatDate(value);
      }
    }

    // Nếu là React element
    if (value && typeof value === 'object' &&
      (value.type !== undefined || value.props !== undefined ||
        value.$$typeof !== undefined)) {
      // Nếu có props.children là string, trả về
      if (value.props && typeof value.props.children === 'string') {
        return value.props.children;
      }
      // Trường hợp phức tạp khác
      return '';
    }

    // Các kiểu dữ liệu thông thường
    if (typeof value === 'object') {
      try {
        return JSON.stringify(value);
      } catch (e) {
        return Object.prototype.toString.call(value);
      }
    }

    // String, number, boolean
    return String(value);
  }


  // Hàm định dạng ngày tháng khi xuất dữ liệu
  function formatDate(value: unknown): string {

    // Kiểm tra nếu là đối tượng Date
    if (value instanceof Date) {
      return `${value.getDate().toString().padStart(2, '0')}/${(value.getMonth() + 1).toString().padStart(2, '0')}/${value.getFullYear()} - ${`${value.getHours().toString().padStart(2, '0')}:${value.getMinutes().toString().padStart(2, '0')}:${value.getSeconds().toString().padStart(2, '0')}`}`;
    }

    // Kiểm tra nếu là chuỗi ngày tháng ISO hoặc chuỗi ngày hợp lệ
    if (typeof value === 'string') {
      // Thử chuyển đổi thành Date object
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()} - ${`${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`}`;
      }
    }

    // Trả về giá trị ban đầu nếu không phải ngày
    return String(value);
  }

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
  // Hàm chuyển đổi ký tự tiếng Việt sang không dấu
  function removeVietnameseAccents(str: string): string {
    if (!str) return '';

    return str.normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D');
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
        isLoading={isLoading}
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
                        CSV (.csv)
                      </DropdownMenuCheckboxItem>
                    )}
                    {(!exportFormats || exportFormats.includes("excel")) && (
                      <DropdownMenuCheckboxItem
                        className="cursor-pointer"
                        onClick={() => handleExportData("excel")}
                      >
                        <FileSpreadsheet className="h-4 w-4 mr-2" />
                        Excel (.xlsx)
                      </DropdownMenuCheckboxItem>
                    )}
                    {(!exportFormats || exportFormats.includes("pdf")) && (
                      <DropdownMenuCheckboxItem
                        className="cursor-pointer"
                        onClick={() => handleExportData("pdf")}
                      >

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

          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 py-4">
            <div className="flex items-center gap-2 w-full sm:w-auto justify-start">
              <span className="text-sm text-muted-foreground">Hiển thị</span>
              <select
                value={table.getState().pagination.pageSize}
                onChange={e => {
                  table.setPageSize(Number(e.target.value))
                }}
                className="border rounded p-1 text-sm"
              >
                {[10, 20, 30, 40, 50].map(pageSize => (
                  <option key={pageSize} value={pageSize}>
                    {pageSize}
                  </option>
                ))}
              </select>
              <span className="text-sm text-muted-foreground">dòng mỗi trang</span>
            </div>
            <div className="flex-1 text-sm text-muted-foreground text-center my-2 sm:my-0">
              Đã chọn {table.getFilteredSelectedRowModel().rows.length} / {" "}
              {table.getFilteredRowModel().rows.length} dòng
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto justify-center sm:justify-end">
              <span className="text-sm">
                Trang {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                Trước
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                Sau
              </Button>
            </div>
          </div>
        </div>
      </PageLoader>
    </div>
  );
}