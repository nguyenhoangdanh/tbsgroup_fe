'use client';

import {
  useQuery,
  useInfiniteQuery,
  useQueryClient,
  UseQueryResult,
  UseInfiniteQueryResult,
} from '@tanstack/react-query';
import {
  fetchRoleById,
  fetchRoleByCode,
  fetchRoleWithRelations,
  fetchRoles,
  fetchRolesList,
  RoleListParams,
  RoleType,
  RoleItemType,
  RoleWithRelationsType,
  RoleListResponse,
} from '@/apis/roles/role.api';
import {useCallback, useMemo, useState} from 'react';
import {toast} from '../use-toast';

// Cache configurations
const GC_TIME = 60 * 60 * 1000; // 60 minutes
const STALE_TIME = 10 * 60 * 1000; // 10 minutes
const LIST_STALE_TIME = 60 * 1000; // 1 minute

// Retry configuration
const DEFAULT_RETRY_OPTIONS = {
  retry: 2,
  retryDelay: (attemptIndex: number) =>
    Math.min(1000 * Math.pow(1.5, attemptIndex), 30000),
};

/**
 * Create stable query key to avoid unnecessary re-renders and refetches
 */
const createStableQueryKey = (params: any) => {
  const sortedParams: Record<string, any> = {};

  Object.keys(params)
    .sort()
    .forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        sortedParams[key] = params[key];
      }
    });

  return sortedParams;
};

/**
 * Hook for role-related queries with optimized caching
 */
