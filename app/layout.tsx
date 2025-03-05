import type { Metadata } from "next";
import "./globals.css";
import { DM_Sans } from "next/font/google";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/context/ThemeProvider";
import SagaProviders from "@/context/SagaProvider";
import QueryProvider from "@/context/QueryProvider";
import DialogProvider from "@/context/DialogProvider";
import { AuthProvider } from "@/context/AuthProvider";

const dm_sans = DM_Sans({ subsets: ["latin"] });
export const metadata: Metadata = {
  title: "NMTXTS",
  description: "TBS Group - Thoại Sơn Handbag Factory"
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`bg-white ${dm_sans.className} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem={false}
          disableTransitionOnChange
        >
          <SagaProviders>
            <QueryProvider>
              <AuthProvider>
                <DialogProvider>
                  <Toaster />
                  {children}
                </DialogProvider>
              </AuthProvider>
            </QueryProvider>
          </SagaProviders>
        </ThemeProvider>
      </body>
    </html >
  );
}
