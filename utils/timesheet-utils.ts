import { TIME_SLOTS, TimeSheetEntryType, TimeSheetType } from "@/schemas/timesheet";
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Formats a date string to a localized date format
 */
export const formatDate = (dateString?: string): string => {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch (error) {
    console.error('Invalid date format:', error);
    return '';
  }
};

/**
 * Formats time in hours and minutes
 */
export const formatTime = (hours: number, minutes: number): string => {
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

/**
 * Calculates the total hours worked for a timesheet
 */
export const calculateTotalHours = (timesheet: TimeSheetType): number => {
  return timesheet.entries.reduce((total, entry) => {
    return total + (entry.total || 0);
  }, 0);
};

/**
 * Searches for timesheets based on criteria
 */
export const searchTimesheets = (
  timesheets: TimeSheetType[],
  searchTerm: string
): TimeSheetType[] => {
  if (!searchTerm.trim()) return timesheets;
  
  const term = searchTerm.toLowerCase();
  
  return timesheets.filter(timesheet => 
    timesheet.employeeName.toLowerCase().includes(term) ||
    timesheet.employeeId.toLowerCase().includes(term) ||
    timesheet.department.toLowerCase().includes(term) ||
    (timesheet.entries.some(entry => 
      entry.taskName?.toLowerCase().includes(term) ||
      entry.taskCode?.toLowerCase().includes(term)
    ))
  );
};

/**
 * Filters timesheets by date range
 */
export const filterTimesheetsByDateRange = (
  timesheets: TimeSheetType[],
  startDate?: Date,
  endDate?: Date
): TimeSheetType[] => {
  if (!startDate && !endDate) return timesheets;
  
  return timesheets.filter(timesheet => {
    if (!timesheet.date) return false;
    
    const date = new Date(timesheet.date);
    
    if (startDate && endDate) {
      return date >= startDate && date <= endDate;
    } else if (startDate) {
      return date >= startDate;
    } else if (endDate) {
      return date <= endDate;
    }
    
    return true;
  });
};

/**
 * Generates a printable version of the timesheet
 */
export const generatePrintableTimesheet = (timesheet: TimeSheetType): string => {
  let html = `
    <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <div>
          <h1 style="margin: 0; font-size: 18px;">PHIẾU THEO DÕI CÔNG ĐOẠN</h1>
          <p style="margin: 0; font-size: 14px;">GIAO CHỈ TIÊU CÁ NHÂN</p>
        </div>
        <div style="text-align: right;">
          <div style="font-size: 14px; font-weight: bold;">MS: P11H1HB034</div>
          <div style="font-size: 12px;">BĐ, ngày ${formatDate(timesheet.date)}</div>
        </div>
      </div>
      
      <div style="margin-bottom: 20px;">
        <div style="display: flex; margin-bottom: 10px;">
          <div style="width: 50%;">
            <div><strong>HỌ TÊN:</strong> ${timesheet.employeeName}</div>
            <div><strong>MÃ SỐ THẺ:</strong> ${timesheet.employeeId}</div>
          </div>
          <div style="width: 50%;">
            <div><strong>ĐƠN VỊ:</strong> ${timesheet.department}</div>
            <div><strong>TRÌNH ĐỘ:</strong> ${timesheet.level || ''}</div>
          </div>
        </div>
        <div>
          <div><strong>QUẢN KÝ TÊN:</strong> ${timesheet.supervisor || ''}</div>
          <div><strong>NHÓM TRƯỞNG KÝ TÊN:</strong> ${timesheet.teamLeader || ''}</div>
          <div><strong>CHUYỀN TRƯỞNG KÝ TÊN:</strong> ${timesheet.shiftLeader || ''}</div>
        </div>
      </div>
      
      <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
        <thead>
          <tr style="background-color: #f0f0f0;">
            <th style="border: 1px solid #ddd; padding: 6px; text-align: center;">STT</th>
            <th style="border: 1px solid #ddd; padding: 6px; text-align: left;">MÃ TÚI</th>
            <th style="border: 1px solid #ddd; padding: 6px; text-align: left;">MÃ C.ĐOẠN</th>
            <th style="border: 1px solid #ddd; padding: 6px; text-align: left;">TÊN C.ĐOẠN SẢN XUẤT</th>
            <th style="border: 1px solid #ddd; padding: 6px; text-align: center;">CHỈ TIÊU GIỜ</th>
            <th style="border: 1px solid #ddd; padding: 6px; text-align: center;">Đ.GIÁ</th>
            ${TIME_SLOTS.map(slot => 
              `<th style="border: 1px solid #ddd; padding: 6px; text-align: center;">${slot.label}</th>`
            ).join('')}
            <th style="border: 1px solid #ddd; padding: 6px; text-align: center;">TỔNG CỘNG</th>
            <th style="border: 1px solid #ddd; padding: 6px; text-align: center;">VT</th>
            <th style="border: 1px solid #ddd; padding: 6px; text-align: center;">CN</th>
            <th style="border: 1px solid #ddd; padding: 6px; text-align: center;">CL</th>
            <th style="border: 1px solid #ddd; padding: 6px; text-align: center;">MM</th>
          </tr>
        </thead>
        <tbody>
          ${timesheet.entries.map((entry, index) => `
            <tr>
              <td style="border: 1px solid #ddd; padding: 6px; text-align: center;">${index + 1}</td>
              <td style="border: 1px solid #ddd; padding: 6px;">${entry.taskCode || ''}</td>
              <td style="border: 1px solid #ddd; padding: 6px;">${entry.taskId || ''}</td>
              <td style="border: 1px solid #ddd; padding: 6px;">${entry.taskName || ''}</td>
              <td style="border: 1px solid #ddd; padding: 6px; text-align: center;">${entry.target || ''}</td>
              <td style="border: 1px solid #ddd; padding: 6px; text-align: center;">${entry.note || ''}</td>
              ${TIME_SLOTS.map(slot => 
                `<td style="border: 1px solid #ddd; padding: 6px; text-align: center;">
                  ${entry.slots && entry.slots[slot.id.toString()] ? '✓' : ''}
                </td>`
              ).join('')}
              <td style="border: 1px solid #ddd; padding: 6px; text-align: center; font-weight: bold;">${entry.total || 0}</td>
              <td style="border: 1px solid #ddd; padding: 6px; text-align: center;">
                ${entry.reasons?.VT ? '✓' : ''}
              </td>
              <td style="border: 1px solid #ddd; padding: 6px; text-align: center;">
                ${entry.reasons?.CN ? '✓' : ''}
              </td>
              <td style="border: 1px solid #ddd; padding: 6px; text-align: center;">
                ${entry.reasons?.CL ? '✓' : ''}
              </td>
              <td style="border: 1px solid #ddd; padding: 6px; text-align: center;">
                ${entry.reasons?.MM ? '✓' : ''}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <div style="margin-top: 20px; font-size: 12px;">
        <div style="margin-bottom: 10px;">
          <span style="margin-right: 20px;"><strong>VT</strong> = VẬT TƯ</span>
          <span style="margin-right: 20px;"><strong>CN</strong> = CÔNG NGHỆ</span>
          <span style="margin-right: 20px;"><strong>CL</strong> = CHẤT LƯỢNG</span>
          <span><strong>MM</strong> = MÁY MÓC - THIẾT BỊ</span>
        </div>
        
        <div style="margin-top: 30px; display: flex; justify-content: space-between;">
          <div style="text-align: center;">
            <div style="margin-bottom: 60px;">Người lập phiếu</div>
            <div>${timesheet.employeeName}</div>
          </div>
          <div style="text-align: center;">
            <div style="margin-bottom: 60px;">Nhóm trưởng</div>
            <div>${timesheet.teamLeader || ''}</div>
          </div>
          <div style="text-align: center;">
            <div style="margin-bottom: 60px;">Quản lý</div>
            <div>${timesheet.supervisor || ''}</div>
          </div>
        </div>
      </div>
    </div>
  `;
  
  return html;
};

/**
 * Exports timesheet to Excel
 */
export const exportTimesheetToExcel = (timesheet: TimeSheetType): void => {
  try {
    // Create worksheet
    const worksheet = XLSX.utils.aoa_to_sheet([
      ['PHIẾU THEO DÕI CÔNG ĐOẠN - GIAO CHỈ TIÊU CÁ NHÂN'],
      ['MS: P11H1HB034', '', `Ngày: ${formatDate(timesheet.date)}`],
      [],
      ['HỌ TÊN:', timesheet.employeeName, '', 'ĐƠN VỊ:', timesheet.department],
      ['MÃ SỐ THẺ:', timesheet.employeeId, '', 'TRÌNH ĐỘ:', timesheet.level || ''],
      ['QUẢN KÝ TÊN:', timesheet.supervisor || ''],
      ['NHÓM TRƯỞNG KÝ TÊN:', timesheet.teamLeader || ''],
      ['CHUYỀN TRƯỞNG KÝ TÊN:', timesheet.shiftLeader || ''],
      [],
      [
        'STT', 
        'MÃ TÚI', 
        'MÃ C.ĐOẠN', 
        'TÊN C.ĐOẠN SẢN XUẤT', 
        'CHỈ TIÊU GIỜ', 
        'Đ.GIÁ',
        ...TIME_SLOTS.map(slot => slot.label),
        'TỔNG CỘNG',
        'VT',
        'CN',
        'CL',
        'MM'
      ]
    ]);
    
    // Add entries
    timesheet.entries.forEach((entry, index) => {
      const rowData = [
        index + 1,
        entry.taskCode || '',
        entry.taskId || '',
        entry.taskName || '',
        entry.target || '',
        entry.note || '',
        ...TIME_SLOTS.map(slot => 
          entry.slots && entry.slots[slot.id.toString()] ? '✓' : ''
        ),
        entry.total || 0,
        entry.reasons?.VT ? '✓' : '',
        entry.reasons?.CN ? '✓' : '',
        entry.reasons?.CL ? '✓' : '',
        entry.reasons?.MM ? '✓' : ''
      ];
      
      XLSX.utils.sheet_add_aoa(worksheet, [rowData], { origin: 10 + index });
    });
    
    // Set column widths
    const colWidths = [
      { wch: 5 },  // STT
      { wch: 10 }, // MÃ TÚI
      { wch: 10 }, // MÃ C.ĐOẠN
      { wch: 30 }, // TÊN C.ĐOẠN SẢN XUẤT
      { wch: 12 }, // CHỈ TIÊU GIỜ
      { wch: 8 },  // Đ.GIÁ
      ...Array(TIME_SLOTS.length).fill({ wch: 10 }), // Time slots
      { wch: 10 }, // TỔNG CỘNG
      { wch: 5 },  // VT
      { wch: 5 },  // CN
      { wch: 5 },  // CL
      { wch: 5 }   // MM
    ];
    
    worksheet['!cols'] = colWidths;
    
    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Phiếu công đoạn');
    
    // Write file
    const fileName = `Phieu_cong_doan_${timesheet.employeeName.replace(/\s+/g, '_')}_${timesheet.date || 'Unknown'}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    throw new Error('Không thể xuất file Excel. Vui lòng thử lại sau.');
  }
};

