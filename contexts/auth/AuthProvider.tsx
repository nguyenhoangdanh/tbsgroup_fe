'use client';
import { usePathname, useRouter } from 'next/navigation';
import React, { createContext, useContext, useEffect, useCallback, useMemo } from 'react';

import { SecurityProvider, useSecurityContext } from '../security/SecurityContext';

import { toast } from 'react-toast-kit';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import {
  login,
  logout,
  refreshToken,
  initAuth,
  resetPassword,
  requestPasswordReset,
  updateUser,
} from '@/redux/actions/authAction';
import { clearErrors } from '@/redux/slices/authSlice';
import {
  User,
  LoginCredentials,
  RequestResetParams,
  ResetPasswordParams,
} from '@/redux/types/auth';
import { SecurityService } from '@/services/common/security.service';

type AuthError = {
  message: string;
  code?: string;
};

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

  // Security context for session timeout tracking
  const { lastActivity, securityLevel, recordActivity } = useSecurityContext();

  // Initialize auth state when the app loads
  useEffect(() => {
    dispatch(initAuth());
  }, [dispatch]);

  // Callback handlers for auth actions
  const handleLogin = useCallback(
    (credentials: LoginCredentials, opts?: { message?: string }) => {
      dispatch(login(credentials));
      // Note: Success/error messages are handled by saga
    },
    [dispatch],
  );

  const handleLogout = useCallback(
    (options?: { reason?: string; allDevices?: boolean; silent?: boolean }) => {
      dispatch(logout(options));
    },
    [dispatch],
  );

  const handleResetPassword = useCallback(
    (params: ResetPasswordParams) => {
      dispatch(
        resetPassword(params.resetToken || '', params.password, {
          timestamp: new Date().toISOString(),
          confirmPassword: params.confirmPassword,
        }),
      );
    },
    [dispatch],
  );

  const handleRequestPasswordReset = useCallback(
    (params: RequestResetParams) => {
      dispatch(requestPasswordReset(params));
    },
    [dispatch],
  );

  const handleUpdateProfile = useCallback(
    (userData: Partial<User>) => {
      dispatch(updateUser(userData));
    },
    [dispatch],
  );

  const handleClearErrors = useCallback(() => {
    dispatch(clearErrors());
  }, [dispatch]);

  const handleRefreshToken = useCallback(() => {
    dispatch(refreshToken());
  }, [dispatch]);

  // Session timeout monitoring
  useEffect(() => {
    if (!auth.user) return;

    const checkSessionTimeout = setInterval(() => {
      if (SecurityService.checkSessionTimeout(lastActivity, securityLevel)) {
        handleLogout({
          reason: 'session_timeout',
          silent: false,
        });
        toast({
          title: 'Phiên đã hết hạn',
          description: 'Vui lòng đăng nhập lại để tiếp tục',
          variant: 'error',
          duration: 4000,
        });
      }
    }, 60000); // Kiểm tra mỗi phút

    return () => clearInterval(checkSessionTimeout);
  }, [lastActivity, securityLevel, auth.user, handleLogout]);

  // Record user activity to prevent unnecessary session timeout
  useEffect(() => {
    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];

    const handleUserActivity = () => {
      recordActivity();
    };

    events.forEach(event => {
      window.addEventListener(event, handleUserActivity);
    });

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleUserActivity);
      });
    };
  }, [recordActivity]);

  // Handle authentication state-based routing
  useEffect(() => {
    // Public routes that don't require authentication
    const publicRoutes = ['/login', '/reset-password', '/forgot-password', '/'];

    if (auth.status === 'needs_password_reset' && pathname !== '/reset-password') {
      router.replace('/reset-password');
    } else if (
      auth.status !== 'authenticated' &&
      auth.status !== 'loading' &&
      !publicRoutes.includes(pathname)
    ) {
      // Add a small delay to prevent flickering during navigation
      const timer = setTimeout(() => {
        router.replace('/login');
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [auth.status, router, pathname]);

  // Show toast messages for auth states
  useEffect(() => {
    if (auth.error) {
      toast({
        title: 'Lỗi',
        description: auth.error,
        variant: 'error',
        duration: 4000,
      });
    }

    // Display success messages
    if (auth.status === 'password_reset_success') {
      toast({
        title: 'Thành công',
        description: 'Mật khẩu đã được đặt lại thành công',
        duration: 4000,
      });
    } else if (auth.status === 'registration_success') {
      toast({
        title: 'Đăng ký thành công',
        description: 'Tài khoản của bạn đã được tạo',
        duration: 4000,
      });
    }
  }, [auth.error, auth.status]);

  // Memoize the auth context value to avoid unnecessary re-renders
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
