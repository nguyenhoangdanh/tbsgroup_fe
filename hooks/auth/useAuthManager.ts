"use client"

import { useCallback } from 'react';
import { useAppSelector, useAppDispatch } from '@/hooks/redux';
import { authManager } from '@/services/auth/AuthManager';
import type { LoginCredentials, RequestResetParams, ResetPasswordParams } from '@/redux/types/auth';
import { useSmartSession } from './useSmartSession';

export const useAuthManager = () => {
  const authState = useAppSelector(state => state.auth);
  const dispatch = useAppDispatch();
  const smartSession = useSmartSession();
  
  // Remove automatic session initialization to prevent excessive calls
  // Session initialization should only happen from SagaProvider

  // Memoized action creators
  const login = useCallback((credentials: LoginCredentials) => {
    return authManager.login(credentials);
  }, []);

  const logout = useCallback((reason?: string) => {
    authManager.logout(reason);
  }, []);

  const refreshToken = useCallback(() => {
    console.warn('refreshToken() is deprecated - HTTP-only cookies handle refresh automatically');
    authManager.refreshToken();
  }, []);

  const requestPasswordReset = useCallback((params: RequestResetParams) => {
    authManager.requestPasswordReset(params);
  }, []);

  const resetPassword = useCallback((params: ResetPasswordParams) => {
    authManager.resetPassword(params);
  }, []);

  const clearResetPasswordData = useCallback(() => {
    authManager.clearResetPasswordData();
  }, []);

  const updateProfile = useCallback((userData: Parameters<typeof authManager.updateProfile>[0]) => {
    authManager.updateProfile(userData);
  }, []);

  // Manual session check using smart session
  const checkSession = useCallback(() => {
    smartSession.validateSession();
  }, [smartSession]);

  // Enhanced return object with smart session capabilities
  return {
    // Basic auth state
    ...authState,
    
    // Action methods
    login,
    logout,
    refreshToken,
    requestPasswordReset,
    resetPassword,
    clearResetPasswordData,
    updateProfile,
    checkSession,
    
    // Smart session capabilities
    forceRefresh: smartSession.forceRefresh,
    clearAuthErrors: smartSession.clearAuthErrors,
    
    // Enhanced status
    isInitializing: smartSession.isInitializing,
    isReady: smartSession.isReady,
    hasError: smartSession.hasError,
    isSessionExpired: smartSession.isSessionExpired,
    needsRefresh: smartSession.needsRefresh,
    sessionInfo: smartSession.sessionInfo,
    
    // Computed properties for convenience
    isLoggedIn: authState.isAuthenticated && !smartSession.isSessionExpired,
    canRefresh: authState.isAuthenticated && smartSession.needsRefresh,
    isCheckingSession: authState.status === 'checking',
    
    // Legacy compatibility
    authState: authState,
  };
};