'use client';

import React from 'react';
import { ToastProvider, ToastPosition, ToastTheme, ToastAnimation, ToastStyle } from 'react-toast-kit';

interface ClientToastProviderProps {
  children: React.ReactNode;
  defaultPosition?: ToastPosition;
  defaultTheme?: ToastTheme;
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
  defaultTheme = 'system',
  defaultAnimation = 'slide',
  defaultStyle = 'solid',
  maxToasts = 3,
  topOffset = 10,
  bottomOffset,
  leftOffset,
  rightOffset,
  enableAccessibleAnnouncements =false,
  enableDevMode = false,
  defaultDuration = 3000, // Default duration for toasts
}: ClientToastProviderProps) {
  return (
    <ToastProvider
      position={defaultPosition}
      theme={defaultTheme}
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