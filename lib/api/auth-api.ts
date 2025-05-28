// Enhanced auth-api.ts with better error handling and retry mechanism
import { delay } from 'redux-saga/effects';
import { api, ApiResponse } from './api';

import type { ApiResponse as AuthApiResponse, AuthResponse } from '../types/auth';

// Maximum number of retries for a request
const MAX_RETRIES = 3;

// Network error detection
const isNetworkError = (error: any): boolean => {
  return (
    (error instanceof TypeError && error.message.includes('Failed to fetch')) ||
    (error instanceof DOMException && error.name === 'AbortError')
  );
};

// Sửa hàm refreshTokenDirectly trong auth-api.ts

// Theo dõi thời gian của lần refresh cuối cùng
let lastRefreshAttempt = 0;
const MIN_REFRESH_INTERVAL = 10000; // 10 giây giữa các lần gọi

/**
 * Direct function to refresh the authentication token with improved throttling
 */
export async function refreshTokenDirectly(): Promise<AuthApiResponse<AuthResponse>> {
  // Kiểm tra tần suất gọi API refresh
  const now = Date.now();
  if (now - lastRefreshAttempt < MIN_REFRESH_INTERVAL) {
    console.log(
      `Token refresh throttled - last attempt was ${Math.floor((now - lastRefreshAttempt) / 1000)}s ago`,
    );
    return {
      success: false,
      error: 'Too many refresh attempts. Please try again later.',
    };
  }

  // Cập nhật thời gian của lần gọi gần nhất
  lastRefreshAttempt = now;

  // Tiếp tục với logic refresh token
  return await withRetry(() => refreshTokenAttempt(), 1); // Giảm số lần thử lại xuống 1
}

/**
 * Generic utility function to retry a failed request with exponential backoff
 * Updated to include longer delays between retries
 */
async function withRetry<T>(fn: () => Promise<T>, maxRetries = 1): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Add exponential backoff delay for retries with much longer times
      if (attempt > 0) {
        const baseDelay = Math.min(5000 * Math.pow(3, attempt - 1), 30000);
        // Add jitter to avoid thundering herd problem
        const jitter = Math.random() * 2000;
        const delayMs = baseDelay + jitter;

        console.log(`Retry attempt ${attempt} after ${delayMs.toFixed(0)}ms delay`);
        await delay(delayMs);
      }

      return await fn();
    } catch (error) {
      console.error(`Attempt ${attempt} failed:`, error);
      lastError = error instanceof Error ? error : new Error(String(error));

      // Check for 429 errors and add extra delay
      if (
        error instanceof Error &&
        (error.message.includes('429') || error.message.includes('Too Many Requests'))
      ) {
        // Add a long delay before any retry
        await delay(60000); // 1 minute delay on rate limit errors
      }

      // Only retry network errors, not HTTP or other errors
      if (!isNetworkError(error)) {
        break;
      }
    }
  }

  throw lastError || new Error('Maximum retry attempts reached');
}

/**
 * Single attempt to refresh token
 */
