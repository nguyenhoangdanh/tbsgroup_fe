// useAuthManager.ts - Updated version

import { useEffect, useState, useCallback } from 'react';

import type { LoginCredentials, RequestResetParams, ResetPasswordParams } from '@/redux/types/auth';
import { authManager, AuthState } from '@/services/auth/AuthManager';

export const useAuthManager = () => {
  const [state, setState] = useState<AuthState>(authManager.getState());

  useEffect(() => {
    // Subscribe to auth state changes
    const unsubscribe = authManager.subscribe(setState);

    // Initialize auth on mount
    authManager.initialize();

    return unsubscribe;
  }, []);

  // Memoized action creators
  const login = useCallback((credentials: LoginCredentials) => {
    return authManager.login(credentials);
  }, []);

  const logout = useCallback((reason?: string) => {
    return authManager.logout(reason);
  }, []);

  const refreshToken = useCallback(() => {
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

  return {
    ...state,
    login,
    logout,
    refreshToken,
    requestPasswordReset,
    resetPassword,
    clearResetPasswordData,
    updateProfile,
  };
};