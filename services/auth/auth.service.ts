import { api } from '@/lib/api/api';

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface LoginResponse {
  user: any;
  success: boolean;
  message?: string;
}

export interface SessionData {
  isAuthenticated: boolean;
  user?: any;
}

export interface RequestPasswordResetParams {
  username?: string;
  cardId?: string;
  employeeId?: string;
}

export interface RequestPasswordResetResponse {
  resetToken: string;
  expiryDate: string;
  username: string;
  message?: string;
}

export interface ResetPasswordParams {
  resetToken?: string;
  username?: string;
  cardId?: string;
  employeeId?: string;
  password: string;
  confirmPassword?: string;
}

/**
 * Authentication Service với httpOnly cookies
 */
export class AuthService {
  /**
   * Login user - backend sẽ tự động set httpOnly cookies
   */
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    try {
      const response = await api.login(credentials);
      return {
        user: response.data?.user || response.data,
        success: true,
        message: response.message
      };
    } catch (error) {
      console.error('[AuthService] Login error:', error);
      throw error;
    }
  }

  /**
   * Logout user - backend sẽ clear httpOnly cookies
   */
  async logout(): Promise<void> {
    try {
      await api.logout();
    } catch (error) {
      console.error('[AuthService] Logout error:', error);
      // Don't throw error for logout - always succeed locally
    }
  }

  /**
   * Refresh access token - backend sẽ tự động handle và set cookies mới
   */
  async refreshToken(): Promise<any> {
    try {
      const response = await api.refreshToken();
      return response;
    } catch (error) {
      console.error('[AuthService] Refresh token error:', error);
      throw error;
    }
  }

  /**
   * Check session via API call
   */
  async checkSession(): Promise<SessionData> {
    try {
      return await api.checkAuthenticationStatus();
    } catch (error) {
      console.error('[AuthService] Check session error:', error);
      return { isAuthenticated: false };
    }
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      return await api.isAuthenticated();
    } catch (error) {
      console.error('[AuthService] Authentication check error:', error);
      return false;
    }
  }

  /**
   * Get current user profile
   */
  async getCurrentUser(): Promise<any> {
    try {
      return await api.getCurrentUser();
    } catch (error) {
      console.error('[AuthService] Get current user error:', error);
      throw error;
    }
  }

  /**
   * Register new user
   */
  async register(userData: any): Promise<any> {
    const response = await api.post('/auth/register', userData);
    return response.data;
  }

  /**
   * Request password reset - đúng theo backend API
   */
  async requestPasswordReset(params: RequestPasswordResetParams): Promise<RequestPasswordResetResponse> {
    try {
      const response = await api.post('/auth/request-password-reset', params);
      return response.data;
    } catch (error) {
      console.error('[AuthService] Request password reset error:', error);
      throw error;
    }
  }

  /**
   * Reset password with token or credentials - đúng theo backend API
   */
  async resetPasswordWithToken(params: ResetPasswordParams): Promise<any> {
    try {
      // Ensure confirmPassword is set to password if not provided
      const requestParams = {
        ...params,
        confirmPassword: params.confirmPassword || params.password
      };
      
      const response = await api.post('/auth/reset-password', requestParams);
      return response.data;
    } catch (error) {
      console.error('[AuthService] Reset password error:', error);
      throw error;
    }
  }

  /**
   * Reset password - legacy method for backward compatibility
   */
  async resetPassword({
    employeeId,
    cardId,
  }: { employeeId: string; cardId: string }): Promise<RequestPasswordResetResponse> {
    return this.requestPasswordReset({ employeeId, cardId });
  }

  /**
   * Change password for authenticated user
   */
  async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    try {
      await api.post('/auth/change-password', {
        oldPassword,
        newPassword,
        confirmPassword: newPassword
      });
    } catch (error) {
      console.error('[AuthService] Change password error:', error);
      throw error;
    }
  }
}

export const authService = new AuthService();
export default AuthService;
