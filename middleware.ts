import { NextRequest, NextResponse } from 'next/server';

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
      "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'self' data: https:; connect-src 'self' " +
        config.apiBaseUrl +
        "; frame-ancestors 'none';",
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
 * Generate CSRF token
 */
function generateCSRFToken(): string {
  const array = new Uint8Array(32);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }
  // Fallback for environments without crypto
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
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

  return tokenFromHeader && tokenFromCookie && tokenFromHeader === tokenFromCookie;
}

/**
 * Enhanced token validation with better error handling
 */
async function validateToken(
  request: NextRequest,
): Promise<{ isValid: boolean; shouldRefresh: boolean }> {
  const token = request.cookies.get('accessToken')?.value;

  if (!token) {
    return { isValid: false, shouldRefresh: false };
  }

  try {
    // For development, we can do basic JWT validation
    if (!config.production) {
      // Simple expiry check (assuming JWT format)
      const parts = token.split('.');
      if (parts.length === 3) {
        try {
          const payload = JSON.parse(atob(parts[1]));
          const exp = payload.exp * 1000; // Convert to milliseconds
          const now = Date.now();

          if (exp < now) {
            return { isValid: false, shouldRefresh: true };
          }

          // Check if token expires in next 5 minutes
          const fiveMinutes = 5 * 60 * 1000;
          if (exp - now < fiveMinutes) {
            return { isValid: true, shouldRefresh: true };
          }

          return { isValid: true, shouldRefresh: false };
        } catch (e) {
          return { isValid: false, shouldRefresh: false };
        }
      }
    }

    // For production, make a request to verify token
    const verifyResponse = await fetch(`${config.apiBaseUrl}/auth/verify`, {
      method: 'GET',
      headers: {
        Cookie: `accessToken=${token}`,
        'Cache-Control': 'no-cache',
      },
      signal: AbortSignal.timeout(3000), // 3 second timeout
    });

    if (verifyResponse.ok) {
      return { isValid: true, shouldRefresh: false };
    } else if (verifyResponse.status === 401) {
      return { isValid: false, shouldRefresh: true };
    }

    return { isValid: false, shouldRefresh: false };
  } catch (error) {
    console.error('Token validation error:', error);
    // If validation fails due to network issues, assume token is valid
    // to avoid blocking user unnecessarily
    return { isValid: true, shouldRefresh: false };
  }
}

/**
 * Enhanced middleware function
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const startTime = Date.now();

  // Skip middleware for static files and API routes that don't need auth
  if (staticRoutes.some(route => pathname.startsWith(route)) || pathname.includes('.')) {
    return NextResponse.next();
  }

  // Rate limiting check
  if (!checkRateLimit(request)) {
    return new NextResponse('Too Many Requests', {
      status: 429,
      headers: {
        'Retry-After': '900', // 15 minutes
      },
    });
  }

  // CSRF validation for state-changing requests
  if (!validateCSRFToken(request)) {
    return new NextResponse('CSRF token mismatch', { status: 403 });
  }

  let response = NextResponse.next();

  // Skip auth check for public routes
  if (publicRoutes.some(route => pathname === route || pathname.startsWith(route))) {
    response = addSecurityHeaders(response);

    // Add performance headers
    const processingTime = Date.now() - startTime;
    response.headers.set('X-Response-Time', `${processingTime}ms`);

    return response;
  }

  // Check authentication for protected routes
  const { isValid, shouldRefresh } = await validateToken(request);

  if (!isValid) {
    // Redirect to login with return URL
    const url = new URL('/login', request.url);
    url.searchParams.set('returnUrl', pathname);
    url.searchParams.set('reason', shouldRefresh ? 'token_expired' : 'no_token');

    response = NextResponse.redirect(url);
    response = addSecurityHeaders(response);
    return response;
  }

  // If token should be refreshed, add header to indicate this to the client
  if (shouldRefresh) {
    response.headers.set('X-Token-Refresh-Required', 'true');
  }

  // Add security headers
  response = addSecurityHeaders(response);

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
