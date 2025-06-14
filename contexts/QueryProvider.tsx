'use client';

import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { useState, useEffect, lazy, ReactNode, Suspense } from 'react';

interface Props {
  children: ReactNode;
}

const ReactQueryDevtoolsProduction = lazy(() =>
  import('@tanstack/react-query-devtools/build/modern/production.js').then(d => ({
    default: d.ReactQueryDevtools,
  })),
);

export default function QueryProvider({ children }: Props) {
  // Create a client
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
  );

  // Creating a persister using useState and useEffect to avoid hydration issues
  const [persister, setPersister] = useState<any>(null);

  useEffect(() => {
    // Only create the persister on the client side
    setPersister(
      createSyncStoragePersister({
        storage: window.localStorage,
      }),
    );
  }, []);

  // If we don't have a persister yet (server-side rendering),
  // just use the regular QueryClientProvider
  if (!persister) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
        <Suspense fallback={null}>
          <ReactQueryDevtoolsProduction />
        </Suspense>
      </QueryClientProvider>
    );
  }

  // Once we have the persister (client-side), use the PersistQueryClientProvider
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister }}
      onSuccess={() => {
        // Optional: do something once the cache is restored
        console.log('Query cache successfully restored');
      }}
    >
      {children}
      {/* <Suspense fallback={null}>
        <ReactQueryDevtoolsProduction />
      </Suspense> */}
    </PersistQueryClientProvider>
  );
}