export const useRoleQueries = () => {
  const queryClient = useQueryClient();
  const [queryError, setQueryError] = useState<Error | null>(null);

  /**
   * Handle query errors with toast notifications
   */
  const handleQueryError = useCallback((error: any, queryName: string) => {
    // Ensure we have a proper Error object
  // Extract message safely
  let errorMessage = 'Lỗi không xác định';
  try {
     if (typeof error === 'object' && error.message) {
      errorMessage = error.message;
    } else if (typeof error === 'object') {
      errorMessage = JSON.stringify(error);
    }
  } catch (e) {
    errorMessage = 'Không thể hiển thị chi tiết lỗi';
  }
  
    // Show toast with safe message
    toast({
      title: `Không thể tải dữ liệu ${queryName}`,
      description: errorMessage || 'Vui lòng thử lại sau',
      variant: 'destructive',
      duration: 3000,
    });
  }, []);

  /**
   * Reset error state
   */
  const resetQueryError = useCallback(() => {
    setQueryError(null);
  }, []);

  /**
   * Prefetch roles data
   */
  const prefetchRoles = useCallback(async () => {
    try {
      await queryClient.prefetchQuery({
        queryKey: ['roles'],
        queryFn: fetchRoles,
        staleTime: STALE_TIME,
        gcTime: GC_TIME,
        ...DEFAULT_RETRY_OPTIONS,
      });
    } catch (error) {
      console.error('Failed to prefetch roles:', error);
    }
  }, [queryClient]);

  /**
   * Prefetch a specific role
   */
  const prefetchRoleById = useCallback(
    async (id: string) => {
      if (!id) return;

      try {
        await queryClient.prefetchQuery({
          queryKey: ['role', id],
          queryFn: () => fetchRoleById(id),
          staleTime: STALE_TIME,
          gcTime: GC_TIME,
          ...DEFAULT_RETRY_OPTIONS,
        });
      } catch (error) {
        console.error(`Failed to prefetch role with ID ${id}:`, error);
      }
    },
    [queryClient],
  );

  /**
   * Get all roles
   */
  const getAllRoles = useQuery<RoleType[], Error>({
    queryKey: ['roles'],
    queryFn: async () => {
      try {
        return await fetchRoles();
      } catch (error) {
        handleQueryError(error, 'danh sách vai trò');
      }
    },
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    refetchOnWindowFocus: false,
    ...DEFAULT_RETRY_OPTIONS,
  });

  /**
   * Get role by ID
   */
  const getRoleById = (
    id?: string,
    options?: {enabled?: boolean},
  ): UseQueryResult<RoleItemType, Error> =>
    useQuery<RoleItemType, Error>({
      queryKey: ['role', id],
      queryFn: async () => {
        if (!id) throw new Error('Role ID is required');
        try {
          return await fetchRoleById(id);
        } catch (error) {
          const err = error instanceof Error ? error : new Error(String(error));
          handleQueryError(err, 'vai trò');
          throw err;
        }
      },
      staleTime: STALE_TIME,
      gcTime: GC_TIME,
      enabled: !!id && options?.enabled !== false,
      refetchOnWindowFocus: false,
      ...DEFAULT_RETRY_OPTIONS,
    });

  /**
   * Get role by code
   */
  const getRoleByCode = (
    code?: string,
    options?: {enabled?: boolean},
  ): UseQueryResult<RoleItemType, Error> =>
    useQuery<RoleItemType, Error>({
      queryKey: ['role-by-code', code],
      queryFn: async () => {
        if (!code) throw new Error('Role code is required');
        try {
          return await fetchRoleByCode(code);
        } catch (error) {
          const err = error instanceof Error ? error : new Error(String(error));
          handleQueryError(err, 'vai trò theo mã');
          throw err;
        }
      },
      staleTime: STALE_TIME,
      gcTime: GC_TIME,
      enabled: !!code && options?.enabled !== false,
      refetchOnWindowFocus: false,
      ...DEFAULT_RETRY_OPTIONS,
    });

  /**
   * Get role with relations
   */
  const getRoleWithRelations = (
    id?: string,
    options?: {enabled?: boolean},
  ): UseQueryResult<RoleWithRelationsType, Error> =>
    useQuery<RoleWithRelationsType, Error>({
      queryKey: ['role-with-relations', id],
      queryFn: async () => {
        if (!id) throw new Error('Role ID is required');
        try {
          return await fetchRoleWithRelations(id);
        } catch (error) {
          const err = error instanceof Error ? error : new Error(String(error));
          handleQueryError(err, 'vai trò và các mối quan hệ');
          throw err;
        }
      },
      staleTime: STALE_TIME,
      gcTime: GC_TIME,
      enabled: !!id && options?.enabled !== false,
      refetchOnWindowFocus: false,
      ...DEFAULT_RETRY_OPTIONS,
    });

  /**
   * List roles with filtering and pagination
   */
  const listRoles = (
    params: RoleListParams = {},
    options?: any,
  ): UseQueryResult<RoleListResponse, Error> => {
    // Create stable query key to avoid unnecessary refetches
    const stableParams = useMemo(() => createStableQueryKey(params), [params]);

    return useQuery<RoleListResponse, Error>({
      queryKey: ['roles-list', stableParams],
      queryFn: async () => {
        try {
          return await fetchRolesList(params);
        } catch (error) {
          handleQueryError(error, 'danh sách vai trò');
        }
      },
      staleTime: LIST_STALE_TIME,
      gcTime: GC_TIME,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      ...DEFAULT_RETRY_OPTIONS,
      ...options,
    });
  };

  /**
   * Get roles with infinite scrolling
   */
  const getRolesInfinite = (
    limit = 20,
    filters: Omit<RoleListParams, 'page' | 'limit'> = {},
  ): UseInfiniteQueryResult<RoleListResponse, Error> => {
    // Create stable query key
    const stableFilters = useMemo(
      () => createStableQueryKey(filters),
      [filters],
    );

    return useInfiniteQuery<RoleListResponse, Error>({
      queryKey: ['roles-infinite', limit, stableFilters],
      initialPageParam: 1,
      queryFn: async ({pageParam}) => {
        try {
          return await fetchRolesList({
            ...filters,
            page: pageParam as number,
            limit,
          });
        } catch (error) {
          const err = error instanceof Error ? error : new Error(String(error));
          handleQueryError(err, 'vai trò (infinite scroll)');
          throw err;
        }
      },
      getNextPageParam: lastPage => {
        if (lastPage.meta?.currentPage < lastPage.meta?.totalPages) {
          return lastPage.meta.currentPage + 1;
        }
        return undefined;
      },
      staleTime: LIST_STALE_TIME,
      gcTime: GC_TIME,
      refetchOnWindowFocus: false,
      ...DEFAULT_RETRY_OPTIONS,
    });
  };

  /**
   * Invalidate roles cache without forcing a refetch
   */
  const invalidateRolesCache = useCallback(
    async (forceRefetch = false) => {
      try {
        await queryClient.invalidateQueries({
          queryKey: ['roles'],
          refetchType: forceRefetch ? 'active' : 'none',
        });

        await queryClient.invalidateQueries({
          queryKey: ['roles-list'],
          refetchType: forceRefetch ? 'active' : 'none',
        });
      } catch (error) {
        console.error('Failed to invalidate roles cache:', error);
      }
    },
    [queryClient],
  );

  /**
   * Invalidate a specific role's cache
   */
  const invalidateRoleCache = useCallback(
    async (id: string, forceRefetch = false) => {
      if (!id) return;

      try {
        await queryClient.invalidateQueries({
          queryKey: ['role', id],
          refetchType: forceRefetch ? 'active' : 'none',
        });
      } catch (error) {
        console.error(`Failed to invalidate role cache for ID ${id}:`, error);
      }
    },
    [queryClient],
  );

  return {
    // Query hooks
    getAllRoles,
    getRoleById,
    getRoleByCode,
    getRoleWithRelations,
    listRoles,
    getRolesInfinite,

    // Prefetch methods
    prefetchRoles,
    prefetchRoleById,

    // Cache invalidation methods
    invalidateRolesCache,
    invalidateRoleCache,
    
    // Error handling
    queryError,
    resetQueryError,
  };
};