import puppeteer from "puppeteer";
import handlebars from "handlebars";
import fs from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { WorkLog } from "@/screens/public/form/workLogService";

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
  try {
    const workLog: WorkLog = await req.json();

    // Lấy ngày hiện tại để điền vào template
    const currentDate = new Date();

    const logoPath = path.join(process.cwd(), 'public', 'images', 'logo-light.png');
    let logoBase64 = '';
    
    try {
      logoBase64 = fs.readFileSync(logoPath, { encoding: 'base64' });
    } catch (error) {
      console.error('Error reading logo file:', error);
      // Provide a fallback or empty string if logo can't be read
    }

    // Ánh xạ dữ liệu WorkLog sang cấu trúc template
    const templateData = {
      msCode: 'P11H1HB034', // Mã số cố định
      fullName: workLog.employeeName,
      staffCode: workLog.cardNumber,
      unit: workLog.department,
      workTime: getWorkTimeLabel(workLog.workingTime),
      logo: logoBase64 ? `data:image/png;base64,${logoBase64}` : '',
      date: {
        day: currentDate.getDate(),
        month: currentDate.getMonth() + 1,
        year: currentDate.getFullYear()
      },
      workLogs: [{
        bagCode: workLog.bagCode,
        stepCode: workLog.operationCode || '', // Use operation code from worklog
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

    // Khởi tạo trình duyệt với các tùy chọn đặc biệt cho Vercel
    const browser = await puppeteer.launch({ 
      headless: true,
      args: [
        '--no-sandbox', 
        '--disable-setuid-sandbox',
        '--disable-gpu',
        '--disable-dev-shm-usage',
        '--single-process'
      ]
    });
    
    const page = await browser.newPage();

    // Set content với timeout dài hơn
    await page.setContent(html, { 
      waitUntil: "networkidle0",
      timeout: 30000 // Increase timeout to 30 seconds
    });

    // Generate PDF with appropriate settings
    const pdfBuffer = await page.pdf({
      format: "A4",
      landscape: true,
      printBackground: true,
      margin: { 
        top: "0mm", 
        right: "0mm", 
        bottom: "0mm", 
        left: "0mm" 
      },
    });

    await browser.close();

    // Return PDF response
    return new NextResponse(Buffer.from(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'inline; filename="worklog.pdf"'
      },
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    return new NextResponse(JSON.stringify({ 
      error: 'Failed to generate PDF',
      details: error instanceof Error ? error.message : String(error)
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json"
      }
    });
  }
}

// Đảm bảo export runtime
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic'; // Ensure this is a dynamic route
























// import puppeteer from "puppeteer";
// import handlebars from "handlebars";
// import fs from "fs";
// import path from "path";
// import { NextRequest, NextResponse } from "next/server";
// import { WorkLog } from "@/screens/public/form/workLogService";

// // Mapping của các time slots cho từng loại working time
// const TIME_SLOTS = {
//   "8_hours": [
//     "07:30-08:30", "08:30-09:30", "09:30-10:30", "10:30-11:30", 
//     "11:30-12:30", "13:30-14:30", "14:30-15:30", "15:30-16:30", 
//     "", "", "", ""
//   ],
//   "9.5_hours": [
//     "07:30-08:30", "08:30-09:30", "09:30-10:30", "10:30-11:30", 
//     "11:30-12:30", "13:30-14:30", "14:30-15:30", "15:30-16:30", 
//     "16:30-17:00", "17:00-18:00", "", ""
//   ],
//   "11_hours": [
//     "07:30-08:30", "08:30-09:30", "09:30-10:30", "10:30-11:30", 
//     "11:30-12:30", "13:30-14:30", "14:30-15:30", "15:30-16:30", 
//     "16:30-17:00", "17:00-18:00", "18:00-19:00", "19:00-20:00"
//   ]
// };

// const getTemplateHtml = (templateName: string) => {
//   const filePath = path.join(process.cwd(), "templates", `${templateName}.hbs`);
//   return fs.readFileSync(filePath, "utf-8");
// };

// // Hàm chuyển đổi working time sang nhãn
// function getWorkTimeLabel(workingTime: string): string {
//   switch(workingTime) {
//     case '8_hours': return '8 tiếng (07:30 - 16:30)';
//     case '9.5_hours': return '9 tiếng 30 phút (07:30 - 18:00)';
//     case '11_hours': return '11 tiếng (07:30 - 19:00)';
//     default: return workingTime;
//   }
// }

// // Hàm chuẩn hóa hourly logs để phù hợp với template
// function getHourlyLogs(production: Record<string, number>, workingTime: string): (number | string)[] {
//   const slots = TIME_SLOTS[workingTime as keyof typeof TIME_SLOTS] || [];
  
//   // Chuẩn hóa lại key của production để đảm bảo tương thích
//   const normalizedProduction: Record<string, number> = {};
//   Object.keys(production).forEach(key => {
//     // Chuẩn hóa key format từ "7:30-8:30" thành "07:30-08:30"
//     const parts = key.split('-');
//     if (parts.length === 2) {
//       const startParts = parts[0].split(':');
//       const endParts = parts[1].split(':');
      
//       if (startParts.length === 2 && endParts.length === 2) {
//         const normalizedKey = `${startParts[0].padStart(2, '0')}:${startParts[1]}-${endParts[0].padStart(2, '0')}:${endParts[1]}`;
//         normalizedProduction[normalizedKey] = production[key];
//       } else {
//         normalizedProduction[key] = production[key];
//       }
//     } else {
//       normalizedProduction[key] = production[key];
//     }
//   });
  
//   // Trả về giá trị cho mỗi time slot, lọc ra các giá trị bằng 0
//   return slots.map(slot => {
//     if (!slot) return "";
//     const value = normalizedProduction[slot] || 0;
//     return value === 0 ? "" : value; // Chỉ hiển thị giá trị khác 0
//   });
// }

// export async function POST(req: NextRequest) {
//   const workLog: WorkLog = await req.json();

//   // Lấy ngày hiện tại để điền vào template
//   const currentDate = new Date();

//   const logoPath = path.join(process.cwd(), 'public', 'images', 'logo-light.png');
//   const logoBase64 = fs.readFileSync(logoPath, { encoding: 'base64' });


//   // Ánh xạ dữ liệu WorkLog sang cấu trúc template
//   const templateData = {
//     msCode: 'P11H1HB034', // Mã số cố định
//     fullName: workLog.employeeName,
//     staffCode: workLog.cardNumber,
//     unit: workLog.department,
//     workTime: getWorkTimeLabel(workLog.workingTime),
//     logo: `data:image/png;base64,${logoBase64}`,
//     date: {
//       day: currentDate.getDate(),
//       month: currentDate.getMonth() + 1,
//       year: currentDate.getFullYear()
//     },
//     workLogs: [{
//       bagCode: workLog.bagCode,
//       stepCode: '', // Bạn có thể thêm logic để lấy mã công đoạn nếu cần
//       stepName: workLog.operationName,
//       targetPerHour: workLog.hourlyTarget,
//       price: '', // Giá trị đơn giá nếu có
//       hourlyLogs: getHourlyLogs(workLog.production, workLog.workingTime),
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
  
//   // Đăng ký các helper cần thiết
//   handlebars.registerHelper('padZero', function(value) {
//     return value < 10 ? `0${value}` : value;
//   });

//   // Helper để tính toán chỉ số STT (bắt đầu từ 1 thay vì 0)
//   handlebars.registerHelper('math', function(lvalue, operator, rvalue, options) {
//     lvalue = parseFloat(lvalue);
//     rvalue = parseFloat(rvalue);

//     switch (operator) {
//       case '+': return lvalue + rvalue;
//       case '-': return lvalue - rvalue;
//       case '*': return lvalue * rvalue;
//       case '/': return lvalue / rvalue;
//       default: return lvalue;
//     }
//   });

//   // Helper để tạo các dòng trống nếu không có dữ liệu
//   handlebars.registerHelper('times', function(n, block) {
//     let accum = '';
//     for(let i = 0; i < n; ++i)
//       accum += block.fn(i);
//     return accum;
//   });

//   const template = handlebars.compile(templateHtml);
//   const html = template(templateData);

//   // Khởi tạo trình duyệt
//   const browser = await puppeteer.launch({ 
//     headless: true,
//     args: ['--no-sandbox', '--disable-setuid-sandbox']
//   });
//   const page = await browser.newPage();

//   // Thêm font hỗ trợ Tiếng Việt
//   await page.setContent(html, { waitUntil: "networkidle0" });

//   const pdfBuffer = await page.pdf({
//     format: "A4",
//     landscape: true, // Changed back to landscape mode to match the reference image
//     printBackground: true,
//     margin: { 
//       top: "0mm", 
//       right: "0mm", 
//       bottom: "0mm", 
//       left: "0mm" 
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

// // Đảm bảo export runtime
// export const runtime = 'nodejs';

