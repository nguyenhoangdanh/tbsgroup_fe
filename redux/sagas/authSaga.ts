import { PayloadAction } from '@reduxjs/toolkit';
import { takeLatest, call, put, select, delay, fork, take, race, all } from 'redux-saga/effects';

import {
  loginRequest,
  loginSuccess,
  loginFailure,
  logoutRequest,
  logoutSuccess,
  registerRequest,
  registerSuccess,
  registerFailure,
  refreshTokenRequest,
  refreshTokenSuccess,
  refreshTokenFailure,
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
} from '../slices/authSlice';
import { RootState } from '../store';
import type {
  LoginCredentials,
  RegisterCredentials,
  ApiResponse,
  AuthResponse,
  User,
  ResetPasswordParams,
  RequestResetParams,
  VerifyRegistration,
} from '../types/auth';

import { authService } from '@/services/auth/auth.service';

const selectAuth = (state: RootState) => state.auth;
const selectExpiresAt = (state: RootState) => state.auth.expiresAt;

/**
 * Login saga that handles user authentication
 */
function* loginSaga(action: PayloadAction<LoginCredentials>): Generator {
  try {
    const response: ApiResponse<AuthResponse> = yield call(
      authService.login.bind(authService),
      action.payload,
    );

    if (response.success && response.data) {
      // Token is stored in cookies by the auth service

      // Record login time for security monitoring
      yield call(authService.recordLoginTime);

      // Fetch session data to get user info
      const sessionResponse = yield call(fetchSessionData);
      
      if (sessionResponse.success && sessionResponse.data.status === 'authenticated') {
        // Update Redux state with user info from session
        yield put(
          loginSuccess({
            user: sessionResponse.data.user,
            accessToken: 'cookie-managed', // Just a placeholder, real token is in HTTP-only cookie
            expiresAt: sessionResponse.data.expiresAt || new Date(Date.now() + 3600 * 1000).toISOString(),
            requiredResetPassword: sessionResponse.data.user?.status === 'PENDING_ACTIVATION',
          }),
        );
      } else {
        // If session fetch failed but login succeeded, use data from login response
        yield put(
          loginSuccess({
            user: response.data.user,
            accessToken: 'cookie-managed', 
            expiresAt: new Date(Date.now() + response.data.expiresIn * 1000).toISOString(),
            requiredResetPassword: response.data.user?.status === 'PENDING_ACTIVATION',
          }),
        );
      }
    } else {
      yield put(loginFailure(response.error || 'Đăng nhập thất bại'));
    }
  } catch (error: any) {
    yield put(loginFailure((error.message as string) || 'Đã xảy ra lỗi không mong muốn'));
  }
}

/**
 * Fetch current session data from server
 */
function* fetchSessionData(): Generator<any, any, any> {
  try {
    // Call the new API endpoint to get current session
    const response = yield call(fetch, '/api/auth/session', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      },
      credentials: 'same-origin',
    });

    if (!response.ok) {
      console.error('Session fetch failed:', response.status);
      return { success: false, error: `HTTP error! status: ${response.status}` };
    }

    const data = yield response.json();
    return { success: true, data };
  } catch (error) {
    console.error('Error fetching session:', error);
    return { success: false, error: 'Failed to fetch session data' };
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

    // Only call logout API if not silent mode
    if (!silent) {
      yield call(authService.logout.bind(authService));
    } else {
      // Just clear local token for silent logout
      yield call(authService.clearStoredToken.bind(authService));
    }

    // Update Redux state
    yield put(logoutSuccess());

    // Log reason if provided (could store for analytics)
    if (options?.reason) {
      console.log('Logout reason:', options.reason);
    }

    // Only redirect to login if not silent
    if (!silent) {
      yield call([window.location, 'replace'], '/login');
    }
  } catch (error) {
    console.error('Logout error:', error);

    // Even if API logout fails, we should still clear local state
    yield put(logoutSuccess());

    // Only redirect if not silent
    if (!options?.silent) {
      yield call([window.location, 'replace'], '/login');
    }
  }
}

