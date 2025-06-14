'use client';

import React from 'react';
import { ThemeProvider } from 'next-themes';
interface RootLayoutWrapperProps {
  children: React.ReactNode;
}

const RootLayoutWrapper = ({ children }: RootLayoutWrapperProps) => {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange={false}
      storageKey="daily-performance-theme"
    >
      {children}
    </ThemeProvider>
  );
};

export default RootLayoutWrapper;
