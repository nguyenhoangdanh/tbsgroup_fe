import type { Metadata } from "next";
import "./globals.css";
import { DM_Sans } from "next/font/google";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/context/ThemeProvider";
import SagaProviders from "@/context/SagaProvider";
import QueryProvider from "@/context/QueryProvider";
import { AuthProvider } from "@/context/AuthProvider";
import { beVietnamPro } from "@/lib/fonts";
import RootLayoutWrapper from "@/components/common/layouts/admin/RootLayoutWrapper";

const dm_sans = DM_Sans({ subsets: ["latin"] });
export const metadata: Metadata = {
  title: "NMTXTS",
  description: "TBS Group - Thoai Son Handbag Factory"
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`bg-white ${beVietnamPro.variable} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem={false}
          disableTransitionOnChange
        >
          <SagaProviders>
            <QueryProvider>
              <AuthProvider>
                <RootLayoutWrapper>
                  <Toaster />
                  {children}
                </RootLayoutWrapper>
              </AuthProvider>
            </QueryProvider>
          </SagaProviders>
        </ThemeProvider>
      </body>
    </html >
  );
}
