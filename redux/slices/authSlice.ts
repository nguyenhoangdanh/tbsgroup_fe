// src/store/slices/authSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import type { AuthState, User, LoginCredentials } from '../types/auth';

const initialState: AuthState = {
  user: null,
  accessToken: null,
  expiresAt: null,
  status: 'loading',
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginRequest: (state, action: PayloadAction<LoginCredentials>) => {
      state.status = 'loading';
      state.error = null;
    },
    loginSuccess: (
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
    loginFailure: (state, action: PayloadAction<string>) => {
      state.status = 'unauthenticated';
      state.error = action.payload;
    },
    logoutRequest: (
      state,
      action: PayloadAction<
        { reason?: string; allDevices?: boolean; silent?: boolean } | undefined
      >,
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
    registerRequest: (
      state,
      action: PayloadAction<{
        email: string;
        password: string;
        fullName: string;
        redirectTo?: string;
      }>,
    ) => {
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
    refreshTokenRequest: state => {
      // Optionally track refresh attempts
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
      state.error = null;
    },
    refreshTokenFailure: state => {
      state.status = 'refresh_needed';
    },
    updateUserRequest: (state, action: PayloadAction<Partial<User>>) => {
      // Optionally set a loading state for user updates
    },
    updateUserSuccess: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
    },
    updateUserFailure: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
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
} = authSlice.actions;

export default authSlice.reducer;

// // src/store/slices/authSlice.ts
// import { createSlice, PayloadAction } from '@reduxjs/toolkit';
// import type { AuthState, User } from '../types/auth';

// const initialState: AuthState = {
//   user: null,
//   accessToken: null,
//   expiresAt: null,
//   status: 'loading',
//   error: null,
// };

// const authSlice = createSlice({
//   name: 'auth',
//   initialState,
//   reducers: {
//     loginRequest: (state, action: PayloadAction<{ email: string; password: string; redirectTo?: string }>) => {
//       state.status = 'loading';
//       state.error = null;
//     },
//     loginSuccess: (state, action: PayloadAction<{ user: User; accessToken: string; expiresAt: string }>) => {
//       state.user = action.payload.user;
//       state.accessToken = action.payload.accessToken;
//       state.expiresAt = action.payload.expiresAt;
//       state.status = 'authenticated';
//       state.error = null;
//     },
//     loginFailure: (state, action: PayloadAction<string>) => {
//       state.status = 'unauthenticated';
//       state.error = action.payload;
//     },
//     logoutRequest: (state, action: PayloadAction<{ reason?: string; allDevices?: boolean } | undefined>) => {
//       state.status = 'loading';
//     },
//     logoutSuccess: (state) => {
//       state.user = null;
//       state.accessToken = null;
//       state.expiresAt = null;
//       state.status = 'unauthenticated';
//       state.error = null;
//     },
//     registerRequest: (state, action: PayloadAction<{
//       email: string;
//       password: string;
//       fullName: string;
//       redirectTo?: string
//     }>) => {
//       state.status = 'loading';
//       state.error = null;
//     },
//     registerSuccess: (state) => {
//       state.status = 'registration_success';
//       state.error = null;
//     },
//     registerFailure: (state, action: PayloadAction<string>) => {
//       state.status = 'unauthenticated';
//       state.error = action.payload;
//     },
//     verifyAccountRequest: (state, action: PayloadAction<{ email: string; code: string }>) => {
//       state.status = 'loading';
//     },
//     verifyAccountSuccess: (state, action: PayloadAction<{
//       user: User;
//       accessToken: string;
//       expiresAt: string
//     }>) => {
//       state.user = action.payload.user;
//       state.accessToken = action.payload.accessToken;
//       state.expiresAt = action.payload.expiresAt;
//       state.status = 'authenticated';
//       state.error = null;
//     },
//     verifyAccountFailure: (state, action: PayloadAction<string>) => {
//       state.status = 'unauthenticated';
//       state.error = action.payload;
//     },
//     refreshTokenRequest: (state) => {
//       // Optionally track refresh attempts
//     },
//     refreshTokenSuccess: (state, action: PayloadAction<{
//       accessToken: string;
//       expiresAt: string
//     }>) => {
//       state.accessToken = action.payload.accessToken;
//       state.expiresAt = action.payload.expiresAt;
//       state.error = null;
//     },
//     refreshTokenFailure: (state) => {
//       state.status = 'refresh_needed';
//     },
//     updateUserRequest: (state, action: PayloadAction<Partial<User>>) => {
//       // Optionally set a loading state for user updates
//     },
//     updateUserSuccess: (state, action: PayloadAction<User>) => {
//       state.user = action.payload;
//     },
//     updateUserFailure: (state, action: PayloadAction<string>) => {
//       state.error = action.payload;
//     },
//   },
// });

// export const {
//   loginRequest,
//   loginSuccess,
//   loginFailure,
//   logoutRequest,
//   logoutSuccess,
//   registerRequest,
//   registerSuccess,
//   registerFailure,
//   verifyAccountRequest,
//   verifyAccountSuccess,
//   verifyAccountFailure,
//   refreshTokenRequest,
//   refreshTokenSuccess,
//   refreshTokenFailure,
//   updateUserRequest,
//   updateUserSuccess,
//   updateUserFailure,
// } = authSlice.actions;

// export default authSlice.reducer;
