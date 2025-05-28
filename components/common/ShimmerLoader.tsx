'use client';

import { cn } from '@/lib/utils';

interface ShimmerLoaderProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
}

/**
 * ShimmerLoader component that displays a shimmering loading effect
 * Used for indicating that content is being loaded
 */
export function ShimmerLoader({
  className,
  width = '100%',
  height = '1rem',
  borderRadius = '0.25rem',
}: ShimmerLoaderProps) {
  return (
    <div
      className={cn(
        'animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:400%_100%]',
        className,
      )}
      style={{
        width,
        height,
        borderRadius,
        backgroundSize: '400% 100%',
        animation: 'shimmer 1.5s infinite linear',
      }}
      aria-hidden="true"
    />
  );
}

export default ShimmerLoader;
