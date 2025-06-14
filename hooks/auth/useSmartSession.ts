"use client"

import { useEffect, useCallback, useRef } from 'react';

import { useAppSelector, useAppDispatch } from '@/redux/hooks';
import { forceSessionCheck, clearErrors } from '@/redux/slices/authSlice';
import type { AuthState } from '@/redux/types/auth';
import { authSessionManager } from '@/services/auth/AuthSessionManager';

/**
 * Enhanced hook for intelligent session management
 * Provides session validation, refresh, and recovery capabilities
 */
export const useSmartSession = () => {
  const dispatch = useAppDispatch();
  const authState = useAppSelector(state => state.auth);
  const lastRefreshRef = useRef<number>(0);
  
  // Session validation with throttling
  const validateSession = useCallback(() => {
    const now = Date.now();
    const MIN_REFRESH_INTERVAL = 30000; // 30 seconds
    
    if (now - lastRefreshRef.current < MIN_REFRESH_INTERVAL) {
      console.log('🚫 Session validation throttled');
      return;
    }
    
    lastRefreshRef.current = now;
    console.log('🔄 Triggering session validation');
    dispatch(forceSessionCheck());
  }, [dispatch]);

  // Force session refresh (bypasses all throttling)
  const forceRefresh = useCallback(() => {
    console.log('💪 Force session refresh');
    lastRefreshRef.current = 0; // Reset throttling
    authSessionManager.forceSessionRefresh();
  }, []);

  // Clear authentication errors
  const clearAuthErrors = useCallback(() => {
    dispatch(clearErrors());
  }, [dispatch]);

  // Check if session is expired
  const isSessionExpired = useCallback(() => {
    if (!authState.expiresAt) return false;
    return new Date(authState.expiresAt).getTime() < Date.now();
  }, [authState.expiresAt]);

  // Check if session needs refresh (within 1 hour of expiry)
  const needsRefresh = useCallback(() => {
    if (!authState.expiresAt) return false;
    const expiryTime = new Date(authState.expiresAt).getTime();
    const oneHour = 60 * 60 * 1000;
    return (expiryTime - Date.now()) < oneHour;
  }, [authState.expiresAt]);

  // Auto-refresh session when nearing expiry
  useEffect(() => {
    if (authState.isAuthenticated && needsRefresh() && !authState.isLoading) {
      console.log('⏰ Session nearing expiry, auto-refreshing');
      validateSession();
    }
  }, [authState.isAuthenticated, authState.isLoading, needsRefresh, validateSession]);

  // Enhanced session info
  const sessionInfo = useCallback((): {
    isValid: boolean;
    isExpired: boolean;
    needsRefresh: boolean;
    timeToExpiry: number | null;
    lastCheck: number | null;
    status: AuthState['status'];
  } => {
    const timeToExpiry = authState.expiresAt 
      ? new Date(authState.expiresAt).getTime() - Date.now()
      : null;

    return {
      isValid: authState.isAuthenticated && !isSessionExpired(),
      isExpired: isSessionExpired(),
      needsRefresh: needsRefresh(),
      timeToExpiry,
      lastCheck: authState.lastSessionCheck,
      status: authState.status,
    };
  }, [authState, isSessionExpired, needsRefresh]);

  return {
    // Session state
    ...authState,
    
    // Session validation methods
    validateSession,
    forceRefresh,
    clearAuthErrors,
    
    // Session status helpers
    isSessionExpired: isSessionExpired(),
    needsRefresh: needsRefresh(),
    sessionInfo: sessionInfo(),
    
    // Enhanced status helpers
    isInitializing: authState.status === 'checking' && authState.isLoading,
    isReady: authState.sessionInitialized && authState.isHydrated,
    hasError: Boolean(authState.error),
    
    // Session manager info (for debugging)
    sessionManagerInfo: authSessionManager.getSessionInfo(),
  };
};

/**
 * Hook for session monitoring and debugging
 * Useful for development and troubleshooting
 */
export const useSessionMonitor = () => {
  const authState = useAppSelector(state => state.auth);
  
  const getSessionDiagnostics = useCallback(() => {
    const now = Date.now();
    const sessionManager = authSessionManager.getSessionInfo();
    
    return {
      timestamp: new Date().toISOString(),
      authState: {
        hasUser: Boolean(authState.user),
        isAuthenticated: authState.isAuthenticated,
        status: authState.status,
        isLoading: authState.isLoading,
        isHydrated: authState.isHydrated,
        sessionInitialized: authState.sessionInitialized,
        lastSessionCheck: authState.lastSessionCheck,
        timeSinceLastCheck: authState.lastSessionCheck 
          ? now - authState.lastSessionCheck 
          : null,
        expiresAt: authState.expiresAt,
        timeToExpiry: authState.expiresAt 
          ? new Date(authState.expiresAt).getTime() - now 
          : null,
      },
      sessionManager,
      browserInfo: typeof window !== 'undefined' ? {
        online: navigator.onLine,
        visibilityState: document.visibilityState,
        cookiesEnabled: navigator.cookieEnabled,
      } : null,
    };
  }, [authState]);

  const logSessionDiagnostics = useCallback(() => {
    const diagnostics = getSessionDiagnostics();
    console.log('📊 Session Diagnostics:', diagnostics);
    return diagnostics;
  }, [getSessionDiagnostics]);

  return {
    getSessionDiagnostics,
    logSessionDiagnostics,
  };
};
