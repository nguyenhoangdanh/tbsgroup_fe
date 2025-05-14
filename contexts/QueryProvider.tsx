'use client';

import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { useState, useEffect, lazy, ReactNode, Suspense } from 'react';

interface Props {
  children: ReactNode;
}

// Xác định kiểu rõ ràng cho persister
type StoragePersister = ReturnType<typeof createSyncStoragePersister>;

const ReactQueryDevtoolsProduction = lazy(() =>
  import('@tanstack/react-query-devtools/build/modern/production.js').then(d => ({
    default: d.ReactQueryDevtools,
  })),
);

export default function QueryProvider({ children }: Props) {
  // Create a client với cấu hình mạnh hơn
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
            retry: 1,
            retryDelay: attempt => Math.min(1000 * 2 ** attempt, 30000),
            gcTime: 5 * 60 * 1000, // 5 phút
          },
          mutations: {
            retry: 1,
            retryDelay: attempt => Math.min(1000 * 2 ** attempt, 15000),
          },
        },
      }),
  );

  // Creating a persister using useState and useEffect to avoid hydration issues
  const [persister, setPersister] = useState<StoragePersister | null>(null);
  const [persistFailed, setPersistFailed] = useState(false);

  // Set up persister and error handling
  useEffect(() => {
    try {
      // Only create the persister on the client side
      // Thêm check để đảm bảo localStorage available
      if (typeof window !== 'undefined' && 'localStorage' in window) {
        // Set up storage error handling
        const handleStorageError = (event: ErrorEvent) => {
          if (event.message.includes('localStorage') || event.message.includes('storage')) {
            console.error('Error with localStorage detected');
            try {
              window.localStorage.removeItem('tbs-query-cache');
            } catch (e) {
              console.error('Failed to clear query cache:', e);
            }
          }
        };

        window.addEventListener('error', handleStorageError);

        const newPersister = createSyncStoragePersister({
          storage: window.localStorage,
          key: 'tbs-query-cache', // Sử dụng key cụ thể
          serialize: data => {
            try {
              return JSON.stringify(data);
            } catch (error) {
              console.error('Error serializing cache:', error);
              return '';
            }
          },
          deserialize: data => {
            try {
              return data ? JSON.parse(data) : {};
            } catch (error) {
              console.error('Error deserializing cache:', error);
              // Xóa cache hỏng
              window.localStorage.removeItem('tbs-query-cache');
              return {};
            }
          },
        });
        setPersister(newPersister);

        // Cleanup function
        return () => {
          window.removeEventListener('error', handleStorageError);
        };
      }
    } catch (error) {
      console.error('Error setting up query persister:', error);
      setPersistFailed(true);
    }
    // No cleanup needed if we didn't set up anything
    return () => {};
  }, []);

  // Render appropriate provider based on persister state
  if (!persister || persistFailed) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
        {process.env.NODE_ENV !== 'production' && (
          <Suspense fallback={null}>
            <ReactQueryDevtoolsProduction />
          </Suspense>
        )}
      </QueryClientProvider>
    );
  }

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        maxAge: 24 * 60 * 60 * 1000, // 1 ngày trong milliseconds
        buster:
          process.env.NODE_ENV === 'production'
            ? 'v1.0.0' // version trong production
            : Date.now().toString(), // timestamp trong development
      }}
      onSuccess={() => {
        console.log('Query cache successfully restored');
      }}
    >
      {children}
      {process.env.NODE_ENV !== 'production' && (
        <Suspense fallback={null}>
          <ReactQueryDevtoolsProduction />
        </Suspense>
      )}
    </PersistQueryClientProvider>
  );
}

// "use client";

// import { useState, useEffect, lazy, ReactNode, Suspense } from "react";
// import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
// import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";

// interface Props {
//     children: ReactNode;
// }

// const ReactQueryDevtoolsProduction = lazy(() =>
//     import('@tanstack/react-query-devtools/build/modern/production.js').then(
//         (d) => ({
//             default: d.ReactQueryDevtools,
//         }),
//     ),
// );

// export default function QueryProvider({ children }: Props) {
//     // Create a client
//     const [queryClient] = useState(() => new QueryClient({
//         defaultOptions: {
//             queries: {
//                 staleTime: 60 * 1000, // 1 minute
//                 refetchOnWindowFocus: false,
//                 retry: 1,
//             }
//         }
//     }));

//     // Creating a persister using useState and useEffect to avoid hydration issues
//     const [persister, setPersister] = useState<any>(null);

//     useEffect(() => {
//         // Only create the persister on the client side
//         setPersister(createSyncStoragePersister({
//             storage: window.localStorage,
//         }));
//     }, []);

//     // If we don't have a persister yet (server-side rendering),
//     // just use the regular QueryClientProvider
//     if (!persister) {
//         return (
//             <QueryClientProvider client={queryClient}>
//                 {children}
//                 <Suspense fallback={null}>
//                     <ReactQueryDevtoolsProduction />
//                 </Suspense>
//             </QueryClientProvider>
//         );
//     }

//     // Once we have the persister (client-side), use the PersistQueryClientProvider
//     return (
//         <PersistQueryClientProvider
//             client={queryClient}
//             persistOptions={{ persister }}
//             onSuccess={() => {
//                 // Optional: do something once the cache is restored
//                 console.log('Query cache successfully restored');
//             }}
//         >
//             {children}
//             <Suspense fallback={null}>
//                 <ReactQueryDevtoolsProduction />
//             </Suspense>
//         </PersistQueryClientProvider>
//     );
// }