/**
 * Register saga that handles user registration
 */
function* registerSaga(action: PayloadAction<RegisterCredentials>) {
  try {
    const response: ApiResponse<any> = yield call(
      authService.register.bind(authService),
      action.payload,
    );

    if (response.success) {
      yield put(registerSuccess());

      // Redirect to verification page or provided redirect
      if (action.payload.redirectTo) {
        yield call([window.location, 'replace'], action.payload.redirectTo);
      } else {
        yield call([window.location, 'replace'], '/login?registered=true');
      }
    } else {
      yield put(registerFailure(response.error || 'Đăng ký thất bại'));
    }
  } catch (error: any) {
    yield put(registerFailure((error.message as string) || 'Đã xảy ra lỗi không mong muốn'));
  }
}

/**
 * Verify account saga
 */
function* verifyAccountSaga(action: PayloadAction<VerifyRegistration>) {
  try {
    // For account verification we need to call API directly since this method isn't in authService
    const response: ApiResponse<any> = yield call(authService.register.bind(authService), {
      ...action.payload,
      verify: true,
    });

    if (response.success && response.data) {
      yield put(
        verifyAccountSuccess({
          user: response.data.user,
          accessToken: response.data.token,
          expiresAt: new Date(Date.now() + response.data.expiresIn * 1000).toISOString(),
        }),
      );

      // Store token
      yield call(
        authService.setStoredToken.bind(authService),
        response.data.token,
        new Date(Date.now() + response.data.expiresIn * 1000),
      );
    } else {
      yield put(verifyAccountFailure(response.error || 'Xác minh tài khoản thất bại'));
    }
  } catch (error: any) {
    yield put(verifyAccountFailure((error.message as string) || 'Đã xảy ra lỗi không mong muốn'));
  }
}

/**
 * Token refresh saga
 */
function* refreshTokenSaga() {
  try {
    const response: ApiResponse<AuthResponse> = yield call(
      authService.refreshToken.bind(authService),
    );

    if (response.success && response.data) {
      // Fetch updated session data after token refresh
      const sessionResponse = yield call(fetchSessionData);
      
      if (sessionResponse.success && sessionResponse.data.status === 'authenticated') {
        yield put(
          refreshTokenSuccess({
            accessToken: 'cookie-managed', // Placeholder, token managed by cookie
            expiresAt: sessionResponse.data.expiresAt || new Date(Date.now() + 3600 * 1000).toISOString(),
          }),
        );
      } else {
        // Fallback if session fetch fails
        yield put(
          refreshTokenSuccess({
            accessToken: 'cookie-managed',
            expiresAt: new Date(Date.now() + response.data.expiresIn * 1000).toISOString(),
          }),
        );
      }

      return true;
    } else {
      console.error('Token refresh failed:', response.error);
      yield put(refreshTokenFailure());
      return false;
    }
  } catch (error) {
    console.error('Token refresh error details:', error);
    yield put(refreshTokenFailure());
    return false;
  }
}

/**
 * Request password reset saga
 */
function* requestPasswordResetSaga(action: PayloadAction<RequestResetParams>) {
  try {
    const response: ApiResponse<{
      resetToken: string;
      expiryDate: string;
      username: string;
    }> = yield call(authService.requestPasswordReset.bind(authService), action.payload);

    if (response.success && response.data) {
      yield put(requestPasswordResetSuccess(response.data));
    } else {
      yield put(
        requestPasswordResetFailure(response.error || 'Không thể yêu cầu đặt lại mật khẩu'),
      );
    }
  } catch (error: any) {
    yield put(requestPasswordResetFailure(error.message || 'Đã xảy ra lỗi không mong muốn'));
  }
}

/**
 * Reset password saga
 */
function* resetPasswordSaga(action: PayloadAction<ResetPasswordParams>) {
  try {
    const response: ApiResponse<any> = yield call(
      authService.resetPassword.bind(authService),
      action.payload,
    );

    if (response.success) {
      yield put(resetPasswordSuccess());

      // Automatically redirect to login after successful password reset
      yield call([window.location, 'replace'], '/login?reset=success');
    } else {
      yield put(resetPasswordFailure(response.error || 'Đặt lại mật khẩu thất bại'));
    }
  } catch (error: any) {
    yield put(resetPasswordFailure(error.message || 'Đã xảy ra lỗi không mong muốn'));
  }
}

