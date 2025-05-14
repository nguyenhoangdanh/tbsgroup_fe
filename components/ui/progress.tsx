// components/CustomProgress.tsx
'use client';

import { cn } from '@/lib/utils';
import { CSSProperties } from 'react';

interface CustomProgressProps {
  /**
   * Giá trị tiến độ từ 0-100
   */
  value?: number;
  /**
   * Màu thanh trên (màu hiển thị tiến độ)
   */
  foregroundColor?: string;
  /**
   * Màu thanh dưới (màu nền)
   */
  backgroundColor?: string;
  /**
   * Chiều cao của thanh tiến độ
   */
  height?: string;
  /**
   * CSS class bổ sung
   */
  className?: string;
  /**
   * Hiển thị giá trị phần trăm
   */
  showValue?: boolean;
  /**
   * Thêm hiệu ứng chuyển động
   */
  animate?: boolean;
}

export function Progress({
  value = 0,
  foregroundColor = 'bg-primary',
  backgroundColor = 'bg-muted',
  height = 'h-2',
  className = 'rounded-full',
  showValue = false,
  animate = false,
}: CustomProgressProps) {
  // Đảm bảo giá trị nằm trong khoảng 0-100
  const safeValue = Math.max(0, Math.min(100, value));

  return (
    <div className={cn('w-full overflow-hidden rounded-full', backgroundColor, height, className)}>
      <div
        className={cn(foregroundColor, 'h-full transition-all duration-300', {
          'animate-pulse': animate,
        })}
        style={{ width: `${safeValue}%` } as CSSProperties}
      >
        {showValue && (
          <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white">
            {safeValue}%
          </span>
        )}
      </div>
    </div>
  );
}
