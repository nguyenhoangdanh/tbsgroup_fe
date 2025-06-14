'use client';

import {
  useQuery,
  useInfiniteQuery,
  useQueryClient,
  UseQueryResult,
  UseInfiniteQueryResult,
  QueryClient,
} from '@tanstack/react-query';
import { useCallback, useMemo, useState, useRef } from 'react';
import { toast } from 'react-toast-kit';

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

const GC_TIME = 2 * 60 * 60 * 1000; // 2 hours (increased from 1 hour)
const STALE_TIME = 30 * 60 * 1000; // 30 minutes (increased from 10 minutes)
const LIST_STALE_TIME = 5 * 60 * 1000; // 5 minutes (increased from 1 minute)

const DEFAULT_RETRY_OPTIONS = {
  retry: 1,
  retryDelay: (attemptIndex: number) => Math.min(1000 * Math.pow(2, attemptIndex), 30000), // exponential backoff capped at 30s
};

/**
 * Create stable query key to avoid unnecessary re-renders and refetches
 * Using stable serialization for deterministic key generation
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
 * Creates a debounced function that delays invoking func until after wait milliseconds
 * @param func The function to debounce
 * @param wait The debounce time in milliseconds
 */
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return function (this: any, ...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func.apply(this, args);
    };

    if (timeout !== null) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Prefetch handler to reduce perceived loading time and improve UX
 */
function setupPrefetchOnHover(queryClient: QueryClient, id: string) {
  return debounce(() => {
    // Don't prefetch if already in cache and not stale
    const existingQuery = queryClient.getQueryData(['role', id]);
    if (!existingQuery) {
      queryClient.prefetchQuery({
        queryKey: ['role', id],
        queryFn: () => fetchRoleById(id),
        staleTime: STALE_TIME,
      });
    }
  }, 150); // Short delay to prevent excessive prefetches during fast scrolling
}

/**
 * Hook for role-related queries with optimized caching
 * Enhanced for high traffic and large user base (5000+ users)
 */
