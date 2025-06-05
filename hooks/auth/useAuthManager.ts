"use client"
import { useEffect, useState, useCallback, useRef } from 'react';

import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import { loginSuccess } from '@/redux/slices/authSlice';
import type { AuthState, LoginCredentials, RequestResetParams, ResetPasswordParams } from '@/redux/types/auth';
import { authManager } from '@/services/auth/AuthManager';
import { authService } from '@/services/auth/auth.service';

export const useAuthManager = () => {
  const [state, setState] = useState<AuthState>(authManager.getState());
  const authState = useAppSelector(state => state.auth);
  const dispatch = useAppDispatch();
  // Sử dụng ref để theo dõi lần gọi API cuối cùng
  const lastSyncTime = useRef<number>(0);
  // Theo dõi trạng thái loading
  const [isCheckingSession, setIsCheckingSession] = useState<boolean>(false);

  // Đảm bảo đồng bộ hóa trạng thái xác thực giữa server và client một cách hiệu quả
  useEffect(() => {
    // Chỉ kiểm tra session nếu:
    // 1. Chưa xác thực trong Redux store hoặc
    // 2. Đã quá 5 phút kể từ lần kiểm tra trước
    const shouldCheckSession = () => {
      const now = Date.now();
      const timeSinceLastSync = now - lastSyncTime.current;
      const fiveMinutes = 5 * 60 * 1000;
      
      return (
        authState.status !== 'authenticated' || 
        timeSinceLastSync > fiveMinutes
      );
    };
    
    // Kiểm tra session server-side và cập nhật Redux store nếu cần
    const syncAuthStateWithSession = async () => {
      if (isCheckingSession || !shouldCheckSession()) return;
      
      try {
        setIsCheckingSession(true);
        
        // Gọi API /auth/session để kiểm tra trạng thái xác thực từ server
        const response = await fetch('/api/auth/session', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache', 
          },
          credentials: 'same-origin',
        });
        
        if (!response.ok) {
          console.error('Không thể lấy thông tin phiên làm việc');
          return;
        }
        
        const sessionData = await response.json();
        lastSyncTime.current = Date.now();
        
        // Nếu xác thực từ session nhưng Redux store chưa cập nhật
        if (sessionData.status === 'authenticated' && sessionData.user && authState.status !== 'authenticated') {
          console.log('Phiên làm việc đã xác thực, cập nhật Redux store');
          
          // Cập nhật Redux store
          dispatch(loginSuccess({
            user: sessionData.user,
            accessToken: 'cookie-managed', // Placeholder vì token thực sự nằm trong HTTP-only cookie
            expiresAt: sessionData.expiresAt || new Date(Date.now() + 3600 * 1000).toISOString(),
            requiredResetPassword: sessionData.user.status === 'PENDING_ACTIVATION',
          }));
        } 
        // Nếu chưa xác thực trên session nhưng Redux store vẫn còn dữ liệu xác thực
        else if (sessionData.status !== 'authenticated' && authState.status === 'authenticated') {
          console.log('Phiên làm việc không còn hợp lệ, cần dispatch AUTH_FORCE_CHECK');
          dispatch({ type: 'AUTH_FORCE_CHECK' });
        }
      } catch (error) {
        console.error('Lỗi khi đồng bộ trạng thái xác thực:', error);
      } finally {
        setIsCheckingSession(false);
      }
    };
    
    // Chạy kiểm tra sau khi component mount
    syncAuthStateWithSession();
    
    // Thiết lập interval để kiểm tra định kỳ với tỉ lệ thấp hơn (mỗi 15 phút)
    const intervalId = setInterval(() => {
      if (shouldCheckSession()) {
        syncAuthStateWithSession();
      }
    }, 15 * 60 * 1000); // Mỗi 15 phút
    
    return () => clearInterval(intervalId);
  }, [authState.status, dispatch, isCheckingSession]);

  // Xử lý khởi tạo trạng thái xác thực khi component mount
  useEffect(() => {
    // Subscribe to auth state changes từ AuthManager
    const unsubscribe = authManager.subscribe(setState);
    
    // Dispatch action khởi tạo xác thực chỉ khi chưa có trạng thái xác thực
    if (!authState.user) {
      dispatch({ type: 'AUTH_INIT' });
    }

    return unsubscribe;
  }, [dispatch, authState.user]);

  // Memoized action creators
  const login = useCallback((credentials: LoginCredentials) => {
    return authManager.login(credentials);
  }, []);

  const logout = useCallback((reason?: string) => {
    return authManager.logout(reason);
  }, []);

  const refreshToken = useCallback(() => {
    // Reset last sync time để đảm bảo kiểm tra session sau khi làm mới token
    lastSyncTime.current = 0;
    return authManager.refreshToken();
  }, []);

  const requestPasswordReset = useCallback((params: RequestResetParams) => {
    return authManager.requestPasswordReset(params);
  }, []);

  const resetPassword = useCallback((params: ResetPasswordParams) => {
    return authManager.resetPassword(params);
  }, []);

  const clearResetPasswordData = useCallback(() => {
    return authManager.clearResetPasswordData();
  }, []);

  const updateProfile = useCallback((userData: Parameters<typeof authManager.updateProfile>[0]) => {
    return authManager.updateProfile(userData);
  }, []);

  // Force kiểm tra session khi cần
  const checkSession = useCallback(async () => {
    if (isCheckingSession) return;
    
    setIsCheckingSession(true);
    try {
      const response = await fetch('/api/auth/session', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache', 
        },
        credentials: 'same-origin',
      });
      
      if (!response.ok) return false;
      
      const sessionData = await response.json();
      lastSyncTime.current = Date.now();
      
      if (sessionData.status === 'authenticated' && sessionData.user) {
        dispatch(loginSuccess({
          user: sessionData.user,
          accessToken: 'cookie-managed',
          expiresAt: sessionData.expiresAt || new Date(Date.now() + 3600 * 1000).toISOString(),
          requiredResetPassword: sessionData.user.status === 'PENDING_ACTIVATION',
        }));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error checking session:', error);
      return false;
    } finally {
      setIsCheckingSession(false);
    }
  }, [dispatch, isCheckingSession]);

  return {
    // Ưu tiên trạng thái từ Redux store vì nó là nguồn dữ liệu chính
    ...state,
    isAuthenticated: authState.status === 'authenticated',
    user: authState.user || state.user,
    accessToken: authState.accessToken || state.accessToken,
    status: authState.status || state.status,
    isCheckingSession,
    checkSession,
    login,
    logout,
    refreshToken,
    requestPasswordReset,
    resetPassword,
    clearResetPasswordData,
    updateProfile,
  };
};