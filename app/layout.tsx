import { Metadata } from 'next';
import Script from 'next/script';

import RootLayoutWrapper from '@/components/common/layouts/admin/RootLayoutWrapper';
import { LoadingProvider } from '@/components/common/loading/LoadingProvider';
import { ClientToastProvider } from '@/contexts/ClientToastProvider';
  import DataTableProviderWrapper from '@/contexts/DataTableProviderWrapper';
import { MainProviders } from '@/contexts/MainProviders';
import { beVietnamPro } from '@/lib/fonts';

import './globals.css';

// Environment detection
const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = process.env.NODE_ENV === 'development';

export const metadata: Metadata = {
  title: 'Thoai Son Handbag Factory',
  description: 'TBS Group - Thoai Son Handbag Factory',
  ...(isProduction && {
    other: {
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
    },
  }),
};

// Security script (simplified)
const SecurityScript = () => (
  <Script
    id="security-script"
    strategy="beforeInteractive"
    dangerouslySetInnerHTML={{
      __html: `
        (function() {
          'use strict';
          
          const config = {
            isProduction: ${isProduction},
            enableCSRF: ${isProduction},
          };
          
          function generateSecureToken() {
            try {
              if (window.crypto && window.crypto.randomUUID) {
                return window.crypto.randomUUID();
              }
              return 'fallback-' + Date.now() + '-' + Math.random().toString(36).substring(2);
            } catch (e) {
              return 'fallback-' + Date.now() + '-' + Math.random().toString(36).substring(2);
            }
          }
          
          function setCSRFToken() {
            if (!config.enableCSRF) return;
            const token = generateSecureToken();
            const maxAge = 30 * 60;
            const secure = window.location.protocol === 'https:' ? '; Secure' : '';
            const sameSite = config.isProduction ? '; SameSite=Strict' : '; SameSite=Lax';
            
            document.cookie = \`csrf-token=\${token}; Path=/; Max-Age=\${maxAge}\${secure}\${sameSite}\`;
            
            let meta = document.querySelector('meta[name="csrf-token"]');
            if (!meta) {
              meta = document.createElement('meta');
              meta.setAttribute('name', 'csrf-token');
              document.head.appendChild(meta);
            }
            meta.setAttribute('content', token);
            return token;
          }
          
          function initialize() {
            const token = setCSRFToken();
            const sessionId = sessionStorage.getItem('sessionId') || generateSecureToken();
            sessionStorage.setItem('sessionId', sessionId);
            
            window.__security = {
              getCSRFToken: () => document.querySelector('meta[name="csrf-token"]')?.getAttribute('content'),
              refreshCSRFToken: setCSRFToken,
              getSessionId: () => sessionId,
            };
            
            if (!config.isProduction) {
              console.log('[Security] Initialized');
            }
          }
          
          if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initialize);
          } else {
            initialize();
          }
        })();
      `,
    }}
  />
);

// Analytics script
const AnalyticsScript = () => {
  if (!isProduction || !process.env.NEXT_PUBLIC_GA_ID) return null;

  return (
    <Script
      src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
      strategy="afterInteractive"
    />
  );
};

// Loading fallback
const AppLoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p className="text-gray-600">Loading application...</p>
    </div>
  </div>
);

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="csrf-token" content="" />
        {isProduction && (
          <>
            <meta httpEquiv="X-Frame-Options" content="DENY" />
            <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
            <meta name="referrer" content="strict-origin-when-cross-origin" />
          </>
        )}
        {process.env.NEXT_PUBLIC_API_BASE_URL && (
          <link rel="preconnect" href={process.env.NEXT_PUBLIC_API_BASE_URL} />
        )}
      </head>

      <body className={`default-theme default-hover ${beVietnamPro.variable} antialiased`}>
        <SecurityScript />
        <AnalyticsScript />

        {/* <Suspense fallback={<AppLoadingFallback />}> */}
          <ClientToastProvider>
            <MainProviders>
                <RootLayoutWrapper>
                <LoadingProvider>
                  <DataTableProviderWrapper>
                    {children}
                  </DataTableProviderWrapper>
                  </LoadingProvider>
                </RootLayoutWrapper>
            </MainProviders>
          </ClientToastProvider>
        {/* </Suspense> */}

        {isDevelopment && (
          <Script
            id="dev-tools"
            strategy="lazyOnload"
            dangerouslySetInnerHTML={{
              __html: `
                window.__dev = {
                  clearCache: () => {
                    localStorage.clear();
                    sessionStorage.clear();
                    console.log('Cache cleared');
                  },
                  getAuthState: () => {
                    try {
                      return JSON.parse(localStorage.getItem('persist:root') || '{}');
                    } catch {
                      return null;
                    }
                  },
                };
                console.log('Dev tools: window.__dev');
              `,
            }}
          />
        )}
      </body>
    </html>
  );
}
