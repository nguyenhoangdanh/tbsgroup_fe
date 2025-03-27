import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { useBaseQueries } from '@/hooks/base/useBaseQueries';
import { Group } from '@/common/interface/group';
import { getGroupById, getGroupsList, GroupCondDTO } from '@/apis/group/group.api';

/**
 * Hook for Group queries
 */
export const useGroupQueries = () => {
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

  // Use base queries hook for Group queries
  const groupQueries = useBaseQueries<Group, GroupCondDTO>(
    'group',
    getGroupsList,
    getGroupById,
    undefined,
    handleQueryError
  );

  /**
   * Prefetch a group for better UX
   */
  const prefetchGroupById = useCallback(
    async (id: string) => {
      if (!id) return;

      try {
        await queryClient.prefetchQuery({
          queryKey: ['group', id],
          queryFn: async () => {
            const response = await getGroupById(id);
            return response;
          },
          staleTime: 5 * 60 * 1000, // 5 minutes
          gcTime: 60 * 60 * 1000, // 60 minutes
        });
      } catch (error) {
        console.error(`Failed to prefetch Group with ID ${id}:`, error);
      }
    },
    [queryClient]
  );

  /**
   * Invalidate group cache
   */
  const invalidateGroupCache = useCallback(
    async (id: string, forceRefetch = false) => {
      if (!id) return;

      try {
        await queryClient.invalidateQueries({
          queryKey: ['group', id],
          refetchType: forceRefetch ? 'active' : 'none',
        });
      } catch (error) {
        console.error(`Failed to invalidate Group cache for ID ${id}:`, error);
      }
    },
    [queryClient]
  );

  /**
   * Invalidate groups list cache
   */
  const invalidateGroupsCache = useCallback(
    async (forceRefetch = false) => {
      try {
        await queryClient.invalidateQueries({
          queryKey: ['group-list'],
          refetchType: forceRefetch ? 'active' : 'none',
        });
      } catch (error) {
        console.error('Failed to invalidate Groups list cache:', error);
      }
    },
    [queryClient]
  );

  return {
    ...groupQueries,
    prefetchGroupById,
    invalidateGroupCache,
    invalidateGroupsCache,
    listGroups: groupQueries.listItems,
    getGroupById: groupQueries.getById
  };
};