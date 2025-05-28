import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { getBagColorsList, getBagColorById } from '@/apis/handbag/handbag.api';
import { BagColor, BagColorCondDTO } from '@/common/interface/handbag';
import { toast } from 'react-toast-kit';
import { useBaseQueries } from '@/hooks/base/useBaseQueries';

/**
 * Hook for BagColor queries
 */
export const useBagColorQueries = () => {
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

    toast({
      title: `Không thể tải dữ liệu ${queryName}`,
      description: errorMessage || 'Vui lòng thử lại sau',
      variant: 'error',
      duration: 3000,
    });
  }, []);

  const bagColorQueries = useBaseQueries<BagColor, BagColorCondDTO>(
    'bagColor',
    getBagColorsList,
    getBagColorById,
    undefined,
    handleQueryError,
  );

  /**
   * Get colors for a specific handbag
   */
  const getHandBagColors = useCallback(
    (handBagId?: string, options?: { enabled?: boolean }) => {
      return bagColorQueries.listItems(
        {
          handBagId: handBagId || '',
          limit: 100,
          page: 1,
        },
        {
          enabled: !!handBagId && options?.enabled !== false,
        },
      );
    },
    [bagColorQueries],
  );

  /**
   * Prefetch colors for a specific handbag
   */
  const prefetchHandBagColors = useCallback(
    async (handBagId: string) => {
      if (!handBagId) return;

      try {
        await queryClient.prefetchQuery({
          queryKey: ['bagColor-list', { handBagId, limit: 100, page: 1 }],
          queryFn: () => {
            return getBagColorsList({ handBagId, limit: 100, page: 1 });
          },
          staleTime: 5 * 60 * 1000, // 5 minutes
        });
      } catch (error) {
        console.error(`Failed to prefetch colors for handbag ${handBagId}:`, error);
      }
    },
    [queryClient],
  );

  return {
    ...bagColorQueries,
    getHandBagColors,
    prefetchHandBagColors,
  };
};
