import { call, put, select, takeEvery, delay } from 'redux-saga/effects';

import { API_ERROR, API_REQUEST, API_SUCCESS, ApiRequestAction } from '../actions/apiAction';
import { initializeSession, logoutRequest } from '../slices/authSlice';
import { RootState } from '../store';

const selectAuth = (state: RootState) => state.auth;

const BASE_API_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

function* handleApiRequest(action: ApiRequestAction): Generator<any, any, any> {
  const { endpoint, method, data, onSuccess, onError } = action.payload;

  try {
    const auth = yield select(selectAuth);

    // Build request headers (no Authorization header needed - using HTTP-only cookies)
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Make the API call
    const response: Response = yield call(fetch, `${BASE_API_URL}${endpoint}`, {
      method,
      headers,
      credentials: 'include', // Important for cookies
      ...(data ? { body: JSON.stringify(data) } : {}),
    });

    // Handle 401 Unauthorized with aggressive throttling
    if (response.status === 401) {
      console.log('🔒 API 401 error - checking if session check is needed');
      
      // Get current auth state
      const authState = yield select(selectAuth);
      const now = Date.now();
      const MIN_SESSION_CHECK_INTERVAL = 10000; // 10 seconds to match other places
      
      // Only trigger session check if we haven't checked recently
      if (!authState.lastSessionCheck || 
          (now - authState.lastSessionCheck) > MIN_SESSION_CHECK_INTERVAL) {
        console.log('🔄 API: Triggering session check due to 401 error');
        yield put(initializeSession());

        // Wait a moment for the session check to complete
        yield call(delay, 1000); // Increase wait time
      } else {
        console.log('🚫 API: Skipping session check - too recent for 401 error:', (now - authState.lastSessionCheck) / 1000, 'seconds ago');
      }

      // Get updated auth state
      const updatedAuth = yield select(selectAuth);

      // If user is still authenticated after session check, retry the request
      if (updatedAuth.status === 'authenticated') {
        // Retry the original request (cookies will be sent automatically)
        const retryResponse: Response = yield call(fetch, `${BASE_API_URL}${endpoint}`, {
          method,
          headers: {
            'Content-Type': 'application/json',
            // Don't include Authorization header - rely on HTTP-only cookies
          },
          credentials: 'include',
          ...(data ? { body: JSON.stringify(data) } : {}),
        });

        if (retryResponse.ok) {
          const retryData = yield call([retryResponse, 'json']);
          yield put({
            type: API_SUCCESS,
            payload: { data: retryData, meta: action.payload.meta },
          });
          if (onSuccess) yield put({ type: onSuccess, payload: retryData });
          return;
        }
      }

      // If session check failed or retry failed, logout
      yield put(logoutRequest());
      yield put({
        type: API_ERROR,
        payload: {
          error: 'Session expired. Please log in again.',
          meta: action.payload.meta,
        },
      });
      if (onError)
        yield put({
          type: onError,
          payload: 'Session expired. Please log in again.',
        });
      return;
    }

    // Parse response
    let responseData: any;
    const contentType = response.headers.get('content-type');

    if (contentType && contentType.includes('application/json')) {
      responseData = yield call([response, 'json']);
    } else {
      responseData = yield call([response, 'text']);
    }

    if (!response.ok) {
      yield put({
        type: API_ERROR,
        payload: {
          error: responseData.message || `Error: ${response.status} ${response.statusText}`,
          meta: action.payload.meta,
        },
      });

      if (onError)
        yield put({
          type: onError,
          payload: responseData.message || `Error: ${response.status} ${response.statusText}`,
        });
      return;
    }

    // Success case
    yield put({
      type: API_SUCCESS,
      payload: { data: responseData, meta: action.payload.meta },
    });

    if (onSuccess)
      yield put({
        type: onSuccess,
        payload: responseData,
      });
  } catch (error: any) {
    yield put({
      type: API_ERROR,
      payload: {
        error: error?.message || 'An unknown error occurred',
        meta: action.payload.meta,
      },
    });

    if (onError)
      yield put({
        type: onError,
        payload: error.message || 'An unknown error occurred',
      });
  }
}

export function* apiSaga() {
  yield takeEvery(API_REQUEST, handleApiRequest);
}
