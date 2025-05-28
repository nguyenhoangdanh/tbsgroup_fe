'use client';

import React, { ReactNode, useEffect, useRef } from 'react';

interface DialogFormWrapperProps {
  children: ReactNode;
  className?: string;
  maxHeight?: string; // Cho phép tùy chỉnh chiều cao tối đa
  scrollToBottom?: boolean; // Tùy chọn cuộn xuống dưới cùng khi hiển thị
}

/**
 * Component bọc Form cải tiến với khả năng cuộn tốt hơn
 * Tự động thiết lập chiều cao phù hợp và hỗ trợ cuộn
 */
const DialogFormWrapper: React.FC<DialogFormWrapperProps> = ({
  children,
  className = '',
  maxHeight = '70vh',
  scrollToBottom = false,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  //Xử lý cuộn xuống dưới cùng nếu cần
  useEffect(() => {
    if (scrollToBottom && scrollRef.current) {
      setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      }, 100);
    }
  }, [scrollToBottom, children]);

  // Đảm bảo scrollbar hoạt động đúng trên mobile
  useEffect(() => {
    const handleTouchMove = (e: TouchEvent) => {
      // Ngăn chặn cuộn trang nếu đang cuộn trong dialog
      if (scrollRef.current && scrollRef.current.contains(e.target as Node)) {
        e.stopPropagation();
      }
    };

    document.addEventListener('touchmove', handleTouchMove, { passive: false });

    return () => {
      document.removeEventListener('touchmove', handleTouchMove);
    };
  }, []);

  return (
    <div className="dialog-content-container">
      <div
        ref={scrollRef}
        className={`dialog-scrollable-wrapper ${className}`}
        style={{ maxHeight }}
      >
        <div className="fixed-form-wrapper">{children}</div>
      </div>
    </div>
  );
};

export default DialogFormWrapper;
