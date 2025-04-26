// hooks/digital-form/useDigitalFormExport.ts
import { useState, useCallback } from 'react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { DigitalFormService } from '@/services/form/digitalFormService';
import { useDigitalForms } from './useDigitalForms';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { ShiftType, RecordStatus } from '@/common/types/digital-form';
import * as XLSX from 'xlsx';

interface ExportOptions {
    orientation?: 'portrait' | 'landscape';
    pageSize?: 'a4' | 'letter' | 'legal';
    withHeaders?: boolean;
    scale?: number;
    filename?: string;
}

/**
 * This hook provides optimized methods for exporting digital forms
 * in different formats (PDF, Excel, etc.) with better performance
 * for large datasets
 */
export const useDigitalFormExport = () => {
    const [isExporting, setIsExporting] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<Error | null>(null);

    const { getFormWithEntries } = useDigitalForms();

    /**
     * Helper to map enum values to human-readable text
     */
    const formatDisplayText = useCallback((key: string, value: any) => {
        // Status formatting
        if (key === 'status') {
            const statusMap: Record<RecordStatus, string> = {
                [RecordStatus.DRAFT]: 'Nháp',
                [RecordStatus.PENDING]: 'Chờ duyệt',
                [RecordStatus.CONFIRMED]: 'Đã duyệt',
                [RecordStatus.REJECTED]: 'Từ chối'
            };
            return statusMap[value as RecordStatus] || value;
        }

        // Shift type formatting
        if (key === 'shiftType') {
            const shiftMap: Record<ShiftType, string> = {
                [ShiftType.REGULAR]: 'Ca Chính (7h30-16h30)',
                [ShiftType.EXTENDED]: 'Ca Kéo Dài (16h30-18h)',
                [ShiftType.OVERTIME]: 'Ca Tăng Ca (18h-20h)'
            };
            return shiftMap[value as ShiftType] || value;
        }

        // Date formatting
        if (key.includes('date') || key.includes('Date') || key.includes('Time') ||
            key === 'createdAt' || key === 'updatedAt' || key === 'submitTime' || key === 'approvedAt') {
            try {
                if (!value) return '';
                const date = new Date(value);
                return isNaN(date.getTime()) ? value : format(date, 'dd/MM/yyyy HH:mm', { locale: vi });
            } catch {
                return value;
            }
        }

        return value;
    }, []);

    /**
     * Export a form to PDF using direct API rendering
     */
    const exportFormToPdf = useCallback(async (formId: string, options: ExportOptions = {}) => {
        if (!formId) {
            throw new Error('Form ID is required');
        }

        setIsExporting(true);
        setProgress(0);
        setError(null);

        try {
            // Update progress
            setProgress(10);

            // Get the form data
            const formData = await getFormWithEntries(formId).refetch();

            if (!formData.data?.data) {
                throw new Error('Failed to fetch form data');
            }

            setProgress(30);

            // Get form details and entries from the response
            const form = formData.data.data.form;
            const entries = formData.data.data.entries || [];

            // Generate PDF with the form data
            const {
                orientation = 'landscape',
                pageSize = 'a4',
                filename
            } = options;

            // Generate filename if not provided
            const pdfFilename = filename || `${form.formCode || 'phieu-cong-doan'}.pdf`;

            // Create PDF with appropriate configuration
            const pdf = new jsPDF({
                orientation,
                unit: 'mm',
                format: pageSize,
            });

            // Set font size and initial position
            pdf.setFontSize(16);
            pdf.text('PHIẾU CÔNG ĐOẠN', pdf.internal.pageSize.getWidth() / 2, 20, { align: 'center' });

            // Form details
            pdf.setFontSize(12);
            pdf.text(`Mã phiếu: ${form.formCode}`, 20, 30);
            pdf.text(`Ngày: ${formatDisplayText('date', form.date)}`, 20, 37);
            pdf.text(`Ca làm việc: ${formatDisplayText('shiftType', form.shiftType)}`, 20, 44);

            // Progress update
            setProgress(50);

            // Create entries table
            if (entries.length > 0) {
                // Table headers
                const headers = ['STT', 'Công nhân', 'Túi', 'Màu', 'Công đoạn', 'Tổng SL', 'Trạng thái'];
                const columnWidths = [10, 35, 35, 30, 35, 20, 25];

                // Define starting position
                let y = 60;
                const rowHeight = 8;

                // Check available space for table headers
                if (y + rowHeight > pdf.internal.pageSize.getHeight() - 20) {
                    pdf.addPage();
                    y = 20;
                }

                // Draw table header
                pdf.setFillColor(240, 240, 240);
                pdf.rect(20, y, columnWidths.reduce((sum, width) => sum + width, 0), rowHeight, 'F');
                pdf.setFont('helvetica', 'bold');

                let x = 20;
                headers.forEach((header, i) => {
                    pdf.text(header, x + 2, y + 5);
                    x += columnWidths[i];
                });
                y += rowHeight;

                // Draw table rows
                pdf.setFont('helvetica', 'normal');

                entries.forEach((entry, index) => {
                    // Check if we need a new page
                    if (y + rowHeight > pdf.internal.pageSize.getHeight() - 20) {
                        pdf.addPage();
                        y = 20;

                        // Redraw header on new page
                        pdf.setFillColor(240, 240, 240);
                        pdf.rect(20, y, columnWidths.reduce((sum, width) => sum + width, 0), rowHeight, 'F');
                        pdf.setFont('helvetica', 'bold');

                        x = 20;
                        headers.forEach((header, i) => {
                            pdf.text(header, x + 2, y + 5);
                            x += columnWidths[i];
                        });
                        y += rowHeight;
                        pdf.setFont('helvetica', 'normal');
                    }

                    // Draw row
                    x = 20;

                    // Draw border lines
                    pdf.rect(
                        20,
                        y,
                        columnWidths.reduce((sum, width) => sum + width, 0),
                        rowHeight
                    );

                    // Draw data
                    pdf.text((index + 1).toString(), x + 2, y + 5);
                    x += columnWidths[0];

                    // For each column, draw vertical line and text
                    // User name (or ID if no name is available)
                    pdf.line(x, y, x, y + rowHeight);
                    pdf.text(entry.userName || entry.userId.substring(0, 8), x + 2, y + 5);
                    x += columnWidths[1];

                    // Handbag name
                    pdf.line(x, y, x, y + rowHeight);
                    pdf.text(entry.handBagName || entry.handBagId.substring(0, 8), x + 2, y + 5);
                    x += columnWidths[2];

                    // Color name
                    pdf.line(x, y, x, y + rowHeight);
                    pdf.text(entry.colorName || entry.bagColorId.substring(0, 8), x + 2, y + 5);
                    x += columnWidths[3];

                    // Process name
                    pdf.line(x, y, x, y + rowHeight);
                    pdf.text(entry.processName || entry.processId.substring(0, 8), x + 2, y + 5);
                    x += columnWidths[4];

                    // Total output
                    pdf.line(x, y, x, y + rowHeight);
                    pdf.text(entry.totalOutput?.toString() || '0', x + 2, y + 5);
                    x += columnWidths[5];

                    // Attendance status
                    pdf.line(x, y, x, y + rowHeight);
                    pdf.text(formatDisplayText('attendanceStatus', entry.attendanceStatus), x + 2, y + 5);

                    y += rowHeight;

                    // Update progress for each entry
                    setProgress(50 + Math.floor((index / entries.length) * 40));
                });
            } else {
                pdf.text('Không có dữ liệu cho phiếu này', 20, 60);
            }

            // Save the PDF
            setProgress(95);
            pdf.save(pdfFilename);
            setProgress(100);

            return pdfFilename;
        } catch (err) {
            console.error('Error exporting form to PDF:', err);
            setError(err instanceof Error ? err : new Error(String(err)));
            throw err;
        } finally {
            setIsExporting(false);
        }
    }, [getFormWithEntries, formatDisplayText]);

    /**
     * Export a form to PDF using HTML to canvas conversion
     * This allows preserving CSS styles and is better for complex layouts
     */
    const exportElementToPdf = useCallback(async (
        elementId: string,
        options: ExportOptions = {}
    ) => {
        const element = document.getElementById(elementId);
        if (!element) {
            throw new Error(`Element with ID "${elementId}" not found`);
        }

        setIsExporting(true);
        setProgress(0);
        setError(null);

        try {
            setProgress(10);

            const {
                orientation = 'landscape',
                pageSize = 'a4',
                scale = 1,
                filename = 'phieu-cong-doan.pdf'
            } = options;

            // Capture the HTML with html2canvas
            setProgress(30);
            const canvas = await html2canvas(element, {
                scale: scale,
                useCORS: true,
                logging: false,
                allowTaint: true
            });

            setProgress(70);

            // Create PDF with appropriate configuration
            const pdf = new jsPDF({
                orientation,
                unit: 'mm',
                format: pageSize,
            });

            // Calculate dimensions
            const imgWidth = orientation === 'portrait' ? 210 : 297; // A4 width in mm
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            // Add the canvas as an image
            const imgData = canvas.toDataURL('image/png');
            pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);

            setProgress(90);

            // Save the PDF
            pdf.save(filename);

            setProgress(100);
            return filename;
        } catch (err) {
            console.error('Error exporting element to PDF:', err);
            setError(err instanceof Error ? err : new Error(String(err)));
            throw err;
        } finally {
            setIsExporting(false);
        }
    }, []);

    /**
     * Export form data to Excel
     */
    const exportFormToExcel = useCallback(async (formId: string, options: ExportOptions = {}) => {
        if (!formId) {
            throw new Error('Form ID is required');
        }

        setIsExporting(true);
        setProgress(0);
        setError(null);

        try {
            // Fetch form data
            setProgress(10);
            const formData = await getFormWithEntries(formId).refetch();

            if (!formData.data?.data) {
                throw new Error('Failed to fetch form data');
            }

            setProgress(30);

            // Extract form and entries
            const form = formData.data.data.form;
            const entries = formData.data.data.entries || [];

            // Generate filename if not provided
            const { filename = `${form.formCode || 'phieu-cong-doan'}.xlsx` } = options;

            // Create workbook and worksheet
            const wb = XLSX.utils.book_new();

            // Form information sheet
            const formInfo = [
                ['Phiếu Công Đoạn'],
                [],
                ['Mã phiếu', form.formCode],
                ['Tên phiếu', form.formName],
                ['Ngày', formatDisplayText('date', form.date)],
                ['Ca làm việc', formatDisplayText('shiftType', form.shiftType)],
                ['Trạng thái', formatDisplayText('status', form.status)],
                ['Người tạo', form.createdById], // Would be better with actual user name
                ['Ngày tạo', formatDisplayText('createdAt', form.createdAt)],
                ['Cập nhật', formatDisplayText('updatedAt', form.updatedAt)],
            ];

            const wsInfo = XLSX.utils.aoa_to_sheet(formInfo);
            XLSX.utils.book_append_sheet(wb, wsInfo, 'Thông tin phiếu');

            setProgress(50);

            // Entries sheet
            if (entries.length > 0) {
                // Prepare headers
                const headers = [
                    'STT',
                    'ID Công nhân',
                    'Họ tên',
                    'ID Túi',
                    'Tên túi',
                    'ID Màu',
                    'Tên màu',
                    'ID Công đoạn',
                    'Tên công đoạn',
                    'Tổng sản lượng',
                    'Trạng thái điểm danh'
                ];

                // Prepare data rows
                const entriesData = entries.map((entry, index) => [
                    index + 1,
                    entry.userId,
                    entry.userName || '',
                    entry.handBagId,
                    entry.handBagName || '',
                    entry.bagColorId,
                    entry.colorName || '',
                    entry.processId,
                    entry.processName || '',
                    entry.totalOutput || 0,
                    formatDisplayText('attendanceStatus', entry.attendanceStatus)
                ]);

                // Create worksheet with headers and data
                const wsEntries = XLSX.utils.aoa_to_sheet([headers, ...entriesData]);

                // Add column widths for better readability
                const colWidths = [
                    { wch: 5 },  // STT
                    { wch: 36 }, // User ID
                    { wch: 20 }, // User Name
                    { wch: 36 }, // Handbag ID
                    { wch: 20 }, // Handbag Name
                    { wch: 36 }, // Color ID
                    { wch: 20 }, // Color Name
                    { wch: 36 }, // Process ID
                    { wch: 20 }, // Process Name
                    { wch: 15 }, // Total Output
                    { wch: 20 }  // Attendance Status
                ];

                wsEntries['!cols'] = colWidths;

                // Add the entries worksheet
                XLSX.utils.book_append_sheet(wb, wsEntries, 'Dữ liệu công nhân');

                setProgress(80);

                // If entries have hourly data, create a detailed sheet
                const entriesWithHourlyData = entries.filter(entry =>
                    entry.hourlyData && Object.keys(entry.hourlyData).length > 0
                );

                if (entriesWithHourlyData.length > 0) {
                    // Collect all possible hour labels
                    const hourLabels = new Set<string>();
                    entriesWithHourlyData.forEach(entry => {
                        Object.keys(entry.hourlyData || {}).forEach(hour => hourLabels.add(hour));
                    });

                    // Sort hour labels
                    const sortedHourLabels = Array.from(hourLabels).sort();

                    // Prepare hourly data headers
                    const hourlyHeaders = [
                        'STT',
                        'ID Công nhân',
                        'Họ tên',
                        'ID Công đoạn',
                        'Tên công đoạn',
                        ...sortedHourLabels,
                        'Tổng cộng'
                    ];

                    // Prepare hourly data rows
                    const hourlyData = entriesWithHourlyData.map((entry, index) => {
                        const rowData: any[] = [
                            index + 1,
                            entry.userId,
                            entry.userName || '',
                            entry.processId,
                            entry.processName || ''
                        ];

                        // Add hour data
                        sortedHourLabels.forEach(hour => {
                            rowData.push(entry.hourlyData?.[hour] || 0);
                        });

                        // Add total
                        rowData.push(entry.totalOutput || 0);

                        return rowData;
                    });

                    // Create hourly worksheet
                    const wsHourly = XLSX.utils.aoa_to_sheet([hourlyHeaders, ...hourlyData]);

                    // Add column widths
                    const hourlyColWidths = [
                        { wch: 5 },  // STT
                        { wch: 36 }, // User ID
                        { wch: 20 }, // User Name
                        { wch: 36 }, // Process ID
                        { wch: 20 }, // Process Name
                        ...sortedHourLabels.map(() => ({ wch: 12 })), // Hour columns
                        { wch: 12 }  // Total
                    ];

                    wsHourly['!cols'] = hourlyColWidths;

                    // Add the hourly worksheet
                    XLSX.utils.book_append_sheet(wb, wsHourly, 'Dữ liệu theo giờ');
                }
            }

            setProgress(90);

            // Write the workbook and trigger download
            XLSX.writeFile(wb, filename);

            setProgress(100);
            return filename;
        } catch (err) {
            console.error('Error exporting form to Excel:', err);
            setError(err instanceof Error ? err : new Error(String(err)));
            throw err;
        } finally {
            setIsExporting(false);
        }
    }, [getFormWithEntries, formatDisplayText]);

    /**
     * Export multiple forms to Excel (batch export)
     * Performance optimized for larger datasets
     */
    const exportMultipleFormsToExcel = useCallback(async (
        formIds: string[],
        options: ExportOptions = {}
    ) => {
        if (!formIds.length) {
            throw new Error('At least one Form ID is required');
        }

        setIsExporting(true);
        setProgress(0);
        setError(null);

        try {
            // Generate filename if not provided
            const { filename = `phieu-cong-doan-batch-${new Date().getTime()}.xlsx` } = options;

            // Create workbook
            const wb = XLSX.utils.book_new();

            // Summary sheet
            const summaryHeaders = [
                'STT',
                'Mã phiếu',
                'Tên phiếu',
                'Ngày',
                'Ca làm việc',
                'Trạng thái',
                'Số công nhân',
                'Tổng sản lượng'
            ];

            const summaryData: any[][] = [];

            // Process each form sequentially to avoid memory issues
            for (let i = 0; i < formIds.length; i++) {
                const formId = formIds[i];
                const progress = Math.floor((i / formIds.length) * 100);
                setProgress(progress);

                try {
                    // Fetch form data
                    const formData = await getFormWithEntries(formId).refetch();

                    if (formData.data?.data) {
                        const form = formData.data.data.form;
                        const entries = formData.data.data.entries || [];

                        // Calculate total output
                        const totalOutput = entries.reduce((sum, entry) => sum + (entry.totalOutput || 0), 0);

                        // Add to summary
                        summaryData.push([
                            i + 1,
                            form.formCode,
                            form.formName,
                            formatDisplayText('date', form.date),
                            formatDisplayText('shiftType', form.shiftType),
                            formatDisplayText('status', form.status),
                            entries.length,
                            totalOutput
                        ]);

                        // Create individual form sheet
                        if (entries.length > 0) {
                            // Limit to first 20 entries per form to avoid Excel limitations
                            const sheetEntries = entries.slice(0, 20);

                            // Prepare headers
                            const entryHeaders = [
                                'STT',
                                'ID Công nhân',
                                'ID Công đoạn',
                                'Tổng sản lượng',
                                'Trạng thái'
                            ];

                            // Prepare data rows
                            const entryData = sheetEntries.map((entry, index) => [
                                index + 1,
                                entry.userId,
                                entry.processId,
                                entry.totalOutput || 0,
                                formatDisplayText('attendanceStatus', entry.attendanceStatus)
                            ]);

                            // Create and add sheet (limit sheet name length to 31 chars)
                            const sheetName = `Form ${i + 1} - ${form.formCode.slice(0, 20)}`;
                            const ws = XLSX.utils.aoa_to_sheet([entryHeaders, ...entryData]);
                            XLSX.utils.book_append_sheet(wb, ws, sheetName);
                        }
                    }
                } catch (err) {
                    console.warn(`Error processing form ${formId}:`, err);
                    // Continue processing other forms
                    summaryData.push([
                        i + 1,
                        formId,
                        'Error loading form',
                        '',
                        '',
                        '',
                        0,
                        0
                    ]);
                }
            }

            // Create and add summary sheet
            const wsSummary = XLSX.utils.aoa_to_sheet([summaryHeaders, ...summaryData]);
            XLSX.utils.book_append_sheet(wb, wsSummary, 'Tổng hợp phiếu');

            // Set column widths for summary
            wsSummary['!cols'] = [
                { wch: 5 },  // STT
                { wch: 15 }, // Form Code
                { wch: 25 }, // Form Name
                { wch: 12 }, // Date
                { wch: 20 }, // Shift Type
                { wch: 15 }, // Status
                { wch: 15 }, // Worker Count
                { wch: 15 }  // Total Output
            ];

            setProgress(95);

            // Write the workbook and trigger download
            XLSX.writeFile(wb, filename);

            setProgress(100);
            return filename;
        } catch (err) {
            console.error('Error exporting multiple forms to Excel:', err);
            setError(err instanceof Error ? err : new Error(String(err)));
            throw err;
        } finally {
            setIsExporting(false);
        }
    }, [getFormWithEntries, formatDisplayText]);

    return {
        isExporting,
        progress,
        error,

        // Export methods
        exportFormToPdf,
        exportElementToPdf,
        exportFormToExcel,
        exportMultipleFormsToExcel
    };
};