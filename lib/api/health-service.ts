// src/lib/api/health-service.ts
import { requestThrottler } from '../utils/request-throttler';

/**
 * Service for checking API health and connectivity with efficient caching
 * to prevent rate limiting issues
 */
export const healthService = {
  // Cache the last health check result
  _lastHealthCheck: {
    timestamp: 0,
    result: false
  },
  
  // Cache duration in milliseconds (5 seconds)
  _cacheDuration: 5000,

  /**
   * Check if the API server is accessible, with caching and request throttling
   * Avoids calling /auth/me unless there's a valid token
   * @returns Promise resolving to boolean indicating if server is reachable
   */
  async checkApiHealth(): Promise<boolean> {
    try {
      // Kiểm tra xem trình duyệt có báo cáo đang offline trước tiên
      if (!navigator.onLine) {
        return false;
      }
      
      // Kiểm tra xem chúng ta có kết quả cache gần đây không
      const now = Date.now();
      if (now - this._lastHealthCheck.timestamp < this._cacheDuration) {
        return this._lastHealthCheck.result;
      }
      
      // Kiểm tra xem chúng ta có token không - tránh kiểm tra không cần thiết
      const hasToken = !!localStorage.getItem('accessToken');
      
      // Nếu không có token, chúng ta không cần kiểm tra /auth/me
      if (!hasToken) {
        // Chỉ kiểm tra kết nối internet cơ bản nếu không có token
        const isConnected = await this.checkInternetConnectivity();
        
        // Cập nhật cache
        this._lastHealthCheck = {
          timestamp: now,
          result: isConnected
        };
        
        return isConnected;
      }
      
      // Sử dụng request throttling để ngăn yêu cầu quá mức
      const result = await requestThrottler.throttle('api-health-check', async () => {
        try {
          const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api';
          
          // GHI CHÚ: Chúng ta đang tránh /auth/me và sử dụng một endpoint công khai đơn giản hơn
          // Trước tiên thử một health endpoint chuyên dụng
          let endpoint = `${API_URL}/health`;
          
          // Đặt timeout để tránh treo
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 3000); // timeout ngắn hơn
          
          try {
            // Sử dụng một request HEAD đơn giản trước - nó nhẹ hơn GET
            const response = await fetch(endpoint, {
              method: 'HEAD',
              cache: 'no-store',
              signal: controller.signal,
              credentials: 'include',
              headers: {
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
              }
            });
            
            clearTimeout(timeoutId);
            
            if (response.ok) {
              // Cập nhật cache
              this._lastHealthCheck = {
                timestamp: now,
                result: true
              };
              return true;
            }
          } catch (headError) {
            clearTimeout(timeoutId);
            // Nếu HEAD thất bại, thử một request GET
          }
          
          // Như một fallback, thử một request GET đơn giản đến health endpoint
          const controller2 = new AbortController();
          const timeoutId2 = setTimeout(() => controller2.abort(), 3000);
          
          try {
            const response2 = await fetch(endpoint, {
              method: 'GET',
              cache: 'no-store',
              signal: controller2.signal,
              credentials: 'omit' as RequestCredentials,
              headers: {
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
              }
            });
            
            clearTimeout(timeoutId2);
            
            // Bất kỳ phản hồi nào có nghĩa là server đang hoạt động
            this._lastHealthCheck = {
              timestamp: now,
              result: true
            };
            return true;
          } catch (getError) {
            clearTimeout(timeoutId2);
            
            // Nếu chúng ta vẫn không thể truy cập health endpoint, thử URL cơ sở
            const controller3 = new AbortController();
            const timeoutId3 = setTimeout(() => controller3.abort(), 3000);
            
            try {
              // Chỉ ping URL API cơ sở
              const baseUrlResponse = await fetch(`${API_URL}`, {
                method: 'HEAD', // Sử dụng HEAD để chỉ kiểm tra xem server có hoạt động không
                cache: 'no-store',
                signal: controller3.signal,
                credentials: 'omit' as RequestCredentials,
                headers: {
                  'Cache-Control': 'no-cache',
                  'Pragma': 'no-cache'
                }
              });
              
              clearTimeout(timeoutId3);
              
              // Nếu chúng ta nhận được bất kỳ phản hồi nào, server đang hoạt động
              this._lastHealthCheck = {
                timestamp: now,
                result: true
              };
              return true;
            } catch (baseUrlError) {
              clearTimeout(timeoutId3);
              
              // Nếu tất cả các lần thử đều thất bại, server không hoạt động
              this._lastHealthCheck = {
                timestamp: now,
                result: false
              };
              return false;
            }
          }
        } catch (fetchError) {
          console.warn('Kiểm tra health API thất bại:', fetchError);
          
          // Cập nhật cache với kết quả thất bại
          this._lastHealthCheck = {
            timestamp: now,
            result: false
          };
          return false;
        }
      });
      
      // Nếu bị throttled, trả về kết quả cache
      return result !== null ? result : this._lastHealthCheck.result;
    } catch (error) {
      console.error('Lỗi trong kiểm tra health API:', error);
      return false;
    }
  },
  
  /**
   * Check network connectivity generally with efficient implementation
   * @returns Promise resolving to boolean indicating if internet is available
   */
  async checkInternetConnectivity(): Promise<boolean> {
    try {
      // Check if browser reports being offline
      if (!navigator.onLine) {
        return false;
      }
      
      // Use request throttling
      const result = await requestThrottler.throttle('internet-check', async () => {
        // Create a controller for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000); // shorter timeout
        
        try {
          // Use a cachebuster to avoid cached responses
          const cacheBuster = Date.now();
          
          // Attempt to fetch a resource that returns quickly
          const response = await fetch(`https://www.google.com/generate_204?_=${cacheBuster}`, {
            method: 'HEAD', // HEAD is lighter than GET
            cache: 'no-store',
            signal: controller.signal,
            credentials: 'omit' as RequestCredentials
          });
          
          clearTimeout(timeoutId);
          return response.status === 204;
        } catch (fetchError) {
          clearTimeout(timeoutId);
          
          // If Google is blocked, try a different source
          try {
            const controller2 = new AbortController();
            const timeoutId2 = setTimeout(() => controller2.abort(), 3000);
            
            const response = await fetch('https://www.cloudflare.com/cdn-cgi/trace', {
              method: 'HEAD',
              cache: 'no-store',
              signal: controller2.signal,
              credentials: 'omit' as RequestCredentials
            });
            
            clearTimeout(timeoutId2);
            return response.ok;
          } catch (secondFetchError) {
            // As a last resort, check our own API but only the health endpoint
            return await this.checkApiHealth();
          }
        }
      });
      
      // If throttled, assume we're online (browser already said we are)
      return result !== null ? result : navigator.onLine;
    } catch (error) {
      console.error('Error checking internet connectivity:', error);
      return navigator.onLine; // Fall back to browser API
    }
  },
  
  /**
   * Reset the health check cache, forcing a fresh check next time
   */
  resetCache(): void {
    this._lastHealthCheck = {
      timestamp: 0,
      result: false
    };
  },
  isReachable: async (): Promise<boolean> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`${API_BASE_URL}/health`, {
        method: 'GET',
        signal: controller.signal,
        credentials: 'include', // Changed from 'omit' to 'include'
        // Removed problematic cache-control headers
      });
      
      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      return false;
    }
  }
};