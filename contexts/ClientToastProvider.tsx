'use client';

import { useTheme } from 'next-themes';
import React from 'react';
import { ToastProvider, ToastPosition, ToastTheme, ToastAnimation, ToastStyle } from 'react-toast-kit';

interface ClientToastProviderProps {
  children: React.ReactNode;
  defaultPosition?: ToastPosition;
  defaultAnimation?: ToastAnimation;
  defaultStyle?: ToastStyle;
  maxToasts?: number;
  topOffset?: number;
  bottomOffset?: number;
  leftOffset?: number;
  rightOffset?: number;
  enableAccessibleAnnouncements?: boolean;
  enableDevMode?: boolean;
  defaultDuration?: number;
}

export function ClientToastProvider({
  children,
  defaultPosition = 'top-right',
  defaultAnimation = 'slide',
  defaultStyle = 'solid',
  maxToasts = 3,
  topOffset = 10,
  bottomOffset,
  leftOffset,
  rightOffset,
  enableAccessibleAnnouncements =false,
  enableDevMode = false,
  defaultDuration = 4000, // Default duration for toasts
}: ClientToastProviderProps) {
  const { theme } = useTheme();

  const convertTheme = (theme: string | undefined): ToastTheme => {
    if (theme === 'dark') return 'dark';
    if (theme === 'light' || !theme) return 'light';
    return 'system';
  };

  return (
    <ToastProvider
      position={defaultPosition}
      theme={convertTheme(theme)}
      maxToasts={maxToasts}
      defaultAnimation={defaultAnimation}
      defaultStyle={defaultStyle}
      topOffset={topOffset}
      bottomOffset={bottomOffset}
      leftOffset={leftOffset}
      rightOffset={rightOffset}
      enableAccessibleAnnouncements={enableAccessibleAnnouncements}
      enableDevMode={enableDevMode}
      suppressHydrationWarning={true}
      defaultDuration={defaultDuration}
    >
      {children}
    </ToastProvider>
  );
}