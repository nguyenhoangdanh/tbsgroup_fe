import { UseQueryResult, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { toast } from 'react-toast-kit';

import {
  getHandBagsList,
  getHandBagById,
  getBagColorsList,
  getBagColorById,
  getBagColorProcessesList,
  getBagColorProcessById,
  getHandBagFullDetails,
} from '@/apis/handbag/handbag.api';
import {
  HandBag,
  HandBagCondDTO,
  BagColor,
  BagColorCondDTO,
  BagColorProcess,
  BagColorProcessCondDTO,
} from '@/common/interface/handbag';

import { useBaseQueries, BaseResponseData } from '../base/useBaseQueries';

import { HandBagWithDetails } from './useHandBagDetails';



/**
 * Hook cho HandBag queries
 */
export const useHandBagQueries = () => {
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

  // Sử dụng hook cơ sở cho HandBag queries
  const handBagQueries = useBaseQueries<HandBag, HandBagCondDTO>(
    'handBag',
    getHandBagsList,
    getHandBagById,
    undefined,
    handleQueryError,
  );

  // Sử dụng hook cơ sở cho BagColor queries
  const bagColorQueries = useBaseQueries<BagColor, BagColorCondDTO>(
    'bagColor',
    getBagColorsList,
    getBagColorById,
    undefined,
    handleQueryError,
  );

  // Sử dụng hook cơ sở cho BagColorProcess queries
  const bagColorProcessQueries = useBaseQueries<BagColorProcess, BagColorProcessCondDTO>(
    'bagColorProcess',
    getBagColorProcessesList,
    getBagColorProcessById,
    undefined,
    handleQueryError,
  );

  /**
   * Get HandBag full details including colors and processes
   */
  const getHandBagWithDetails = (
    id?: string,
    options?: { enabled?: boolean },
  ): UseQueryResult<HandBagWithDetails, Error> => {
    return useQuery<HandBagWithDetails, Error>({
      queryKey: ['handBag', id, 'fullDetails'],
      queryFn: async () => {
        if (!id) throw new Error('HandBag ID is required');
        try {
          const response = await getHandBagFullDetails(id);
          // Trả về trực tiếp response (đã là HandBagWithDetails)
          return response;
        } catch (error) {
          handleQueryError(error, 'chi tiết túi xách');
          throw error instanceof Error ? error : new Error('Unknown error');
        }
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 60 * 60 * 1000, // 60 minutes
      enabled: !!id && options?.enabled !== false,
      refetchOnWindowFocus: false,
    });
  };

  /**
   * Prefetch HandBag full details for better UX
   */
  const prefetchHandBagWithDetails = useCallback(
    async (id: string) => {
      if (!id) return;

      try {
        await queryClient.prefetchQuery({
          queryKey: ['handBag', id, 'fullDetails'],
          queryFn: async () => {
            const response = await getHandBagFullDetails(id);
            //  Trả về trực tiếp response (đã là HandBagWithDetails)
            return response;
          },
          staleTime: 5 * 60 * 1000, // 5 minutes
          gcTime: 60 * 60 * 1000, // 60 minutes
        });
      } catch (error) {
        console.error(`Failed to prefetch HandBag details with ID ${id}:`, error);
      }
    },
    [queryClient],
  );

  /**
   * Invalidate HandBag full details cache
   */
  const invalidateHandBagDetailsCache = useCallback(
    async (id: string, forceRefetch = false) => {
      if (!id) return;

      try {
        await queryClient.invalidateQueries({
          queryKey: ['handBag', id, 'fullDetails'],
          refetchType: forceRefetch ? 'active' : 'none',
        });
      } catch (error) {
        console.error(`Failed to invalidate HandBag details cache for ID ${id}:`, error);
      }
    },
    [queryClient],
  );

  /**
   * Get colors for a specific handbag
   */
  const getHandBagColors = (
    handBagId?: string,
    options?: { enabled?: boolean; limit?: number },
  ): UseQueryResult<BaseResponseData<BagColor>, Error> => {
    return bagColorQueries.listItems(
      {
        handBagId: handBagId || '',
        limit: options?.limit || 100,
        page: 1,
      },
      {
        enabled: !!handBagId && options?.enabled !== false,
      },
    );
  };

  /**
   * Get processes for a specific bag color
   */
  const getBagColorProcesses = (
    bagColorId?: string,
    options?: { enabled?: boolean; limit?: number },
  ): UseQueryResult<BaseResponseData<BagColorProcess>, Error> => {
    return bagColorProcessQueries.listItems(
      {
        bagColorId: bagColorId || '',
        limit: options?.limit || 100,
        page: 1,
      },
      {
        enabled: !!bagColorId && options?.enabled !== false,
      },
    );
  };

  return {
    // Base HandBag queries
    ...handBagQueries,
    listHandBags: handBagQueries.listItems,

    // Base BagColor queries
    getBagColorById: bagColorQueries.getById,
    listBagColors: bagColorQueries.listItems,
    getBagColorsInfinite: bagColorQueries.getItemsInfinite,
    prefetchBagColorById: bagColorQueries.prefetchById,
    invalidateBagColorCache: bagColorQueries.invalidateItemCache,
    invalidateBagColorsCache: bagColorQueries.invalidateListCache,

    // Base BagColorProcess queries
    getBagColorProcessById: bagColorProcessQueries.getById,
    listBagColorProcesses: bagColorProcessQueries.listItems,
    prefetchBagColorProcessById: bagColorProcessQueries.prefetchById,
    invalidateBagColorProcessCache: bagColorProcessQueries.invalidateItemCache,
    invalidateBagColorProcessesCache: bagColorProcessQueries.invalidateListCache,

    // Additional specialized queries
    getHandBagWithDetails,
    prefetchHandBagWithDetails,
    invalidateHandBagDetailsCache,
    getHandBagColors,
    getBagColorProcesses,
  };
};
