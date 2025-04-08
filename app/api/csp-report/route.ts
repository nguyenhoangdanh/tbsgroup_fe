// app/api/csp-report/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Endpoint API để xử lý các báo cáo vi phạm CSP
 * Các trình duyệt hiện đại sẽ tự động gửi báo cáo đến endpoint này 
 * khi phát hiện vi phạm CSP nếu directive report-uri được thiết lập
 */

// Cấu hình mới cho App Router
export const dynamic = 'force-dynamic';
export const runtime = 'edge';
export async function POST(request: NextRequest) {
  try {
    // Parse JSON từ request body, sử dụng cấu trúc tiêu chuẩn của báo cáo CSP
    let report;
    
    try {
      // Một số trình duyệt gửi báo cáo CSP trong cấu trúc khác nhau
      const body = await request.json();
      
      // Chrome gửi dưới dạng {"csp-report": {...}}
      // Firefox có thể gửi trực tiếp
      report = body["csp-report"] || body;
    } catch (parseError) {
      console.warn('Could not parse CSP report JSON:', parseError);
      // Thử đọc dưới dạng text nếu JSON không hợp lệ
      report = { rawText: await request.text() };
    }
    
    // Log vi phạm CSP (trong môi trường thực tế, bạn có thể lưu vào DB hoặc gửi đến dịch vụ giám sát)
    console.warn('CSP Violation:', JSON.stringify(report, null, 2));
    
    // Trong môi trường production, bạn có thể muốn gửi lỗi này đến một dịch vụ giám sát
    if (process.env.NODE_ENV === 'production') {
      // Gửi đến hệ thống logging
      // await logToMonitoringService({
      //   type: 'csp-violation',
      //   data: report,
      //   timestamp: new Date().toISOString()
      // });
    }
    
    // Trả về thành công - luôn trả về 204 No Content cho báo cáo CSP
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error processing CSP report:', error);
    // Vẫn trả về 204 No Content để trình duyệt không gặp lỗi
    return new NextResponse(null, { status: 204 });
  }
}
