import {NextRequest, NextResponse} from 'next/server';
const protectedRoutes = ['/home', '/sessions'];
const adminProtectedRoutes = ['/admin'];
const publicPaths = [
  '/',
  '/login',
  '/reset-password',
  '/register',
  '/confirm-account',
  '/forgot-password', // Sửa lỗi thiếu dấu / ở đầu
  '/reset-password',
  '/verify-mfa',
  '/_next', // Thêm để tránh lỗi khi truy cập tài nguyên Next.js
];

// Danh sách các endpoints không yêu cầu CSRF
const csrfExemptEndpoints = [
  '/api/csp-report',
  '/api/auth', // Thêm nếu có API xác thực cần miễn CSRF
];

export default async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  // Tạo một NextResponse mới để gửi đến destination của bạn
  const response = NextResponse.next();

  // Thêm đường dẫn hiện tại vào headers, để các server component có thể truy cập
  response.headers.set('x-pathname', req.nextUrl.pathname);
  response.headers.set('x-url', req.url);

  // Lấy API base URL từ biến môi trường, hoặc mặc định localhost nếu không có
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1';
  
  // Phân tích URL API để có được phần gốc (không có đường dẫn)
  let apiHostname = '';
  try {
    const apiUrl = new URL(apiBaseUrl);
    apiHostname = apiUrl.origin; // Ví dụ: http://localhost:8000
  } catch (e) {
    console.error('Không thể phân tích URL API:', e);
    apiHostname = 'http://localhost:8000'; // Mặc định fallback
  }

  // Thiết lập CSP với cấu hình đã cải thiện
  response.headers.set(
    'Content-Security-Policy',
    `
      default-src 'self';
      script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdnjs.cloudflare.com;
      style-src 'self' 'unsafe-inline';
      img-src 'self' data: https://www.tbsgroup.vn https://*.tbsgroup.vn blob:;
      font-src 'self' https://fonts.gstatic.com data:;
      connect-src 'self' ${apiHostname} ${apiHostname}/* ws: wss:;
      upgrade-insecure-requests;
      report-uri /api/csp-report;
    `.replace(/\s+/g, ' ').trim()
  );

  // Thêm các header bảo mật khác
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'same-origin');
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains; preload'
  );

  // Trong giai đoạn phát triển, ta có thể thêm policy report-only để kiểm tra
  if (process.env.NODE_ENV === 'development') {
    response.headers.set(
      'Content-Security-Policy-Report-Only',
      `
        default-src 'self';
        script-src 'self' 'unsafe-inline' 'unsafe-eval';
        style-src 'self' 'unsafe-inline';
        img-src 'self' data: https://www.tbsgroup.vn https://*.tbsgroup.vn blob:;
        connect-src 'self' ${apiHostname} ${apiHostname}/* ws: wss:;
        report-uri /api/csp-report;
      `.replace(/\s+/g, ' ').trim(),
    );
  }

  // Kiểm tra nếu yêu cầu hiện tại thuộc đường dẫn công khai
  const isPublicPath = publicPaths.some(publicPath =>
    req.nextUrl.pathname.startsWith(publicPath),
  );

  // Bỏ qua xác thực cho các đường dẫn công khai
  if (isPublicPath) {
    return response;
  }

  // Kiểm tra token xác thực cho các tuyến đường được bảo vệ
  const authToken = req.cookies.get('accessToken')?.value;

  // if (!authToken) {
  //   // Chuyển hướng về trang đăng nhập nếu không xác thực
  //   return NextResponse.redirect(new URL('/login', req.url));
  // }



  // Xử lý CSRF cho các yêu cầu thay đổi dữ liệu
  const requestMethod = req.method.toUpperCase();
  const requiresCsrfCheck = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(
    requestMethod,
  );
  
  // Kiểm tra xem endpoint có được miễn trừ khỏi kiểm tra CSRF không
  const isCsrfExempt = csrfExemptEndpoints.some(endpoint => 
    req.nextUrl.pathname.startsWith(endpoint)
  );

  if (requiresCsrfCheck && req.nextUrl.pathname.startsWith('/api/') && !isCsrfExempt) {
    const csrfToken = req.headers.get('X-CSRF-Token');
    const storedCsrfToken = req.cookies.get('csrf-token')?.value;

    if (!csrfToken || csrfToken !== storedCsrfToken) {
      // Lưu ý: lưu log để gỡ lỗi trong môi trường phát triển
      if (process.env.NODE_ENV === 'development') {
        console.error('CSRF token không hợp lệ', {
          path: req.nextUrl.pathname,
          method: requestMethod,
          headerToken: csrfToken?.slice(0, 6) + '...',
          cookieToken: storedCsrfToken?.slice(0, 6) + '...',
        });
      }
      
      // Trả về lỗi CSRF không hợp lệ
      return new NextResponse(
        JSON.stringify({success: false, message: 'CSRF token không hợp lệ'}),
        {
          status: 403,
          headers: {'Content-Type': 'application/json'},
        },
      );
    }
  }



  return response;
}

// Chỉ áp dụng middleware cho các đường dẫn:
export const config = {
  matcher: [
    // Áp dụng cho tất cả các đường dẫn ngoại trừ static/assets/public/etc
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};