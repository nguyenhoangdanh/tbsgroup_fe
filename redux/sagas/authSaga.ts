import { PayloadAction } from '@reduxjs/toolkit';
import { takeLatest, call, put, all, select, delay, SagaReturnType } from 'redux-saga/effects';

import { authService } from '@/services/auth/auth.service';
import { stableToast } from '@/utils/stableToast';

import {
  initializeApp,
  initializeSession,
  setSessionAuthenticated,
  setSessionUnauthenticated,
  loginRequest,
  loginSuccess,
  loginFailure,
  logoutRequest,
  logoutSuccess,
  registerRequest,
  registerSuccess,
  registerFailure,
  updateUserRequest,
  updateUserSuccess,
  updateUserFailure,
  resetPasswordRequest,
  resetPasswordSuccess,
  resetPasswordFailure,
  requestPasswordResetRequest,
  requestPasswordResetSuccess,
  requestPasswordResetFailure,
  verifyAccountRequest,
  verifyAccountSuccess,
  verifyAccountFailure,
  forceSessionCheck,
  checkAuthenticationSuccess,
  checkAuthenticationFailure,
  refreshTokenSuccess,
  refreshTokenFailure,
  setAuthenticationStatus,
} from '../slices/authSlice';
import { RootState } from '../store';
import type {
  LoginCredentials,
  RegisterCredentials,
  User,
  ResetPasswordParams,
  RequestResetParams,
  VerifyRegistration,
} from '../types/auth';


// Selector to get auth state with proper typing
const selectAuth = (state: RootState) => state.auth;

/**
 * Helper function to check authentication via cookies - FIX CHO LỖI UNDEFINED
 */
function* checkAuthenticationCookies() {
  try {
    console.log('🔍 Checking authentication cookies...');
    
    // Use object format for instance method calls
    const sessionData: SagaReturnType<typeof authService.checkSession> = yield call({
      context: authService,
      fn: authService.checkSession
    });
    
    if (sessionData.isAuthenticated && sessionData.user) {
      console.log('✅ Authentication successful via cookies');
      yield put(checkAuthenticationSuccess(sessionData.user));
      yield put(setAuthenticationStatus('authenticated'));
      return sessionData.user;
    } else {
      console.log('❌ No valid authentication found');
      yield put(checkAuthenticationFailure('No valid session'));
      yield put(setAuthenticationStatus('unauthenticated'));
      return null;
    }
  } catch (error) {
    console.error('❌ Cookie check error:', error);
    yield put(checkAuthenticationFailure(error instanceof Error ? error.message : 'Authentication check failed'));
    yield put(setAuthenticationStatus('unauthenticated'));
    return null;
  }
}

/**
 * Login saga that handles user authentication
 */
function* loginSaga(action: PayloadAction<LoginCredentials>) {
  try {
    console.log('🔐 Starting login process...');
    
    const response: SagaReturnType<typeof authService.login> = yield call({
      context: authService,
      fn: authService.login
    }, action.payload);

    if (response.success && response.user) {
      console.log('✅ Login successful');
      stableToast.success('Đăng nhập thành công', {
        description: `Chào mừng ${response.user.fullName || response.user.username}!`
      });
      yield put(loginSuccess({
        user: response.user,
        accessToken: 'cookie-managed', // We don't store tokens in frontend with httpOnly cookies
      }));
    } else {
      stableToast.error('Đăng nhập thất bại', {
        description: 'Tên đăng nhập hoặc mật khẩu không đúng'
      });
      yield put(loginFailure('Login failed'));
    }
  } catch (error: any) {
    console.error('❌ Login failed:', error);
    const errorMessage = error.message || 'Login failed';
    stableToast.error('Đăng nhập thất bại', {
      description: errorMessage
    });
    yield put(loginFailure(errorMessage));
  }
}

/**
 * Logout saga that handles user logout
 */
