import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/context/ThemeProvider";
import SagaProviders from "@/context/SagaProvider";
import QueryProvider from "@/context/QueryProvider";
import { beVietnamPro } from "@/lib/fonts";
import RootLayoutWrapper from "@/components/common/layouts/admin/RootLayoutWrapper";
import { AuthSecurityProvider } from "@/context/AuthProvider";
import ActivityMonitor from "@/components/security/ActivityMonitor";
import Script from "next/script";
import SecurityBanner from "@/components/security/SecurityBanner";
import ClientProviders from "@/context/ClientProviders";
import { LoadingProvider } from "@/components/common/loading/LoadingProvider";
export const metadata: Metadata = {
  title: "Thoai Son Handbag Factory",
  description: "TBS Group - Thoai Son Handbag Factory"
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="csp-nonce" content="random-nonce-123" />
        <meta name="csrf-token" content="" />
      </head>
      <body className={`default-theme default-hover ${beVietnamPro.variable} antialiased`}>
        {/* Sử dụng Script với chiến lược afterInteractive */}
        <Script
          id="csrf-script"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const generateToken = () => {
                  // Sử dụng phương thức mạnh hơn để tạo token
                  let token;
                  if (crypto.randomUUID) {
                    token = crypto.randomUUID();
                  } else if (crypto.getRandomValues) {
                    token = Array.from(crypto.getRandomValues(new Uint8Array(16)))
                      .map(b => b.toString(16).padStart(2, '0'))
                      .join('');
                  } else {
                    // Fallback kém an toàn hơn
                    token = Math.random().toString(36).substring(2, 15) +
                            Math.random().toString(36).substring(2, 15);
                  }
                  
                  // Thêm secure flag và max-age
                  const secure = window.location.protocol === 'https:' ? '; secure' : '';
                  const maxAge = 30 * 60; // 30 phút
                  document.cookie = 'csrf-token=' + token + '; path=/; samesite=strict' + secure + '; max-age=' + maxAge;

                   // Kiểm tra xem token đã tồn tại chưa trước khi tạo mới
  const existingToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
  if (existingToken && existingToken !== "") {
    return existingToken;
  }
                  
                  // Cập nhật meta tag
                  let meta = document.querySelector('meta[name="csrf-token"]');
                  if (!meta) {
                    meta = document.createElement('meta');
                    meta.name = 'csrf-token';
                    document.head.appendChild(meta);
                  }
                  meta.content = token;
                  
                  // Thêm token vào localStorage để có thể sử dụng cho requests
                  localStorage.setItem('csrf-token', token);
                  
                  // Lưu thời gian hoạt động cuối
                  localStorage.setItem('last_activity', Date.now().toString());
                  
                  return token;
                };
                
                // Thêm token vào tất cả fetch/XMLHttpRequest
                const originalFetch = window.fetch;
                window.fetch = function(url, options = {}) {
                  const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
                  if (token) {
                    options.headers = options.headers || {};
                    if (options.headers instanceof Headers) {
                      options.headers.append('X-CSRF-Token', token);
                    } else {
                      options.headers = {
                        ...options.headers,
                        'X-CSRF-Token': token
                      };
                    }
                  }
                  return originalFetch(url, options);
                };
                
                // Patch XMLHttpRequest
                const originalOpen = XMLHttpRequest.prototype.open;
                XMLHttpRequest.prototype.open = function() {
                  const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
                  this.addEventListener('readystatechange', function() {
                    if (this.readyState === 1 && token) {
                      this.setRequestHeader('X-CSRF-Token', token);
                    }
                  });
                  originalOpen.apply(this, arguments);
                };
                
                // Tạo token khi trang tải
                const token = generateToken();
                
                // Làm mới token mỗi 30 phút
                setInterval(generateToken, 30 * 60 * 1000);
                
                // Làm mới token trên hoạt động của người dùng nếu token gần hết hạn
                ['mousedown', 'keydown', 'touchstart', 'scroll'].forEach(event => {
                  window.addEventListener(event, () => {
                    const lastActivity = parseInt(localStorage.getItem('last_activity') || '0', 10);
                    const now = Date.now();
                    // Làm mới nếu đã qua 20 phút
                    if (now - lastActivity > 20 * 60 * 1000) {
                      generateToken();
                    }
                    localStorage.setItem('last_activity', now.toString());
                  }, { passive: true });
                });
                
                console.log('CSRF protection initialized');
              } catch (e) {
                console.error('Failed to set CSRF token:', e);
              }
            `
          }}
        />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem={false}
          disableTransitionOnChange
        >
          <SagaProviders>
            <QueryProvider>
              <AuthSecurityProvider>
                <ActivityMonitor />
                <RootLayoutWrapper>
                  <ClientProviders>
                    {/* <SecurityBanner /> */}
                    <Toaster />
                    <LoadingProvider>
                      {children}
                    </LoadingProvider>
                  </ClientProviders>
                </RootLayoutWrapper>
              </AuthSecurityProvider>
            </QueryProvider>
          </SagaProviders>
        </ThemeProvider>
      </body>
    </html >
  );
}
