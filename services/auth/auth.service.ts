import { api } from '@/lib/api/api-client';
import {
  ApiResponse,
  AuthResponse,
  LoginCredentials,
  RegisterCredentials,
  User,
} from '@/lib/types/auth';

/**
 * Authentication service with enhanced security for auth-related API calls
 */
export const authService = {
  /**
   * Login with email and password
   */
  async login(credentials: LoginCredentials): Promise<ApiResponse<AuthResponse>> {
    // Add device fingerprint for fraud detection
    // const deviceInfo = {
    //   userAgent: navigator.userAgent,
    //   timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    //   screenRes: `${window.screen.width}x${window.screen.height}`,
    //   language: navigator.language,
    // };

    return api.post<AuthResponse>('/auth/login', {
      ...credentials,
      // deviceInfo
    });
  },

  /**
   * Register new user with enhanced validation
   */
  async register(credentials: RegisterCredentials): Promise<ApiResponse<AuthResponse>> {
    return api.post<AuthResponse>('/auth/register', credentials);
  },

  /**
   * Secure logout from all devices
   */
  async logout(options: { allDevices?: boolean } = {}): Promise<ApiResponse> {
    const endpoint = options.allDevices ? '/auth/logout-all' : '/auth/logout';
    return api.post(endpoint, {});
  },

  /**
   * Get the current authenticated user
   */
  async getCurrentUser(): Promise<ApiResponse<User>> {
    return api.get<User>('/auth/me');
  },

  /**
   * Verify email address with token
   */
  async verifyEmail(token: string): Promise<ApiResponse> {
    // Validate token format first to prevent sending invalid tokens
    if (!/^[a-zA-Z0-9_-]{20,}$/.test(token)) {
      return {
        success: false,
        error: 'Invalid token format',
      };
    }

    return api.get(`/auth/verify-email/${token}`);
  },

  async refreshToken(): Promise<ApiResponse<AuthResponse>> {
    try {
      // Kiểm tra giới hạn tốc độ
      const now = Date.now();
      const lastRefreshStr = localStorage.getItem('lastTokenRefreshTime');
      const lastRefresh = lastRefreshStr ? parseInt(lastRefreshStr) : 0;
      const MIN_REFRESH_INTERVAL = 30 * 1000; // 30 giây giữa các lần refresh

      if (now - lastRefresh < MIN_REFRESH_INTERVAL) {
        console.log(
          `Service token refresh throttled - last refresh was ${Math.floor((now - lastRefresh) / 1000)}s ago`,
        );
        return {
          success: false,
          error: 'Too many refresh attempts. Please try again later.',
        };
      }

      // Ghi lại thời gian refresh hiện tại
      localStorage.setItem('lastTokenRefreshTime', now.toString());

      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api';
      console.log('Attempting token refresh with URL:', `${API_BASE_URL}/auth/refresh`);

      // Thêm controller để thiết lập timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include', // Critical for including cookies
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
        },
        signal: controller.signal,
        // Add timestamp to avoid caching
        cache: 'no-store',
      });

      clearTimeout(timeoutId);

      console.log('Refresh response status:', response.status);

      // Xử lý lỗi 429 một cách đặc biệt
      if (response.status === 429) {
        console.error('Rate limited (429) on token refresh');

        // Thiết lập thời gian dài hơn cho cooldown
        const cooldownTimeMs = 5 * 60 * 1000; // 5 phút
        const cooldownUntil = now + cooldownTimeMs;
        localStorage.setItem('tokenRefreshCooldownUntil', cooldownUntil.toString());

        return {
          success: false,
          error: 'Rate limited. Please try again later.',
        };
      }

      if (!response.ok) {
        let errorMessage;
        try {
          // Try to get error details if available
          const errorData = await response.json();
          errorMessage = errorData.message || `HTTP Error: ${response.status}`;
          console.error('Refresh error details:', errorData);
        } catch (parseError) {
          // If we can't parse JSON, use status text
          errorMessage = `HTTP Error: ${response.status} ${response.statusText}`;
          console.error('Failed to parse error response:', parseError);
        }

        return {
          success: false,
          error: errorMessage,
        };
      }

      // Parse the successful response
      const data = await response.json();
      console.log('Token refresh successful');
      return { success: true, data };
    } catch (error) {
      // Detailed error logging
      console.error('Refresh token network error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown refresh token error';
      console.error('Error details:', errorMessage);

      return {
        success: false,
        error: errorMessage,
      };
    }
  },

  /**
   * Send password reset email with rate limiting
   */
  async sendPasswordResetEmail(email: string): Promise<ApiResponse> {
    return api.post('/auth/forgot-password', { email });
  },

  /**
   * Reset password with token and password validation
   */
  async resetPassword(token: string, password: string, securityInfo?: any): Promise<ApiResponse> {
    // Validate password strength before sending
    const isStrongPassword = this.validatePasswordStrength(password);
    if (!isStrongPassword.valid) {
      return {
        success: false,
        error: isStrongPassword.message,
      };
    }

    // return api.post('/auth/reset-password', {token, password, securityInfo});
    return api.resetPassword(token, password, securityInfo);
  },

  /**
   * Update user profile with optional password verification for sensitive updates
   */
  async updateUserProfile(
    userData: Partial<User>,
    options: { requirePassword?: string } = {},
  ): Promise<ApiResponse<User>> {
    return api.patch<User>('/auth/profile', {
      ...userData,
      ...(options.requirePassword ? { currentPassword: options.requirePassword } : {}),
    });
  },

  /**
   * Validate password strength
   */
  validatePasswordStrength(password: string): {
    valid: boolean;
    message?: string;
    score?: number;
  } {
    if (password.length < 10) {
      return {
        valid: false,
        message: 'Password must be at least 10 characters long',
        score: 1,
      };
    }

    let score = 0;

    // Check for uppercase, lowercase, numbers, and special characters
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    // Check for common patterns
    if (/123|abc|qwerty|password|admin/i.test(password)) {
      score = Math.max(1, score - 2);
    }

    if (score < 3) {
      return {
        valid: false,
        message:
          'Password must contain at least 3 of: uppercase letters, lowercase letters, numbers, and special characters',
        score,
      };
    }

    return { valid: true, score };
  },

  /**
   * Get token from secure storage
   */
  getStoredToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('accessToken');
  },

  /**
   * Set token in secure storage
   */
  setStoredToken(token: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem('accessToken', token);
    const expiresAtToken = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // Token hết hạn sau 1 giờ
    localStorage.setItem('tokenExpiresAt', expiresAtToken);
  },

  /**
   * Clear token from storage
   */
  clearStoredToken(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('tokenExpiresAt');
    localStorage.removeItem('refreshToken');
  },

  /**
   * Check if token is expired with buffer time
   */
  isTokenExpired(bufferSeconds: number = 0): boolean {
    if (typeof window === 'undefined') return true;

    const expiresAtStr = localStorage.getItem('tokenExpiresAt');
    if (!expiresAtStr) return true;

    const expiresAt = new Date(expiresAtStr).getTime();
    // Add buffer time to account for network latency
    return expiresAt <= new Date().getTime() + bufferSeconds * 1000;
  },

  /**
   * Check if there was a recent login (for sensitive operations)
   */
  wasRecentlyLoggedIn(maxAgeMinutes: number = 30): boolean {
    const loginTimeStr = localStorage.getItem('lastLoginTime');
    if (!loginTimeStr) return false;

    const loginTime = new Date(loginTimeStr).getTime();
    const now = new Date().getTime();

    // Check if login was within the specified time frame
    return now - loginTime < maxAgeMinutes * 60 * 1000;
  },

  /**
   * Record successful login time
   */
  recordLoginTime(): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem('lastLoginTime', new Date().toISOString());
  },
};
