import {NextRequest, NextResponse} from 'next/server';

const protectedRoutes = ['/home', '/sessions'];
const publicRoutes = [
  '/',
  '/login',
  '/register',
  '/confirm-account',
  'forgot-password',
  'reset-password',
  '/verify-mfa',
];

export default async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const isProtectedRoute = protectedRoutes.includes(path);
  const isPublicRoute = publicRoutes.includes(path);

  const accessToken = req.cookies.get('accessToken')?.value;

  if (isProtectedRoute && !accessToken) {
    return NextResponse.redirect(new URL('/login', req.nextUrl));
  }

  if (isPublicRoute && accessToken) {
    return NextResponse.redirect(new URL('/', req.nextUrl));
  }

  return NextResponse.next();
}
