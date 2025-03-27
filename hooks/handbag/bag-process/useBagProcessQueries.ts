import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { BagProcess } from '@/common/interface/handbag';
import { 
  getBagProcessesList, 
  getBagProcessById,
  BagProcessCondDTO
} from '@/apis/handbag/bagProcess.api';
import { toast } from '@/hooks/use-toast';
import { useBaseQueries } from '@/hooks/base/useBaseQueries';

/**
 * Hook for BagProcess queries
 */
export const useBagProcessQueries = () => {
  const queryClient = useQueryClient();
  
  /**
   * Handle query errors with toast notifications
   */
  const handleQueryError = useCallback((error: any, queryName: string) => {
    // Extract message safely
    let errorMessage = 'Lỗi không xác định';
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'object' && error !== null && 'message' in error) {
      errorMessage = error.message as string;
    }
    
    // Show toast with safe message
    toast({
      title: `Không thể tải dữ liệu ${queryName}`,
      description: errorMessage || 'Vui lòng thử lại sau',
      variant: 'destructive',
      duration: 3000,
    });
  }, []);

  // Use base queries hook for BagProcess queries
  const bagProcessQueries = useBaseQueries<BagProcess, BagProcessCondDTO>(
    'bagProcess',
    getBagProcessesList,
    getBagProcessById,
    undefined,
    handleQueryError
  );

  /**
   * Prefetch a bag process for better UX
   */
  const prefetchBagProcessById = useCallback(
    async (id: string) => {
      if (!id) return;

      try {
        await queryClient.prefetchQuery({
          queryKey: ['bagProcess', id],
          queryFn: async () => {
            const response = await getBagProcessById(id);
            return response;
          },
          staleTime: 5 * 60 * 1000, // 5 minutes
          gcTime: 60 * 60 * 1000, // 60 minutes
        });
      } catch (error) {
        console.error(`Failed to prefetch BagProcess with ID ${id}:`, error);
      }
    },
    [queryClient]
  );

  /**
   * Invalidate bagProcess cache
   */
  const invalidateBagProcessCache = useCallback(
    async (id: string, forceRefetch = false) => {
      if (!id) return;

      try {
        await queryClient.invalidateQueries({
          queryKey: ['bagProcess', id],
          refetchType: forceRefetch ? 'active' : 'none',
        });
      } catch (error) {
        console.error(`Failed to invalidate BagProcess cache for ID ${id}:`, error);
      }
    },
    [queryClient]
  );

  /**
   * Invalidate bagProcesses list cache
   */
  const invalidateBagProcessesCache = useCallback(
    async (forceRefetch = false) => {
      try {
        await queryClient.invalidateQueries({
          queryKey: ['bagProcess-list'],
          refetchType: forceRefetch ? 'active' : 'none',
        });
      } catch (error) {
        console.error('Failed to invalidate BagProcesses list cache:', error);
      }
    },
    [queryClient]
  );

  return {
    ...bagProcessQueries,
    prefetchBagProcessById,
    invalidateBagProcessCache,
    invalidateBagProcessesCache,
    listBagProcesses: bagProcessQueries.listItems,
    getBagProcessById: bagProcessQueries.getById
  };
};