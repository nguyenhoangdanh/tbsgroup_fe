import {NextRequest, NextResponse} from 'next/server';
import { UserStatusEnum } from './common/enum';

const protectedRoutes = ['/home', '/sessions'];
const adminProtectedRoutes = ['/admin'];
const publicRoutes = [
  '/',
  '/login',
  '/reset-password',
  '/register',
  '/confirm-account',
  'forgot-password',
  'reset-password',
  '/verify-mfa',
];

// const protectedRoutes = /^\/(?:home|sessions).*/;
// const publicRoutes = /^\/(?:login|reset-password|register|forgot-password).*/;

// Trong middleware.ts
export default async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const isProtectedRoute = protectedRoutes.includes(path);
  const isPublicRoute = publicRoutes.includes(path);

   // Tạo một NextResponse mới để gửi đến destination của bạn
   const response = NextResponse.next();
  
   // Thêm đường dẫn hiện tại vào headers, để các server component có thể truy cập
   response.headers.set('x-pathname', req.nextUrl.pathname);
   response.headers.set('x-url', req.url);

  const accessToken = req.cookies.get('accessToken')?.value;
  
  if (isProtectedRoute && !accessToken && adminProtectedRoutes.includes(path)) {
    return NextResponse.redirect(new URL('/login', req.nextUrl));
  }

  // Nếu đã đăng nhập và có trạng thái PENDING_ACTIVATION, chỉ cho phép truy cập /reset-password
  // if (accessToken && isPendingActivation && path !== '/reset-password') {
  //   return NextResponse.redirect(new URL('/reset-password', req.nextUrl));
  // }

  // if (isPublicRoute && accessToken ) {
  //   return NextResponse.redirect(new URL('/home', req.nextUrl));
  // }

  return NextResponse.next();
}

// Middleware sẽ chạy cho tất cả các routes
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};