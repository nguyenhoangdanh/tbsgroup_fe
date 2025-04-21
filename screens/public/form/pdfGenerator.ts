import { WorkLog } from "./workLogTypes";
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

// Time slot mappings for each working time type
const TIME_SLOTS = {
  "8_hours": [
    "7:30-8:30", "8:30-9:30", "9:30-10:30", "10:30-11:30", 
    "12:30-13:30", "13:30-14:30", "14:30-15:30", "15:30-16:30"
  ],
  "9.5_hours": [
    "7:30-8:30", "8:30-9:30", "9:30-10:30", "10:30-11:30", 
    "12:30-13:30", "13:30-14:30", "14:30-15:30", "15:30-16:30", "17:00-18:00"
  ],
  "11_hours": [
    "7:30-8:30", "8:30-9:30", "9:30-10:30", "10:30-11:30", 
    "12:30-13:30", "13:30-14:30", "14:30-15:30", "15:30-16:30", 
    "17:00-18:00", "18:00-19:00", "19:00-20:00"
  ]
};

// Function to convert working time to label
function getWorkTimeLabel(workingTime: string): string {
  switch(workingTime) {
    case '8_hours': return '8 tiếng (07:30 - 16:30)';
    case '9.5_hours': return '9 tiếng 30 phút (07:30 - 18:00)';
    case '11_hours': return '11 tiếng (07:30 - 20:00)';
    default: return workingTime;
  }
}

// Normalize time slot keys
function normalizeTimeSlotKey(slot: string): string {
  const parts = slot.split('-');
  if (parts.length === 2) {
    let start = parts[0].trim();
    let end = parts[1].trim();
    
    // Add leading zero if needed (7:30 -> 07:30)
    if (start.length === 4 && start[1] === ':') {
      start = '0' + start;
    }
    if (end.length === 4 && end[1] === ':') {
      end = '0' + end;
    }
    
    return `${start}-${end}`;
  }
  return slot;
}

// Get all related entries for a workLog if isFullReport is true
function getAllRelatedEntries(workLog: WorkLog, isFullReport: boolean): WorkLog[] {
  if (!isFullReport) {
    return [workLog];
  }

  try {
    const storedLogs = localStorage.getItem('enhancedWorkLogs');
    if (!storedLogs) return [workLog];

    const logs = JSON.parse(storedLogs);
    
    // Find all worklogs with the same employeeId and date
    const relatedLogs = logs.filter((log: any) => {
      return log.employeeId === workLog.employeeId && log.date === workLog.date;
    });
    
    if (relatedLogs.length === 0) return [workLog];
    
    // Convert enhanced records to individual worklogs
    const flattenedLogs: WorkLog[] = [];
    
    relatedLogs.forEach((enhancedLog: any) => {
      if (enhancedLog.entries && Array.isArray(enhancedLog.entries)) {
        enhancedLog.entries.forEach((entry: any) => {
          flattenedLogs.push({
            id: `${enhancedLog.id}_${entry.id}`,
            date: enhancedLog.date,
            employeeId: enhancedLog.employeeId,
            employeeCode: enhancedLog.employeeCode,
            employeeName: enhancedLog.employeeName,
            department: enhancedLog.department,
            cardNumber: enhancedLog.cardNumber,
            workingTime: enhancedLog.workingTime,
            bagCode: entry.bagCode,
            operationCode: entry.operationCode,
            operationName: entry.operationName,
            hourlyTarget: entry.hourlyTarget,
            production: entry.production,
            totalProduction: entry.totalProduction,
            performanceReason: entry.performanceReason,
            status: enhancedLog.status,
            createdAt: enhancedLog.createdAt,
            updatedAt: enhancedLog.updatedAt
          });
        });
      }
    });
    
    return flattenedLogs.length > 0 ? flattenedLogs : [workLog];
  } catch (error) {
    console.error('Error getting related entries:', error);
    return [workLog];
  }
}

