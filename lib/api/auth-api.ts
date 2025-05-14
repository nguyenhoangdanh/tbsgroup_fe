// Enhanced auth-api.ts with better error handling and retry mechanism
import { delay } from 'redux-saga/effects';
import type { ApiResponse, AuthResponse } from '../types/auth';

// Maximum number of retries for a request
const MAX_RETRIES = 3;

// Network error detection
const isNetworkError = (error: any): boolean => {
  return (error instanceof TypeError && error.message.includes('Failed to fetch')) ||
         (error instanceof DOMException && error.name === 'AbortError');
};

// Sửa hàm refreshTokenDirectly trong auth-api.ts

// Theo dõi thời gian của lần refresh cuối cùng
let lastRefreshAttempt = 0;
const MIN_REFRESH_INTERVAL = 10000; // 10 giây giữa các lần gọi

/**
 * Direct function to refresh the authentication token with improved throttling
 */
export async function refreshTokenDirectly(): Promise<ApiResponse<AuthResponse>> {
  // Kiểm tra tần suất gọi API refresh
  const now = Date.now();
  if (now - lastRefreshAttempt < MIN_REFRESH_INTERVAL) {
    console.log(`Token refresh throttled - last attempt was ${Math.floor((now - lastRefreshAttempt)/1000)}s ago`);
    return {
      success: false,
      error: 'Too many refresh attempts. Please try again later.'
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
      if (error instanceof Error && 
          (error.message.includes('429') || error.message.includes('Too Many Requests'))) {
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
async function refreshTokenAttempt(): Promise<ApiResponse<AuthResponse>> {
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
          'Pragma': 'no-cache',
        },
        credentials: 'include' as RequestCredentials,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      // Handle different response statuses
      if (response.status === 401) {
        console.warn('Refresh token expired or invalid');
        return {
          success: false,
          error: 'Your session has expired. Please log in again.'
        };
      }
      
      if (response.status === 403) {
        console.warn('Refresh token forbidden');
        return {
          success: false,
          error: 'Access denied. Please log in again.'
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
          error: 'Invalid response from server'
        };
      }
      
      // Validate response data shape
      if (!data.accessToken || !data.expiresAt) {
        console.error('Invalid token response format:', data);
        return {
          success: false,
          error: 'Invalid authentication response format'
        };
      }
      
      return {
        success: true,
        data
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
        error: 'Network connection error. Please check your internet connection.'
      };
    }
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during authentication'
    };
  }
}