'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';

interface ImageLogoProps {
  className?: string;
  variant?: 'light' | 'dark';
  width?: number;
  height?: number;
  fallbackText?: string;
  showGradient?: boolean;
}

export default function ImageLogo({
  className = '',
  variant = 'light',
  width = 150,
  height = 150,
  fallbackText = 'TBS',
  showGradient = true
}: ImageLogoProps) {
  const [imageSrc, setImageSrc] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    // CRITICAL FIX: Use actual logo paths
    const src = '/images/remove-bg-logo.png'; // Sử dụng logo chính từ public/images
    setImageSrc(src);
    setLoading(false);
  }, [variant]);

  // Xử lý lỗi hình ảnh
  const handleError = () => {
    console.error(`Failed to load image: ${imageSrc}`);
    setError(true);
  };

  if (loading) {
    return (
      <div
        className={`${className} flex items-center justify-center bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg animate-pulse`}
        style={{ width, height }}
      >
        <span className="text-white font-bold text-xs">Loading...</span>
      </div>
    );
  }

  if (error || !imageSrc) {
    return (
      <div
        className={`${className} flex items-center justify-center ${
          showGradient 
            ? 'bg-gradient-to-r from-green-500 to-emerald-500 shadow-lg' 
            : 'bg-green-500 dark:bg-green-600'
        } rounded-lg transition-all duration-300 hover:scale-105`}
        style={{ width, height }}
      >
        <span className="text-white font-bold drop-shadow-sm text-sm">
          {fallbackText}
        </span>
      </div>
    );
  }

  return (
    <div className={`${className} relative overflow-hidden`}>
      <Image
        src={imageSrc}
        alt="Thoai Son Handbag Factory Logo"
        width={width}
        height={height}
        className="object-contain transition-all duration-300 hover:scale-105"
        onError={handleError}
        priority={true}
        style={{
          maxWidth: '100%',
          height: 'auto',
          aspectRatio: `${width}/${height}`
        }}
      />
    </div>
  );
}
