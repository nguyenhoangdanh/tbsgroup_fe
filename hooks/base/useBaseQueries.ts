import {
  UseQueryResult,
  UseInfiniteQueryResult,
  InfiniteData,
  useQuery,
  useInfiniteQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { useMemo, useCallback } from 'react';

export interface BasePaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface BaseResponseData<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export const GC_TIME = 60 * 60 * 1000; // 60 minutes
export const STALE_TIME = 10 * 60 * 1000; // 10 minutes
export const LIST_STALE_TIME = 60 * 1000; // 1 minute

export const DEFAULT_RETRY_OPTIONS = {
  retry: 2,
  retryDelay: (attemptIndex: number) => Math.min(1000 * Math.pow(1.5, attemptIndex), 30000),
};

/**
 * Create stable query key to avoid unnecessary re-renders and refetches
 */
export const createStableQueryKey = (params: any) => {
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
 * Hook cơ sở cho các query, có thể tái sử dụng cho bất kỳ module nào
 */
export const useBaseQueries = <T, FilterParams extends Record<string, any>>(
  resourceName: string,
  fetchFn: (params: FilterParams & BasePaginationParams) => Promise<BaseResponseData<T>>,
  fetchByIdFn: (id: string) => Promise<T>,
  fetchAllFn?: () => Promise<T[]>,
  errorHandler?: (error: any, queryName: string) => void,
) => {
  const queryClient = useQueryClient();

  /**
   * Get item by ID
   */
  const getById = (id?: string, options?: { enabled?: boolean }): UseQueryResult<T, Error> =>
    useQuery<T, Error>({
      queryKey: [resourceName, id],
      queryFn: async () => {
        if (!id) throw new Error('ID is required');
        try {
          return await fetchByIdFn(id);
        } catch (error) {
          const err = error instanceof Error ? error : new Error(String(error));
          if (errorHandler) errorHandler(err, resourceName);
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
   * List items with filtering and pagination
   */
  const listItems = (
    params: FilterParams & BasePaginationParams = {} as any,
    options?: any,
  ): UseQueryResult<BaseResponseData<T>, Error> => {
    // Create stable query key to avoid unnecessary refetches
    const stableParams = useMemo(() => createStableQueryKey(params), [params]);

    return useQuery<BaseResponseData<T>, Error>({
      queryKey: [`${resourceName}-list`, stableParams],
      queryFn: async () => {
        try {
          return await fetchFn(params);
        } catch (error) {
          if (errorHandler) errorHandler(error, `${resourceName} list`);
          throw error;
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
   * Get items with infinite scrolling
   */
  const getItemsInfinite = (
    limit = 20,
    filters: Omit<FilterParams & BasePaginationParams, 'page' | 'limit'> = {} as any,
  ): UseInfiniteQueryResult<InfiniteData<BaseResponseData<T>>, Error> => {
    // Create stable query key
    const stableFilters = useMemo(() => createStableQueryKey(filters), [filters]);

    return useInfiniteQuery<BaseResponseData<T>, Error>({
      queryKey: [`${resourceName}-infinite`, limit, stableFilters],
      initialPageParam: 1,
      queryFn: async ({ pageParam }) => {
        try {
          return await fetchFn({
            ...filters,
            page: pageParam as number,
            limit,
          } as FilterParams & BasePaginationParams);
        } catch (error) {
          const err = error instanceof Error ? error : new Error(String(error));
          if (errorHandler) errorHandler(err, `${resourceName} (infinite scroll)`);
          throw err;
        }
      },
      getNextPageParam: lastPage => {
        if (lastPage.page < Math.ceil(lastPage.total / lastPage.limit)) {
          return lastPage.page + 1;
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
   * Get all items (no pagination)
   */
  const getAllItems = fetchAllFn
    ? useQuery<T[], Error>({
        queryKey: [resourceName],
        queryFn: async () => {
          try {
            return await fetchAllFn();
          } catch (error) {
            if (errorHandler) errorHandler(error, `all ${resourceName}`);
            throw error;
          }
        },
        staleTime: STALE_TIME,
        gcTime: GC_TIME,
        refetchOnWindowFocus: false,
        ...DEFAULT_RETRY_OPTIONS,
      })
    : undefined;

  /**
   * Prefetch an item by ID
   */
  const prefetchById = useCallback(
    async (id: string) => {
      if (!id) return;

      try {
        await queryClient.prefetchQuery({
          queryKey: [resourceName, id],
          queryFn: () => fetchByIdFn(id),
          staleTime: STALE_TIME,
          gcTime: GC_TIME,
          ...DEFAULT_RETRY_OPTIONS,
        });
      } catch (error) {
        console.error(`Failed to prefetch ${resourceName} with ID ${id}:`, error);
      }
    },
    [queryClient, resourceName, fetchByIdFn],
  );

  /**
   * Invalidate cache for a specific item
   */
  const invalidateItemCache = useCallback(
    async (id: string, forceRefetch = false) => {
      if (!id) return;

      try {
        await queryClient.invalidateQueries({
          queryKey: [resourceName, id],
          refetchType: forceRefetch ? 'active' : 'none',
        });
      } catch (error) {
        console.error(`Failed to invalidate ${resourceName} cache for ID ${id}:`, error);
      }
    },
    [queryClient, resourceName],
  );

  /**
   * Invalidate list cache
   */
  const invalidateListCache = useCallback(
    async (forceRefetch = false) => {
      try {
        await queryClient.invalidateQueries({
          queryKey: [`${resourceName}-list`],
          refetchType: forceRefetch ? 'active' : 'none',
        });

        if (fetchAllFn) {
          await queryClient.invalidateQueries({
            queryKey: [resourceName],
            refetchType: forceRefetch ? 'active' : 'none',
          });
        }
      } catch (error) {
        console.error(`Failed to invalidate ${resourceName} list cache:`, error);
      }
    },
    [queryClient, resourceName, fetchAllFn],
  );

  return {
    getById,
    listItems,
    getItemsInfinite,
    getAllItems,
    prefetchById,
    invalidateItemCache,
    invalidateListCache,
  };
};
