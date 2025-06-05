// lib/api/api.ts - Fixed version with better error parsing
import { ApiResponse, ApiConfig, Logger, ConsoleLogger } from './types';
import Cookies from 'js-cookie';

/**
 * Enhanced API configuration with environment-specific settings
 */
const getApiConfig = (): ApiConfig => {
  const isProduction = process.env.NODE_ENV === 'production';

  return {
    baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1',
    maxNetworkRetries: isProduction ? 2 : 3,
    defaultTimeout: isProduction ? 15000 : 30000,
    logger: new ConsoleLogger(),
  };
};

const DEFAULT_CONFIG = getApiConfig();

/**
 * Request queue for handling concurrent requests to the same endpoint
 */
class RequestQueue {
  private static instance: RequestQueue;
  private pendingRequests = new Map<string, Promise<any>>();

  static getInstance() {
    if (!RequestQueue.instance) {
      RequestQueue.instance = new RequestQueue();
    }
    return RequestQueue.instance;
  }

  async dedupe<T>(key: string, requestFn: () => Promise<T>): Promise<T> {
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key);
    }

    const promise = requestFn().finally(() => {
      this.pendingRequests.delete(key);
    });

    this.pendingRequests.set(key, promise);
    return promise;
  }
}

const requestQueue = RequestQueue.getInstance();

/**
 * Extract error message from response data with priority order
 */
const extractErrorMessage = (data: any, defaultMessage: string): string => {
  if (!data || typeof data !== 'object') {
    return defaultMessage;
  }

  // Priority order for error message extraction
  // 1. message field (most common in backend responses)
  if (typeof data.message === 'string' && data.message.trim()) {
    return data.message;
  }

  // 2. error field (alternative error format)
  if (typeof data.error === 'string' && data.error.trim()) {
    return data.error;
  }

  // 3. errors array (validation errors)
  if (Array.isArray(data.errors) && data.errors.length > 0) {
    const firstError = data.errors[0];
    if (typeof firstError === 'string') {
      return firstError;
    }
    if (typeof firstError === 'object' && firstError.message) {
      return firstError.message;
    }
  }

  // 4. error.message (nested error object)
  if (data.error && typeof data.error === 'object' && data.error.message) {
    return data.error.message;
  }

  // 5. detail field (some APIs use this)
  if (typeof data.detail === 'string' && data.detail.trim()) {
    return data.detail;
  }

  return defaultMessage;
};

/**
 * Enhanced API request function with better retry logic and error parsing
 */
