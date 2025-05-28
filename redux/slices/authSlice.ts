import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import type { AuthState, User } from '../types/auth';

const initialState: AuthState = {
  user: null,
  accessToken: null,
  expiresAt: null,
  status: null,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Login actions
    loginRequest: (state, action: PayloadAction<{ username: string; password: string }>) => {
      state.status = 'loading';
      state.error = null;
    },
    loginSuccess: (
      state,
      action: PayloadAction<{
        user: User;
        accessToken: string;
        expiresAt: string;
        requiredResetPassword: boolean;
      }>,
    ) => {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.expiresAt = action.payload.expiresAt;
      state.status = action.payload.requiredResetPassword
        ? 'needs_password_reset'
        : 'authenticated';
      state.error = null;
    },
    loginFailure: (state, action: PayloadAction<string>) => {
      state.status = 'unauthenticated';
      state.error = action.payload;
    },

    // Logout actions
    logoutRequest: (
      state,
      action?: PayloadAction<{ reason?: string; allDevices?: boolean; silent?: boolean }>,
    ) => {
      state.status = 'loading';
    },
    logoutSuccess: state => {
      state.user = null;
      state.accessToken = null;
      state.expiresAt = null;
      state.status = 'unauthenticated';
      state.error = null;
    },

    // Register actions
    registerRequest: (state, action: PayloadAction<any>) => {
      state.status = 'loading';
      state.error = null;
    },
    registerSuccess: state => {
      state.status = 'registration_success';
      state.error = null;
    },
    registerFailure: (state, action: PayloadAction<string>) => {
      state.status = 'unauthenticated';
      state.error = action.payload;
    },

    // Verify account actions
    verifyAccountRequest: (state, action: PayloadAction<{ email: string; code: string }>) => {
      state.status = 'loading';
    },
    verifyAccountSuccess: (
      state,
      action: PayloadAction<{
        user: User;
        accessToken: string;
        expiresAt: string;
      }>,
    ) => {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.expiresAt = action.payload.expiresAt;
      state.status = 'authenticated';
      state.error = null;
    },
    verifyAccountFailure: (state, action: PayloadAction<string>) => {
      state.status = 'unauthenticated';
      state.error = action.payload;
    },

    // Token refresh actions
    refreshTokenRequest: state => {
      // Optionally set a loading state just for token refresh
      state.status = state.status === 'authenticated' ? 'refreshing_token' : state.status;
    },
    refreshTokenSuccess: (
      state,
      action: PayloadAction<{
        accessToken: string;
        expiresAt: string;
      }>,
    ) => {
      state.accessToken = action.payload.accessToken;
      state.expiresAt = action.payload.expiresAt;
      state.status = state.status === 'refreshing_token' ? 'authenticated' : state.status;
      state.error = null;
    },
    refreshTokenFailure: state => {
      // Only change status if we were refreshing, otherwise keep current status
      state.status = state.status === 'refreshing_token' ? 'refresh_needed' : state.status;
    },

    // User update actions
    updateUserRequest: (state, action: PayloadAction<Partial<User>>) => {
      state.status = 'updating_profile';
    },
    updateUserSuccess: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.status = 'authenticated';
    },
    updateUserFailure: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.status = 'authenticated'; // Keep authenticated even if update fails
    },

    // Password reset actions
    requestPasswordResetRequest: (
      state,
      action: PayloadAction<{ employeeId: string; cardId: string }>,
    ) => {
      state.status = 'requesting_reset';
    },
    requestPasswordResetSuccess: (
      state,
      action: PayloadAction<{
        resetToken: string;
        expiryDate: string;
        username: string;
      }>,
    ) => {
      state.status = 'reset_requested';
    },
    requestPasswordResetFailure: (state, action: PayloadAction<string>) => {
      state.status = 'reset_request_failed';
      state.error = action.payload;
    },
    resetPasswordRequest: (
      state,
      action: PayloadAction<{
        resetToken?: string;
        username?: string;
        password: string;
        confirmPassword: string;
      }>,
    ) => {
      state.status = 'resetting_password';
    },
    resetPasswordSuccess: state => {
      state.status = 'password_reset_success';
    },
    resetPasswordFailure: (state, action: PayloadAction<string>) => {
      state.status = 'password_reset_failed';
      state.error = action.payload;
    },

    // Clear errors
    clearErrors: state => {
      state.error = null;
    },

    // Handle session expiry
    sessionExpired: state => {
      state.status = 'session_expired';
    },
  },
});

export const {
  loginRequest,
  loginSuccess,
  loginFailure,
  logoutRequest,
  logoutSuccess,
  registerRequest,
  registerSuccess,
  registerFailure,
  verifyAccountRequest,
  verifyAccountSuccess,
  verifyAccountFailure,
  refreshTokenRequest,
  refreshTokenSuccess,
  refreshTokenFailure,
  updateUserRequest,
  updateUserSuccess,
  updateUserFailure,
  requestPasswordResetRequest,
  requestPasswordResetSuccess,
  requestPasswordResetFailure,
  resetPasswordRequest,
  resetPasswordSuccess,
  resetPasswordFailure,
  clearErrors,
  sessionExpired,
} = authSlice.actions;

export default authSlice.reducer;
