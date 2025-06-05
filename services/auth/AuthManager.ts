"use client"
import { store } from '@/redux/store';
import { 
  loginRequest, 
  logoutRequest, 
  registerRequest, 
  refreshTokenRequest,
  updateUserRequest,
  requestPasswordResetRequest,
  resetPasswordRequest,
  clearErrors, // Thay đổi từ clearResetPasswordData sang clearErrors
} from '@/redux/slices/authSlice';
import type { AuthState, LoginCredentials, RequestResetParams, ResetPasswordParams } from '@/redux/types/auth';
import { authService } from './auth.service';

/**
 * AuthManager class handles auth state management and communicates with Redux
 */
class AuthManager {
  private subscribers: Array<(state: AuthState) => void> = [];
  private initialized = false;
  private state: AuthState = {
    status: 'idle',
    user: null,
    accessToken: null,
    isAuthenticated: false,
    error: null,
    loading: false,
    expiresAt: null,
    resetPassword: {
      resetToken: null,
      expiryDate: null,
      username: null,
      loading: false,
      error: null,
    },
  };

  constructor() {
    this.initializeFromReduxStore();
    this.initialize();
  }

  /**
   * Initialize from Redux store - prefer Redux store state over local
   */
  private initializeFromReduxStore(): void {
    const state = store.getState();
    this.state = { ...this.state, ...state.auth };
  }

  /**
   * Initialize auth state from cookies/session
   * Giữ phương thức này đồng bộ để tránh lỗi trong quá trình khởi tạo
   */
  private initialize(): void {
    try {
      if (this.initialized) return;
      
      // Chỉ kiểm tra cơ bản qua cookie để không gây lỗi trong quá trình khởi tạo
      const isAuthenticated = authService.isAuthenticated();
      
      if (isAuthenticated) {
        console.log('Initial check: Có thể đã xác thực, sẽ kiểm tra session sau');
      } else {
        console.log('Initial check: Không tìm thấy dấu hiệu xác thực');
      }
      
      this.initialized = true;
    } catch (error) {
      console.error('Error initializing auth state:', error);
    }
  }

  /**
   * Subscribe to auth state changes
   */
  subscribe(callback: (state: AuthState) => void): () => void {
    this.subscribers.push(callback);
    
    // Return unsubscribe function
    return () => {
      this.subscribers = this.subscribers.filter(sub => sub !== callback);
    };
  }

  /**
   * Notify all subscribers of state change
   */
  private notifySubscribers(): void {
    const currentState = this.getState();
    this.subscribers.forEach(callback => callback(currentState));
  }

  /**
   * Update internal state and notify subscribers
   */
  private updateState(newState: Partial<AuthState>): void {
    this.state = { ...this.state, ...newState };
    this.notifySubscribers();
  }

  /**
   * Get current auth state
   */
  getState(): AuthState {
    return { ...this.state };
  }

  /**
   * Login with username and password
   */
  async login(credentials: LoginCredentials): Promise<boolean> {
    store.dispatch(loginRequest(credentials));
    const unsubscribe = store.subscribe(() => {
      const state = store.getState();
      this.updateState(state.auth);
      this.notifySubscribers();
    });
    
    try {
      const response = await authService.login(credentials);
      unsubscribe();
      return response.success;
    } catch (error) {
      unsubscribe();
      return false;
    }
  }

  /**
   * Register a new user
   */
  register(userData: any): void {
    store.dispatch(registerRequest(userData));
    this.subscribeToStoreChanges();
  }

  /**
   * Logout current user
   */
  logout(reason?: string): void {
    store.dispatch(logoutRequest({ reason }));
    this.subscribeToStoreChanges();
  }

  /**
   * Refresh auth token
   */
  refreshToken(): void {
    store.dispatch(refreshTokenRequest());
    this.subscribeToStoreChanges();
  }

  /**
   * Request password reset
   */
  requestPasswordReset(params: RequestResetParams): void {
    store.dispatch(requestPasswordResetRequest(params));
    this.subscribeToStoreChanges();
  }

  /**
   * Reset password with token
   */
  resetPassword(params: ResetPasswordParams): void {
    store.dispatch(resetPasswordRequest(params));
    this.subscribeToStoreChanges();
  }

  /**
   * Clear reset password data
   */
  clearResetPasswordData(): void {
    store.dispatch(clearErrors()); // Thay đổi từ clearResetPasswordAction sang clearErrors
    this.subscribeToStoreChanges();
  }

  /**
   * Update user profile
   */
  updateProfile(userData: any): void {
    store.dispatch(updateUserRequest(userData));
    this.subscribeToStoreChanges();
  }

  /**
   * Subscribe to Redux store changes temporarily
   */
  private subscribeToStoreChanges(): void {
    const unsubscribe = store.subscribe(() => {
      const state = store.getState();
      const authState = state.auth;
      
      // Check if auth state has changed with a deep comparison
      if (JSON.stringify(authState) !== JSON.stringify(this.state)) {
        this.updateState(authState);
        
        // Unsubscribe after state update
        setTimeout(() => {
          unsubscribe();
        }, 100);
      }
    });
  }

  /**
   * Force check of current session status
   */
  async checkSession(): Promise<boolean> {
    try {
      // Gọi API session để kiểm tra
      const sessionData = await authService.checkSession();
      return sessionData.isAuthenticated;
    } catch (error) {
      console.error('Error checking session:', error);
      return false;
    }
  }
}

// Create singleton instance
export const authManager = new AuthManager();