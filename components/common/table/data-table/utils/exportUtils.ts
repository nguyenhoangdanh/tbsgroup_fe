  import * as XLSX from 'xlsx';
  import { jsPDF } from "jspdf";
  import autoTable from 'jspdf-autotable';
  import { ColumnDef } from "@tanstack/react-table";
  import { extractPlainValue, removeVietnameseAccents } from "@/utils";
  import { toast } from "@/hooks/use-toast";
  
  export function prepareExportData<TData>(
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
  
  export const exportExcel = <TData extends Record<string, any>>(
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
  
  export const exportCSV = <TData extends Record<string, any>>(
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
  
  export const exportPDF = <TData extends Record<string, any>>(
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