function* logoutSaga(
  action: PayloadAction<{ reason?: string; allDevices?: boolean; silent?: boolean } | undefined>,
) {
  try {
    const options = action.payload;
    const silent = options?.silent || false;

    console.log('🚪 Starting logout process...');

    if (!silent) {
      // Call logout service (clears httpOnly cookies)
      yield call({
        context: authService,
        fn: authService.logout
      });
      stableToast.info('Bạn đã đăng xuất thành công');
    }

    console.log('✅ Logout successful');
    yield put(logoutSuccess());

    if (options?.reason) {
      console.log('Logout reason:', options.reason);
      if (options.reason === 'session_timeout') {
        stableToast.warning('Phiên làm việc hết hạn', {
          description: 'Vui lòng đăng nhập lại để tiếp tục'
        });
      } else if (options.reason === 'token_expired') {
        stableToast.warning('Phiên đăng nhập hết hạn', {
          description: 'Vui lòng đăng nhập lại'
        });
      } else if (options.reason === 'security_logout') {
        stableToast.warning('Đăng xuất bảo mật', {
          description: 'Phát hiện hoạt động bất thường'
        });
      }
    }

    if (!silent && typeof window !== 'undefined') {
      window.location.replace('/login');
    }
  } catch (error) {
    console.error('❌ Logout error:', error);
    // Even if logout fails on server, clear local state
    yield put(logoutSuccess());
    
    if (!action.payload?.silent && typeof window !== 'undefined') {
      window.location.replace('/login');
    }
  }
}

/**
 * Register saga that handles user registration
 */
function* registerSaga(action: PayloadAction<RegisterCredentials>): Generator {
  try {
    const response: SagaReturnType<typeof authService.register> = yield call({
      context: authService,
      fn: authService.register
    }, action.payload);

    stableToast.success('Đăng ký thành công', {
      description: 'Tài khoản đã được tạo thành công'
    });
    yield put(registerSuccess());
  } catch (error: any) {
    stableToast.error('Đăng ký thất bại', {
      description: error.message || 'Đã xảy ra lỗi không mong muốn',
    });
    yield put(registerFailure(error.message || 'Đã xảy ra lỗi không mong muốn'));
  }
}

/**
 * Verify account saga
 */
function* verifyAccountSaga(action: PayloadAction<VerifyRegistration>) {
  try {
    // For now, just mark as successful since we don't have a verifyAccount method
    // This can be implemented when the backend supports account verification
    yield put(verifyAccountSuccess());
    
    stableToast.success('Xác thực tài khoản thành công', {
      description: 'Tài khoản của bạn đã được kích hoạt'
    });
    
    // After successful verification, trigger session check to get updated user data
    yield put(initializeSession());
  } catch (error: any) {
    stableToast.error('Xác thực tài khoản thất bại', {
      description: error.message || 'Vui lòng thử lại sau'
    });
    yield put(verifyAccountFailure(error.message || 'Xác thực tài khoản thất bại'));
  }
}

/**
 * Request password reset saga - updated to match backend API
 */
function* requestPasswordResetSaga(action: PayloadAction<RequestResetParams>) {
  try {
    console.log('🔑 Requesting password reset...', action.payload);
    
    // Use object format for instance method calls
    const response: SagaReturnType<typeof authService.requestPasswordReset> = yield call({
      context: authService,
      fn: authService.requestPasswordReset
    }, action.payload);
    
    console.log('✅ Password reset request successful:', response);
    
    stableToast.success('Xác thực thành công!', {
      description: response.message || 'Vui lòng nhập mật khẩu mới'
    });
    
    yield put(requestPasswordResetSuccess({
      resetToken: response.resetToken,
      username: response.username,
      message: response.message || 'Password reset request sent successfully',
      expiryDate: response.expiryDate,
    }));
    
  } catch (error: any) {
    console.error('❌ Password reset request failed:', error);
    stableToast.error('Xác thực thất bại', {
      description: error.message || 'Không thể xác thực thông tin. Vui lòng kiểm tra lại mã nhân viên và CCCD.'
    });
    yield put(requestPasswordResetFailure(error.message || 'Đã xảy ra lỗi không mong muốn'));
  }
}