async function refreshTokenAttempt(): Promise<AuthApiResponse<AuthResponse>> {
  try {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api';

    // Set up request timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    try {
      const response = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
        },
        credentials: 'include' as RequestCredentials,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle different response statuses
      if (response.status === 401) {
        console.warn('Refresh token expired or invalid');
        return {
          success: false,
          error: 'Your session has expired. Please log in again.',
        };
      }

      if (response.status === 403) {
        console.warn('Refresh token forbidden');
        return {
          success: false,
          error: 'Access denied. Please log in again.',
        };
      }

      if (!response.ok) {
        // Get error details from response if possible
        let errorDetails = `Server error: ${response.status}`;

        try {
          const errorBody = await response.json();
          if (errorBody.message) {
            errorDetails = errorBody.message;
          }
        } catch (jsonError) {
          // If we can't parse JSON, just use status text
          errorDetails = response.statusText || errorDetails;
        }

        throw new Error(`Refresh token failed: ${errorDetails}`);
      }

      // Parse the response
      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error('Failed to parse refresh token response:', jsonError);
        return {
          success: false,
          error: 'Invalid response from server',
        };
      }

      // Validate response data shape
      if (!data.accessToken || !data.expiresAt) {
        console.error('Invalid token response format:', data);
        return {
          success: false,
          error: 'Invalid authentication response format',
        };
      }

      return {
        success: true,
        data,
      };
    } catch (fetchError) {
      clearTimeout(timeoutId);

      // Handle timeout errors
      if (fetchError instanceof DOMException && fetchError.name === 'AbortError') {
        console.error('Refresh token request timed out');
        throw new Error('Authentication request timed out. Please try again.');
      }

      // Handle network errors to trigger retry
      if (isNetworkError(fetchError)) {
        console.error('Network error during token refresh');
        throw fetchError; // Re-throw to trigger retry
      }

      throw fetchError; // Re-throw other errors
    }
  } catch (error) {
    // Log the complete error for diagnostics
    console.error('Token refresh error:', error);

    // Provide more user-friendly error message
    if (isNetworkError(error)) {
      return {
        success: false,
        error: 'Network connection error. Please check your internet connection.',
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during authentication',
    };
  }
}

