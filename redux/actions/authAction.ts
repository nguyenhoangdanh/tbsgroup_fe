import {
  loginRequest,
  logoutRequest,
  registerRequest,
  verifyAccountRequest,
  refreshTokenRequest,
  updateUserRequest,
  requestPasswordResetRequest,
  resetPasswordRequest,
} from '../slices/authSlice';
import { AppDispatch } from '../store';
import type {
  LoginCredentials,
  RegisterCredentials,
  VerifyRegistration,
  User,
  RequestResetParams,
  ResetPasswordParams,
} from '../types/auth';

/**
 * Initialize auth state on application start
 */
export const initAuth = () => {
  return async (dispatch: AppDispatch, getState: any) => {
    try {
      // Kiểm tra xem đã có token chưa trước khi gọi API
      const authState = getState().auth;

      // Bỏ qua kiểm tra nếu không có token
      if (!authState.accessToken) {
        console.log('Không có token, bỏ qua khởi tạo auth');
        dispatch({
          type: 'AUTH_STATUS_CHANGED',
          payload: { status: 'unauthenticated' },
        });
        return;
      }

      // Nếu có token, tiếp tục với quá trình khởi tạo
      dispatch({ type: 'AUTH_INIT' });
    } catch (error) {
      console.error('Lỗi khởi tạo auth:', error);

      // Xử lý lỗi phù hợp
      dispatch({
        type: 'AUTH_ERROR',
        payload: {
          error: error instanceof Error ? error.message : 'Lỗi không xác định',
          status: 'error',
        },
      });
    }
  };
};

/**
 * Login a user with email and password
 */
export const login = (credentials: LoginCredentials) => (dispatch: AppDispatch) => {
  dispatch(loginRequest(credentials));
};

/**
 * Register a new user
 */
export const register = (userData: RegisterCredentials) => (dispatch: AppDispatch) => {
  dispatch(registerRequest(userData));
};

/**
 * Verify user account with verification code
 */
export const verifyAccount = (verificationData: VerifyRegistration) => (dispatch: AppDispatch) => {
  dispatch(verifyAccountRequest(verificationData));
};

/**
 * Logout current user
 * @param options Logout options: reason and whether to log out from all devices
 */
export const logout =
  (options?: { reason?: string; allDevices?: boolean; silent?: boolean }) =>
  (dispatch: AppDispatch) => {
    dispatch(logoutRequest(options));
  };

/**
 * Force refresh the auth token
 */
export const refreshToken = () => (dispatch: AppDispatch) => {
  dispatch(refreshTokenRequest());
};

/**
 * Update user information
 */
export const updateUser = (userData: Partial<User>) => (dispatch: AppDispatch) => {
  dispatch(updateUserRequest(userData));
};

/**
 * Request password reset with employee ID and card ID
 */
export const requestPasswordReset = (params: RequestResetParams) => (dispatch: AppDispatch) => {
  dispatch(requestPasswordResetRequest(params));
};

/**
 * Reset password with token or username
 */
export const resetPassword = (params: ResetPasswordParams) => (dispatch: AppDispatch) => {
  dispatch(resetPasswordRequest(params));
};

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
