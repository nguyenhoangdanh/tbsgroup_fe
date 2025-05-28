import { useQuery, useQueryClient } from '@tanstack/react-query';

import { getHandBagFullDetails } from '@/apis/handbag/handbag.api';
import { HandBag, BagColor, BagColorProcess } from '@/common/interface/handbag';
import { toast } from 'react-toast-kit';

/**
 * Extended type for a HandBag with its colors and processes
 */
export interface HandBagWithDetails extends HandBag {
  colors: (BagColor & {
    processes: BagColorProcess[];
  })[];
}

/**
 * Hook for working with the full handbag details (including colors and processes)
 */
export const useHandBagDetails = (handBagId?: string, options?: { enabled?: boolean }) => {
  const queryClient = useQueryClient();

  // Query for fetching full handbag details
  const handBagDetailsQuery = useQuery<HandBagWithDetails, Error>({
    queryKey: ['handBag', handBagId, 'fullDetails'],
    queryFn: async () => {
      if (!handBagId) throw new Error('HandBag ID is required');
      try {
        // Trả về trực tiếp từ API (đã là HandBagWithDetails)
        return await getHandBagFullDetails(handBagId);
      } catch (error) {
        let errorMessage = 'Lỗi không xác định';
        if (error instanceof Error) {
          errorMessage = error.message;
        }

        toast({
          title: 'Không thể tải chi tiết túi xách',
          description: errorMessage,
          variant: 'error',
          duration: 3000,
        });

        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 60 * 60 * 1000, // 60 minutes
    enabled: !!handBagId && options?.enabled !== false,
    refetchOnWindowFocus: false,
  });

  /**
   * Prefetch HandBag full details for better UX
   */
  const prefetchHandBagDetails = async (id: string) => {
    if (!id) return;

    try {
      await queryClient.prefetchQuery({
        queryKey: ['handBag', id, 'fullDetails'],
        queryFn: async () => {
          //  Trả về trực tiếp từ API (đã là HandBagWithDetails)
          return await getHandBagFullDetails(id);
        },
        staleTime: 5 * 60 * 1000,
        gcTime: 60 * 60 * 1000,
      });
    } catch (error) {
      console.error(`Failed to prefetch HandBag details with ID ${id}:`, error);
    }
  };

  /**
   * Invalidate HandBag full details cache
   */
  const invalidateHandBagDetails = async (id: string, forceRefetch = false) => {
    if (!id) return;

    try {
      await queryClient.invalidateQueries({
        queryKey: ['handBag', id, 'fullDetails'],
        refetchType: forceRefetch ? 'active' : 'none',
      });
    } catch (error) {
      console.error(`Failed to invalidate HandBag details cache for ID ${id}:`, error);
    }
  };

  return {
    ...handBagDetailsQuery,
    prefetchHandBagDetails,
    invalidateHandBagDetails,
  };
};