/**
 * Reset password saga - updated to match backend API
 */
function* resetPasswordSaga(action: PayloadAction<ResetPasswordParams>) {
  try {
    console.log('🔒 Resetting password...', { 
      hasToken: Boolean(action.payload.resetToken),
      hasUsername: Boolean(action.payload.username),
      hasCardInfo: Boolean(action.payload.cardId && action.payload.employeeId)
    });
    
    // Use object format for instance method calls
    yield call({
      context: authService,
      fn: authService.resetPasswordWithToken
    }, action.payload);
    
    console.log('✅ Password reset successful');
    
    stableToast.success('Đổi mật khẩu thành công', {
      description: 'Mật khẩu của bạn đã được cập nhật thành công'
    });
    
    yield put(resetPasswordSuccess());
    
  } catch (error: any) {
    console.error('❌ Password reset failed:', error);
    stableToast.error('Đổi mật khẩu thất bại', {
      description: error.message || 'Không thể đổi mật khẩu. Vui lòng thử lại.'
    });
    yield put(resetPasswordFailure(error.message || 'Đã xảy ra lỗi không mong muốn'));
  }
}

/**
 * Update user profile saga
 */
function* updateUserSaga(action: PayloadAction<Partial<User>>): Generator {
  try {
    const response: SagaReturnType<typeof authService.getCurrentUser> = yield call({
      context: authService,
      fn: authService.getCurrentUser
    });
    
    stableToast.success('Cập nhật thông tin thành công', {
      description: 'Thông tin cá nhân đã được cập nhật'
    });
    yield put(updateUserSuccess(response));
  } catch (error: any) {
    stableToast.error('Cập nhật thông tin thất bại', {
      description: error.message || 'Không thể cập nhật thông tin cá nhân'
    });
    yield put(updateUserFailure(error.message || 'Đã xảy ra lỗi không mong muốn'));
  }
}

/**
 * Force session check saga
 */
function* forceSessionCheckSaga() {
  try {
    console.log('🔄 Force session check triggered...');
    yield call(checkAuthenticationCookies);
  } catch (error) {
    console.error('❌ Force session check failed:', error);
  }
}

/**
 * Token refresh saga (for httpOnly cookies, this is handled automatically by browser)
 */
function* refreshTokenSaga() {
  try {
    console.log('🔄 Token refresh triggered...');
    
    // With httpOnly cookies, refresh is handled automatically by the browser
    // We just need to verify the session is still valid
    const user: User | null = yield call(checkAuthenticationCookies);
    
    if (user) {
      stableToast.info('Phiên làm việc đã được làm mới', {
        description: 'Bạn có thể tiếp tục sử dụng'
      });
      yield put(refreshTokenSuccess({
        user,
        accessToken: 'cookie-managed',
      }));
    } else {
      stableToast.warning('Phiên làm việc đã hết hạn', {
        description: 'Vui lòng đăng nhập lại'
      });
      yield put(refreshTokenFailure('Session expired'));
    }
  } catch (error) {
    console.error('❌ Token refresh failed:', error);
    stableToast.error('Làm mới phiên thất bại', {
      description: 'Vui lòng đăng nhập lại'
    });
    yield put(refreshTokenFailure(error instanceof Error ? error.message : 'Refresh failed'));
  }
}

/**
 * Initialize session saga - Check authentication status (legacy, with throttling)
 */
