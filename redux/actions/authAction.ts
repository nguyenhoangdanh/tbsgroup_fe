import { createAction } from '@reduxjs/toolkit';

import {
  loginRequest,
  logoutRequest,
  registerRequest,
  updateUserRequest,
  requestPasswordResetRequest,
  resetPasswordRequest,
  initializeSession,
  initializeApp,
} from '../slices/authSlice';
import type {
  LoginCredentials,
  RequestResetParams,
  ResetPasswordParams,
  User,
} from '../types/auth';

/**
 * Initialize auth state on application start - Use plain action
 */
export const initAuth = () => initializeApp();

/**
 * Login a user with email and password
 */
export const login = (credentials: LoginCredentials) => loginRequest(credentials);

/**
 * Register a new user
 */
export const register = (userData: any) => registerRequest(userData);

/**
 * Logout current user - Use plain action
 */
export const logout = (options?: { reason?: string; allDevices?: boolean; silent?: boolean }) =>
  logoutRequest(options);

/**
 * Update user information
 */
export const updateUser = (userData: Partial<User>) => updateUserRequest(userData);

/**
 * Request password reset with employee ID and card ID
 */
export const requestPasswordReset = (params: RequestResetParams) =>
  requestPasswordResetRequest(params);

/**
 * Reset password with token or username
 */
export const resetPassword = (params: ResetPasswordParams) => resetPasswordRequest(params);

/**
 * Send magic link for passwordless authentication
 */
export const sendMagicLink = (email: string) => ({
  type: 'SEND_MAGIC_LINK_REQUEST',
  payload: { email },
});

/**
 * Verify magic link token
 */
export const verifyMagicLink = (token: string) => ({
  type: 'VERIFY_MAGIC_LINK_REQUEST',
  payload: { token },
});

/**
 * Send password reset email
 */
export const forgotPassword = (email: string) => ({
  type: 'FORGOT_PASSWORD_REQUEST',
  payload: { email },
});

/**
 * Reset password with token
 * @param token Reset password token
 * @param password New password
 * @param securityData Additional security information
 */
export const resetPasswordOld = (token: string, password: string, securityData?: any) => ({
  type: 'RESET_PASSWORD_REQUEST',
  payload: {
    token,
    password,
    securityData: securityData || {
      timestamp: new Date().toISOString(),
      deviceInfo: {
        userAgent: navigator.userAgent,
        language: navigator.language,
        screenSize: `${window.screen.width}x${window.screen.height}`,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
    },
  },
});

/**
 * Resend verification code
 */
export const resendVerificationCode = (email: string) => ({
  type: 'RESEND_VERIFICATION_CODE_REQUEST',
  payload: { email },
});

// Login actions
export const loginAction = createAction<LoginCredentials>('auth/login');
export const loginSuccess = createAction<{ user: User; accessToken: string }>('auth/loginSuccess');
export const loginFailure = createAction<string>('auth/loginFailure');

// Logout actions
export const logoutAction = createAction<{ reason?: string; allDevices?: boolean; silent?: boolean } | undefined>('auth/logout');
export const logoutSuccess = createAction('auth/logoutSuccess');

// Registration actions
export const registerAction = createAction<any>('auth/register');
export const registerSuccess = createAction('auth/registerSuccess');
export const registerFailure = createAction<string>('auth/registerFailure');

// Token refresh actions
export const refreshTokenAction = createAction('auth/refreshToken');
export const refreshTokenSuccess = createAction<{ user: User; accessToken: string }>('auth/refreshTokenSuccess');
export const refreshTokenFailure = createAction<string>('auth/refreshTokenFailure');

// Password reset actions
export const requestPasswordResetAction = createAction<RequestResetParams>('auth/requestPasswordReset');
export const requestPasswordResetSuccess = createAction<any>('auth/requestPasswordResetSuccess');
export const requestPasswordResetFailure = createAction<string>('auth/requestPasswordResetFailure');

export const resetPasswordAction = createAction<ResetPasswordParams>('auth/resetPassword');
export const resetPasswordSuccess = createAction('auth/resetPasswordSuccess');
export const resetPasswordFailure = createAction<string>('auth/resetPasswordFailure');

// User update actions
export const updateUserAction = createAction<Partial<User>>('auth/updateUser');
export const updateUserSuccess = createAction<User>('auth/updateUserSuccess');
export const updateUserFailure = createAction<string>('auth/updateUserFailure');

// Auth initialization
export const initAuthAction = createAction('auth/init');
export const checkAuthenticationStatus = createAction('auth/checkStatus');

// Token refresh
export const refreshToken = createAction('auth/refreshToken');

// Clear actions - create new ones instead of importing conflicting ones
export const clearAuthErrors = createAction('auth/clearErrors');
export const clearResetPasswordData = createAction('auth/clearResetPasswordData');

// Legacy exports for backward compatibility
export const initializeAuth = initAuth;