// Create HTML based on worklog data with improved styling
function generatePrintableHTML(workLog: WorkLog, relatedLogs: WorkLog[], logoUrl?: string): string {
  // Get date from workLog or current date
  const reportDate = new Date(workLog.date || new Date());
  const day = reportDate.getDate();
  const month = reportDate.getMonth() + 1;
  const year = reportDate.getFullYear();
  
  // Define time slots to display
  const allTimeColumns = [
    "07:30-08:30", "08:30-09:30", "09:30-10:30", "10:30-11:30", 
    "11:30-12:30", "12:30-13:30", "13:30-14:30", "14:30-15:30",
    "15:30-16:30", "16:30-17:00", "17:00-18:00", "18:00-19:00", "19:00-20:00"
  ];
  
  // Create data rows for table
  const tableRows = relatedLogs.map((log, index) => {
    // Get production values for each time slot
    const hourlyProduction: Record<string, number | string> = {};
    
    // Prepare production data for all time intervals
    Object.keys(log.production || {}).forEach(key => {
      const normalizedKey = normalizeTimeSlotKey(key);
      hourlyProduction[normalizedKey] = log.production[key] || 0;
    });
    
    // Create cells for each time slot - empty if value is 0
    const timeSlotCells = allTimeColumns.map(slot => {
      const value = hourlyProduction[slot] || 0;
      return `<td>${typeof value === 'number' && value > 0 ? value : ''}</td>`;
    });
    
    // Format reasons
    const vtReason = log.performanceReason?.material || '';
    const cnReason = log.performanceReason?.technology || '';
    const clReason = log.performanceReason?.quality || '';
    const mmReason = log.performanceReason?.machinery || '';
    
    return `
      <tr>
        <td>${index + 1}</td>
        <td>${log.bagCode || ''}</td>
        <td>${log.operationCode || ''}</td>
        <td style="text-align: left;">${log.operationName || ''}</td>
        <td>${log.hourlyTarget || ''}</td>
        <td></td>
        ${timeSlotCells.join('')}
        <td>${log.totalProduction || ''}</td>
        <td>${vtReason}</td>
        <td>${cnReason}</td>
        <td>${clReason}</td>
        <td>${mmReason}</td>
      </tr>
    `;
  }).join('');
  
  // If no data, add empty row
  const emptyRow = relatedLogs.length === 0 ? `
    <tr>
      <td>1</td>
      <td></td><td></td><td></td><td></td><td></td>
      <td></td><td></td><td></td><td></td><td></td><td></td>
      <td></td><td></td><td></td><td></td><td></td><td></td>
      <td></td><td></td><td></td><td></td><td></td>
    </tr>
  ` : '';

  // Create full HTML based on template
  return `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>Báo Cáo Sản Lượng</title>
  <style>
    @page {
      size: A4 landscape;
      margin: 0;
    }

    body {
      font-family: 'Times New Roman', DejaVu Sans, sans-serif;
      font-size: 10px;
      margin: 5mm;
      padding: 0;
      line-height: 1.3;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 3px;
    }

    .logo-container {
      display: flex;
      flex-direction: column;
    }

    .logo {
      max-width: 80px;
      max-height: 30px;
    }

    .company-info {
      text-align: left;
      font-size: 8px;
      margin-top: 2px;
      font-weight: bold;
    }

    .ms-code {
      text-align: right;
      font-weight: bold;
    }

    .date-info {
      display: flex;
      justify-content: flex-end;
      align-items: flex-end;
      font-style: italic;
      font-size: 9px;
    }

    .main-container {
      border: 1px solid black;
    }

    .document-title {
      text-align: center;
      font-weight: bold;
      font-size: 12px;
      border-bottom: 1px solid black;
      padding: 5px;
      text-transform: uppercase;
    }

    .info-section {
      display: flex;
      border-bottom: 1px solid black;
    }

    .info-column {
      padding: 5px;
    }

    .info-column-left {
      width: 50%;
      border-right: 1px solid black;
    }

    .info-column-right {
      width: 50%;
      display: flex;
    }

    .info-box {
      padding: 5px;
    }

    .info-box-1 {
      flex: 1;
      border-right: 1px solid black;
    }

    .info-box-2 {
      flex: 1;
    }

    .employee-info {
      display: flex;
      align-items: center;
      margin-bottom: 5px;
    }

    .label-dotted {
      border-bottom: 1px dotted black;
      flex: 1;
      margin: 0 5px;
      min-height: 14px;
      position: relative;
    }
    
    /* Add dots after label */
    .employee-info .label-dotted:after {
      content: "......................................................................................................................";
      position: absolute;
      bottom: -2px;
      left: 0;
      width: 100%;
      overflow: hidden;
      white-space: nowrap;
    }

    table {
      width: 100%;
      border-collapse: collapse;
    }

    table, th, td {
      border: 1px solid #000;
    }

    th, td {
      padding: 2px;
      text-align: center;
      font-size: 9px;
    }

    th {
      font-weight: bold;
      background-color: #f2f2f2;
    }

    .table-header {
      background-color: #f2f2f2;
    }

    .note {
      font-size: 9px;
      font-style: italic;
      margin-top: 3px;
    }

    .time-column {
      width: 35px;
    }

    .narrow-column {
      width: 30px;
    }

    .wide-column {
      width: 100px;
    }
    
    .signature-table {
      border: none;
      height: 100%;
      width: 100%;
    }
    
    .signature-table td {
      border: none;
      width: 33%;
      text-align: center;
      height: 50px;
      vertical-align: top;
    }
    
    /* Column styling for headers and results */
    .results-header {
      text-align: center;
      font-weight: bold;
      background-color: #f2f2f2;
    }
    
    .causes-header {
      text-align: center;
      font-weight: bold;
      background-color: #f2f2f2;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo-container">
      ${logoUrl ? `<img src="${logoUrl}" alt="TBS Logo" class="logo" />` : ''}
      <div class="company-info">
        HANDBAG FACTORY
        <br>
        XN: THOẠI SƠN
      </div>
    </div>
    <div class="ms-code">
      MS: P11H1HB034
      <div class="date-info">
        TS, ngày ${day < 10 ? '0' + day : day}/${month < 10 ? '0' + month : month}/${year}
      </div>
    </div>
  </div>

  <div class="main-container">
    <div class="document-title">
      PHIẾU THEO DÕI CÔNG ĐOẠN - GIAO CHỈ TIÊU CÁ NHÂN
    </div>

    <div class="info-section">
      <div class="info-column info-column-left">
        <div class="employee-info">
          <span>HỌ TÊN:</span>
          <span class="label-dotted">${workLog.employeeName || ''}</span>
        </div>
        <div class="employee-info">
          <span>MÃ SỐ THẺ:</span>
          <span class="label-dotted">${workLog.cardNumber || ''}</span>
        </div>
      </div>
      <div class="info-column info-column-right">
        <div class="info-box info-box-1">
          <div class="employee-info">
            <span>ĐƠN VỊ:</span>
            <span class="label-dotted">${workLog.department || ''}</span>
          </div>
          <div class="employee-info">
            <span>T/GIAN LV:</span>
            <span class="label-dotted">${getWorkTimeLabel(workLog.workingTime || '')}</span>
          </div>
        </div>
        <div class="info-box info-box-2">
          <table class="signature-table">
            <tr>
              <td>CN KÝ TÊN</td>
              <td>NHÓM TRƯỞNG<br>KÝ TÊN</td>
              <td>CHUYỂN TRƯỞNG<br>KÝ TÊN</td>
            </tr>
          </table>
        </div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th rowspan="2" class="narrow-column">STT</th>
          <th rowspan="2">MÃ TÚI</th>
          <th rowspan="2">MÃ C.ĐOẠN</th>
          <th rowspan="2" class="wide-column">TÊN C.ĐOẠN SẢN XUẤT</th>
          <th rowspan="2">CHỈ TIÊU<br>GIỜ</th>
          <th rowspan="2">Đ.GIÁ</th>
          <th colspan="13" class="results-header">KẾT QUẢ THỰC HIỆN TRONG NGÀY</th>
          <th rowspan="2">TỔNG<br>CỘNG</th>
          <th colspan="4" class="causes-header">NGUYÊN NHÂN</th>
        </tr>
        <tr>
          <th class="time-column">07:30-<br>08:30</th>
          <th class="time-column">08:30-<br>09:30</th>
          <th class="time-column">09:30-<br>10:30</th>
          <th class="time-column">10:30-<br>11:30</th>
          <th class="time-column">11:30-<br>12:30</th>
          <th class="time-column">12:30-<br>13:30</th>
          <th class="time-column">13:30-<br>14:30</th>
          <th class="time-column">14:30-<br>15:30</th>
          <th class="time-column">15:30-<br>16:30</th>
          <th class="time-column">16:30-<br>17:00</th>
          <th class="time-column">17:00-<br>18:00</th>
          <th class="time-column">18:00-<br>19:00</th>
          <th class="time-column">19:00-<br>20:00</th>
          <th class="narrow-column">VT</th>
          <th class="narrow-column">CN</th>
          <th class="narrow-column">CL</th>
          <th class="narrow-column">MM</th>
        </tr>
      </thead>
      <tbody>
        ${tableRows}
        ${emptyRow}
      </tbody>
    </table>
  </div>

  <div class="note">
    GHI CHÚ: VT = VẬT TƯ &nbsp;&nbsp;&nbsp;&nbsp; CN = CÔNG NGHỆ &nbsp;&nbsp;&nbsp;&nbsp; CL = CHẤT LƯỢNG
    &nbsp;&nbsp;&nbsp;&nbsp; MM = MÁY MÓC - THIẾT BỊ
  </div>
</body>
</html>
  `;
}

