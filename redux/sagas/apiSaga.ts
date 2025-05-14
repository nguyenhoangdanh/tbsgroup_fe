// src/store/sagas/apiSaga.ts
import {call, put, select, takeEvery} from 'redux-saga/effects';
import {refreshTokenRequest, logoutRequest} from '../slices/authSlice';
import {RootState} from '../store';
import {API_ERROR, API_REQUEST, API_SUCCESS, ApiRequestAction} from '../actions/apiAction';

// Select auth state
const selectAuth = (state: RootState) => state.auth;

const BASE_API_URL = process.env.NEXT_PUBLIC_API_URL;

function* handleApiRequest(action: ApiRequestAction): Generator<any, any, any> {
  const {endpoint, method, data, onSuccess, onError} = action.payload;

  try {
    const auth = yield select(selectAuth);

    // Build request headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(auth?.accessToken ? {Authorization: `Bearer ${auth.accessToken}`} : {}),
    };

    // Make the API call
    const response: Response = yield call(fetch, `${BASE_API_URL}${endpoint}`, {
      method,
      headers,
      credentials: 'include', // Important for cookies
      ...(data ? {body: JSON.stringify(data)} : {}),
    });

    // Handle 401 Unauthorized
    if (response.status === 401) {
      // Try to refresh the token
      yield put(refreshTokenRequest());

      // Get updated auth state
      const updatedAuth = yield select(selectAuth);

      // Check if token refresh was successful
      if (updatedAuth.accessToken) {
        // Retry the original request with new token
        const retryHeaders = {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${updatedAuth.accessToken}`,
        };

        const retryResponse: Response = yield call(fetch, `${BASE_API_URL}${endpoint}`, {
          method,
          headers: retryHeaders,
          credentials: 'include',
          ...(data ? {body: JSON.stringify(data)} : {}),
        });

        if (retryResponse.ok) {
          const retryData = yield call([retryResponse, 'json']);
          yield put({
            type: API_SUCCESS,
            payload: {data: retryData, meta: action.payload.meta},
          });
          if (onSuccess) yield put({type: onSuccess, payload: retryData});
          return;
        }
      }

      // If retry fails, logout
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
      payload: {data: responseData, meta: action.payload.meta},
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
