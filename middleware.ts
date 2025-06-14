import { NextRequest, NextResponse } from 'next/server';

import { addCorsHeaders } from './lib/cors';

// Configuration
const config = {
  production: process.env.NODE_ENV === 'production',
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1',
  enableRateLimit: process.env.NEXT_PUBLIC_ENABLE_RATE_LIMIT === 'true',
  enableCSRF: process.env.NODE_ENV === 'production',
};

// Rate limiting store (in-memory for demo, use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Array of public routes that don't require authentication
const publicRoutes = [
  '/login',
  '/reset-password',
  '/forgot-password',
  '/register',
  '/verify-email',
  '/',
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/refresh',
  '/api/health',
];

const apiRoutes = ['/api/'];
const staticRoutes = ['/_next', '/favicon.ico', '/images', '/icons'];

/**
 * Rate limiting function
 */
function checkRateLimit(request: NextRequest): boolean {
  if (!config.enableRateLimit) return true;

  const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxRequests = 100; // requests per window

  const key = `rate_limit:${ip}`;
  const current = rateLimitStore.get(key);

  if (!current || now > current.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (current.count >= maxRequests) {
    return false;
  }

  current.count++;
  rateLimitStore.set(key, current);
  return true;
}

/**
 * Security headers function
 */
function addSecurityHeaders(response: NextResponse): NextResponse {
  if (config.production) {
    // Security headers for production
    response.headers.set('X-DNS-Prefetch-Control', 'off');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=63072000; includeSubDomains; preload',
    );
    response.headers.set(
      'Content-Security-Policy',
      "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://cdnjs.cloudflare.com; " +
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
      "font-src 'self' https://fonts.gstatic.com; " +
      "img-src 'self' data: https:; " +
      "connect-src 'self' " + config.apiBaseUrl + " https://tbsgroup-be.vercel.app wss:; " +
      "frame-ancestors 'none'; " +
      "base-uri 'self'; " +
      "form-action 'self';"
    );
  } else {
    // More permissive CSP for development
    response.headers.set(
      'Content-Security-Policy',
      "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
      "style-src 'self' 'unsafe-inline'; " +
      "font-src 'self' data:; " +
      "img-src 'self' data: https:; " +
      "connect-src 'self' http://localhost:* https://tbsgroup-be.vercel.app wss:; " +
      "frame-ancestors 'none';"
    );
  }

  // CSRF protection
  if (config.enableCSRF) {
    const csrfToken = generateCSRFToken();
    response.headers.set('X-CSRF-Token', csrfToken);
  }

  return response;
}

/**
 * Generate CSRF token with proper crypto handling for Edge Runtime
 */
function generateCSRFToken(): string {
  // Try to use Web Crypto API first (available in Edge Runtime)
  if (typeof globalThis !== 'undefined' && globalThis.crypto && globalThis.crypto.getRandomValues) {
    const array = new Uint8Array(32);
    globalThis.crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }
  
  // Fallback to Math.random (Edge Runtime compatible)
  let result = '';
  for (let i = 0; i < 64; i++) {
    result += Math.floor(Math.random() * 16).toString(16);
  }
  return result;
}

/**
 * Validate CSRF token for state-changing operations
 */
function validateCSRFToken(request: NextRequest): boolean {
  if (!config.enableCSRF) return true;

  const method = request.method;
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    return true; // Skip CSRF check for safe methods
  }

  const tokenFromHeader = request.headers.get('X-CSRF-Token');
  const tokenFromCookie = request.cookies.get('csrf-token')?.value;

  const result: boolean = (tokenFromHeader === tokenFromCookie) && (tokenFromHeader !== undefined && tokenFromCookie !== undefined);

  return result;
}

/**
 * Enhanced token validation với httpOnly cookies
 */
