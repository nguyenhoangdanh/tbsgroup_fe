'use client';

import React, { memo, useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '@/components/ui/pagination';
import { Input } from '@/components/ui/input';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { cn } from '@/lib/utils';

interface TablePaginationProps {
  // Pagination info
  current: number;
  pageSize: number;
  total: number;
  totalPages: number;
  
  // Display options
  pageSizeOptions?: number[];
  showSizeChanger?: boolean;
  showQuickJumper?: boolean;
  showTotal?: boolean;
  position?: 'top' | 'bottom' | 'both';
  hideOnSinglePage?: boolean;
  simple?: boolean;
  
  // Events
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  
  // State
  disabled?: boolean;
}

export const TablePagination = memo(({
  current,
  pageSize,
  total,
  totalPages,
  pageSizeOptions = [10, 20, 50, 100],
  showSizeChanger = true,
  showQuickJumper = false,
  showTotal = true,
  position = 'bottom',
  hideOnSinglePage = false,
  simple = false,
  onPageChange,
  onPageSizeChange,
  disabled = false,
}: TablePaginationProps) => {
  const isMobile = useMediaQuery('(max-width: 640px)');
  const isTablet = useMediaQuery('(min-width: 641px) and (max-width: 1024px)');
  const [jumpPageValue, setJumpPageValue] = useState('');
  
  // Calculate visible range of items
  const startItem = Math.min((current - 1) * pageSize + 1, total);
  const endItem = Math.min(current * pageSize, total);
  
  // Don't render if there's only one page and hideOnSinglePage is true
  if (hideOnSinglePage && totalPages <= 1) {
    return null;
  }
  
  // Don't render if there's no data
  if (total === 0) {
    return null;
  }

  // Generate page numbers with intelligent ellipses
  const generatePageNumbers = () => {
    const pages: (number | 'ellipsis')[] = [];
    const maxVisiblePages = isMobile ? 3 : isTablet ? 5 : 7;
    
    if (totalPages <= maxVisiblePages) {
      // Show all pages if there aren't many
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always include first page
      pages.push(1);
      
      // Calculate middle range
      const leftSide = Math.floor(maxVisiblePages / 2);
      const rightSide = maxVisiblePages - leftSide - 1;
      
      if (current <= leftSide + 1) {
        // Near the start
        for (let i = 2; i <= maxVisiblePages - 1; i++) {
          pages.push(i);
        }
        pages.push('ellipsis');
      } else if (current >= totalPages - rightSide) {
        // Near the end
        pages.push('ellipsis');
        for (let i = totalPages - maxVisiblePages + 2; i < totalPages; i++) {
          pages.push(i);
        }
      } else {
        // Middle - show current page with neighbors
        pages.push('ellipsis');
        const startPage = Math.max(2, current - Math.floor(leftSide / 2));
        const endPage = Math.min(totalPages - 1, current + Math.floor(rightSide / 2));
        
        for (let i = startPage; i <= endPage; i++) {
          pages.push(i);
        }
        
        if (endPage < totalPages - 1) {
          pages.push('ellipsis');
        }
      }
      
      // Always include last page if not already included
      if (pages[pages.length - 1] !== totalPages) {
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    if (disabled || page === current || page < 1 || page > totalPages) return;
    onPageChange(page);
  };

  // Handle page size change
  const handlePageSizeChange = (value: string) => {
    if (disabled) return;
    onPageSizeChange(parseInt(value, 10));
  };

  // Handle quick jump to page
  const handleQuickJump = () => {
    const page = parseInt(jumpPageValue, 10);
    if (isNaN(page) || page < 1 || page > totalPages) {
      setJumpPageValue('');
      return;
    }
    
    handlePageChange(page);
    setJumpPageValue('');
  };

  // Calculate page numbers to display
  const pageNumbers = generatePageNumbers();
  
  // Render simple mode for mobile
  if (simple || isMobile) {
    return (
      <div className="flex items-center justify-between py-4">
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          {showTotal && (
            <span>
              {startItem}-{endItem} / {total}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            onClick={() => handlePageChange(current - 1)}
            disabled={current === 1 || disabled}
            className="h-8 w-8"
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          {showQuickJumper && (
            <Input 
              type="number"
              className="h-8 w-12 text-center"
              min={1}
              max={totalPages}
              value={jumpPageValue}
              onChange={(e) => setJumpPageValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleQuickJump()}
              disabled={disabled}
            />
          )}
          
          {!showQuickJumper && (
            <span className="mx-2 text-sm">
              {current} / {totalPages}
            </span>
          )}
          
          <Button
            variant="outline"
            size="icon"
            onClick={() => handlePageChange(current + 1)}
            disabled={current === totalPages || disabled}
            className="h-8 w-8"
            aria-label="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          
          {showSizeChanger && (
            <Select 
              value={String(pageSize)} 
              onValueChange={handlePageSizeChange}
              disabled={disabled}
            >
              <SelectTrigger className="h-8 w-[70px] ml-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size} / trang
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>
    );
  }
  
  // Render full pagination (desktop)
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4">
      {/* Left side - Total info and page size selector */}
      <div className="flex flex-col sm:flex-row items-center gap-4 text-sm text-muted-foreground">
        {showTotal && (
          <div className="flex items-center gap-2">
            <span>
              Hiển thị {startItem}-{endItem} trên {total} mục
            </span>
          </div>
        )}

        {showSizeChanger && (
          <div className="flex items-center gap-2 whitespace-nowrap">
            <span>Hiển thị</span>
            <Select 
              value={String(pageSize)} 
              onValueChange={handlePageSizeChange}
              disabled={disabled}
            >
              <SelectTrigger className="h-8 w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span>mỗi trang</span>
          </div>
        )}
      </div>

      {/* Center - Quick jumper (optional) */}
      {showQuickJumper && totalPages > 1 && (
        <div className="flex items-center gap-2 text-sm">
          <span>Đến trang</span>
          <Input
            type="number"
            min={1}
            max={totalPages}
            value={jumpPageValue}
            onChange={(e) => setJumpPageValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleQuickJump()}
            className="w-16 h-8 px-2 py-1 text-center"
            disabled={disabled}
          />
        </div>
      )}

      {/* Right side - Pagination controls */}
      {totalPages > 1 && (
        <div className="flex items-center gap-2">
          {/* First page */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(1)}
            disabled={current === 1 || disabled}
            className="h-8 w-8 p-0"
            aria-label="First page"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>

          {/* Previous page */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(current - 1)}
            disabled={current === 1 || disabled}
            className="h-8 w-8 p-0"
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {/* Page numbers */}
          <Pagination>
            <PaginationContent>
              {pageNumbers.map((page, index) =>
                page === 'ellipsis' ? (
                  <PaginationItem key={`ellipsis-${index}`}>
                    <PaginationEllipsis />
                  </PaginationItem>
                ) : (
                  <PaginationItem key={page}>
                    <PaginationLink
                      isActive={page === current}
                      onClick={() => handlePageChange(page)}
                      className={cn(
                        disabled ? 'pointer-events-none opacity-50' : 'cursor-pointer'
                      )}
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                )
              )}
            </PaginationContent>
          </Pagination>

          {/* Next page */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(current + 1)}
            disabled={current === totalPages || disabled}
            className="h-8 w-8 p-0"
            aria-label="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          {/* Last page */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(totalPages)}
            disabled={current === totalPages || disabled}
            className="h-8 w-8 p-0"
            aria-label="Last page"
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
});

TablePagination.displayName = 'TablePagination';