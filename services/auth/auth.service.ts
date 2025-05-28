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

/**
 * Auth Service - provides methods for interacting with authentication API endpoints
 * using the custom API client
 */
class AuthService {
  /**
   * Login with username and password
   */
  async login(credentials: LoginCredentials): Promise<ApiResponse<AuthResponse>> {
    try {
      const response = await api.post<AuthResponse>('/auth/login', credentials, true);
      if (response.success && response.data) {
        this.setStoredToken(
          response.data.token,
          new Date(Date.now() + response.data.expiresIn * 1000),
        );
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
      const response = await api.post('/auth/logout', {});
      // Clear local storage regardless of API response
      this.clearStoredToken();
      return response;
    } catch (error: any) {
      // Clear token even if API call fails
      this.clearStoredToken();
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
      // Use the built-in token refresh logic in your API client
      const response = await api.post<AuthResponse>('/auth/refresh', {});

      if (response.success && response.data) {
        this.setStoredToken(
          response.data.token,
          new Date(Date.now() + response.data.expiresIn * 1000),
        );
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
    return api.get<User>('/users/profile');
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
    return response
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
   * Verify the user's authentication status
   */
  async verifyAuth(): Promise<boolean> {
    return api.hasValidToken();
  }

  /**
   * Store token in localStorage with expiry
   */
  setStoredToken(token: string, expiryDate: Date): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem('auth-token', token);
    localStorage.setItem('tokenExpiresAt', expiryDate.toISOString());
  }

  /**
   * Get token from localStorage
   */
  getStoredToken(): string | null {
    if (typeof window === 'undefined') return null;

    const token = localStorage.getItem('auth-token');
    const expiresAtStr = localStorage.getItem('tokenExpiresAt');

    if (!token || !expiresAtStr) return null;

    // Check if token has expired
    const expiresAt = new Date(expiresAtStr);
    if (expiresAt < new Date()) {
      // Clean up expired token
      this.clearStoredToken();
      return null;
    }

    return token;
  }

  /**
   * Clear token and related data from localStorage
   */
  clearStoredToken(): void {
    if (typeof window === 'undefined') return;

    localStorage.removeItem('auth-token');
    localStorage.removeItem('tokenExpiresAt');
    localStorage.removeItem('auth-user');
    localStorage.removeItem('auth-user-minimal');
  }

  /**
   * Check if a user's token is valid without checking the backend
   */
  isAuthenticated(): boolean {
    return !!this.getStoredToken();
  }

  /**
   * Record successful login time
   */
  recordLoginTime(): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem('lastLoginTime', new Date().toISOString());
  }
}

// Create a singleton instance
export const authService = new AuthService();
