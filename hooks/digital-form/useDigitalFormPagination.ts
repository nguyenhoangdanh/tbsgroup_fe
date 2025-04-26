// hooks/useDigitalFormPagination.ts
import { useState, useCallback, useMemo } from 'react';
import { TPaginationParams } from '@/schemas/digital-form.schema';

/**
 * Hook for managing pagination state and functionality for digital forms
 */
export const useDigitalFormPagination = (
  initialPagination?: Partial<TPaginationParams>,
  onPageChange?: (page: number) => void
) => {
  // Default pagination values
  const defaultPagination: TPaginationParams = {
    page: initialPagination?.page || 1,
    limit: initialPagination?.limit || 10,
    sortBy: initialPagination?.sortBy || 'createdAt',
    sortOrder: initialPagination?.sortOrder || 'desc',
  };

  // State for pagination
  const [pagination, setPagination] = useState<TPaginationParams>(defaultPagination);
  
  // Total number of items (can be updated by the parent component)
  const [totalItems, setTotalItems] = useState<number>(0);

  // Calculate total pages
  const totalPages = useMemo(() => {
    if (totalItems === 0 || pagination.limit === 0) return 0;
    return Math.ceil(totalItems / pagination.limit);
  }, [totalItems, pagination.limit]);

  // Go to a specific page
  const goToPage = useCallback((page: number) => {
    // Ensure page is within valid range
    const validPage = Math.max(1, Math.min(page, totalPages || 1));
    
    // Only update if page actually changes
    if (validPage !== pagination.page) {
      setPagination(prev => ({ ...prev, page: validPage }));
      if (onPageChange) {
        onPageChange(validPage);
      }
    }
  }, [pagination.page, totalPages, onPageChange]);

  // Go to next page
  const nextPage = useCallback(() => {
    if (pagination.page < (totalPages || 1)) {
      goToPage(pagination.page + 1);
    }
  }, [pagination.page, totalPages, goToPage]);

  // Go to previous page
  const prevPage = useCallback(() => {
    if (pagination.page > 1) {
      goToPage(pagination.page - 1);
    }
  }, [pagination.page, goToPage]);

  // Go to first page
  const firstPage = useCallback(() => {
    goToPage(1);
  }, [goToPage]);

  // Go to last page
  const lastPage = useCallback(() => {
    goToPage(totalPages || 1);
  }, [goToPage, totalPages]);

  // Change items per page (limit)
  const setItemsPerPage = useCallback((limit: number) => {
    // Reset to page 1 when changing items per page
    setPagination(prev => ({ 
      ...prev, 
      limit,
      page: 1 
    }));
    
    if (onPageChange) {
      onPageChange(1);
    }
  }, [onPageChange]);

  // Update sort options
  const updateSort = useCallback((sortBy: string, sortOrder: 'asc' | 'desc' = 'desc') => {
    // Keep same page when sorting changes
    setPagination(prev => ({ 
      ...prev, 
      sortBy,
      sortOrder
    }));
  }, []);

  // Reset pagination to defaults
  const resetPagination = useCallback(() => {
    setPagination(defaultPagination);
    
    if (defaultPagination.page !== pagination.page && onPageChange) {
      onPageChange(defaultPagination.page);
    }
  }, [defaultPagination, pagination.page, onPageChange]);

  // Generate an array of page numbers for pagination UI
  const pageNumbers = useMemo(() => {
    if (totalPages <= 7) {
      // Show all pages if there are 7 or fewer
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    // Otherwise show a window around the current page
    const currentPage = pagination.page;
    let pages: (number | string)[] = [];

    if (currentPage <= 4) {
      // Near the start
      pages = [1, 2, 3, 4, 5, '...', totalPages];
    } else if (currentPage >= totalPages - 3) {
      // Near the end
      pages = [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    } else {
      // In the middle
      pages = [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
    }

    return pages;
  }, [pagination.page, totalPages]);

  return {
    // State
    pagination,
    totalItems,
    totalPages,
    pageNumbers,
    
    // UI helpers
    canPrevPage: pagination.page > 1,
    canNextPage: pagination.page < (totalPages || 1),
    isFirstPage: pagination.page === 1,
    isLastPage: pagination.page === (totalPages || 1),
    
    // Actions
    setPagination,
    setTotalItems,
    goToPage,
    nextPage,
    prevPage,
    firstPage,
    lastPage,
    setItemsPerPage,
    updateSort,
    resetPagination,
  };
};