'use client';
import React from 'react';

import { useMediaQuery } from '@/hooks/useMediaQuery';

import AuthImage from '../layouts/auth/AuthImage';


const LazyLoader = () => {
  const isMobile = useMediaQuery('(max-width: 640px)');
  const isTablet = useMediaQuery('(min-width: 641px) and (max-width: 1024px)');

  const imageSize = isMobile ? 30 : isTablet ? 40 : 50;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-transparent pointer-events-none">
      <div className="text-center flex flex-col items-center bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm p-4 sm:p-6 md:p-8 rounded-xl shadow-lg pointer-events-auto max-w-[90%] w-auto">
        <div className="relative w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 mb-3 sm:mb-4 md:mb-6">
          {/* Logo placed inside the animated circle */}
          <div className="absolute inset-0 border-3 sm:border-4 border-transparent border-t-primary border-r-primary rounded-full animate-spin"></div>
          <div className="absolute inset-0 border-3 sm:border-4 border-transparent border-b-primary-foreground border-l-primary-foreground rounded-full animate-spin-reverse"></div>
          <div className="absolute inset-0 border-3 sm:border-4 border-gray-200 rounded-full"></div>

          {/* AuthImage Logo centered inside the circle */}
          <div className="absolute inset-0 flex items-center justify-center animate-pulse-slow">
            <AuthImage width={imageSize} height={imageSize} />
          </div>
        </div>
        <div className="space-y-2 sm:space-y-3">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100 tracking-wide animate-pulse-slow">
            Đang tải
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-gray-600 dark:text-gray-300 animate-pulse">
            Vui lòng chờ trong giây lát...
          </p>
        </div>
      </div>
    </div>
  );
};

export default LazyLoader;