/**
 * Update user profile saga
 */
function* updateUserSaga(action: PayloadAction<Partial<User>>) {
  try {
    const response: ApiResponse<User> = yield call(
      authService.updateUserProfile.bind(authService),
      action.payload,
    );

    if (response.success && response.data) {
      yield put(updateUserSuccess(response.data));
    } else {
      yield put(updateUserFailure(response.error || 'Không thể cập nhật thông tin người dùng'));
    }
  } catch (error: any) {
    yield put(updateUserFailure((error.message as string) || 'Đã xảy ra lỗi không mong muốn'));
  }
}

/**
 * Calculate time until token expires (in milliseconds)
 */
function* getTimeUntilExpiry() {
  const expiresAtStr: string | null = yield select(selectExpiresAt);
  if (!expiresAtStr) return 0;

  const expiryTime = new Date(expiresAtStr).getTime();
  const currentTime = new Date().getTime();

  return Math.max(0, expiryTime - currentTime);
}

/**
 * Saga to refresh token before it expires with improved throttling
 */

function* refreshTokenWatcher(): Generator {
  let lastRefreshTime = Date.now();
  const MIN_REFRESH_INTERVAL = 10 * 60 * 1000; // 10 phút tối thiểu

  while (true) {
    try {
      const timeUntilExpiry: number = yield call(getTimeUntilExpiry);
      const authState = yield select(selectAuth);
      
      // Thoát nếu người dùng không còn xác thực
      if (authState.status !== 'authenticated') {
        console.log('Người dùng không còn được xác thực, dừng chu kỳ làm mới');
        break;
      }
      
      // Không làm mới nếu còn quá nhiều thời gian (> 45 phút)
      if (timeUntilExpiry > 45 * 60 * 1000) {
        // Đợi và kiểm tra lại sau một thời gian dài hơn
        const { logout } = yield race({
          timeout: delay(30 * 60 * 1000), // Chờ 30 phút
          logout: take(logoutRequest.type),
        });
        
        if (logout) break;
        continue;
      }
      
      // Kiểm tra khoảng cách giữa các lần làm mới
      const now = Date.now();
      const timeSinceLastRefresh = now - lastRefreshTime;
      
      if (timeSinceLastRefresh < MIN_REFRESH_INTERVAL) {
        const waitTime = MIN_REFRESH_INTERVAL - timeSinceLastRefresh;
        const { logout } = yield race({
          timeout: delay(waitTime),
          logout: take(logoutRequest.type),
        });
        
        if (logout) break;
        continue;
      }
      
      // Ghi lại thời gian làm mới trước khi thực hiện
      lastRefreshTime = Date.now();
      
      // Thực hiện làm mới token
      yield put(refreshTokenRequest());
      const refreshed: boolean = yield call(refreshTokenSaga);
      
      // Nếu làm mới thất bại, đợi một thời gian trước khi thử lại
      if (!refreshed) {
        yield delay(5 * 60 * 1000); // Đợi 5 phút
      } else {
        // Nếu thành công, đợi một lượng thời gian phù hợp trước lần làm mới tiếp theo
        const refreshTimeWithBuffer = Math.max(
          timeUntilExpiry * 0.8,
          MIN_REFRESH_INTERVAL
        );
        yield delay(refreshTimeWithBuffer);
      }
    } catch (error) {
      console.error('Lỗi watcher làm mới token:', error);
      yield delay(10 * 60 * 1000); // Đợi 10 phút khi có lỗi
    }
  }
}

/**
 * Initialize auth state on application start
 */
