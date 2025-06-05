import { configureStore } from '@reduxjs/toolkit';
import { createWrapper } from 'next-redux-wrapper';
import { combineReducers } from 'redux';
import { persistStore, persistReducer } from 'redux-persist';
import createSagaMiddleware from 'redux-saga';
import rootSaga from '@/redux/sagas';
import authReducer from '@/redux/slices/authSlice';

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

// Create a cookie-based storage for redux-persist
// This is a null storage that doesn't actually persist anything
// since we're using HTTP-only cookies managed by the server
const createCookieStorage = () => {
  return {
    getItem() {
      // Return null for persistence and let auth state be populated from cookies directly
      return Promise.resolve(null);
    },
    setItem(_key: string, value: any) {
      // Do nothing - auth tokens are handled by authService directly
      return Promise.resolve(value);
    },
    removeItem(_key: string) {
      // Do nothing - auth tokens are handled by authService directly
      return Promise.resolve();
    }
  };
};

// Use cookie storage on client side or fallback to noop storage
const storage = typeof window !== 'undefined' 
  ? createCookieStorage() 
  : createNoopStorage();

const rootReducer = combineReducers({
  // handbagStages: handbagReducer,
  auth: authReducer,
});

// Persist config
const persistConfig = {
  key: 'root',
  storage,
  whitelist: [], // We don't need to persist auth state anymore since we use cookies
  version: 1,
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

// Create saga middleware outside of configureStore to avoid recreating it
const sagaMiddleware = createSagaMiddleware();

// Configure store with TypeScript
export const store = configureStore({
  reducer: persistedReducer,
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE', 'AUTH_INIT', 'AUTH_FORCE_CHECK'],
      },
    }).concat(sagaMiddleware),
});

// Only run saga middleware on client side
if (typeof window !== 'undefined') {
  sagaMiddleware.run(rootSaga);
}

export const persistor = persistStore(store);

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const wrapper = createWrapper(() => store, { debug: false });
