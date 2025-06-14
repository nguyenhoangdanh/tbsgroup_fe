// lib/api/api.ts - Centralized API client with httpOnly cookie authentication

import { mode } from "crypto-js";

interface ApiConfig {
  baseURL?: string;
  timeout?: number;
  defaultHeaders?: Record<string, string>;
}

interface ApiResponse<T = any> {
  data: T;
  message?: string;
  success?: boolean;
  status?: number;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
  };
}

interface PaginatedResponse<T = any> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages?: number;
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages?: number;
  };
}

class ApiClient {
  private baseURL: string;
  private timeout: number;
  private defaultHeaders: Record<string, string>;

  constructor(config: ApiConfig = {}) {
    this.baseURL = config.baseURL || process.env.NEXT_PUBLIC_API_BASE_URL || '';
    this.timeout = config.timeout || 30000;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      ...config.defaultHeaders,
      mode: 'cors',
    };
  }

  /**
   * Build headers for requests
   * Note: We don't manually add Authorization header since we use httpOnly cookies
   */
  private buildHeaders(additionalHeaders: Record<string, string> = {}): Record<string, string> {
    return {
      ...this.defaultHeaders,
      ...additionalHeaders,
    };
  }

  /**
   * Core request method with enhanced error handling and abort signal support
   */
  private async request<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      ...options,
      headers: this.buildHeaders(options.headers as Record<string, string>),
      credentials: 'include', // CRITICAL: Always include cookies for httpOnly authentication
      // Use provided signal or create timeout signal
      signal: options.signal || AbortSignal.timeout(this.timeout),
    };

    try {
      const response = await fetch(url, config);
      
      // Handle different response status codes
      if (!response.ok) {
        await this.handleErrorResponse(response);
      }

      const contentType = response.headers.get('content-type');
      let data;

      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      return {
        data: data?.data || data,
        message: data?.message,
        success: data?.success ?? true,
        status: response.status,
        meta: data?.meta,
      };
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Request was aborted');
        }
        if (error.name === 'TimeoutError') {
          throw new Error('Request timeout - please try again');
        }
        throw error;
      }
      throw new Error('Network error occurred');
    }
  }

  /**
   * Handle error responses with proper error messages
   */
  private async handleErrorResponse(response: Response): Promise<never> {
    let errorData: any = {};
    
    try {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        errorData = await response.json();
      } else {
        errorData = { message: await response.text() };
      }
    } catch {
      errorData = { message: `HTTP ${response.status}: ${response.statusText}` };
    }

    // Handle specific status codes
    switch (response.status) {
      case 401:
        // Token expired or invalid - redirect to login
        throw new Error(errorData.message || 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      
      case 403:
        throw new Error(errorData.message || 'Bạn không có quyền thực hiện thao tác này.');
      
      case 404:
        throw new Error(errorData.message || 'Không tìm thấy tài nguyên yêu cầu.');
      
      case 422:
        // Validation errors
        throw {
          message: errorData.message || 'Dữ liệu không hợp lệ',
          errors: errorData.errors || {},
          status: 422
        };
      
      case 429:
        throw new Error(errorData.message || 'Quá nhiều yêu cầu. Vui lòng thử lại sau.');
      
      case 500:
        throw new Error(errorData.message || 'Lỗi máy chủ nội bộ. Vui lòng thử lại sau.');
      
      default:
        throw new Error(errorData.message || `Lỗi HTTP ${response.status}: ${response.statusText}`);
    }
  }

  /**
   * HTTP Methods with httpOnly cookie authentication
   */
  async get<T = any>(
    endpoint: string, 
    params?: Record<string, any>,
    options?: { signal?: AbortSignal }
  ): Promise<ApiResponse<T>> {
    const searchParams = params ? new URLSearchParams() : null;
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams!.append(key, String(value));
        }
      });
    }
    
    const url = searchParams?.toString() ? `${endpoint}?${searchParams.toString()}` : endpoint;
    return this.request<T>(url, { 
      method: 'GET',
      signal: options?.signal
    });
  }

  async post<T = any>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T = any>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T = any>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T = any>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  /**
   * Upload files with proper headers
   */
  async upload<T = any>(endpoint: string, formData: FormData): Promise<ApiResponse<T>> {
    // Don't set Content-Type for FormData - let browser handle it
    const headers = this.buildHeaders();
    delete headers['Content-Type'];

    return this.request<T>(endpoint, {
      method: 'POST',
      body: formData,
      headers,
    });
  }

  /**
   * Utility method for paginated responses
   */
  async paginated<T = any>(
    endpoint: string, 
    params?: Record<string, any>
  ): Promise<PaginatedResponse<T>> {
    const response = await this.get<PaginatedResponse<T>>(endpoint, params);
    
    // Handle different response structures
    if (response.data && 'data' in response.data) {
      return response.data;
    }
    
    // If response.data is already the paginated structure
    return response.data as PaginatedResponse<T>;
  }

  /**
   * Batch delete with proper error handling
   */
  async batchDelete(endpoint: string, ids: (string | number)[]): Promise<ApiResponse<void>> {
    if (!ids || ids.length === 0) {
      throw new Error('No IDs provided for batch delete');
    }

    return this.post(`${endpoint}/batch-delete`, { ids });
  }

  /**
   * Health check endpoint
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.get('/health');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if user is authenticated by trying to get profile
   * Since we can't access httpOnly cookies from JS, we need to make an API call
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      await this.get('/users/profile');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get current user profile to check authentication status
   */
  async getCurrentUser(): Promise<any> {
    try {
      const response = await this.get('/users/profile');
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Verify current session - khác với isAuthenticated
   */
  async verifySession(): Promise<{ isValid: boolean; user?: any }> {
    try {
      const response = await this.get('/auth/verify');
      return {
        isValid: true,
        user: response.data
      };
    } catch {
      return {
        isValid: false
      };
    }
  }

  /**
   * Check authentication status specifically for saga
   */
  async checkAuthenticationStatus(): Promise<{ isAuthenticated: boolean; user?: any }> {
    try {
      const response = await this.get('/users/profile');
      return {
        isAuthenticated: true,
        user: response.data
      };
    } catch (error) {
      console.log('[API] Authentication check failed:', error);
      return {
        isAuthenticated: false
      };
    }
  }

  /**
   * Login with httpOnly cookies
   */
  async login(credentials: { username: string; password: string }): Promise<any> {
    try {
      const response = await this.post('/auth/login', credentials);
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Logout with httpOnly cookies
   */
  async logout(): Promise<void> {
    try {
      await this.post('/auth/logout');
    } catch (error) {
      console.error('[API] Logout error:', error);
      // Don't throw error for logout - always succeed locally
    }
  }

  /**
   * Refresh token via httpOnly cookies
   */
  async refreshToken(): Promise<any> {
    try {
      const response = await this.post('/auth/refresh');
      return response;
    } catch (error) {
      throw error;
    }
  }
}

// Create and export singleton instance
export const api = new ApiClient({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api',
  timeout: 30000,
});

// Export specific method for saga usage
export const checkAuthenticationStatus = () => api.checkAuthenticationStatus();
export const verifyUserSession = () => api.verifySession();
export const getCurrentUserProfile = () => api.getCurrentUser();

// Export types for use in other files
export type { ApiResponse, PaginatedResponse, ApiConfig };

// Export default
export default api;