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
  confirmPassword: string;
}

/**
 * Authentication Service với httpOnly cookies
 */
export class AuthService {
  /**
   * Login user - backend sẽ tự động set httpOnly cookies
   */
  static async login(credentials: LoginCredentials): Promise<LoginResponse> {
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
  static async logout(): Promise<void> {
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
  static async refreshToken(): Promise<any> {
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
  static async checkSession(): Promise<SessionData> {
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
  static async isAuthenticated(): Promise<boolean> {
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
  static async getCurrentUser(): Promise<any> {
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
  static async register(userData: any): Promise<any> {
    const response = await api.post('/auth/register', userData);
    return response.data;
  }

  /**
   * Request password reset - đúng theo backend API
   */
  static async requestPasswordReset(params: RequestPasswordResetParams): Promise<RequestPasswordResetResponse> {
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
  static async resetPasswordWithToken(params: ResetPasswordParams): Promise<void> {
    try {
      await api.post('/auth/reset-password', params);
    } catch (error) {
      console.error('[AuthService] Reset password error:', error);
      throw error;
    }
  }

  /**
   * Reset password - legacy method for backward compatibility
   */
  static async resetPassword({
    employeeId,
    cardId,
  }: { employeeId: string; cardId: string }): Promise<RequestPasswordResetResponse> {
    return AuthService.requestPasswordReset({ employeeId, cardId });
  }

  /**
   * Change password for authenticated user
   */
  static async changePassword(oldPassword: string, newPassword: string): Promise<void> {
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

  // Instance methods for backward compatibility
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    return AuthService.login(credentials);
  }

  async logout(): Promise<void> {
    return AuthService.logout();
  }

  async refreshToken(): Promise<any> {
    return AuthService.refreshToken();
  }

  async checkSession(): Promise<SessionData> {
    return AuthService.checkSession();
  }

  async isAuthenticated(): Promise<boolean> {
    return AuthService.isAuthenticated();
  }

  async getCurrentUser(): Promise<any> {
    return AuthService.getCurrentUser();
  }

  async register(userData: any): Promise<any> {
    return AuthService.register(userData);
  }

  async requestPasswordReset(params: RequestPasswordResetParams): Promise<RequestPasswordResetResponse> {
    return AuthService.requestPasswordReset(params);
  }

  async resetPasswordWithToken(params: ResetPasswordParams): Promise<void> {
    return AuthService.resetPasswordWithToken(params);
  }

  async resetPassword({ employeeId, cardId }: { employeeId: string; cardId: string }): Promise<RequestPasswordResetResponse> {
    return AuthService.resetPassword({ employeeId, cardId });
  }

  async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    return AuthService.changePassword(oldPassword, newPassword);
  }
}

export const authService = new AuthService();
export default AuthService;
