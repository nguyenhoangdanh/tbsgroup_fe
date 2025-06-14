import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { HYDRATE } from 'next-redux-wrapper';

import type { 
  AuthState, 
  RequestResetParams, 
  ResetPasswordParams, 
  User, 
  LoginCredentials, 
  RegisterCredentials, 
  VerifyRegistration 
} from '../types/auth';

// Initial state with proper typing
const initialState: AuthState = {
  user: null,
  accessToken: null,
  expiresAt: null,
  status: 'checking',
  error: null,
  isAuthenticated: false,
  isLoading: false,
  lastSessionCheck: null,
  resetPasswordData: null,
  isHydrated: false,
  sessionInitialized: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Clear all auth data
    clearAuthData: (state) => {
      Object.assign(state, initialState);
    },

    // Set hydrated status
    setHydrated: (state, action: PayloadAction<boolean>) => {
      state.isHydrated = action.payload;
    },

    // Handle Redux Persist rehydration
    rehydrateAuth: (state, action: PayloadAction<Partial<AuthState>>) => {
      const persistedState = action.payload;
      if (persistedState) {
        // Safely merge persisted state
        Object.keys(persistedState).forEach(key => {
          if (key in state && persistedState[key as keyof AuthState] !== undefined) {
            (state as any)[key] = (persistedState as any)[key];
          }
        });
        
        // Reset sensitive fields
        state.accessToken = null;
        state.error = null;
        state.isLoading = false;
        state.lastSessionCheck = null;
        state.isHydrated = true;
        
        console.log('🔄 Auth state rehydrated successfully');
      }
    },

    // App initialization
    initializeApp: (state) => {
      state.status = 'loading';
      state.error = null;
    },

    // Authentication status
    setAuthenticationStatus: (state, action: PayloadAction<AuthState['status']>) => {
      state.status = action.payload;
      state.isAuthenticated = action.payload === 'authenticated';
      state.isLoading = ['loading', 'refreshing_token'].includes(action.payload);
    },

    // Session management
    forceSessionCheck: (state) => {
      console.log('🔄 Force session check triggered');
      state.status = 'checking';
      state.isLoading = true;
      state.error = null;
      state.lastSessionCheck = Date.now();
    },

    initializeSession: (state) => {
      const now = Date.now();
      const MIN_SESSION_CHECK_INTERVAL = 10000;
      
      if (state.sessionInitialized && state.lastSessionCheck && 
          (now - state.lastSessionCheck) < MIN_SESSION_CHECK_INTERVAL) {
        console.log('🚫 Session check blocked - too recent');
        return;
      }
      
      state.status = 'checking';
      state.error = null;
      state.lastSessionCheck = now;
    },

    // Session state setters
    setSessionAuthenticated: (
      state,
      action: PayloadAction<{ user: User; expiresAt?: string }>
    ) => {
      const { user, expiresAt } = action.payload;
      
      state.user = user;
      state.accessToken = 'cookie-managed';
      state.expiresAt = expiresAt ? new Date(expiresAt) : new Date(Date.now() + 7 * 24 * 3600 * 1000);
      state.status = user.status === 'PENDING_ACTIVATION' ? 'needs_password_reset' : 'authenticated';
      state.isAuthenticated = true;
      state.error = null;
      state.isLoading = false;
      state.sessionInitialized = true;
    },

    setSessionUnauthenticated: (state, action: PayloadAction<string | undefined>) => {
      state.user = null;
      state.accessToken = null;
      state.expiresAt = null;
      state.status = 'unauthenticated';
      state.isAuthenticated = false;
      state.error = action.payload || null;
      state.isLoading = false;
      state.sessionInitialized = true;
    },

    setSessionError: (state, action: PayloadAction<string>) => {
      state.status = 'unauthenticated';
      state.isAuthenticated = false;
      state.error = action.payload;
      state.lastSessionCheck = Date.now();
    },
    
    // Simplified loading states
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },

    // Login actions
    loginRequest: (state, action: PayloadAction<LoginCredentials>) => {
      state.status = 'loading';
      state.isLoading = true;
      state.error = null;
    },

    loginSuccess: (state, action: PayloadAction<{ user: User; accessToken: string }>) => {
      state.status = 'authenticated';
      state.isAuthenticated = true;
      state.isLoading = false;
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.error = null;
      state.lastSessionCheck = Date.now();
    },

    loginFailure: (state, action: PayloadAction<string>) => {
      state.status = 'unauthenticated';
      state.isLoading = false;
      state.error = action.payload;
    },

    // Logout actions
    logoutRequest: (
      state,
      action: PayloadAction<{ reason?: string; allDevices?: boolean; silent?: boolean } | undefined>,
    ) => {
      state.isLoading = true;
    },

    logoutSuccess: (state) => {
      state.user = null;
      state.accessToken = null;
      state.expiresAt = null;
      state.status = 'unauthenticated';
      state.isAuthenticated = false;
      state.error = null;
      state.isLoading = false;
    },

    // Authentication check actions
    checkAuthenticationSuccess: (state, action: PayloadAction<User>) => {
      state.status = 'authenticated';
      state.isAuthenticated = true;
      state.user = action.payload;
      state.accessToken = 'cookie-managed';
      state.error = null;
      state.lastSessionCheck = Date.now();
      state.sessionInitialized = true;
    },

    checkAuthenticationFailure: (state, action: PayloadAction<string>) => {
      state.status = 'unauthenticated';
      state.isAuthenticated = false;
      state.user = null;
      state.accessToken = null;
      state.error = action.payload;
      state.sessionInitialized = true;
    },

    // Token refresh actions
    refreshTokenSuccess: (state, action: PayloadAction<{ user: User; accessToken: string }>) => {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.lastSessionCheck = Date.now();
      state.error = null;
    },

    refreshTokenFailure: (state, action: PayloadAction<string>) => {
      state.status = 'unauthenticated';
      state.isAuthenticated = false;
      state.user = null;
      state.accessToken = null;
      state.error = action.payload;
    },

    // Register actions
    registerRequest: (state, action: PayloadAction<RegisterCredentials>) => {
      state.status = 'loading';
      state.isLoading = true;
      state.error = null;
    },

    registerSuccess: (state) => {
      state.status = 'registration_success';
      state.isLoading = false;
      state.error = null;
    },

    registerFailure: (state, action: PayloadAction<string>) => {
      state.status = 'unauthenticated';
      state.isLoading = false;
      state.error = action.payload;
    },

    // Verify account actions
    verifyAccountRequest: (state, action: PayloadAction<VerifyRegistration>) => {
      state.isLoading = true;
      state.error = null;
    },

    verifyAccountSuccess: (state) => {
      state.isLoading = false;
      state.error = null;
    },

    verifyAccountFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
    },

    // Reset password actions
    resetPasswordRequest: (state, action: PayloadAction<ResetPasswordParams>) => {
      state.isLoading = true;
      state.error = null;
    },

    resetPasswordSuccess: (state) => {
      state.status = 'password_reset_success';
      state.isLoading = false;
      state.error = null;
      state.resetPasswordData = null;
    },

    resetPasswordFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
    },

    // Request password reset actions
    requestPasswordResetRequest: (state, action: PayloadAction<RequestResetParams>) => {
      state.isLoading = true;
      state.error = null;
    },

    requestPasswordResetSuccess: (state, action: PayloadAction<{ resetToken: string; username: string; message: string }>) => {
      state.isLoading = false;
      state.error = null;
      state.resetPasswordData = action.payload;
    },

    requestPasswordResetFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
    },

    // Update user actions
    updateUserRequest: (state, action: PayloadAction<Partial<User>>) => {
      state.isLoading = true;
      state.error = null;
    },

    updateUserSuccess: (state, action: PayloadAction<User>) => {
      state.isLoading = false;
      state.user = action.payload;
      state.error = null;
    },

    updateUserFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
    },

    // Clear errors
    clearErrors: (state) => {
      state.error = null;
    },

    // Clear reset password data
    clearResetPasswordData: (state) => {
      state.resetPasswordData = null;
    },

    // Handle session expiry
    sessionExpired: (state) => {
      state.status = 'session_expired';
      state.user = null;
      state.accessToken = null;
      state.expiresAt = null;
      state.isAuthenticated = false;
    },
  },
  extraReducers: (builder) => {
    // Handle Next.js hydration
    builder.addMatcher(
      (action) => action.type === HYDRATE,
      (state, action: any) => {
        if (action.payload?.auth) {
          const serverAuth = action.payload.auth;
          if (serverAuth.user && !state.user) {
            return { 
              ...state, 
              ...serverAuth, 
              isHydrated: true 
            };
          }
        }
        return state;
      }
    );
  },
});

export const {
  clearAuthData,
  setHydrated,
  rehydrateAuth,
  initializeApp,
  setAuthenticationStatus,
  forceSessionCheck,
  initializeSession,
  setSessionAuthenticated,
  setSessionUnauthenticated,
  setSessionError,
  setLoading,
  loginRequest,
  loginSuccess,
  loginFailure,
  logoutRequest,
  logoutSuccess,
  checkAuthenticationSuccess,
  checkAuthenticationFailure,
  refreshTokenSuccess,
  refreshTokenFailure,
  registerRequest,
  registerSuccess,
  registerFailure,
  verifyAccountRequest,
  verifyAccountSuccess,
  verifyAccountFailure,
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
  clearResetPasswordData,
  sessionExpired,
} = authSlice.actions;

export default authSlice.reducer;