async function validateToken(
  request: NextRequest,
): Promise<{ isValid: boolean; shouldRefresh: boolean; userData?: any }> {
  // CRITICAL: Lấy accessToken từ httpOnly cookies
  const token = request.cookies.get('accessToken')?.value;

  console.log(`[Middleware] Kiểm tra httpOnly cookie token: ${token ? 'Có' : 'Không'}`);

  if (!token) {
    return { isValid: false, shouldRefresh: false };
  }

  try {
    // QUAN TRỌNG: Gọi API endpoint từ server để xác thực token
    // Vì token đã trong cookie, chỉ cần forward toàn bộ cookies
    const cookieHeader = request.headers.get('cookie') || '';
    
    const verifyResponse = await fetch(`${config.apiBaseUrl}/users/profile`, {
      method: 'GET',
      headers: {
        // Forward tất cả cookies từ request gốc
        'Cookie': cookieHeader,
        'Cache-Control': 'no-cache',
        'User-Agent': request.headers.get('user-agent') || 'Next.js Middleware',
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(5000), // Increased timeout to 5 seconds
    });

    if (verifyResponse.ok) {
      // Nếu token hợp lệ, lấy thông tin người dùng
      const userData = await verifyResponse.json();
      console.log('[Middleware] Token valid, user data received');
      return { isValid: true, shouldRefresh: false, userData };
    } else if (verifyResponse.status === 401) {
      // Token không hợp lệ hoặc hết hạn
      console.log('[Middleware] HttpOnly token không hợp lệ hoặc hết hạn');
      return { isValid: false, shouldRefresh: true };
    }

    return { isValid: false, shouldRefresh: false };
  } catch (error) {
    console.error('[Middleware] Lỗi khi xác thực httpOnly token:', error);
    // If network error, temporarily allow user access to avoid blocking
    return { isValid: true, shouldRefresh: false };
  }
}

/**
 * Enhanced middleware function
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const startTime = Date.now();

  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    const response = new NextResponse(null, { status: 200 });
    return addCorsHeaders(response, request);
  }

  // Skip middleware for static files and API routes that don't need auth
  if (staticRoutes.some(route => pathname.startsWith(route)) || pathname.includes('.')) {
    const response = NextResponse.next();
    return addCorsHeaders(response, request);
  }

  // Rate limiting check
  if (!checkRateLimit(request)) {
    const response = new NextResponse('Too Many Requests', {
      status: 429,
      headers: {
        'Retry-After': '900', // 15 minutes
      },
    });
    return addCorsHeaders(response, request);
  }

  // CSRF validation for state-changing requests
  if (!validateCSRFToken(request)) {
    const response = new NextResponse('CSRF token mismatch', { status: 403 });
    return addCorsHeaders(response, request);
  }

  // Tạo response ban đầu
  let response = NextResponse.next();

  // Skip auth check for public routes
  if (publicRoutes.some(route => pathname === route || pathname.startsWith(route))) {
    response = addSecurityHeaders(response);
    response = addCorsHeaders(response, request);

    // Add performance headers
    const processingTime = Date.now() - startTime;
    response.headers.set('X-Response-Time', `${processingTime}ms`);

    return response;
  }

  // Check authentication for protected routes
  const { isValid, shouldRefresh, userData } = await validateToken(request);

  if (!isValid) {
    // Redirect to login with return URL
    const url = new URL('/login', request.url);
    url.searchParams.set('returnUrl', pathname);
    url.searchParams.set('reason', shouldRefresh ? 'token_expired' : 'no_token');

    response = NextResponse.redirect(url);
    response = addSecurityHeaders(response);
    response = addCorsHeaders(response, request);
    return response;
  }

  // If token should be refreshed, add header to indicate this to the client
  if (shouldRefresh) {
    response.headers.set('X-Token-Refresh-Required', 'true');
  }

  // Quan trọng: Nếu token hợp lệ và có thông tin người dùng,
  // thêm thông tin người dùng vào header để client-side có thể sử dụng
  if (userData) {
    // Chỉ thêm thông tin không nhạy cảm vào header
    response.headers.set('X-Auth-Status', 'authenticated');
    
    // Thông tin người dùng sẽ được lấy thông qua API /api/auth/session
    // để tránh vượt quá giới hạn kích thước header
  }

  // Add security headers
  response = addSecurityHeaders(response);
  response = addCorsHeaders(response, request);

  // Add performance monitoring headers
  const processingTime = Date.now() - startTime;
  response.headers.set('X-Response-Time', `${processingTime}ms`);

  // Add cache control for authenticated pages
  response.headers.set('Cache-Control', 'private, no-cache, no-store, must-revalidate');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');

  return response;
}

/**
 * Middleware configuration
 */
export const middlewareConfig = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api routes that don't need auth (login, register, refresh)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

// Export the config for Next.js
export { middlewareConfig as config };

// Performance monitoring (development only)
if (process.env.NODE_ENV === 'development') {
  const middlewareStats = {
    totalRequests: 0,
    averageResponseTime: 0,
    authChecks: 0,
    rateLimitHits: 0,
  };

  // Log stats every minute in development
  setInterval(() => {
    if (middlewareStats.totalRequests > 0) {
      console.log('[Middleware Stats]', {
        ...middlewareStats,
        rateLimitStoreSize: rateLimitStore.size,
      });
    }
  }, 60000);
}