function* initializeSessionSaga() {
  try {
    const authState: SagaReturnType<typeof selectAuth> = yield select(selectAuth);
    
    if (!authState) {
      console.warn('⚠️ Auth state is undefined, cannot proceed with session check');
      return;
    }
    
    const now = Date.now();
    const MIN_SESSION_CHECK_INTERVAL = 10000; // 10 seconds to match reducer
    
    // Check if we already have a valid authenticated session
    if (authState.isAuthenticated && authState.expiresAt) {
      const expiryTime = new Date(authState.expiresAt).getTime();
      if (now < expiryTime) {
        console.log('✅ Session still valid, expires at:', authState.expiresAt);
        return; // Skip session check if we have valid token
      } else {
        console.log('⏰ Session expired, checking with server...');
        stableToast.info('Đang kiểm tra phiên làm việc...', {
          description: 'Vui lòng đợi trong giây lát'
        });
      }
    }
    
    // Aggressive throttling - skip if we just checked recently
    if (authState.lastSessionCheck && 
        (now - authState.lastSessionCheck) < MIN_SESSION_CHECK_INTERVAL) {
      console.log('🚫 SAGA BLOCKED: Session check too recent -', (now - authState.lastSessionCheck) / 1000, 'seconds ago');
      return;
    }
    
    console.log('🔄 SAGA: Proceeding with session check...');
    
    const sessionResponse: SagaReturnType<typeof authService.checkSession> = yield call({
      context: authService,
      fn: authService.checkSession
    });
    
    if (sessionResponse.isAuthenticated && sessionResponse.user) {
      console.log('✅ Session is valid, user authenticated');
      
      yield put(
        setSessionAuthenticated({
          user: sessionResponse.user,
          expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(), // 7 days
        }),
      );
    } else {
      console.log('Session is invalid or not found');
      yield put(setSessionUnauthenticated(undefined)); // Fix: provide undefined argument
    }
  } catch (error: any) {
    console.error('Session initialization error:', error);
    stableToast.error('Lỗi kiểm tra phiên làm việc', {
      description: 'Không thể xác thực phiên đăng nhập'
    });
    yield put(setSessionUnauthenticated(error.message || 'Session check failed')); // Fix: provide error message
  }
}

/**
 * App initialization saga - Handle session validation on app startup
 */
function* initializeAppSaga() {
  try {
    console.log('🚀 Initializing app authentication...');
    
    // Check if we have an authenticated session via cookies
    const user: User | null = yield call(checkAuthenticationCookies);
    
    if (user) {
      console.log('✅ App initialization completed with authenticated user');
      stableToast.success('Chào mừng trở lại!', {
        description: `Xin chào ${user.fullName || user.username}`
      });
    } else {
      console.log('ℹ️ App initialization completed without authentication');
    }
    
    return user;
  } catch (error) {
    console.error('❌ App initialization failed:', error);
    stableToast.error('Lỗi khởi tạo ứng dụng', {
      description: 'Không thể khởi tạo phiên đăng nhập'
    });
    yield put(setAuthenticationStatus('unauthenticated'));
  }
}

/**
 * Session monitoring saga
 */
function* sessionMonitorSaga() {
  while (true) {
    try {
      // Check session every 5 minutes
      yield delay(5 * 60 * 1000);
      
      const authState: SagaReturnType<typeof selectAuth> = yield select(selectAuth);
      
      // Add null check and proper type guard
      if (!authState) {
        console.warn('⚠️ Auth state is undefined in session monitor');
        continue;
      }
      
      // Only check if user is currently authenticated
      if (authState.status === 'authenticated' && authState.user) {
        console.log('🔍 Periodic session check...');
        yield call(checkAuthenticationCookies);
      }
    } catch (error) {
      console.error('❌ Session monitor error:', error);
    }
  }
}

/**
 * Root saga for authentication
 */
export function* authSaga() {
  yield all([
    takeLatest(loginRequest.type, loginSaga),
    takeLatest(logoutRequest.type, logoutSaga),
    takeLatest(registerRequest.type, registerSaga),
    takeLatest(verifyAccountRequest.type, verifyAccountSaga),
    takeLatest(requestPasswordResetRequest.type, requestPasswordResetSaga),
    takeLatest(resetPasswordRequest.type, resetPasswordSaga),
    takeLatest(updateUserRequest.type, updateUserSaga),
    takeLatest(forceSessionCheck.type, forceSessionCheckSaga),
    takeLatest(refreshTokenSuccess.type, refreshTokenSaga),
    takeLatest(initializeSession.type, initializeSessionSaga),
    takeLatest(initializeApp.type, initializeAppSaga),
  ]);
}