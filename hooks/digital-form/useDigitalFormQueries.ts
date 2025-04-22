// hooks/digital-form/useDigitalFormQueries.ts
import { useQuery, useQueryClient, UseQueryResult } from '@tanstack/react-query';
import { DigitalFormService, DigitalFormCondition, PaginationParams } from '@/services/form/digitalFormService';
import { DigitalForm, DigitalFormEntry, RecordStatus } from '@/common/types/digital-form';
import { useCallback, useMemo } from 'react';
import { format } from 'date-fns';

// Define response types for better type safety
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ListApiResponse<T> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  limit: number;
}

// Cache duration constants
const STALE_TIMES = {
  LIST: 60 * 1000,         // 1 minute
  DETAIL: 2 * 60 * 1000,   // 2 minutes
  ENTRIES: 60 * 1000,      // 1 minute
  PRINT: 10 * 60 * 1000    // 10 minutes
};

const GC_TIMES = {
  LIST: 5 * 60 * 1000,     // 5 minutes
  DETAIL: 10 * 60 * 1000,  // 10 minutes
  ENTRIES: 5 * 60 * 1000,  // 5 minutes 
  PRINT: 30 * 60 * 1000    // 30 minutes
};

// Retry configuration for network resilience
const RETRY_CONFIG = {
  DEFAULT_RETRIES: 2,
  MAX_DELAY: 10000, // 10 seconds
  calculateDelay: (attemptIndex: number) => Math.min(1000 * Math.pow(1.5, attemptIndex), 10000)
};

/**
 * Hook để quản lý tất cả các queries liên quan đến Digital Form
 * Tối ưu hiệu suất cho ứng dụng quy mô lớn (5000+ users)
 */
export const useDigitalFormQueries = () => {
  const queryClient = useQueryClient();
  
  // Create stable query keys to prevent unnecessary refetches
  const createStableQueryKey = useCallback((params: Record<string, any>) => {
    return Object.entries(params)
      .filter(([_, value]) => value !== undefined && value !== null && value !== '')
      .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
      .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});
  }, []);
  
  // Helper for formatting date parameters consistently
  const formatDateParams = useCallback((params: DigitalFormCondition & PaginationParams = {}) => {
    const formattedParams = { ...params };
    
    // Format date parameters if they exist and are Date objects
    if (params.dateFrom instanceof Date) {
      formattedParams.dateFrom = format(params.dateFrom, 'yyyy-MM-dd');
    }
    
    if (params.dateTo instanceof Date) {
      formattedParams.dateTo = format(params.dateTo, 'yyyy-MM-dd');
    }
    
    return formattedParams;
  }, []);

  /**
   * List forms with filtering and pagination - optimized with stable keys
   */
  const listForms = (
    params: DigitalFormCondition & PaginationParams = {}
  ): UseQueryResult<ListApiResponse<DigitalForm>, Error> => {
    const formattedParams = formatDateParams(params);
    const stableParams = useMemo(() => createStableQueryKey(formattedParams), [formattedParams]);
    
    return useQuery<ListApiResponse<DigitalForm>, Error>({
      queryKey: ['digital-forms', stableParams],
      queryFn: async () => {
        // return await DigitalFormService.listForms(formattedParams);
        try {
          const response = await DigitalFormService.listForms(formattedParams);
          console.log('API Response:', response); // Log toàn bộ response
          return response;
        } catch (error) {
          console.error('API Error Details:', error);
          throw error; // Re-throw để React Query xử lý
        } 
      },
      staleTime: STALE_TIMES.LIST,
      gcTime: GC_TIMES.LIST,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      retry: RETRY_CONFIG.DEFAULT_RETRIES,
      retryDelay: (attemptIndex) => RETRY_CONFIG.calculateDelay(attemptIndex),
    });
  };

  /**
   * Get form detail by ID with optimized caching
   */
  const getForm = (
    id: string, 
    options?: { enabled?: boolean }
  ): UseQueryResult<ApiResponse<DigitalForm>, Error> => {
    return useQuery<ApiResponse<DigitalForm>, Error>({
      queryKey: ['digital-form', id],
      queryFn: async () => {
        return await DigitalFormService.getForm(id);
      },
      enabled: !!id && (options?.enabled !== false),
      staleTime: STALE_TIMES.DETAIL,
      gcTime: GC_TIMES.DETAIL,
      retry: RETRY_CONFIG.DEFAULT_RETRIES,
      retryDelay: (attemptIndex) => RETRY_CONFIG.calculateDelay(attemptIndex),
    });
  };

  /**
   * Get form with all entries - better typing and optimized caching
   */
  const getFormWithEntries = (
    id: string, 
    options?: { enabled?: boolean }
  ): UseQueryResult<ApiResponse<{form: DigitalForm; entries: DigitalFormEntry[]}>, Error> => {
    return useQuery<ApiResponse<{form: DigitalForm; entries: DigitalFormEntry[]}>, Error>({
      queryKey: ['digital-form-with-entries', id],
      queryFn: async () => {
        return await DigitalFormService.getFormWithEntries(id);
      },
      enabled: !!id && (options?.enabled !== false),
      staleTime: STALE_TIMES.ENTRIES,
      gcTime: GC_TIMES.ENTRIES,
      retry: RETRY_CONFIG.DEFAULT_RETRIES,
      retryDelay: (attemptIndex) => RETRY_CONFIG.calculateDelay(attemptIndex),
    });
  };
  
  /**
   * Get form print version - longer cache time for static content
   */
  const getFormPrintVersion = (
    id: string, 
    options?: { enabled?: boolean }
  ): UseQueryResult<ApiResponse<{form: DigitalForm; entries: DigitalFormEntry[]}>, Error> => {
    return useQuery<ApiResponse<{form: DigitalForm; entries: DigitalFormEntry[]}>, Error>({
      queryKey: ['digital-form-print', id],
      queryFn: async () => {
        return await DigitalFormService.getPrintVersion(id);
      },
      enabled: !!id && (options?.enabled !== false),
      staleTime: STALE_TIMES.PRINT,
      gcTime: GC_TIMES.PRINT,
      retry: 1, // Only retry once for print versions since they're less critical
    });
  };

  /**
   * Get form statistics (for dashboards)
   */
  const getFormStats = (
    params: { period?: 'day' | 'week' | 'month' | 'year' } = {}, 
    options?: { enabled?: boolean }
  ): UseQueryResult<ApiResponse<any>, Error> => {
    return useQuery<ApiResponse<any>, Error>({
      queryKey: ['digital-form-stats', params],
      queryFn: async () => {
        // Giả định phương thức này tồn tại trong service
        return await DigitalFormService.getFormStats(params);
      },
      enabled: options?.enabled !== false,
      staleTime: 5 * 60 * 1000, // 5 minutes - stats don't change frequently
      gcTime: 30 * 60 * 1000, // 30 minutes
      retry: 1,
    });
  };

  return {
    listForms,
    getForm,
    getFormWithEntries,
    getFormPrintVersion,
    getFormStats,
    // Expose helpers for other hooks
    createStableQueryKey,
    formatDateParams,
  };
};