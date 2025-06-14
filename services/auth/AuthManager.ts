"use client"
import { 
  loginRequest, 
  logoutRequest, 
  registerRequest, 
  updateUserRequest,
  requestPasswordResetRequest,
  resetPasswordRequest,
  clearErrors,
  initializeSession,
  clearResetPasswordData,
} from '@/redux/slices/authSlice';
import { store } from '@/redux/store';
import type { AuthState, LoginCredentials, RequestResetParams, ResetPasswordParams } from '@/redux/types/auth';

import { authService } from './auth.service';

/**
 * AuthManager class handles auth state management and communicates with Redux
 */
class AuthManager {
  private subscribers: Array<(state: AuthState) => void> = [];
  private initialized = false;
  private state: AuthState = {
    status: 'checking',
    user: null,
    accessToken: 'cookie-managed',
    isAuthenticated: false,
    error: null,
    isLoading: false,
    expiresAt: null,
    resetPasswordData: null,
  };

  constructor() {
    this.initializeFromReduxStore();
    // Don't automatically initialize session - let SagaProvider handle it
  }

  private initializeFromReduxStore(): void {
    const state = store.getState();
    this.state = { ...this.state, ...state.auth };
  }

  private initialize(): void {
    try {
      if (this.initialized) return;
      
      // Only initialize session if explicitly called
      console.log('AuthManager: Manual session initialization');
      store.dispatch(initializeSession());
      
      this.initialized = true;
    } catch (error) {
      console.error('Error initializing auth state:', error);
    }
  }

  subscribe(callback: (state: AuthState) => void): () => void {
    this.subscribers.push(callback);
    
    return () => {
      this.subscribers = this.subscribers.filter(sub => sub !== callback);
    };
  }

  private notifySubscribers(): void {
    const currentState = this.getState();
    this.subscribers.forEach(callback => callback(currentState));
  }

  private updateState(newState: Partial<AuthState>): void {
    this.state = { ...this.state, ...newState };
    this.notifySubscribers();
  }

  getState(): AuthState {
    return { ...this.state };
  }

  checkSession(): void {
    store.dispatch(initializeSession());
    this.subscribeToStoreChanges();
  }

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

  register(userData: any): void {
    store.dispatch(registerRequest(userData));
    this.subscribeToStoreChanges();
  }

  logout(reason?: string): void {
    const payload = reason ? { reason } : {};
    store.dispatch(logoutRequest(payload));
    this.subscribeToStoreChanges();
  }

  // Token refresh is now handled automatically by HTTP-only cookies
  // This method is kept for backward compatibility but does nothing
  refreshToken(): void {
    console.warn('refreshToken() is deprecated - HTTP-only cookies handle refresh automatically');
  }

  requestPasswordReset(params: RequestResetParams): void {
    store.dispatch(requestPasswordResetRequest(params));
    this.subscribeToStoreChanges();
  }

  resetPassword(params: ResetPasswordParams): void {
    store.dispatch(resetPasswordRequest(params));
    this.subscribeToStoreChanges();
  }

  clearResetPasswordData(): void {
    store.dispatch(clearResetPasswordData());
    this.subscribeToStoreChanges();
  }

  updateProfile(userData: any): void {
    store.dispatch(updateUserRequest(userData));
    this.subscribeToStoreChanges();
  }

  private subscribeToStoreChanges(): void {
    const unsubscribe = store.subscribe(() => {
      const state = store.getState();
      const authState = state.auth;
      
      if (JSON.stringify(authState) !== JSON.stringify(this.state)) {
        this.updateState(authState);
        
        setTimeout(() => {
          unsubscribe();
        }, 100);
      }
    });
  }

  async checkSessionLegacy(): Promise<boolean> {
    try {
      const sessionData = await authService.checkSession();
      return sessionData.isAuthenticated;
    } catch (error) {
      console.error('Error checking session:', error);
      return false;
    }
  }
}

export const authManager = new AuthManager();