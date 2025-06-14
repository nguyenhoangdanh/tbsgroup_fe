import { NextRequest, NextResponse } from 'next/server';

export function corsHeaders(origin: string | null): Record<string, string> {
  const allowedOrigins = [
    'http://localhost:3000',
    'https://daily-performance.vercel.app',
    'https://tbsgroup-be.vercel.app',
    process.env.NEXT_PUBLIC_FRONTEND_URL,
    process.env.NEXT_PUBLIC_API_BASE_URL
  ].filter(Boolean);

  const isAllowedOrigin = origin && allowedOrigins.some(allowed => 
    origin === allowed || origin.includes('vercel.app')
  );

  return {
    'Access-Control-Allow-Origin': isAllowedOrigin ? origin : allowedOrigins[0] || '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, X-CSRF-Token',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400',
  };
}

export function addCorsHeaders(response: NextResponse, request: NextRequest): NextResponse {
  const origin = request.headers.get('origin');
  const headers = corsHeaders(origin);
  
  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  
  return response;
}