export interface User {
  id: string;
  username: string;
  fullName: string;
  role?: string;
  roleId: string;
  email?: string;
  phone?: string;
  employeeId: string;
  cardId: string;
  factoryId?: string | null;
  lineId?: string | null;
  teamId?: string | null;
  groupId?: string | null;
  positionId?: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Session {
  accessToken: string;
  expiresAt: string;
  lastVerified?: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterCredentials {
  username: string;
  password: string;
  fullName: string;
  employeeId: string;
  cardId: string;
  email?: string;
  phone?: string;
  factoryId?: string;
  lineId?: string;
  teamId?: string;
  groupId?: string;
  positionId?: string;
  defaultRoleCode?: string;
  redirectTo?: string;
}

export interface AuthResponse {
  success: boolean;
  user: User;
  accessToken: string;
  expiresIn: number;
  requiredResetPassword: boolean;
}

export interface ResetPasswordParams {
  username?: string;
  cardId?: string;
  employeeId?: string;
  resetToken?: string;
  password: string;
  confirmPassword: string;
}

export interface RequestResetParams {
  username?: string;
  cardId?: string;
  employeeId?: string;
}

export interface VerifyRegistration {
  token: string;
  username?: string;
}

export interface TokenResponse {
  token: string;
  expiresIn: number;
}

export interface ResetTokenResponse {
  resetToken: string;
  expiryDate: string;
  username: string;
}

// Security monitoring info
export interface SecurityInfo {
  ipAddress?: string;
  userAgent?: string;
  deviceInfo?: {
    browser?: string;
    os?: string;
    device?: string;
  };
  timestamp: string;
  location?: {
    country?: string;
    region?: string;
    city?: string;
  };
}

// Memory-based token storage (not persistent across page refreshes)
let inMemoryToken: string | null = null;
let tokenExpiryTime: number | null = null;

class AuthAPI {
  // Set the in-memory token and expiry
  setToken(token: string, expiresIn: number) {
    inMemoryToken = token;
    tokenExpiryTime = Date.now() + expiresIn * 1000;
  }

  // Clear the in-memory token
  clearToken() {
    inMemoryToken = null;
    tokenExpiryTime = null;
  }

  // Get the in-memory token if it's still valid
  getToken(): string | null {
    if (!inMemoryToken || !tokenExpiryTime) return null;
    if (Date.now() > tokenExpiryTime) {
      this.clearToken();
      return null;
    }
    return inMemoryToken;
  }

  // Check if the token is about to expire (within next 5 minutes)
  isTokenExpiringSoon(): boolean {
    if (!tokenExpiryTime) return false;
    return Date.now() > tokenExpiryTime - 5 * 60 * 1000;
  }

  // Login user
  async login(credentials: LoginCredentials): Promise<ApiResponse<AuthResponse>> {
    const response = await api.post<AuthResponse>('/auth/login', credentials);
    if (response.success && response.data) {
      this.setToken(response.data.accessToken, response.data.expiresIn);
      this.recordLoginTime();
    }
    return response;
  }

  // Register user
  async register(userData: RegisterCredentials): Promise<ApiResponse<{userId: string}>> {
    return api.post<{userId: string}>('/auth/register', userData);
  }

  // Logout user
  async logout(options?: { allDevices?: boolean }): Promise<ApiResponse<{message: string}>> {
    const response = await api.post<{message: string}>('/auth/logout', options || {});
    this.clearToken();
    return response;
  }

  // Clear stored token without API call
  clearStoredToken(): void {
    this.clearToken();
  }

  // Set stored token manually
  setStoredToken(token: string, expiresAt: Date): void {
    this.setToken(token, (expiresAt.getTime() - Date.now()) / 1000);
  }

  // Get current user
  async getCurrentUser(): Promise<ApiResponse<User>> {
    return api.get<User>('/auth/me');
  }

  // Refresh the token
  async refreshToken(): Promise<ApiResponse<TokenResponse>> {
    const response = await api.post<TokenResponse>('/auth/refresh', {});
    if (response.success && response.data) {
      this.setToken(response.data.token, response.data.expiresIn);
    }
    return response;
  }

  // Add a CSRF token to HTTP headers
  addCsrfToken(headers: Record<string, string>, csrfToken: string): Record<string, string> {
    return {
      ...headers,
      'X-CSRF-Token': csrfToken,
    };
  }

  // Get a CSRF token from the server
  async getCsrfToken(): Promise<ApiResponse<{token: string}>> {
    return api.get<{token: string}>('/auth/csrf');
  }

  // Request password reset
  async requestPasswordReset(data: RequestResetParams): Promise<ApiResponse<ResetTokenResponse>> {
    return api.post<ResetTokenResponse>('/auth/request-password-reset', data);
  }

  // Reset password with token
  async resetPassword(data: ResetPasswordParams): Promise<ApiResponse<any>> {
    return api.post<any>('/auth/reset-password', data);
  }

  // Change password (requires authentication)
  async changePassword(oldPassword: string, newPassword: string, confirmPassword: string): Promise<ApiResponse<any>> {
    return api.post<any>('/auth/change-password', {
      oldPassword,
      newPassword,
      confirmPassword,
    });
  }

  // Verify account with verification code
  async verifyAccount(data: VerifyRegistration): Promise<ApiResponse<AuthResponse>> {
    return api.post<AuthResponse>('/auth/verify-account', data);
  }

  // Magic link authentication request
  async requestMagicLink(email: string): Promise<ApiResponse<{message: string}>> {
    return api.post<{message: string}>('/auth/magic-link-request', { email });
  }

  // Verify magic link token
  async verifyMagicLink(token: string): Promise<ApiResponse<AuthResponse>> {
    return api.post<AuthResponse>('/auth/magic-link-verify', { token });
  }

  // OAuth redirect
  getOAuthUrl(provider: 'google' | 'facebook' | 'github'): string {
    return `${api.baseUrl || ''}/auth/oauth/${provider}`;
  }

  // Verify OAuth callback
  async verifyOAuthCallback(provider: string, code: string, state: string): Promise<ApiResponse<AuthResponse>> {
    return api.post<AuthResponse>('/auth/oauth/callback', { provider, code, state });
  }

  // Record login time for security monitoring
  recordLoginTime(): void {
    const securityData = {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
    };
    sessionStorage.setItem('auth_last_login', JSON.stringify(securityData));
  }

  // Update user profile
  async updateUserProfile(userData: Partial<User>): Promise<ApiResponse<User>> {
    return api.put<User>('/users/profile', userData);
  }

  // Get security info from session storage
  getLastLoginInfo(): SecurityInfo | null {
    const data = sessionStorage.getItem('auth_last_login');
    if (!data) return null;
    try {
      return JSON.parse(data) as SecurityInfo;
    } catch (e) {
      console.error('Failed to parse auth security info', e);
      return null;
    }
  }
}

export const authService = new AuthAPI();
export default authService;
