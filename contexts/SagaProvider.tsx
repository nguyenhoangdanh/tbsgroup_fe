'use client';
import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { store } from '@/redux/store';
import { authService } from '@/services/auth/auth.service';

// Import Provider components dynamically with SSR disabled to prevent hydration mismatch
const DynamicReduxProvider = dynamic(
  () => import('react-redux').then((mod) => ({ default: mod.Provider })),
  { ssr: false }
);

const DynamicPersistGate = dynamic(
  () => import('redux-persist/integration/react').then((mod) => ({ default: mod.PersistGate })),
  { ssr: false }
);

// Create a dynamic import for the persistor to avoid it being part of SSR
const DynamicReduxContainer = dynamic(
  async () => {
    const { persistor } = await import('@/redux/store');
    
    const ReduxContainer = ({ children }: { children: React.ReactNode }) => {
      return (
        <DynamicReduxProvider store={store}>
          <DynamicPersistGate loading={null} persistor={persistor}>
            {children}
          </DynamicPersistGate>
        </DynamicReduxProvider>
      );
    };
    
    return { default: ReduxContainer };
  },
  { ssr: false }
);

// Loading component while initializing auth
const LoadingComponent = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
  </div>
);

const SagaProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Use useState to track whether we're on the client side
  const [isClient, setIsClient] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Use useEffect to mark that we're on the client and initialize auth
  useEffect(() => {
    setIsClient(true);

    // Check for token in cookies
    const hasToken = authService.getStoredToken();
    
    // If we have a token, dispatch the force check action
    if (hasToken) {
      console.log('Found authentication token in cookies, initializing auth state');
      store.dispatch({ type: 'AUTH_FORCE_CHECK' });
    } else {
      console.log('No authentication token found in cookies');
    }
    
    setIsInitialized(true);
  }, []);

  // If we're not on the client yet, render nothing to avoid hydration mismatch
  if (!isClient) {
    return null;
  }

  // Show loading indicator while initializing
  if (!isInitialized) {
    return <LoadingComponent />;
  }

  return <DynamicReduxContainer>{children}</DynamicReduxContainer>;
};

export default SagaProviders;
