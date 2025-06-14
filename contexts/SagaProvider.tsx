'use client';
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { store } from '@/redux/store';

// Memoized dynamic imports
const DynamicReduxProvider = dynamic(
  () => import('react-redux').then((mod) => ({ default: mod.Provider })),
  { ssr: false }
);

const DynamicPersistGate = dynamic(
  () => import('redux-persist/integration/react').then((mod) => ({ default: mod.PersistGate })),
  { ssr: false }
);

// Memoized Redux container
const DynamicReduxContainer = dynamic(
  async () => {
    const { persistor } = await import('@/redux/store');
    
    const ReduxContainer = React.memo(({ children }: { children: React.ReactNode }) => {
      return (
        <DynamicReduxProvider store={store}>
          <DynamicPersistGate loading={null} persistor={persistor}>
            {children}
          </DynamicPersistGate>
        </DynamicReduxProvider>
      );
    });

    ReduxContainer.displayName = 'ReduxContainer';
    
    return { default: ReduxContainer };
  },
  { ssr: false }
);

const LoadingComponent = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
  </div>
);

const SagaProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isClient, setIsClient] = useState(false);
  const [sessionInitialized, setSessionInitialized] = useState(false);
  const [initializationError, setInitializationError] = useState<string | null>(null);
  
  // Memoized initialization function
  const initializeSession = useCallback(async () => {
    if (sessionInitialized) return;
    
    try {
      const { authSessionManager } = await import('@/services/auth/AuthSessionManager');
      console.log('🚀 SagaProvider: Starting session initialization');
      
      await authSessionManager.initializeSession();
      setSessionInitialized(true);
      setInitializationError(null);
      
      console.log('✅ SagaProvider: Session initialization completed');
    } catch (error) {
      console.error('❌ SagaProvider: Session initialization failed:', error);
      setInitializationError(error instanceof Error ? error.message : 'Unknown error');
      setSessionInitialized(true); // Prevent infinite retries
    }
  }, [sessionInitialized]);

  // Client-side initialization
  useEffect(() => {
    if (isClient) return;
    
    setIsClient(true);
  }, [isClient]);

  // Session initialization
  useEffect(() => {
    if (!isClient || sessionInitialized) return;
    
    initializeSession();
  }, [isClient, sessionInitialized, initializeSession]);

  // Memoized children to prevent unnecessary re-renders
  const memoizedChildren = useMemo(() => children, [children]);

  // Don't render anything on server side
  if (!isClient) {
    return null;
  }

  // Show error state if initialization failed
  if (initializationError) {
    console.error('🚨 Session initialization error:', initializationError);
  }

  return <DynamicReduxContainer>{memoizedChildren}</DynamicReduxContainer>;
};

export default React.memo(SagaProviders);