export async function apiRequest<T = unknown>(
  endpoint: string,
  options: RequestInit = {},
  config: Partial<ApiConfig> = {},
  retryWithRefresh = true,
  networkRetries = DEFAULT_CONFIG.maxNetworkRetries,
): Promise<ApiResponse<T>> {
  const mergedConfig: ApiConfig = { ...DEFAULT_CONFIG, ...config };
  const { baseUrl, defaultTimeout, logger } = mergedConfig;

  // Create request key for deduplication
  const requestKey = `${options.method || 'GET'}:${endpoint}:${JSON.stringify(options.body || {})}`;

  try {
    return await requestQueue.dedupe(requestKey, async () => {
      const url = endpoint.startsWith('/') ? `${baseUrl}${endpoint}` : `${baseUrl}/${endpoint}`;

      // Enhanced headers with CSRF protection
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        ...((options.headers as Record<string, string>) || {}),
      };

      // Add CSRF token if available
      if (typeof window !== 'undefined') {
        const csrfToken = document
          .querySelector('meta[name="csrf-token"]')
          ?.getAttribute('content');
        if (csrfToken) {
          headers['X-CSRF-Token'] = csrfToken;
        }
      }

      const finalOptions: RequestInit = {
        ...options,
        headers,
        credentials: 'include', // Always include cookies for auth
      };

      const method = (finalOptions.method || 'GET').toUpperCase();

      // Create timeout signal with better browser compatibility
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), defaultTimeout);

      // Combine signals if one already exists
      if (finalOptions.signal) {
        const originalSignal = finalOptions.signal;
        originalSignal.addEventListener('abort', () => controller.abort());
      }

      finalOptions.signal = controller.signal;

      try {
        logger.debug(`${method} request to ${url}`);

        const response = await fetch(url, finalOptions);
        clearTimeout(timeoutId);

        // Parse response with better error handling
        let data: unknown;
        const contentType = response.headers.get('content-type');

        try {
          if (contentType && contentType.includes('application/json')) {
            data = await response.json();
          } else {
            const text = await response.text();
            try {
              data = JSON.parse(text);
            } catch {
              data = { message: text };
            }
          }
        } catch (parseError) {
          logger.error('Response parsing error:', parseError);
          data = { message: 'Invalid response format' };
        }

        // Handle authentication errors with smart refresh
        if (response.status === 401 && retryWithRefresh) {
          // First, extract the actual error message from the 401 response
          const actualErrorMessage = extractErrorMessage(
            data,
            'Your session has expired. Please log in again.'
          );

          // Only attempt token refresh for actual token expiry, not for invalid credentials
          const isTokenExpiry = typeof data === 'object' && data !== null && 
            ('token' in data || 'expired' in data || 'session' in data);

          if (isTokenExpiry) {
            try {
              logger.info('Token expired, attempting refresh');

              const refreshResponse = await fetch(`${baseUrl}/auth/refresh`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                  'Content-Type': 'application/json',
                  'Cache-Control': 'no-cache, no-store, must-revalidate',
                  Pragma: 'no-cache',
                },
              });

              if (refreshResponse.ok) {
                logger.info('Token refreshed successfully');
                // Retry original request
                return apiRequest(endpoint, options, config, false, networkRetries);
              }

              logger.warn('Token refresh failed');
            } catch (refreshError) {
              logger.error('Token refresh error:', refreshError);
            }
          }

          // Return the actual error message from the backend
          return {
            success: false,
            error: actualErrorMessage,
          };
        }

        // Handle non-success responses
        if (!response.ok) {
          const errorMessage = extractErrorMessage(
            data,
            `Error: ${response.status} ${response.statusText}`
          );

          logger.error(`API error (${response.status}): ${errorMessage}`);

          // For structured error responses, include additional details
          if (data && typeof data === 'object' && data !== null) {
            return {
              success: false,
              error: {
                error: errorMessage,
                message: errorMessage,
                statusCode: response.status,
              },
            };
          }

          return {
            success: false,
            error: errorMessage,
          };
        }

        // Handle API-specific response format
        if (data && typeof data === 'object' && data !== null) {
          // If the response already has success field, use it as-is
          if ('success' in data) {
            return data as ApiResponse<T>;
          }

          // If response has data field, wrap it properly
          if ('data' in data) {
            return {
              success: true,
              data: (data as any).data as T,
            };
          }
        }

        // Default success response
        return {
          success: true,
          data: data as T,
        };
      } catch (fetchError: unknown) {
        clearTimeout(timeoutId);

        const isNetworkError =
          fetchError instanceof TypeError && fetchError.message.includes('Failed to fetch');
        const isTimeoutError =
          fetchError instanceof DOMException &&
          (fetchError.name === 'AbortError' || fetchError.name === 'TimeoutError');

        if (isNetworkError || isTimeoutError) {
          const errorType = isNetworkError ? 'Network error' : 'Timeout error';
          logger.warn(
            `${errorType} (${endpoint}): ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}`,
          );

          // Smart retry logic
          const canRetry =
            networkRetries > 0 &&
            (isIdempotentRequest(method) || config.maxNetworkRetries !== undefined);

          if (canRetry) {
            logger.info(`Retrying request, ${networkRetries} retries left...`);

            // Exponential backoff with jitter
            const baseDelay = Math.min(
              1000 * (DEFAULT_CONFIG.maxNetworkRetries - networkRetries + 1),
              5000,
            );
            const delay = baseDelay + Math.random() * 1000;

            await new Promise(resolve => setTimeout(resolve, delay));
            return apiRequest(endpoint, options, config, retryWithRefresh, networkRetries - 1);
          }

          const errorMessage = isNetworkError
            ? 'Network error: Unable to connect to server. Please check your internet connection and try again.'
            : 'Request timed out. The server took too long to respond.';

          return {
            success: false,
            error: errorMessage,
          };
        }

        logger.error('API request failed:', fetchError);
        return {
          success: false,
          error: fetchError instanceof Error ? fetchError.message : 'An unknown error occurred',
        };
      }
    });
  } catch (error: unknown) {
    logger.error('API request failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    };
  }
}

/**
 * Check if a request method is idempotent (safe to retry)
 */
const isIdempotentRequest = (method: string): boolean => {
  return ['GET', 'HEAD', 'OPTIONS', 'PUT', 'DELETE'].includes(method.toUpperCase());
};

/**
 * Enhanced API client with better performance and caching
 */
