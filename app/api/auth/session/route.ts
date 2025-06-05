import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Cấu hình API backend
const config = {
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1',
};

/**
 * GET handler để lấy thông tin phiên làm việc hiện tại
 * API này trả về trạng thái xác thực và thông tin người dùng nếu đã xác thực
 * Không cần tạo API mới vì HTTP-only cookie được gửi tự động
 */
export async function GET(req: NextRequest) {
  try {
    // Lấy cookie accessToken từ request
    const accessToken = cookies().get('accessToken')?.value;
    
    // Nếu không có token, trả về trạng thái chưa xác thực
    if (!accessToken) {
      return NextResponse.json({ 
        status: 'unauthenticated',
        user: null
      }, { status: 200 });
    }

    // Gọi API backend để xác thực token và lấy thông tin người dùng
    const response = await fetch(`${config.apiBaseUrl}/users/profile`, {
      method: 'GET',
      headers: {
        Cookie: `accessToken=${accessToken}`,
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      },
      credentials: 'include',
      cache: 'no-store',
    });

    // Kiểm tra phản hồi từ API
    if (response.ok) {
      // Nếu thành công, lấy dữ liệu người dùng
      const userData = await response.json();
      
      if (!userData || !userData.success) {
        throw new Error('Invalid response format from API');
      }

      // Trả về trạng thái đã xác thực và thông tin người dùng
      return NextResponse.json({
        status: 'authenticated',
        user: userData.data,
        accessToken: 'cookie-managed', // Placeholder vì token thực sự nằm trong HTTP-only cookie
        expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(), // Giả định thời gian hết hạn (1 giờ)
      }, { status: 200 });
    } else if (response.status === 401) {
      // Token không hợp lệ hoặc đã hết hạn
      // Không cần xóa cookie vì backend sẽ xử lý việc này
      
      return NextResponse.json({ 
        status: 'unauthenticated',
        user: null,
        error: 'Token expired or invalid'
      }, { status: 200 });
    } else {
      // Lỗi khác từ API
      const errorData = await response.text();
      console.error('API error:', response.status, errorData);
      
      return NextResponse.json({ 
        status: 'error',
        user: null,
        error: `API error: ${response.status}`
      }, { status: 200 }); // Vẫn trả về 200 để client xử lý
    }
  } catch (error) {
    // Xử lý lỗi
    console.error('Session API error:', error);
    
    return NextResponse.json({
      status: 'error',
      error: 'Internal server error',
      user: null
    }, { status: 500 });
  }
}