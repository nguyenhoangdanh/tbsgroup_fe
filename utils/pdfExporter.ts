// File: utils/pdfExporter.ts
import { WorkLog } from "@/screens/public/form/workLogService";
import { jsPDF } from "jspdf";
import 'jspdf-autotable';
import autoTable from 'jspdf-autotable';

// Bổ sung định nghĩa cho jsPDF với autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: typeof autoTable;
  }
}

export async function generateWorkLogPDF(workLog: WorkLog): Promise<string> {
  try {
    // Khởi tạo jsPDF với hướng ngang
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    // Thêm font tiếng Việt nếu cần
    // doc.addFont('path/to/font.ttf', 'CustomFont', 'normal');
    // doc.setFont('CustomFont');

    // Thêm tiêu đề
    doc.setFontSize(16);
    doc.text('PHIẾU THEO DÕI CÔNG ĐOẠN - GIAO CHỈ TIÊU CÁ NHÂN', doc.internal.pageSize.width / 2, 20, { align: 'center' });

    // Thông tin nhân viên
    doc.setFontSize(10);
    doc.text(`Họ tên: ${workLog.employeeName}`, 15, 30);
    doc.text(`Mã số thẻ: ${workLog.cardNumber}`, 15, 36);
    doc.text(`Đơn vị: ${workLog.department}`, 90, 30);
    doc.text(`Thời gian làm việc: ${getWorkTimeLabel(workLog.workingTime)}`, 90, 36);
    doc.text(`Ngày: ${new Date().toLocaleDateString('vi-VN')}`, 180, 30);

    // Tạo dữ liệu cho bảng
    const timeSlots = getTimeSlots(workLog.workingTime);
    const hourlyData = getHourlyLogs(workLog.production, workLog.workingTime);

    // Tạo headers cho bảng
    const tableHeaders = [
      [
        { content: 'STT', rowSpan: 2 },
        { content: 'MÃ TÚI', rowSpan: 2 },
        { content: 'MÃ C.ĐOẠN', rowSpan: 2 },
        { content: 'TÊN C.ĐOẠN SẢN XUẤT', rowSpan: 2 },
        { content: 'CHỈ TIÊU GIỜ', rowSpan: 2 },
        { content: 'Đ.GIÁ', rowSpan: 2 },
        { content: 'KẾT QUẢ THỰC HIỆN TRONG NGÀY', colSpan: timeSlots.length },
        { content: 'TỔNG CỘNG', rowSpan: 2 },
        { content: 'NGUYÊN NHÂN', colSpan: 4 }
      ],
      [
        ...timeSlots.map(slot => ({ content: slot })),
        { content: 'VT' },
        { content: 'CN' },
        { content: 'CL' },
        { content: 'MM' }
      ]
    ];

    // Dữ liệu cho bảng
    const tableBody = [
      [
        '1',
        workLog.bagCode,
        workLog.operationCode || '',
        workLog.operationName,
        workLog.hourlyTarget.toString(),
        '',
        ...hourlyData.map(val => val.toString()),
        workLog.totalProduction.toString(),
        workLog.performanceReason.material || '',
        workLog.performanceReason.technology || '',
        workLog.performanceReason.quality || '',
        workLog.performanceReason.machinery || ''
      ]
    ];

    // Tạo bảng với autoTable
    (doc as any).autoTable({
      head: tableHeaders,
      body: tableBody,
      startY: 45,
      theme: 'grid',
      styles: {
        fontSize: 8,
        cellPadding: 2,
        valign: 'middle',
        halign: 'center',
        lineWidth: 0.1,
      },
      headStyles: {
        fillColor: [240, 240, 240],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
      },
      columnStyles: {
        0: { cellWidth: 10 }, // STT
        1: { cellWidth: 20 }, // MÃ TÚI
        2: { cellWidth: 20 }, // MÃ C.ĐOẠN
        3: { cellWidth: 40 }, // TÊN C.ĐOẠN
        4: { cellWidth: 15 }, // CHỈ TIÊU GIỜ
        5: { cellWidth: 10 }, // Đ.GIÁ
        // Time slots có kích thước động
        // TỔNG CỘNG và NGUYÊN NHÂN cũng vậy
      },
    });

    // Thêm ghi chú
    const finalY = (doc as any).lastAutoTable.finalY || 120;
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.text('GHI CHÚ: VT = VẬT TƯ    CN = CÔNG NGHỆ    CL = CHẤT LƯỢNG    MM = MÁY MÓC - THIẾT BỊ', 15, finalY + 10);

    // Xuất PDF dưới dạng base64
    const pdfBase64 = doc.output('datauristring');
    return pdfBase64;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
}

// Các hàm helper giống như trong backend version
function getWorkTimeLabel(workingTime: string): string {
  switch(workingTime) {
    case '8_hours': return '8 tiếng (07:30 - 16:30)';
    case '9.5_hours': return '9 tiếng 30 phút (07:30 - 18:00)';
    case '11_hours': return '11 tiếng (07:30 - 19:00)';
    default: return workingTime;
  }
}

function getTimeSlots(workingTime: string): string[] {
  switch (workingTime) {
    case "8_hours":
      return ["07:30-08:30", "08:30-09:30", "09:30-10:30", "10:30-11:30", "13:30-14:30", "14:30-15:30", "15:30-16:30"];
    case "9.5_hours":
      return ["07:30-08:30", "08:30-09:30", "09:30-10:30", "10:30-11:30", "13:30-14:30", "14:30-15:30", "15:30-16:30", "17:00-18:00"];
    case "11_hours":
      return ["07:30-08:30", "08:30-09:30", "09:30-10:30", "10:30-11:30", "13:30-14:30", "14:30-15:30", "15:30-16:30", "17:00-18:00", "18:00-19:00"];
    default:
      return [];
  }
}

function getHourlyLogs(production: Record<string, number>, workingTime: string): (number | string)[] {
  const slots = getTimeSlots(workingTime);
  
  // Chuẩn hóa lại key của production
  const normalizedProduction: Record<string, number> = {};
  Object.keys(production).forEach(key => {
    const parts = key.split('-');
    if (parts.length === 2) {
      const startParts = parts[0].split(':');
      const endParts = parts[1].split(':');
      
      if (startParts.length === 2 && endParts.length === 2) {
        const normalizedKey = `${startParts[0].padStart(2, '0')}:${startParts[1]}-${endParts[0].padStart(2, '0')}:${endParts[1]}`;
        normalizedProduction[normalizedKey] = production[key];
      } else {
        normalizedProduction[key] = production[key];
      }
    } else {
      normalizedProduction[key] = production[key];
    }
  });
  
  return slots.map(slot => {
    if (!slot) return "";
    const value = normalizedProduction[slot] || 0;
    return value === 0 ? "" : value;
  });
}