// Generate PDF from WorkLog with logo support
export async function generateClientSidePDF(
  workLog: WorkLog, 
  isFullReport: boolean = false,
  logoUrl?: string
): Promise<string> {
  // Get all related work logs
  const relatedLogs = getAllRelatedEntries(workLog, isFullReport);
  
  try {
    // Generate HTML
    const htmlContent = generatePrintableHTML(workLog, relatedLogs, logoUrl);
    
    // Create an iframe to render the HTML
    const iframe = document.createElement('iframe');
    iframe.style.visibility = 'hidden';
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '1100px';  // A4 landscape width equivalent
    iframe.style.height = '800px';  // A4 landscape height equivalent
    iframe.style.border = 'none';
    
    // Add iframe to document
    document.body.appendChild(iframe);
    
    // Set iframe content
    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!iframeDoc) throw new Error('Cannot create iframe document');
    
    iframeDoc.open();
    iframeDoc.write(htmlContent);
    iframeDoc.close();
    
    // Wait for content to render
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Create PDF with better quality settings
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });
    
    // Use html2canvas to capture the content
    if (!iframeDoc.body) throw new Error('Cannot find body in iframe');
    
    // Higher scale and better quality settings
    const canvas = await html2canvas(iframeDoc.body, {
      scale: 3,              // Higher scale for better quality
      useCORS: true,
      logging: false,
      backgroundColor: '#FFFFFF',
      imageTimeout: 0,       // No timeout for images
      allowTaint: true,      // Allow using images from other domains
    });
    
    // Add image to PDF with high quality setting
    const imgData = canvas.toDataURL('image/jpeg', 1.0);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    
    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
    
    // Clean up the iframe
    document.body.removeChild(iframe);
    
    // Return PDF as blob URL
    const pdfBlob = pdf.output('blob');
    const url = URL.createObjectURL(pdfBlob);
    
    return url;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
}