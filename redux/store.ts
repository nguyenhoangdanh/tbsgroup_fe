import { configureStore } from '@reduxjs/toolkit';
import { createWrapper } from 'next-redux-wrapper';
import { combineReducers } from 'redux';
import { persistStore, persistReducer } from 'redux-persist';
import createSagaMiddleware from 'redux-saga';
import rootSaga from '@/redux/sagas';
import authReducer, { setHydrated } from '@/redux/slices/authSlice';
import type { AuthState } from '@/redux/types/auth';

// Create a custom storage object that safely checks for window
const createNoopStorage = () => {
  return {
    getItem(_key: string) {
      return Promise.resolve(null);
    },
    setItem(_key: string, value: any) {
      return Promise.resolve(value);
    },
    removeItem(_key: string) {
      return Promise.resolve();
    }
  };
};

// Create localStorage-based storage for caching user data only
const createSmartStorage = () => {
  if (typeof window === 'undefined') {
    return createNoopStorage();
  }

  return {
    getItem(key: string) {
      try {
        const item = localStorage.getItem(key);
        return Promise.resolve(item);
      } catch {
        return Promise.resolve(null);
      }
    },
    setItem(key: string, value: any) {
      try {
        localStorage.setItem(key, value);
        return Promise.resolve(value);
      } catch {
        return Promise.resolve(value);
      }
    },
    removeItem(key: string) {
      try {
        localStorage.removeItem(key);
        return Promise.resolve();
      } catch {
        return Promise.resolve();
      }
    }
  };
};

// Use smart storage that caches user data for better UX
const storage = createSmartStorage();

// Define the root state type first
export interface RootState {
  auth: AuthState;
}

// Create the root reducer - let TypeScript infer the type naturally
const rootReducer = combineReducers({
  auth: authReducer,
});

// Type-safe persist configuration without complex transforms
const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['auth'], // Only persist auth state
  version: 1,
  // Remove transforms to avoid type conflicts
};

// Create persisted reducer with type casting to resolve conflicts
const persistedReducer = persistReducer(persistConfig, rootReducer) as any;

// Create saga middleware outside of configureStore
const sagaMiddleware = createSagaMiddleware();

// Configure store with proper typing
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          'persist/PERSIST', 
          'persist/REHYDRATE', 
          'AUTH_INIT', 
          'AUTH_FORCE_CHECK'
        ],
        ignoredPaths: ['auth.expiresAt', 'auth.lastSessionCheck'],
      },
      // Keep thunk enabled for any legacy thunk actions
      thunk: true,
    }).concat(sagaMiddleware),
  devTools: process.env.NODE_ENV !== 'production',
});

// Only run saga middleware on client side
if (typeof window !== 'undefined') {
  sagaMiddleware.run(rootSaga);
}

// Create persistor with callback to handle hydration
export const persistor = persistStore(store, {}, () => {
  // After rehydration, dispatch setHydrated action
  store.dispatch(setHydrated(true));
});

// Infer types from the store itself
export type AppDispatch = typeof store.dispatch;

// Export properly typed store
export const wrapper = createWrapper(() => store, { debug: false });

// Helper function to get typed state
export const getTypedState = (): RootState => store.getState() as RootState;

// Export type-safe selectors
export const selectAuth = (state: RootState) => state.auth;
export const selectUser = (state: RootState) => state.auth.user;
export const selectIsAuthenticated = (state: RootState) => state.auth.isAuthenticated;
export const selectAuthStatus = (state: RootState) => state.auth.status;
export const selectAuthError = (state: RootState) => state.auth.error;
export const selectIsLoading = (state: RootState) => state.auth.isLoading;

export default store;
