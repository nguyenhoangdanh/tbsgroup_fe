import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';

import type { RootState, AppDispatch } from '@/redux/store';

// Type-safe hooks
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

// Selector hooks for common auth state
export const useAuth = () => useAppSelector(state => state.auth);
export const useUser = () => useAppSelector(state => state.auth.user);
export const useIsAuthenticated = () => useAppSelector(state => state.auth.isAuthenticated);
export const useAuthStatus = () => useAppSelector(state => state.auth.status);
export const useAuthError = () => useAppSelector(state => state.auth.error);
export const useIsLoading = () => useAppSelector(state => state.auth.isLoading);

// Export default for compatibility
export default {
  useAppDispatch,
  useAppSelector,
  useAuth,
  useUser,
  useIsAuthenticated,
  useAuthStatus,
  useAuthError,
  useIsLoading,
};
