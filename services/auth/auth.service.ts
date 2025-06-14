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
   * Reset password
   */
  static async resetPassword({
    employeeId,
    cardId,
  }: { employeeId: string; cardId: string }): Promise<void> {
    await api.post('/auth/reset-password', { employeeId, cardId });
  }

  /**
   * Change password
   */
  static async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await api.patch('/auth/change-password', {
      currentPassword,
      newPassword
    });
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

  async resetPassword({ employeeId, cardId }: { employeeId: string; cardId: string }): Promise<void> {
    return AuthService.resetPassword({ employeeId, cardId });
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    return AuthService.changePassword(currentPassword, newPassword);
  }
}

export const authService = new AuthService();
export default AuthService;
