// AuthManager.ts - Fixed version with correct types

import { authService } from './auth.service';
import type { LoginCredentials, RequestResetParams, ResetPasswordParams, User } from '@/redux/types/auth';
import type { ApiResponse } from '@/lib/api/types';

// Updated AuthState interface to match ApiResponse structure
export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  error: string | null;
  resetPasswordData: ApiResponse<{
    resetToken?: string;
    username: string;
    message: string;
  }> | null;
}

export interface ResetPasswordType {
  employeeId: string;
  cardId: string;
  password: string;
  confirmPassword: string;
}

type AuthSubscriber = (state: AuthState) => void;

class AuthManager {
  private state: AuthState = {
    isAuthenticated: false,
    isLoading: false,
    user: null,
    error: null,
    resetPasswordData: null,
  };

  private subscribers: AuthSubscriber[] = [];

  constructor() {
    this.initialize();
  }

  /**
   * Get current auth state
   */
  getState(): AuthState {
    return this.state;
  }

  /**
   * Subscribe to auth state changes
   */
  subscribe(callback: AuthSubscriber): () => void {
    this.subscribers.push(callback);
    
    // Return unsubscribe function
    return () => {
      this.subscribers = this.subscribers.filter(sub => sub !== callback);
    };
  }

  /**
   * Update state and notify subscribers
   */
  private setState(newState: Partial<AuthState>): void {
    this.state = { ...this.state, ...newState };
    this.subscribers.forEach(callback => callback(this.state));
  }

  /**
   * Initialize auth state on app start
   */
  async initialize(): Promise<void> {
    try {
      this.setState({ isLoading: true, error: null });

      // Check if user has valid token
      const isAuth = authService.isAuthenticated();
      
      if (isAuth) {
        // Verify token with backend and get user data
        const userResponse = await authService.getCurrentUser();
        
        if (userResponse.success && userResponse.data) {
          this.setState({
            isAuthenticated: true,
            user: userResponse.data,
            isLoading: false,
          });
        } else {
          // Token might be invalid, clear it
          authService.clearStoredToken();
          this.setState({
            isAuthenticated: false,
            user: null,
            isLoading: false,
          });
        }
      } else {
        this.setState({
          isAuthenticated: false,
          user: null,
          isLoading: false,
        });
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      this.setState({
        isAuthenticated: false,
        user: null,
        isLoading: false,
        error: 'Failed to initialize authentication',
      });
    }
  }

  /**
   * Login with credentials
   */
  async login(credentials: LoginCredentials): Promise<void> {
    try {
      this.setState({ isLoading: true, error: null });

      const response = await authService.login(credentials);

      if (response.success && response.data) {
        // Get user profile after successful login
        const userResponse = await authService.getCurrentUser();

        console.log('User response:', userResponse);
        
        if (userResponse.success && userResponse.data) {
          authService.recordLoginTime();
          this.setState({
            isAuthenticated: true,
            user: userResponse.data,
            isLoading: false,
          });
        } else {
          this.setState({
            isLoading: false,
            error: 'Failed to get user profile',
          });
        }
      } else {
        this.setState({
          isLoading: false,
          error: this.extractErrorMessage(response.error) || 'Login failed',
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      this.setState({
        isLoading: false,
        error: 'An unexpected error occurred during login',
      });
    }
  }

  /**
   * Logout user
   */
  async logout(reason?: string): Promise<void> {
    try {
      this.setState({ isLoading: true });

      await authService.logout();

      this.setState({
        isAuthenticated: false,
        user: null,
        isLoading: false,
        error: null,
        resetPasswordData: null, // Clear reset data on logout
      });

      if (reason) {
        console.log('Logout reason:', reason);
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Even if logout fails, clear local state
      this.setState({
        isAuthenticated: false,
        user: null,
        isLoading: false,
        error: null,
        resetPasswordData: null,
      });
    }
  }

  /**
   * Refresh authentication token
   */
  async refreshToken(): Promise<void> {
    try {
      this.setState({ isLoading: true, error: null });

      const response = await authService.refreshToken();

      if (response.success) {
        // Token refreshed successfully, get updated user data
        const userResponse = await authService.getCurrentUser();
        
        if (userResponse.success && userResponse.data) {
          this.setState({
            isAuthenticated: true,
            user: userResponse.data,
            isLoading: false,
          });
        }
      } else {
        // Refresh failed, logout user
        await this.logout('Token refresh failed');
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      await this.logout('Token refresh error');
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(userData: Partial<User>): Promise<void> {
    try {
      this.setState({ isLoading: true, error: null });

      const response = await authService.updateUserProfile(userData);

      if (response.success && response.data) {
        this.setState({
          user: response.data,
          isLoading: false,
        });
      } else {
        this.setState({
          isLoading: false,
          error: this.extractErrorMessage(response.error) || 'Failed to update profile',
        });
      }
    } catch (error) {
      console.error('Profile update error:', error);
      this.setState({
        isLoading: false,
        error: 'An unexpected error occurred while updating profile',
      });
    }
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(params: RequestResetParams): Promise<void> {
    try {
      this.setState({ isLoading: true, error: null });

      const response = await authService.requestPasswordReset(params);

      this.setState({
        isLoading: false,
        resetPasswordData: response
      });

      if (!response.success) {
        this.setState({
          error: this.extractErrorMessage(response.error) || 'Không thể yêu cầu đặt lại mật khẩu',
        });
      }
    } catch (error) {
      console.error('Request password reset error:', error);
      this.setState({
        isLoading: false,
        error: 'Có lỗi xảy ra khi yêu cầu đặt lại mật khẩu',
        resetPasswordData: null,
      });
    }
  }

  /**
   * Reset password
   */
  async resetPassword(params: ResetPasswordParams): Promise<void> {
    try {
      this.setState({ isLoading: true, error: null });

      const response = await authService.resetPassword(params);

      if (response.success) {
        this.setState({
          isLoading: false,
          resetPasswordData: null, // Clear reset data after successful reset
        });
      } else {
        const errorMessage = this.extractErrorMessage(response.error) || 'Không thể đặt lại mật khẩu';
        this.setState({
          isLoading: false,
          error: errorMessage,
        });
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      console.error('Reset password error:', error);
      this.setState({
        isLoading: false,
        error: error.message || 'Có lỗi xảy ra khi đặt lại mật khẩu',
      });
      throw error;
    }
  }

  /**
   * Clear reset password data
   */
  clearResetPasswordData(): void {
    this.setState({
      resetPasswordData: null,
      error: null,
    });
  }

  /**
   * Helper method to extract error message from ApiResponse error
   * Handles both string and object error formats
   */
  private extractErrorMessage(error: string | { error: string; message: string; statusCode: number } | undefined): string | null {
    if (!error) return null;
    
    if (typeof error === 'string') {
      return error;
    }
    
    if (typeof error === 'object' && 'message' in error) {
      return error.message;
    }
    
    return 'An unknown error occurred';
  }
}

// Create singleton instance
export const authManager = new AuthManager();