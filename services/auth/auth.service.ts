import api from '@/lib/api/api';
import { ApiResponse } from '@/lib/api/types';
import {
  LoginCredentials,
  RegisterCredentials,
  RequestResetParams,
  ResetPasswordParams,
  AuthResponse,
  User,
} from '@/redux/types/auth';
import Cookies from 'js-cookie';

/**
 * Auth Service - provides methods for interacting with authentication API endpoints
 * using the custom API client
 */
class AuthService {
  // Cookie names - sử dụng tên cookie chính xác từ backend
  private TOKEN_COOKIE_NAME = 'accessToken';
  private EXPIRES_AT_COOKIE_NAME = 'token-expires-at';

  /**
   * Login with username and password
   */
  async login(credentials: LoginCredentials): Promise<ApiResponse<AuthResponse>> {
    try {
      console.log('Đang đăng nhập với:', credentials.username);
      // Backend đã xử lý việc lưu accessToken vào cookie
      const response = await api.post<AuthResponse>('/auth/login', credentials, true);
      
      if (response.success && response.data) {
        // Lưu thời gian hết hạn để tiện theo dõi
        const expiryDate = new Date(Date.now() + response.data.expiresIn * 1000);
        this.setTokenExpiryTime(expiryDate);
        
        console.log('Đăng nhập thành công, accessToken được lưu trong cookie HTTP-only');
      }

      return response;
    } catch (error: any) {
      console.error('Login error:', error);
      return {
        success: false,
        error: error.message || 'Không thể kết nối đến máy chủ',
      };
    }
  }

  /**
   * Register a new user
   */
  async register(userData: RegisterCredentials): Promise<ApiResponse<any>> {
    return api.post('/auth/register', userData);
  }

  /**
   * Logout the current user
   */
  async logout(): Promise<ApiResponse<any>> {
    try {
      // Backend sẽ xử lý việc xóa cookie
      const response = await api.post('/auth/logout', {});
      
      // Xóa cookie expires-at để đồng bộ
      this.clearTokenExpiryTime();
      
      return response;
    } catch (error: any) {
      // Xóa cookie expires-at ngay cả khi API call thất bại
      this.clearTokenExpiryTime();
      
      return {
        success: false,
        error: error.message || 'Logout failed but local session cleared',
      };
    }
  }

  /**
   * Refresh the authentication token
   */
  async refreshToken(): Promise<ApiResponse<AuthResponse>> {
    try {
      console.log('Đang làm mới token...');
      // Backend sẽ tự động cập nhật cookie
      const response = await api.post<AuthResponse>('/auth/refresh', {});

      if (response.success && response.data) {
        console.log('Token đã được làm mới thành công');
        // Chỉ cần cập nhật thời gian hết hạn
        const expiryDate = new Date(Date.now() + response.data.expiresIn * 1000);
        this.setTokenExpiryTime(expiryDate);
      } else {
        console.error('Làm mới token thất bại:', response.error);
      }

      return response;
    } catch (error: any) {
      console.error('Token refresh error:', error);
      return {
        success: false,
        error: error.message || 'Không thể làm mới token',
      };
    }
  }

  /**
   * Get the current user profile
   */
  async getCurrentUser(): Promise<ApiResponse<User>> {
    try {
      const response = await api.get<User>('/users/profile');
      return response;
    } catch (error: any) {
      console.error('Get user profile error:', error);
      return {
        success: false,
        error: error.message || 'Không thể lấy thông tin người dùng',
      };
    }
  }