export const createApiClient = (config: Partial<ApiConfig> = {}) => {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };

  return {
    /**
     * GET request with optional caching
     */
    get: <T = unknown>(
      endpoint: string,
      customHeaders?: Record<string, string>,
      useCache = false,
    ): Promise<ApiResponse<T>> => {
      const cacheKey = `GET:${endpoint}`;

      // Simple in-memory cache for GET requests
      if (useCache && typeof window !== 'undefined') {
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) {
          try {
            const parsedCache = JSON.parse(cached);
            const isExpired = Date.now() - parsedCache.timestamp > 5 * 60 * 1000; // 5 minutes

            if (!isExpired) {
              return Promise.resolve(parsedCache.data);
            }
          } catch {
            sessionStorage.removeItem(cacheKey);
          }
        }
      }

      const request = apiRequest<T>(
        endpoint,
        {
          method: 'GET',
          headers: customHeaders,
        },
        mergedConfig,
      );

      // Cache successful responses
      if (useCache) {
        request.then(response => {
          if (response.success && typeof window !== 'undefined') {
            try {
              sessionStorage.setItem(
                cacheKey,
                JSON.stringify({
                  data: response,
                  timestamp: Date.now(),
                }),
              );
            } catch {
              // Storage quota exceeded, ignore
            }
          }
        });
      }

      return request;
    },

    /**
     * POST request with retry logic for network errors only
     */
    post: <T = unknown>(
      endpoint: string,
      data: unknown,
      retryOnNetworkError = false,
    ): Promise<ApiResponse<T>> =>
      apiRequest<T>(
        endpoint,
        {
          method: 'POST',
          body: JSON.stringify(data),
        },
        {
          ...mergedConfig,
          maxNetworkRetries: retryOnNetworkError ? mergedConfig.maxNetworkRetries : 0,
        },
      ),

    /**
     * PUT request (idempotent, safe to retry)
     */
    put: <T = unknown>(
      endpoint: string,
      data: unknown,
      retryOnNetworkError = true,
    ): Promise<ApiResponse<T>> =>
      apiRequest<T>(
        endpoint,
        {
          method: 'PUT',
          body: JSON.stringify(data),
        },
        {
          ...mergedConfig,
          maxNetworkRetries: retryOnNetworkError ? mergedConfig.maxNetworkRetries : 0,
        },
      ),

    /**
     * PATCH request
     */
    patch: <T = unknown>(
      endpoint: string,
      data: unknown,
      retryOnNetworkError = false,
    ): Promise<ApiResponse<T>> =>
      apiRequest<T>(
        endpoint,
        {
          method: 'PATCH',
          body: JSON.stringify(data),
        },
        {
          ...mergedConfig,
          maxNetworkRetries: retryOnNetworkError ? mergedConfig.maxNetworkRetries : 0,
        },
      ),

    /**
     * DELETE request (idempotent, safe to retry)
     */
    delete: <T = unknown>(endpoint: string): Promise<ApiResponse<T>> =>
      apiRequest<T>(endpoint, { method: 'DELETE' }, mergedConfig),

    /**
     * Check if there's a valid token (without making API call)
     */
    hasValidToken: (): boolean => {
      if (typeof window === 'undefined') return false;

      // Kiểm tra accessToken trong cookie thay vì localStorage
      const token = Cookies.get('accessToken');

      // Kiểm tra token-expires-at trong cookie nếu có
      const expiresAtStr = Cookies.get('token-expires-at');

      if (!token) return false;

      // Nếu có thời gian hết hạn, kiểm tra xem token có còn hợp lệ không
      if (expiresAtStr) {
        const expiresAt = new Date(expiresAtStr);
        return expiresAt > new Date();
      }

      // Nếu không có thông tin về thời gian hết hạn nhưng có token,
      // chúng ta giả định token còn hợp lệ (backend sẽ từ chối nếu không hợp lệ)
      return true;
    },

    /**
     * Health check with timeout
     */
    isReachable: async (): Promise<boolean> => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(`${mergedConfig.baseUrl}/health`, {
          method: 'GET',
          credentials: 'omit',
          headers: {
            'Cache-Control': 'no-cache',
            Pragma: 'no-cache',
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        return response.ok;
      } catch (error) {
        mergedConfig.logger.error('API connection check failed:', error);
        return false;
      }
    },

    /**
     * Clear all caches
     */
    clearCache: () => {
      if (typeof window !== 'undefined') {
        const keys = Object.keys(sessionStorage);
        keys.forEach(key => {
          if (key.startsWith('GET:')) {
            sessionStorage.removeItem(key);
          }
        });
      }
    },
  };
};

// Create default API client
export const api = createApiClient();

// Default export
export default api;