/**
 * Exports timesheet to PDF
 */
export const exportTimesheetToPDF = (timesheet: TimeSheetType): void => {
  try {
    // Create new PDF document (A4 landscape)
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });
    
    // Add title
    doc.setFontSize(16);
    doc.text('PHIẾU THEO DÕI CÔNG ĐOẠN - GIAO CHỈ TIÊU CÁ NHÂN', 15, 10);
    
    // Add metadata
    doc.setFontSize(10);
    doc.text(`MS: P11H1HB034`, 15, 18);
    doc.text(`Ngày: ${formatDate(timesheet.date)}`, 240, 18);
    
    // Add employee info
    doc.text(`HỌ TÊN: ${timesheet.employeeName}`, 15, 26);
    doc.text(`ĐƠN VỊ: ${timesheet.department}`, 120, 26);
    doc.text(`MÃ SỐ THẺ: ${timesheet.employeeId}`, 15, 32);
    doc.text(`TRÌNH ĐỘ: ${timesheet.level || ''}`, 120, 32);
    doc.text(`QUẢN KÝ TÊN: ${timesheet.supervisor || ''}`, 15, 38);
    doc.text(`NHÓM TRƯỞNG KÝ TÊN: ${timesheet.teamLeader || ''}`, 15, 44);
    doc.text(`CHUYỀN TRƯỞNG KÝ TÊN: ${timesheet.shiftLeader || ''}`, 15, 50);
    
    // Prepare table headers
    const tableHeaders = [
      ['STT', 'MÃ TÚI', 'MÃ C.ĐOẠN', 'TÊN C.ĐOẠN SẢN XUẤT', 'CHỈ TIÊU GIỜ', 'Đ.GIÁ',
       ...TIME_SLOTS.map(slot => slot.label), 'TỔNG', 'VT', 'CN', 'CL', 'MM']
    ];
    
    // Prepare table data
    const tableData = timesheet.entries.map((entry, index) => [
      (index + 1).toString(),
      entry.taskCode || '',
      entry.taskId || '',
      entry.taskName || '',
      entry.target || '',
      entry.note || '',
      ...TIME_SLOTS.map(slot => 
        entry.slots && entry.slots[slot.id.toString()] ? '✓' : ''
      ),
      (entry.total || 0).toString(),
      entry.reasons?.VT ? '✓' : '',
      entry.reasons?.CN ? '✓' : '',
      entry.reasons?.CL ? '✓' : '',
      entry.reasons?.MM ? '✓' : ''
    ]);
    
    // Set table styles and render
    autoTable(doc, {
      startY: 55,
      head: tableHeaders,
      body: tableData,
      theme: 'grid',
      styles: {
        fontSize: 8,
        cellPadding: 1
      },
      headStyles: {
        fillColor: [220, 220, 220],
        textColor: [0, 0, 0],
        fontStyle: 'bold'
      },
      columnStyles: {
        0: { cellWidth: 8 },
        1: { cellWidth: 15 },
        2: { cellWidth: 15 },
        3: { cellWidth: 35 },
        4: { cellWidth: 15 },
        5: { cellWidth: 10 },
        17: { cellWidth: 12 },
        18: { cellWidth: 8 },
        19: { cellWidth: 8 },
        20: { cellWidth: 8 },
        21: { cellWidth: 8 }
      }
    });
    
    // Add footer text
    const finalY = (doc as any).lastAutoTable.finalY || 180;
    doc.text('VT = VẬT TƯ     CN = CÔNG NGHỆ     CL = CHẤT LƯỢNG     MM = MÁY MÓC - THIẾT BỊ', 15, finalY + 10);
    
    // Add signature lines
    doc.text('Người lập phiếu', 60, finalY + 20);
    doc.text('Nhóm trưởng', 140, finalY + 20);
    doc.text('Quản lý', 220, finalY + 20);
    
    doc.text(timesheet.employeeName, 60, finalY + 40);
    doc.text(timesheet.teamLeader || '', 140, finalY + 40);
    doc.text(timesheet.supervisor || '', 220, finalY + 40);
    
    // Save the PDF
    const fileName = `Phieu_cong_doan_${timesheet.employeeName.replace(/\s+/g, '_')}_${timesheet.date || 'Unknown'}.pdf`;
    doc.save(fileName);
  } catch (error) {
    console.error('Error exporting to PDF:', error);
    throw new Error('Không thể xuất file PDF. Vui lòng thử lại sau.');
  }
};

