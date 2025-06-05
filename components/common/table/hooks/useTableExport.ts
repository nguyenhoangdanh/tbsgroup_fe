import { useCallback, useMemo } from 'react';
import { toast } from 'react-toast-kit';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

import { BaseTableData, TableColumn, ExportFormat } from '../types';

interface UseTableExportProps<T extends BaseTableData> {
  data: T[];
  columns: TableColumn<T>[];
  filename?: string;
  title?: string;
}

interface ExportOptions {
  includeHeaders?: boolean;
  includeFilters?: boolean;
  customHeaders?: Record<string, string>;
  dateFormat?: string;
  numberFormat?: string;
}

export function useTableExport<T extends BaseTableData>({
  data,
  columns,
  filename = 'table-export',
  title,
}: UseTableExportProps<T>) {
  
  // Memoized exportable columns
  const exportableColumns = useMemo(() => {
    return columns.filter(col => 
      col.exportable !== false && 
      col.id !== 'select' && 
      col.id !== 'actions' &&
      col.accessorKey !== 'actions'
    );
  }, [columns]);

  // Enhanced data preparation
  const prepareExportData = useCallback((format: ExportFormat, options: ExportOptions = {}) => {
    const { includeHeaders = true, customHeaders = {}, dateFormat = 'YYYY-MM-DD', numberFormat = '0.00' } = options;
    
    // Extract headers with custom mapping
    const headers = exportableColumns.map(col => {
      const columnId = col.id || col.accessorKey as string;
      if (customHeaders[columnId]) {
        return customHeaders[columnId];
      }
      if (typeof col.header === 'string') {
        return col.header;
      }
      return columnId || '';
    });

    // Extract and format data
    const rows = data.map(row => {
      return exportableColumns.map(col => {
        const columnId = col.id || col.accessorKey as string;
        let value = row[columnId];

        // Apply custom export formatter if available
        if (col.exportFormatter) {
          return col.exportFormatter(value);
        }

        // Default formatting based on data type
        if (value === null || value === undefined) {
          return '';
        }

        if (value instanceof Date) {
          return value.toISOString().split('T')[0];
        }

        if (typeof value === 'number') {
          return format === 'csv' ? value.toString() : value;
        }

        if (typeof value === 'boolean') {
          return value ? 'Có' : 'Không';
        }

        if (typeof value === 'object') {
          return JSON.stringify(value);
        }

        return String(value);
      });
    });

    return { headers, rows, exportableColumns };
  }, [data, exportableColumns]);

  // Enhanced CSV export with better encoding
  const exportToCSV = useCallback((options: ExportOptions = {}) => {
    try {
      const { headers, rows } = prepareExportData('csv', options);
      
      // Create CSV content with proper escaping
      const csvContent = [
        headers.join(','),
        ...rows.map(row => 
          row.map(cell => {
            const cellValue = String(cell);
            // Escape quotes and wrap in quotes if contains comma, quote, or newline
            if (cellValue.includes(',') || cellValue.includes('"') || cellValue.includes('\n')) {
              return `"${cellValue.replace(/"/g, '""')}"`;
            }
            return cellValue;
          }).join(',')
        )
      ].join('\n');

      // Create blob with BOM for proper UTF-8 encoding
      const blob = new Blob(['\uFEFF' + csvContent], { 
        type: 'text/csv;charset=utf-8;' 
      });
      
      // Download file
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: 'Xuất CSV thành công',
        description: `Đã xuất ${rows.length} dòng dữ liệu`,
        variant: 'default',
      });
    } catch (error) {
      console.error('Export CSV error:', error);
      toast({
        title: 'Xuất CSV thất bại',
        description: error instanceof Error ? error.message : 'Đã xảy ra lỗi',
        variant: 'error',
      });
    }
  }, [prepareExportData, filename]);

  // Enhanced Excel export with styling
  const exportToExcel = useCallback((options: ExportOptions = {}) => {
    try {
      const { headers, rows } = prepareExportData('excel', options);
      
      // Create worksheet
      const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
      
      // Calculate column widths
      const colWidths = headers.map((header, colIndex) => {
        const headerLength = header.length;
        const maxRowLength = Math.max(
          ...rows.map(row => String(row[colIndex] || '').length)
        );
        return { wch: Math.max(headerLength, maxRowLength, 10) };
      });
      worksheet['!cols'] = colWidths;

      // Style the header row
      const headerRange = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
      for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
        if (!worksheet[cellAddress]) continue;
        
        worksheet[cellAddress].s = {
          font: { bold: true, color: { rgb: 'FFFFFF' } },
          fill: { fgColor: { rgb: '366092' } },
          alignment: { horizontal: 'center', vertical: 'center' },
          border: {
            top: { style: 'thin', color: { rgb: '000000' } },
            bottom: { style: 'thin', color: { rgb: '000000' } },
            left: { style: 'thin', color: { rgb: '000000' } },
            right: { style: 'thin', color: { rgb: '000000' } }
          }
        };
      }

      // Add title if provided
      if (title) {
        XLSX.utils.sheet_add_aoa(worksheet, [[title]], { origin: 'A1' });
        XLSX.utils.sheet_add_aoa(worksheet, [headers], { origin: 'A2' });
        XLSX.utils.sheet_add_aoa(worksheet, rows, { origin: 'A3' });
      }

      // Create workbook and save
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
      
      // Add metadata
      workbook.Props = {
        Title: title || 'Table Export',
        Subject: 'Data Export',
        Author: 'Table Export System',
        CreatedDate: new Date()
      };

      XLSX.writeFile(workbook, `${filename}-${new Date().toISOString().split('T')[0]}.xlsx`);

      toast({
        title: 'Xuất Excel thành công',
        description: `Đã xuất ${rows.length} dòng dữ liệu`,
        variant: 'default',
      });
    } catch (error) {
      console.error('Export Excel error:', error);
      toast({
        title: 'Xuất Excel thất bại',
        description: error instanceof Error ? error.message : 'Đã xảy ra lỗi',
        variant: 'error',
      });
    }
  }, [prepareExportData, filename, title]);

  // Enhanced PDF export with better formatting
  const exportToPDF = useCallback((options: ExportOptions = {}) => {
    try {
      const { headers, rows } = prepareExportData('pdf', options);
      
      // Create PDF document
      const doc = new jsPDF();
      
      // Add title
      if (title) {
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text(title, 14, 20);
      }

      // Add export date
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Xuất ngày: ${new Date().toLocaleDateString('vi-VN')}`, 14, title ? 30 : 20);

      // Prepare table data
      const tableData = rows.map(row => 
        row.map(cell => String(cell).substring(0, 50)) // Truncate long text
      );

      // Add table with autoTable
      (doc as any).autoTable({
        head: [headers],
        body: tableData,
        startY: title ? 40 : 30,
        styles: {
          fontSize: 8,
          cellPadding: 2,
          overflow: 'linebreak',
          halign: 'left',
        },
        headStyles: {
          fillColor: [54, 96, 146],
          textColor: 255,
          fontStyle: 'bold',
          halign: 'center',
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245],
        },
        margin: { top: 10, right: 10, bottom: 10, left: 10 },
        columnStyles: exportableColumns.reduce((acc, col, index) => {
          acc[index] = {
            cellWidth: 'auto',
            halign: col.align || 'left',
          };
          return acc;
        }, {} as any),
      });

      // Add footer
      const pageCount = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.text(
          `Trang ${i} / ${pageCount}`,
          doc.internal.pageSize.width - 30,
          doc.internal.pageSize.height - 10
        );
      }

      // Save file
      doc.save(`${filename}-${new Date().toISOString().split('T')[0]}.pdf`);

      toast({
        title: 'Xuất PDF thành công',
        description: `Đã xuất ${rows.length} dòng dữ liệu`,
        variant: 'default',
      });
    } catch (error) {
      console.error('Export PDF error:', error);
      toast({
        title: 'Xuất PDF thất bại',
        description: error instanceof Error ? error.message : 'Đã xảy ra lỗi',
        variant: 'error',
      });
    }
  }, [prepareExportData, filename, title, exportableColumns]);

  // Enhanced JSON export with metadata
  const exportToJSON = useCallback((options: ExportOptions = {}) => {
    try {
      const { headers } = prepareExportData('json', options);
      
      // Create structured JSON data
      const jsonData = {
        metadata: {
          title: title || 'Table Export',
          exportDate: new Date().toISOString(),
          totalRecords: data.length,
          columns: headers,
          filename: filename,
        },
        data: data.map(row => {
          const structuredRow: any = {};
          exportableColumns.forEach((col, index) => {
            const columnId = col.id || col.accessorKey as string;
            const header = headers[index];
            structuredRow[header] = row[columnId];
          });
          return structuredRow;
        }),
      };

      // Convert to JSON string with formatting
      const jsonString = JSON.stringify(jsonData, null, 2);
      
      // Create blob and download
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}-${new Date().toISOString().split('T')[0]}.json`;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: 'Xuất JSON thành công',
        description: `Đã xuất ${data.length} dòng dữ liệu`,
        variant: 'default',
      });
    } catch (error) {
      console.error('Export JSON error:', error);
      toast({
        title: 'Xuất JSON thất bại',
        description: error instanceof Error ? error.message : 'Đã xảy ra lỗi',
        variant: 'error',
      });
    }
  }, [data, exportableColumns, filename, title, prepareExportData]);

  // Main export function with format selection
  const exportData = useCallback((format: ExportFormat, options: ExportOptions = {}) => {
    if (!data || data.length === 0) {
      toast({
        title: 'Không có dữ liệu để xuất',
        description: 'Vui lòng đảm bảo có dữ liệu trong bảng',
        variant: 'error',
      });
      return;
    }

    switch (format) {
      case 'csv':
        exportToCSV(options);
        break;
      case 'excel':
        exportToExcel(options);
        break;
      case 'pdf':
        exportToPDF(options);
        break;
      case 'json':
        exportToJSON(options);
        break;
      default:
        toast({
          title: 'Định dạng không được hỗ trợ',
          description: `Định dạng ${format} không được hỗ trợ`,
          variant: 'error',
        });
    }
  }, [data, exportToCSV, exportToExcel, exportToPDF, exportToJSON]);

  // Batch export multiple formats
  const exportMultipleFormats = useCallback((formats: ExportFormat[], options: ExportOptions = {}) => {
    const delay = 500; // Delay between exports to prevent browser issues
    
    formats.forEach((format, index) => {
      setTimeout(() => {
        exportData(format, options);
      }, index * delay);
    });
  }, [exportData]);

  // Get export preview data
  const getPreviewData = useCallback((maxRows: number = 5) => {
    const { headers, rows } = prepareExportData('csv');
    return {
      headers,
      rows: rows.slice(0, maxRows),
      totalRows: rows.length,
    };
  }, [prepareExportData]);

  return {
    exportData,
    exportToCSV,
    exportToExcel,
    exportToPDF,
    exportToJSON,
    exportMultipleFormats,
    getPreviewData,
    exportableColumns,
    canExport: data.length > 0 && exportableColumns.length > 0,
  };
}