function* initAuthSaga(): Generator {
  try {
    const auth = yield select(selectAuth);

    // Bỏ qua nếu chúng ta đã có token hợp lệ và người dùng
    if (auth.status === 'authenticated' && auth.user && auth.accessToken && auth.expiresAt) {
      // Bắt đầu chu kỳ làm mới token
      yield fork(refreshTokenWatcher);
      return;
    }

    console.log('Initializing auth state from session API');
    
    // Get session data from server
    const sessionResponse = yield call(fetchSessionData);
    
    if (sessionResponse.success) {
      const { status, user, expiresAt } = sessionResponse.data;
      
      if (status === 'authenticated' && user) {
        console.log('Session authenticated, setting user state');
        
        yield put(
          loginSuccess({
            user,
            accessToken: 'cookie-managed', // Placeholder since actual token is in HTTP-only cookie
            expiresAt: expiresAt || new Date(Date.now() + 3600 * 1000).toISOString(),
            requiredResetPassword: user.status === 'PENDING_ACTIVATION',
          }),
        );
        
        // Start token refresh cycle
        yield fork(refreshTokenWatcher);
      } else {
        console.log('Session not authenticated');
        yield put(logoutSuccess());
      }
    } else {
      console.log('Failed to fetch session data, logging out');
      yield put(logoutSuccess());
    }
  } catch (error) {
    console.error('Không thể khởi tạo xác thực:', error);

    // Xác định xem đây có phải là lỗi mạng không
    if (
      error instanceof Error &&
      (error.message.includes('Failed to fetch') || error.message.includes('Network error'))
    ) {
      // Xử lý lỗi mạng khác nhau - không xóa token
      yield put({
        type: 'AUTH_ERROR',
        payload: {
          error: error.message,
          status: 'network_error',
        },
      });
    } else {
      // Đối với các lỗi khác, xóa token và đăng xuất
      yield call(authService.clearStoredToken.bind(authService));
      yield put(logoutSuccess());
    }
  }
}

/**
 * Force auth check after store hydration
 */
function* forceAuthCheckSaga(): Generator {
  try {
    console.log('Forcing auth check via session API');
    
    // Get session data from server
    const sessionResponse = yield call(fetchSessionData);
    
    if (sessionResponse.success) {
      const { status, user, expiresAt } = sessionResponse.data;
      
      if (status === 'authenticated' && user) {
        console.log('Session is authenticated, updating user state');
        
        yield put(
          loginSuccess({
            user,
            accessToken: 'cookie-managed', // Placeholder since actual token is in HTTP-only cookie
            expiresAt: expiresAt || new Date(Date.now() + 3600 * 1000).toISOString(),
            requiredResetPassword: user.status === 'PENDING_ACTIVATION',
          }),
        );
        
        // Start token refresh cycle
        yield fork(refreshTokenWatcher);
      } else {
        console.log('Session not authenticated, logging out');
        yield put(logoutSuccess());
      }
    } else {
      console.log('Failed to fetch session data, logging out');
      yield put(logoutSuccess());
    }
  } catch (error) {
    console.error('Error during forced auth check:', error);
    yield call(authService.clearStoredToken.bind(authService));
    yield put(logoutSuccess());
  }
}

/**
 * Handle the auth initialization action
 */
function* handleAuthInit() {
  yield call(initAuthSaga);
}

/**
 * Root auth saga
 */
export function* authSaga() {
  yield all([
    // Khi ứng dụng bắt đầu, theo dõi hành động khởi tạo
    takeLatest('AUTH_INIT', handleAuthInit),
    // Theo dõi kiểm tra xác thực bắt buộc (sau khi hoàn thành hydration)
    takeLatest('AUTH_FORCE_CHECK', forceAuthCheckSaga),
    // Theo dõi hành động xác thực
    takeLatest(loginRequest.type, loginSaga),
    takeLatest(registerRequest.type, registerSaga),
    takeLatest(verifyAccountRequest.type, verifyAccountSaga),
    takeLatest(logoutRequest.type, logoutSaga),
    takeLatest(updateUserRequest.type, updateUserSaga),
    takeLatest(requestPasswordResetRequest.type, requestPasswordResetSaga),
    takeLatest(resetPasswordRequest.type, resetPasswordSaga),
  ]);
}
