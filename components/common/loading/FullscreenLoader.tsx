'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import React from 'react';

import { LoadingConfig } from './LoadingProvider';

import { useMediaQuery } from '@/hooks/useMediaQuery';

interface FullscreenLoaderProps {
  config: LoadingConfig;
  onExitComplete: () => void;
}

const FullscreenLoader: React.FC<FullscreenLoaderProps> = ({ config, onExitComplete }) => {
  const isMobile = useMediaQuery('(max-width: 640px)');
  const isTablet = useMediaQuery('(min-width: 641px) and (max-width: 1024px)');
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Increased loading circle sizes
  const size = isMobile ? 64 : isTablet ? 80 : 96;
  const borderWidth = isMobile ? 5 : 6;
  const logoSize = Math.floor(size * 0.6); // 60% of circle size for logo

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className={`fixed inset-0 z-[9999] flex items-center justify-center ${
        isDark ? 'bg-gray-900/80' : 'bg-black/50'
      } backdrop-blur-sm ${config.customClass || ''}`}
      onAnimationComplete={definition => {
        if (definition === 'exit') onExitComplete();
      }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
      }}
    >
      <div
        className={`flex flex-col items-center p-8 rounded-2xl shadow-xl ${
          isDark ? 'bg-gray-800/90' : 'bg-white/90'
        }`}
      >
        <div
          className="relative mb-6"
          style={{
            width: `${size}px`,
            height: `${size}px`,
          }}
        >
          {/* Outer spinning border */}
          <div
            className="absolute inset-0 rounded-full animate-spin"
            style={{
              borderWidth: `${borderWidth}px`,
              borderColor: 'transparent',
              borderTopColor: 'var(--primary)',
              borderRightColor: 'var(--primary)',
            }}
          />

          {/* Inner spinning border */}
          <div
            className="absolute inset-0 rounded-full animate-spin-reverse"
            style={{
              borderWidth: `${borderWidth}px`,
              borderColor: 'transparent',
              borderBottomColor: 'var(--primary-foreground)',
              borderLeftColor: 'var(--primary-foreground)',
            }}
          />

          {/* Inner circle background */}
          <div
            className={`absolute rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}
            style={{
              top: `${borderWidth}px`,
              left: `${borderWidth}px`,
              right: `${borderWidth}px`,
              bottom: `${borderWidth}px`,
            }}
          />

          {/* Logo container */}
          <div className="absolute inset-0 flex items-center justify-center animate-pulse">
            <div style={{ width: `${logoSize}px`, height: `${logoSize}px`, position: 'relative' }}>
              <Image
                src="/images/logo.png"
                alt="Company Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
          </div>
        </div>
        <h3
          className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-800'} animate-pulse`}
        >
          {config.message || 'Đang tải...'}
        </h3>
      </div>
    </motion.div>
  );
};

export default FullscreenLoader;