/**
 * Gets the reason names for a timesheet entry
 */
export const getReasonNames = (entry: TimeSheetEntryType): string[] => {
  const reasons: string[] = [];
  
  if (entry.reasons?.VT) reasons.push('Vật tư');
  if (entry.reasons?.CN) reasons.push('Công nghệ');
  if (entry.reasons?.CL) reasons.push('Chất lượng');
  if (entry.reasons?.MM) reasons.push('Máy móc - Thiết bị');
  
  return reasons;
};

/**
 * Gets a user-friendly status label
 */
export const getStatusLabel = (status?: string): string => {
  switch (status) {
    case 'approved': return 'Đã duyệt';
    case 'pending': return 'Chờ duyệt';
    case 'draft': return 'Bản nháp';
    default: return 'Không xác định';
  }
};

/**
 * Gets a color for a status
 */
export const getStatusColor = (status?: string): { bg: string; text: string } => {
  switch (status) {
    case 'approved':
      return { bg: 'bg-green-100 dark:bg-green-800', text: 'text-green-800 dark:text-green-100' };
    case 'pending':
      return { bg: 'bg-yellow-100 dark:bg-yellow-800', text: 'text-yellow-800 dark:text-yellow-100' };
    case 'draft':
      return { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-800 dark:text-gray-100' };
    default:
      return { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-800 dark:text-gray-200' };
  }
};