export const useRoleQueries = () => {
  const queryClient = useQueryClient();
  const [queryError, setQueryError] = useState<Error | null>(null);

  // Use ref for tracking active requests to prevent memory leaks and race conditions
  const activeRequestsRef = useRef(new Set<string>());

  /**
   * Handle query errors with toast notifications
   * Improved error extraction and formatting
   */
  const handleQueryError = useCallback((error: any, queryName: string) => {
    //   Extract message safely with improved error handling
    let errorMessage = 'Lỗi không xác định';
    try {
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null) {
        // Try to extract useful information from error object
        if (error.message) {
          errorMessage = error.message;
        } else if (error.status && error.statusText) {
          errorMessage = `HTTP Error: ${error.status} ${error.statusText}`;
        } else if (error.code) {
          errorMessage = `Error code: ${error.code}`;
        } else {
          errorMessage = JSON.stringify(error);
        }
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
    } catch (e) {
      errorMessage = 'Không thể hiển thị chi tiết lỗi';
    }

    // Log for debugging
    console.error(`Query error in ${queryName}:`, error);

    //  Store error state
    setQueryError(error instanceof Error ? error : new Error(errorMessage));

    // Show toast with safe message - limit to one toast per error type
    // This prevents toast flood in case of multiple errors
    toast({
      title: `Không thể tải dữ liệu ${queryName}`,
      description: errorMessage || 'Vui lòng thử lại sau',
      variant: 'error',
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
   * Prefetch roles data with improved caching strategy
   * Helps reduce perceived loading time for common operations
   */
  const prefetchRoles = useCallback(async () => {
    const requestId = `prefetch-roles-${Date.now()}`;
    activeRequestsRef.current.add(requestId);

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
    } finally {
      activeRequestsRef.current.delete(requestId);
    }
  }, [queryClient]);

  /**
   * Prefetch a specific role with improved performance
   * Useful for hovering over items in a list
   */
  const prefetchRoleById = useCallback(
    async (id: string) => {
      if (!id) return;

      const requestId = `prefetch-role-${id}-${Date.now()}`;
      activeRequestsRef.current.add(requestId);

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
      } finally {
        activeRequestsRef.current.delete(requestId);
      }
    },
    [queryClient],
  );

  /**
   * Generate a hover handler that prefetches role data
   * Improved UX by preparing data before user clicks
   */
  const getPrefetchOnHoverHandler = useCallback(
    (id: string) => setupPrefetchOnHover(queryClient, id),
    [queryClient],
  );

  /**
   * Get all roles with optimized caching
   */
  const getAllRoles = useQuery<RoleType[], Error>({
    queryKey: ['roles'],
    queryFn: async () => {
      const requestId = `fetch-all-roles-${Date.now()}`;
      activeRequestsRef.current.add(requestId);

      try {
        return await fetchRoles();
      } catch (error) {
        handleQueryError(error, 'danh sách vai trò');
        throw error; // Re-throw to let React Query handle retry
      } finally {
        activeRequestsRef.current.delete(requestId);
      }
    },
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    refetchOnWindowFocus: false,
    ...DEFAULT_RETRY_OPTIONS,
  });

  /**
   * Get role by ID with enhanced error handling
   */
  const getRoleById = (
    id?: string,
    options?: { enabled?: boolean },
  ): UseQueryResult<RoleItemType, Error> =>
    useQuery<RoleItemType, Error>({
      queryKey: ['role', id],
      queryFn: async () => {
        if (!id) throw new Error('Role ID is required');

        const requestId = `fetch-role-${id}-${Date.now()}`;
        activeRequestsRef.current.add(requestId);

        try {
          return await fetchRoleById(id);
        } catch (error) {
          const err = error instanceof Error ? error : new Error(String(error));
          handleQueryError(err, 'vai trò');
          throw err;
        } finally {
          activeRequestsRef.current.delete(requestId);
        }
      },
      staleTime: STALE_TIME,
      gcTime: GC_TIME,
      enabled: !!id && options?.enabled !== false,
      refetchOnWindowFocus: false,
      ...DEFAULT_RETRY_OPTIONS,
    });

  /**
   * Get role by code with enhanced error handling
   */
  const getRoleByCode = (
    code?: string,
    options?: { enabled?: boolean },
  ): UseQueryResult<RoleItemType, Error> =>
    useQuery<RoleItemType, Error>({
      queryKey: ['role-by-code', code],
      queryFn: async () => {
        if (!code) throw new Error('Role code is required');

        const requestId = `fetch-role-by-code-${code}-${Date.now()}`;
        activeRequestsRef.current.add(requestId);

        try {
          return await fetchRoleByCode(code);
        } catch (error) {
          const err = error instanceof Error ? error : new Error(String(error));
          handleQueryError(err, 'vai trò theo mã');
          throw err;
        } finally {
          activeRequestsRef.current.delete(requestId);
        }
      },
      staleTime: STALE_TIME,
      gcTime: GC_TIME,
      enabled: !!code && options?.enabled !== false,
      refetchOnWindowFocus: false,
      ...DEFAULT_RETRY_OPTIONS,
    });

  /**
   * Get role with relations - optimized for performance
   */
  const getRoleWithRelations = (
    id?: string,
    options?: { enabled?: boolean },
  ): UseQueryResult<RoleWithRelationsType, Error> =>
    useQuery<RoleWithRelationsType, Error>({
      queryKey: ['role-with-relations', id],
      queryFn: async () => {
        if (!id) throw new Error('Role ID is required');

        const requestId = `fetch-role-with-relations-${id}-${Date.now()}`;
        activeRequestsRef.current.add(requestId);

        try {
          return await fetchRoleWithRelations(id);
        } catch (error) {
          const err = error instanceof Error ? error : new Error(String(error));
          handleQueryError(err, 'vai trò và các mối quan hệ');
          throw err;
        } finally {
          activeRequestsRef.current.delete(requestId);
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
   * Enhanced with stable query keys to avoid unnecessary refetches
   */
  const listRoles = (
    params: RoleListParams = {},
    options?: any,
  ): UseQueryResult<RoleListResponse, Error> => {
    //Create stable query key to avoid unnecessary refetches
    const stableParams = useMemo(() => createStableQueryKey(params), [params]);

    return useQuery<RoleListResponse, Error>({
      queryKey: ['roles-list', stableParams],
      queryFn: async () => {
        const requestId = `fetch-roles-list-${JSON.stringify(stableParams)}-${Date.now()}`;
        activeRequestsRef.current.add(requestId);

        try {
          return await fetchRolesList(params);
        } catch (error) {
          handleQueryError(error, 'danh sách vai trò');
          throw error;
        } finally {
          activeRequestsRef.current.delete(requestId);
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
   * Optimized for memory usage with large datasets
   */
  const getRolesInfinite = (
    limit = 20,
    filters: Omit<RoleListParams, 'page' | 'limit'> = {},
  ): UseInfiniteQueryResult<RoleListResponse, Error> => {
    // Create stable query key
    const stableFilters = useMemo(() => createStableQueryKey(filters), [filters]);

    return useInfiniteQuery<RoleListResponse, Error>({
      queryKey: ['roles-infinite', limit, stableFilters],
      initialPageParam: 1,
      queryFn: async ({ pageParam }) => {
        const requestId = `fetch-roles-infinite-${pageParam}-${JSON.stringify(stableFilters)}-${Date.now()}`;
        activeRequestsRef.current.add(requestId);

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
        } finally {
          activeRequestsRef.current.delete(requestId);
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
   * Enhanced with selective invalidation to improve performance
   */
  const invalidateRolesCache = useCallback(
    async (forceRefetch = false) => {
      try {
        //  Use selective invalidation to minimize unnecessary refetches
        await queryClient.invalidateQueries({
          queryKey: ['roles'],
          refetchType: forceRefetch ? 'active' : 'none',
        });

        await queryClient.invalidateQueries({
          queryKey: ['roles-list'],
          refetchType: forceRefetch ? 'active' : 'none',
        });

        //  Also invalidate infinite queries without forcing refetch
        await queryClient.invalidateQueries({
          queryKey: ['roles-infinite'],
          refetchType: forceRefetch ? 'active' : 'none',
        });
      } catch (error) {
        console.error('Failed to invalidate roles cache:', error);
      }
    },
    [queryClient],
  );
  return {
    //  Query hooks
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

    //  Error handling
    queryError,
    resetQueryError,
  };
};
