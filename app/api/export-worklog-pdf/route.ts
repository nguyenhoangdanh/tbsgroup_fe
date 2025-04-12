import puppeteer from "puppeteer";
import handlebars from "handlebars";
import fs from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { WorkLog } from "@/screens/public/demo/workLogService";

// Mapping của các time slots cho từng loại working time
const TIME_SLOTS = {
  "8_hours": [
    "07:30-08:30", "08:30-09:30", "09:30-10:30", "10:30-11:30", 
    "11:30-12:30", "13:30-14:30", "14:30-15:30", "15:30-16:30", 
    "", "", "", ""
  ],
  "9.5_hours": [
    "07:30-08:30", "08:30-09:30", "09:30-10:30", "10:30-11:30", 
    "11:30-12:30", "13:30-14:30", "14:30-15:30", "15:30-16:30", 
    "16:30-17:00", "17:00-18:00", "", ""
  ],
  "11_hours": [
    "07:30-08:30", "08:30-09:30", "09:30-10:30", "10:30-11:30", 
    "11:30-12:30", "13:30-14:30", "14:30-15:30", "15:30-16:30", 
    "16:30-17:00", "17:00-18:00", "18:00-19:00", "19:00-20:00"
  ]
};

const getTemplateHtml = (templateName: string) => {
  const filePath = path.join(process.cwd(), "templates", `${templateName}.hbs`);
  return fs.readFileSync(filePath, "utf-8");
};

// Hàm chuyển đổi working time sang nhãn
function getWorkTimeLabel(workingTime: string): string {
  switch(workingTime) {
    case '8_hours': return '8 tiếng (07:30 - 16:30)';
    case '9.5_hours': return '9 tiếng 30 phút (07:30 - 18:00)';
    case '11_hours': return '11 tiếng (07:30 - 19:00)';
    default: return workingTime;
  }
}

