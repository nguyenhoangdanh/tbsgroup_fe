import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Get token from cookie
    const token = request.cookies.get('accessToken')?.value;

    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    // In a real application, you would verify the token here
    // For now, we'll do basic validation
    const isValidToken = await verifyToken(token);

    if (!isValidToken) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    return NextResponse.json({
      valid: true,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Token verification error:', error);
    return NextResponse.json({ error: 'Token verification failed' }, { status: 500 });
  }
}

async function verifyToken(token: string): Promise<boolean> {
  try {
    // In development, do basic JWT validation
    if (process.env.NODE_ENV === 'development') {
      const parts = token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]));
        const exp = payload.exp * 1000;
        return exp > Date.now();
      }
      return false;
    }

    // In production, verify with your auth service
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/verify`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Cache-Control': 'no-cache',
      },
    });

    return response.ok;
  } catch {
    return false;
  }
}
