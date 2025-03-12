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
import {useCallback, useMemo} from 'react';

// Cache configurations
const GC_TIME = 30 * 60 * 1000; // 30 minutes
const STALE_TIME = 5 * 60 * 1000; // 5 minutes
const LIST_STALE_TIME = 30 * 1000; // 30 seconds - balancing between fresh data and performance

// Error retry configuration
const DEFAULT_RETRY_OPTIONS = {
  retry: 1, // Giảm xuống 1 lần retry để tránh quá nhiều request
  retryDelay: (attemptIndex: number) =>
    Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
};

/**
 * Tạo stable query key để tránh re-render và refetch không cần thiết
 */
const createStableQueryKey = (params: any) => {
  // Tạo một object mới với các property được sắp xếp
const sortedParams: Record<string, any> = {};

  // Sắp xếp các key theo thứ tự alphabet
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
    queryFn: fetchRoles,
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
      queryFn: () => {
        if (!id) throw new Error('Role ID is required');
        return fetchRoleById(id);
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
      queryFn: () => {
        if (!code) throw new Error('Role code is required');
        return fetchRoleByCode(code);
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
      queryFn: () => {
        if (!id) throw new Error('Role ID is required');
        return fetchRoleWithRelations(id);
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
    // Tạo stable query key để tránh refetch không cần thiết
    const stableParams = useMemo(() => createStableQueryKey(params), [params]);

    return useQuery<RoleListResponse, Error>({
      queryKey: ['roles-list', stableParams],
      queryFn: () => fetchRolesList(params),
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
    // Tạo stable query key
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
          console.error('Failed to fetch infinite roles:', error);
          throw error;
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
  };
};