// Hàm chuẩn hóa hourly logs để phù hợp với template
function getHourlyLogs(production: Record<string, number>, workingTime: string): (number | string)[] {
  const slots = TIME_SLOTS[workingTime as keyof typeof TIME_SLOTS] || [];
  
  // Chuẩn hóa lại key của production để đảm bảo tương thích
  const normalizedProduction: Record<string, number> = {};
  Object.keys(production).forEach(key => {
    // Chuẩn hóa key format từ "7:30-8:30" thành "07:30-08:30"
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
  
  // Trả về giá trị cho mỗi time slot, lọc ra các giá trị bằng 0
  return slots.map(slot => {
    if (!slot) return "";
    const value = normalizedProduction[slot] || 0;
    return value === 0 ? "" : value; // Chỉ hiển thị giá trị khác 0
  });
}

export async function POST(req: NextRequest) {
  const workLog: WorkLog = await req.json();

  // Lấy ngày hiện tại để điền vào template
  const currentDate = new Date();

  const logoPath = path.join(process.cwd(), 'public', 'images', 'logo-light.png');
  const logoBase64 = fs.readFileSync(logoPath, { encoding: 'base64' });


  // Ánh xạ dữ liệu WorkLog sang cấu trúc template
  const templateData = {
    msCode: 'P11H1HB034', // Mã số cố định
    fullName: workLog.employeeName,
    staffCode: workLog.cardNumber,
    unit: workLog.department,
    workTime: getWorkTimeLabel(workLog.workingTime),
    logo: `data:image/png;base64,${logoBase64}`,
    date: {
      day: currentDate.getDate(),
      month: currentDate.getMonth() + 1,
      year: currentDate.getFullYear()
    },
    workLogs: [{
      bagCode: workLog.bagCode,
      stepCode: '', // Bạn có thể thêm logic để lấy mã công đoạn nếu cần
      stepName: workLog.operationName,
      targetPerHour: workLog.hourlyTarget,
      price: '', // Giá trị đơn giá nếu có
      hourlyLogs: getHourlyLogs(workLog.production, workLog.workingTime),
      total: workLog.totalProduction,
      reason: {
        VT: workLog.performanceReason.material || '',
        CN: workLog.performanceReason.technology || '',
        CL: workLog.performanceReason.quality || '',
        MM: workLog.performanceReason.machinery || ''
      }
    }]
  };

  const templateHtml = getTemplateHtml("workLogTemplate");
  
  // Đăng ký các helper cần thiết
  handlebars.registerHelper('padZero', function(value) {
    return value < 10 ? `0${value}` : value;
  });

  // Helper để tính toán chỉ số STT (bắt đầu từ 1 thay vì 0)
  handlebars.registerHelper('math', function(lvalue, operator, rvalue, options) {
    lvalue = parseFloat(lvalue);
    rvalue = parseFloat(rvalue);

    switch (operator) {
      case '+': return lvalue + rvalue;
      case '-': return lvalue - rvalue;
      case '*': return lvalue * rvalue;
      case '/': return lvalue / rvalue;
      default: return lvalue;
    }
  });

  // Helper để tạo các dòng trống nếu không có dữ liệu
  handlebars.registerHelper('times', function(n, block) {
    let accum = '';
    for(let i = 0; i < n; ++i)
      accum += block.fn(i);
    return accum;
  });

  const template = handlebars.compile(templateHtml);
  const html = template(templateData);

  // Khởi tạo trình duyệt
  const browser = await puppeteer.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();

  // Thêm font hỗ trợ Tiếng Việt
  await page.setContent(html, { waitUntil: "networkidle0" });

  const pdfBuffer = await page.pdf({
    format: "A4",
    landscape: true, // Changed back to landscape mode to match the reference image
    printBackground: true,
    margin: { 
      top: "0mm", 
      right: "0mm", 
      bottom: "0mm", 
      left: "0mm" 
    },
  });

  await browser.close();

  return new NextResponse(Buffer.from(pdfBuffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'inline; filename="worklog.pdf"'
    },
  });
}

// Đảm bảo export runtime
export const runtime = 'nodejs';













// import puppeteer from "puppeteer";
// import handlebars from "handlebars";
// import fs from "fs";
// import path from "path";
// import { NextRequest, NextResponse } from "next/server";
// import { WorkLog } from "@/screens/public/demo/workLogService";

// const getTemplateHtml = (templateName: string) => {
//   const filePath = path.join(process.cwd(), "templates", `${templateName}.hbs`);
//   return fs.readFileSync(filePath, "utf-8");
// };

// export async function POST(req: NextRequest) {
//   const workLog: WorkLog = await req.json();

//   // Ánh xạ dữ liệu WorkLog sang cấu trúc template
//   const templateData = {
//     fullName: workLog.employeeName,
//     staffCode: workLog.cardNumber,
//     unit: workLog.department,
//     workTime: getWorkTimeLabel(workLog.workingTime),
//     workLogs: [{
//       bagCode: workLog.bagCode,
//       stepCode: '', // Bạn có thể thêm logic để lấy mã công đoạn nếu cần
//       stepName: workLog.operationName,
//       targetPerHour: workLog.hourlyTarget,
//       price: '', // Giá trị đơn giá nếu có
//       hourlyLogs: Object.values(workLog.production),
//       total: workLog.totalProduction,
//       reason: {
//         VT: workLog.performanceReason.material || '',
//         CN: workLog.performanceReason.technology || '',
//         CL: workLog.performanceReason.quality || '',
//         MM: workLog.performanceReason.machinery || ''
//       }
//     }]
//   };

//   const templateHtml = getTemplateHtml("workLogTemplate");
//   const template = handlebars.compile(templateHtml);
//   const html = template(templateData);

//   // Khởi tạo trình duyệt với font hỗ trợ Tiếng Việt
//   const browser = await puppeteer.launch({ 
//     headless: true,
//   });
//   const page = await browser.newPage();

//   // Thêm font hỗ trợ Tiếng Việt
//   await page.setContent(html, { waitUntil: "networkidle0" });
//   await page.addStyleTag({
//     content: `
//       @import url('https://fonts.googleapis.com/css2?family=Roboto+Slab:wght@400;700&display=swap');
//       body { 
//         font-family: 'Roboto Slab', 'Times New Roman', DejaVu Sans, sans-serif; 
//       }
//     `
//   });

//   const pdfBuffer = await page.pdf({
//     format: "A4",
//     printBackground: true,
//     margin: { 
//       top: "10mm", 
//       right: "10mm", 
//       bottom: "15mm", 
//       left: "10mm" 
//     },
//   });

//   await browser.close();

//   return new NextResponse(Buffer.from(pdfBuffer), {
//     status: 200,
//     headers: {
//       "Content-Type": "application/pdf",
//       "Content-Disposition": 'inline; filename="worklog.pdf"'
//     },
//   });
// }

// // Hàm hỗ trợ chuyển đổi workingTime sang nhãn
// function getWorkTimeLabel(workingTime: string): string {
//   switch(workingTime) {
//     case '8_hours': return '8 tiếng (07:30 - 16:30)';
//     case '9.5_hours': return '9 tiếng 30 phút (07:30 - 18:00)';
//     case '11_hours': return '11 tiếng (07:30 - 19:00)';
//     default: return workingTime;
//   }
