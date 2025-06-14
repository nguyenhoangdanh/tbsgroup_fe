'use client';

import { ThemeProvider } from 'next-themes';
import React from 'react';
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