  /**
   * Kiểm tra session hiện tại - sử dụng API /api/auth/session
   * Cách này tránh tạo thêm API endpoint và tận dụng cookie HTTP-only
   */
  async checkSession(): Promise<{
    isAuthenticated: boolean;
    user?: any;
    error?: string;
  }> {
    try {
      const response = await fetch('/api/auth/session', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
        credentials: 'same-origin',
      });

      if (!response.ok) {
        return {
          isAuthenticated: false,
          error: `HTTP error: ${response.status}`,
        };
      }

      const sessionData = await response.json();
      return {
        isAuthenticated: sessionData.status === 'authenticated',
        user: sessionData.user || undefined,
        error: sessionData.error,
      };
    } catch (error: any) {
      console.error('Error checking session:', error);
      return {
        isAuthenticated: false,
        error: error.message || 'Không thể kiểm tra phiên làm việc',
      };
    }
  }

  /**
   * Update user profile information
   */
  async updateUserProfile(userData: Partial<User>): Promise<ApiResponse<User>> {
    return api.patch<User>('/users/profile', userData);
  }

  /**
   * Request password reset with employee ID and card ID
   */
  async requestPasswordReset(params: RequestResetParams): Promise<ApiResponse<{
    resetToken: string;
    username: string;
    message: string;
  }>> {
    try {
      const response = await api.post('/auth/request-password-reset', params);
      return {
        success: response.success,
        data: response.data,
        error: response.error,
      }
    } catch (error: any) {
      console.error('Request password reset error:', error);
      return {
        success: false,
        error: error.message || 'Không thể yêu cầu đặt lại mật khẩu',
      };
    }
  }

  /**
   * Reset password with token or username
   */
  async resetPassword(params: ResetPasswordParams): Promise<ApiResponse<any>> {
    try {
      const response = await api.post('/auth/reset-password', params);
      return response;
    } catch (error: any) {
      console.error('Reset password error:', error);
      return {
        success: false,
        error: error.message || 'Không thể đặt lại mật khẩu',
      };
    }
  }

  /**
   * Change password (requires authentication)
   */
  async changePassword(
    oldPassword: string,
    newPassword: string,
    confirmPassword: string,
  ): Promise<ApiResponse<any>> {
    return api.post('/auth/change-password', {
      oldPassword,
      newPassword,
      confirmPassword,
    });
  }

  /**
   * Store token expiry time 
   */
  private setTokenExpiryTime(expiryDate: Date): void {
    if (typeof window === 'undefined') return;
    
    // Set secure options for production
    const isSecure = window.location.protocol === 'https:';
    const options = {
      expires: (expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24), // Chuyển đổi về ngày
      secure: isSecure,
      sameSite: isSecure ? 'strict' : 'lax' as 'strict' | 'lax',
      path: '/'
    };
    
    // Chỉ lưu thời gian hết hạn
    Cookies.set(this.EXPIRES_AT_COOKIE_NAME, expiryDate.toISOString(), options);
  }

  /**
   * Clear token expiry time
   */
  private clearTokenExpiryTime(): void {
    if (typeof window === 'undefined') return;
    Cookies.remove(this.EXPIRES_AT_COOKIE_NAME, { path: '/' });
  }
  
  /**
   * Clear stored token - chỉ xóa cookies không phải HTTP-only
   */
  clearStoredToken(): void {
    if (typeof window === 'undefined') return;
    
    // Không xóa accessToken cookie, backend sẽ quản lý việc này
    // Chỉ xóa token-expires-at cookie mà chúng ta tự thêm vào
    Cookies.remove(this.EXPIRES_AT_COOKIE_NAME, { path: '/' });
    
    // Xóa bất kỳ localStorage nào còn sót lại từ phiên bản cũ
    localStorage.removeItem('auth-token');
    localStorage.removeItem('tokenExpiresAt');
    localStorage.removeItem('auth-user');
    localStorage.removeItem('auth-user-minimal');
    localStorage.removeItem('lastLoginTime');
  }

  /**
   * Record successful login time
   */
  recordLoginTime(): void {
    if (typeof window === 'undefined') return;
    Cookies.set('lastLoginTime', new Date().toISOString(), { path: '/' });
  }

  /**
   * Check if a user's token is valid - phiên bản đồng bộ
   * Cần thiết cho AuthManager initialize
   */
  isAuthenticated(): boolean {
    // Với HTTP-only cookies, không thể kiểm tra trực tiếp từ client
    // Phương thức này luôn trả về true để không gây lỗi trong quá trình khởi tạo
    // Các endpoint bảo vệ sẽ được xác thực thông qua middleware và API
    if (typeof window === 'undefined') return false;
    
    // Chỉ kiểm tra xem cookie token-expires-at có tồn tại hay không
    const expiresAt = Cookies.get(this.EXPIRES_AT_COOKIE_NAME);
    if (expiresAt) {
      try {
        const expiryDate = new Date(expiresAt);
        return expiryDate > new Date();
      } catch (e) {
        return false;
      }
    }
    
    // Trong trường hợp không tìm thấy cookie, trả về false
    // Trạng thái xác thực thực sự sẽ được xác định bởi API /api/auth/session sau đó
    return false;
  }
}

// Create a singleton instance
export const authService = new AuthService();
