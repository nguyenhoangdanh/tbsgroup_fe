import { UseQueryResult, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { useBaseQueries } from '../base/useBaseQueries';

import {
  getFactoriesList,
  getFactoryById,
  getFactoryManagers,
  getAccessibleFactories,
  checkCanManageFactory,
} from '@/apis/factory/factory.api';
import {
  Factory,
  FactoryCondDTO,
  FactoryManager,
  FactoryWithDetails,
} from '@/common/interface/factory';
import { toast } from 'react-toast-kit';

/**
 * Hook cho Factory queries
 */
export const useFactoryQueries = () => {
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
      variant: 'error',
      duration: 3000,
    });
  }, []);

  // Sử dụng hook cơ sở cho Factory queries
  const factoryQueries = useBaseQueries<Factory, FactoryCondDTO>(
    'factory',
    getFactoriesList,
    getFactoryById,
    undefined,
    handleQueryError,
  );

  /**
   * Get factory managers
   */
  const getManagersByFactoryId = (
    factoryId?: string,
    options?: { enabled?: boolean },
  ): UseQueryResult<FactoryManager[], Error> => {
    return useQuery<FactoryManager[], Error>({
      queryKey: ['factory', factoryId, 'managers'],
      queryFn: async () => {
        if (!factoryId) throw new Error('Factory ID is required');
        try {
          const response = await getFactoryManagers(factoryId);
          return response;
        } catch (error) {
          handleQueryError(error, 'quản lý nhà máy');
          throw error instanceof Error ? error : new Error('Unknown error');
        }
      },
      enabled: !!factoryId && options?.enabled !== false,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 30 * 60 * 1000, // 30 minutes
    });
  };

  /**
   * Get accessible factories for current user
   */
  const getAccessibleFactoriesForUser = (options?: {
    enabled?: boolean;
  }): UseQueryResult<Factory[], Error> => {
    return useQuery<Factory[], Error>({
      queryKey: ['factories', 'accessible'],
      queryFn: async () => {
        try {
          const response = await getAccessibleFactories();
          return response;
        } catch (error) {
          handleQueryError(error, 'nhà máy có quyền truy cập');
          throw error instanceof Error ? error : new Error('Unknown error');
        }
      },
      enabled: options?.enabled !== false,
      staleTime: 10 * 60 * 1000, // 10 minutes
      gcTime: 30 * 60 * 1000, // 30 minutes
    });
  };

  /**
   * Check if user can manage factory
   */
  const canManageFactory = (
    factoryId?: string,
    options?: { enabled?: boolean },
  ): UseQueryResult<boolean, Error> => {
    return useQuery<boolean, Error>({
      queryKey: ['factory', factoryId, 'can-manage'],
      queryFn: async () => {
        if (!factoryId) return false;
        try {
          return await checkCanManageFactory(factoryId);
        } catch (error) {
          handleQueryError(error, 'quyền quản lý nhà máy');
          return false;
        }
      },
      enabled: !!factoryId && options?.enabled !== false,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 15 * 60 * 1000, // 15 minutes
    });
  };

  /**
   * Get factory with details
   */
  const getFactoryWithDetails = (
    factoryId?: string,
    options?: { enabled?: boolean; includeManagers?: boolean },
  ): UseQueryResult<Partial<FactoryWithDetails>, Error> => {
    const includeManagers = options?.includeManagers !== false;

    return useQuery<Partial<FactoryWithDetails>, Error>({
      queryKey: ['factory', factoryId, 'details', { includeManagers }],
      queryFn: async () => {
        if (!factoryId) throw new Error('Factory ID is required');
        try {
          // Get basic factory data
          const factoryResponse = await getFactoryById(factoryId);

          // Start with basic factory data
          const factoryWithDetails: Partial<FactoryWithDetails> = {
            ...factoryResponse,
            managers: [],
            lines: [],
          };

          // If managers data is requested, fetch it
          if (includeManagers) {
            try {
              const managersResponse = await getFactoryManagers(factoryId);
              factoryWithDetails.managers = managersResponse;
            } catch (managersError) {
              console.error('Error fetching factory managers:', managersError);
              factoryWithDetails.managers = [];
            }
          }

          return factoryWithDetails;
        } catch (error) {
          handleQueryError(error, 'chi tiết nhà máy');
          throw error instanceof Error ? error : new Error('Unknown error');
        }
      },
      enabled: !!factoryId && options?.enabled !== false,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 30 * 60 * 1000, // 30 minutes
    });
  };

  /**
   * Invalidate factory details cache
   */
  const invalidateFactoryDetailsCache = useCallback(
    async (factoryId: string, forceRefetch = false) => {
      if (!factoryId) return;

      try {
        await queryClient.invalidateQueries({
          queryKey: ['factory', factoryId, 'details'],
          refetchType: forceRefetch ? 'active' : 'none',
        });

        // Also invalidate managers
        await queryClient.invalidateQueries({
          queryKey: ['factory', factoryId, 'managers'],
          refetchType: forceRefetch ? 'active' : 'none',
        });
      } catch (error) {
        console.error(`Failed to invalidate factory details cache for ID ${factoryId}:`, error);
      }
    },
    [queryClient],
  );

  /**
   * Prefetch factory details for better UX
   */
  const prefetchFactoryDetails = useCallback(
    async (factoryId: string, options?: { includeManagers?: boolean }) => {
      if (!factoryId) return;

      const includeManagers = options?.includeManagers !== false;

      try {
        await queryClient.prefetchQuery({
          queryKey: ['factory', factoryId, 'details', { includeManagers }],
          queryFn: async () => {
            const factoryResponse = await getFactoryById(factoryId);

            const factoryWithDetails: Partial<FactoryWithDetails> = {
              ...factoryResponse,
              managers: [],
              lines: [],
            };

            if (includeManagers) {
              try {
                const managersResponse = await getFactoryManagers(factoryId);
                factoryWithDetails.managers = managersResponse;
              } catch (managersError) {
                console.error('Error prefetching factory managers:', managersError);
              }
            }

            return factoryWithDetails;
          },
          staleTime: 5 * 60 * 1000, // 5 minutes
        });
      } catch (error) {
        console.error(`Failed to prefetch factory details for ID ${factoryId}:`, error);
      }
    },
    [queryClient],
  );

  return {
    // Base factory queries
    ...factoryQueries,
    listFactories: factoryQueries.listItems,

    // Additional specialized queries
    getManagersByFactoryId,
    getAccessibleFactoriesForUser,
    canManageFactory,
    getFactoryWithDetails,

    // Cache management
    invalidateFactoryDetailsCache,
    prefetchFactoryDetails,
  };
};
