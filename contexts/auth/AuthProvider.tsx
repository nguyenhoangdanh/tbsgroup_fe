'use client';
import { usePathname, useRouter } from 'next/navigation';
import React, { createContext, useContext, useEffect, useCallback, useMemo } from 'react';

import { SecurityProvider, useSecurityContext } from '../security/SecurityContext';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import {
  loginRequest,
  logoutRequest,
  refreshTokenSuccess,
  resetPasswordRequest,
  requestPasswordResetRequest,
  updateUserRequest,
  initializeApp,
  clearErrors,
} from '@/redux/slices/authSlice';
import {
  User,
  LoginCredentials,
  RequestResetParams,
  ResetPasswordParams,
} from '@/redux/types/auth';
import stableToast from '@/utils/stableToast';
import { PUBLICROUTES } from '@/config/constants';

type AuthContextType = {
  user: User | null;
  error: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  needsPasswordReset: boolean;
  login: (credentials: LoginCredentials, opts?: { message?: string }) => void;
  logout: (options?: { reason?: string; allDevices?: boolean; silent?: boolean }) => void;
  resetPassword: (params: ResetPasswordParams) => void;
  requestPasswordReset: (params: RequestResetParams) => void;
  updateProfile: (userData: Partial<User>) => void;
  clearAuthErrors: () => void;
  refreshAuthToken: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const auth = useAppSelector(state => state.auth);

  const { lastActivity, securityLevel, recordActivity } = useSecurityContext();

  // Initialize auth state only once
  useEffect(() => {
    if (!auth.sessionInitialized) {
      dispatch(initializeApp());
    }
  }, [dispatch, auth.sessionInitialized]);

  // Memoized callback handlers to prevent re-renders
  const handleLogin = useCallback(
    (credentials: LoginCredentials, opts?: { message?: string }) => {
      dispatch(loginRequest(credentials));
    },
    [dispatch],
  );

  const handleLogout = useCallback(
    (options?: { reason?: string; allDevices?: boolean; silent?: boolean }) => {
      dispatch(logoutRequest(options));
    },
    [dispatch],
  );

  const handleResetPassword = useCallback(
    (params: ResetPasswordParams) => {
      dispatch(resetPasswordRequest(params));
    },
    [dispatch],
  );

  const handleRequestPasswordReset = useCallback(
    (params: RequestResetParams) => {
      dispatch(requestPasswordResetRequest(params));
    },
    [dispatch],
  );

  const handleUpdateProfile = useCallback(
    (userData: Partial<User>) => {
      dispatch(updateUserRequest(userData));
    },
    [dispatch],
  );

  const handleClearErrors = useCallback(() => {
    dispatch(clearErrors());
  }, [dispatch]);

  const handleRefreshToken = useCallback(() => {
    // For httpOnly cookies, we don't manually refresh - just trigger a session check
    dispatch(refreshTokenSuccess({
      user: auth.user!,
      accessToken: 'cookie-managed',
    }));
  }, [dispatch, auth.user]);

  // Optimized session timeout monitoring
  useEffect(() => {
    if (!auth.user || auth.status !== 'authenticated') return;

    const timeoutThreshold = securityLevel === 'high' 
      ? 15 * 60 * 1000 
      : 30 * 60 * 1000;
        
    const checkSessionTimeout = () => {
      const now = Date.now();
      const inactiveTime = now - lastActivity;
      
      if (inactiveTime > timeoutThreshold) {
        handleLogout({
          reason: 'session_timeout',
          silent: false,
        });
        stableToast.error('Phiên đã hết hạn. Vui lòng đăng nhập lại để tiếp tục')
      }
    };

    const interval = setInterval(checkSessionTimeout, 60000);
    return () => clearInterval(interval);
  }, [lastActivity, securityLevel, auth.user, auth.status, handleLogout]);

  // Optimized user activity tracking
  useEffect(() => {
    if (!auth.user) return;

    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    let activityTimeout: NodeJS.Timeout | null = null;

    const handleUserActivity = () => {
      if (activityTimeout) {
        clearTimeout(activityTimeout);
      }

      activityTimeout = setTimeout(() => {
        recordActivity();
      }, 300);
    };

    events.forEach(event => {
      window.addEventListener(event, handleUserActivity, { passive: true });
    });

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleUserActivity);
      });
      if (activityTimeout) {
        clearTimeout(activityTimeout);
      }
    };
  }, [recordActivity, auth.user]);

  // Optimized routing logic
  useEffect(() => {
    if (auth.status === 'loading' || auth.status === 'refreshing_token') {
      return;
    }

    if (auth.status === 'needs_password_reset' && pathname !== '/reset-password') {
      router.replace('/reset-password');
      return;
    }

    if (auth.status === 'authenticated' && pathname === '/login') {
      router.replace('/admin/users/all');
    }
  }, [auth.status, router, pathname]);

  // Optimized toast messages
  useEffect(() => {
    if (auth.error && !PUBLICROUTES.includes(pathname)) {
      stableToast.error(auth.error);
    }

    if (auth.status === 'password_reset_success') {
      stableToast.success('Mật khẩu đã được đặt lại thành công');
    } else if (auth.status === 'registration_success') {
      stableToast.success('Đăng ký thành công');
    }
  }, [auth.error, auth.status]);

  // Heavily memoized context value
  const authContextValue = useMemo(
    () => ({
      user: auth.user,
      error: auth.error,
      isLoading: auth.status === 'loading' || auth.status === 'refreshing_token',
      isAuthenticated: auth.status === 'authenticated',
      needsPasswordReset: auth.status === 'needs_password_reset',
      login: handleLogin,
      logout: handleLogout,
      resetPassword: handleResetPassword,
      requestPasswordReset: handleRequestPasswordReset,
      updateProfile: handleUpdateProfile,
      clearAuthErrors: handleClearErrors,
      refreshAuthToken: handleRefreshToken,
    }),
    [
      auth.user,
      auth.error,
      auth.status,
      handleLogin,
      handleLogout,
      handleResetPassword,
      handleRequestPasswordReset,
      handleUpdateProfile,
      handleClearErrors,
      handleRefreshToken,
    ],
  );

  return <AuthContext.Provider value={authContextValue}>{children}</AuthContext.Provider>;
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within a AuthProvider');
  }
  return context;
};

// Combined provider for easy usage
export const AuthSecurityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <SecurityProvider>
      <AuthProvider>{children}</AuthProvider>
    </SecurityProvider>
  );
};
