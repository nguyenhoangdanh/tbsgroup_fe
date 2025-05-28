'use client';

import {
  useQuery,
  useInfiniteQuery,
  useQueryClient,
  UseQueryResult,
  UseInfiniteQueryResult,
  InfiniteData,
} from '@tanstack/react-query';
import { useCallback, useMemo, useState } from 'react';
import { toast } from 'react-toast-kit';

import { 
  UserProfileType, 
  UserListParams, 
  UserListResponse,
  UserRoleResponse 
} from '@/common/interface/user';
import { UserService } from '@/services/user/user.service';

// Cache configurations
const GC_TIME = 60 * 60 * 1000; // 60 minutes
const STALE_TIME = 10 * 60 * 1000; // 10 minutes
const LIST_STALE_TIME = 60 * 1000; // 1 minute

// Retry configuration
const DEFAULT_RETRY_OPTIONS = {
  retry: 2,
  retryDelay: (attemptIndex: number) => Math.min(1000 * Math.pow(1.5, attemptIndex), 30000),
};

/**
 * Create stable query key to avoid unnecessary re-renders and refetches
 */
const createStableQueryKey = (params: Record<string, any>) => {
  const sortedParams: Record<string, any> = {};

  Object.keys(params)
    .sort()
    .forEach(key => {
      if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
        sortedParams[key] = params[key];
      }
    });

  return sortedParams;
};

/**
 * Hook for user-related queries with optimized caching
 */
export const useUserQueries = () => {
  const queryClient = useQueryClient();
  const [queryError, setQueryError] = useState<Error | null>(null);

  /**
   * Handle query errors with toast notifications
   */
  const handleQueryError = useCallback((error: any, queryName: string) => {
    let errorMessage = 'Lỗi không xác định';
    try {
      if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
    } catch (e) {
      errorMessage = `Lỗi không thể đọc thông báo: ${String(e)}`;
    }

    setQueryError(error);

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
   * Get current user profile
   */
  const getCurrentProfile = (): UseQueryResult<UserProfileType, Error> =>
    useQuery<UserProfileType, Error>({
      queryKey: ['user-profile'],
      queryFn: async () => {
        try {
          return await UserService.getProfile();
        } catch (error) {
          const err = error instanceof Error ? error : new Error(String(error));
          handleQueryError(err, 'hồ sơ người dùng');
          throw err;
        }
      },
      staleTime: STALE_TIME,
      gcTime: GC_TIME,
      refetchOnWindowFocus: false,
      ...DEFAULT_RETRY_OPTIONS,
    });

  /**
   * Get user by ID
   */
  const getUserById = (
    id?: string,
    options?: { enabled?: boolean },
  ): UseQueryResult<UserProfileType, Error> =>
    useQuery<UserProfileType, Error>({
      queryKey: ['user', id],
      queryFn: async () => {
        if (!id) throw new Error('User ID is required');
        try {
          return await UserService.getById(id);
        } catch (error) {
          const err = error instanceof Error ? error : new Error(String(error));
          handleQueryError(err, 'người dùng');
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
   * List users with filtering and pagination
   */
  const listUsers = (
    params: UserListParams = {},
    options?: any,
  ): UseQueryResult<UserListResponse, Error> => {
    // Create stable query key to avoid unnecessary refetches
    const stableParams = useMemo(() => createStableQueryKey(params), [params]);

    return useQuery<UserListResponse, Error>({
      queryKey: ['users-list', stableParams],
      queryFn: async () => {
        try {
          return await UserService.getList(params);
        } catch (error) {
          const err = error instanceof Error ? error : new Error(String(error));
          handleQueryError(err, 'danh sách người dùng');
          throw err;
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
   * Get users with infinite scrolling
   */
  const getUsersInfinite = (
    limit = 20,
    filters: Omit<UserListParams, 'page' | 'limit'> = {},
  ): UseInfiniteQueryResult<InfiniteData<UserListResponse>, Error> => {
    // Create stable query key
    const stableFilters = useMemo(() => createStableQueryKey(filters), [filters]);

    return useInfiniteQuery<UserListResponse, Error>({
      queryKey: ['users-infinite', limit, stableFilters],
      initialPageParam: 1,
      queryFn: async ({ pageParam }) => {
        try {
          return await UserService.getList({
            ...filters,
            page: pageParam as number,
            limit,
          });
        } catch (error) {
          const err = error instanceof Error ? error : new Error(String(error));
          handleQueryError(err, 'người dùng (infinite scroll)');
          throw err;
        }
      },
      getNextPageParam: (lastPage) => {
        const totalPages = Math.ceil(lastPage.total / lastPage.limit);
        if (lastPage.page < totalPages) {
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
   * Get user roles
   */
  const getUserRoles = (
    id?: string,
    options?: { enabled?: boolean },
  ): UseQueryResult<UserRoleResponse[], Error> =>
    useQuery<UserRoleResponse[], Error>({
      queryKey: ['user-roles', id],
      queryFn: async () => {
        if (!id) throw new Error('User ID is required');
        try {
          return await UserService.getUserRoles(id);
        } catch (error) {
          const err = error instanceof Error ? error : new Error(String(error));
          handleQueryError(err, 'vai trò người dùng');
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
   * Prefetch users data
   */
  const prefetchUsers = useCallback(async (params: UserListParams = {}) => {
    try {
      await queryClient.prefetchQuery({
        queryKey: ['users-list', createStableQueryKey(params)],
        queryFn: () => UserService.getList(params),
        staleTime: STALE_TIME,
        gcTime: GC_TIME,
        ...DEFAULT_RETRY_OPTIONS,
      });
    } catch (error) {
      console.error('Failed to prefetch users:', error);
    }
  }, [queryClient]);

  /**
   * Prefetch a specific user
   */
  const prefetchUserById = useCallback(
    async (id: string) => {
      if (!id) return;

      try {
        await queryClient.prefetchQuery({
          queryKey: ['user', id],
          queryFn: () => UserService.getById(id),
          staleTime: STALE_TIME,
          gcTime: GC_TIME,
          ...DEFAULT_RETRY_OPTIONS,
        });
      } catch (error) {
        console.error(`Failed to prefetch user with ID ${id}:`, error);
      }
    },
    [queryClient],
  );

  /**
   * Invalidate users cache without forcing a refetch
   */
  const invalidateUsersCache = useCallback(
    async (forceRefetch = false) => {
      try {
        await queryClient.invalidateQueries({
          queryKey: ['users-list'],
          refetchType: forceRefetch ? 'active' : 'none',
        });

        await queryClient.invalidateQueries({
          queryKey: ['users-infinite'],
          refetchType: forceRefetch ? 'active' : 'none',
        });
      } catch (error) {
        console.error('Failed to invalidate users cache:', error);
      }
    },
    [queryClient],
  );

  /**
   * Invalidate a specific user's cache
   */
  const invalidateUserCache = useCallback(
    async (id: string, forceRefetch = false) => {
      if (!id) return;

      try {
        await queryClient.invalidateQueries({
          queryKey: ['user', id],
          refetchType: forceRefetch ? 'active' : 'none',
        });

        await queryClient.invalidateQueries({
          queryKey: ['user-roles', id],
          refetchType: forceRefetch ? 'active' : 'none',
        });
      } catch (error) {
        console.error(`Failed to invalidate user cache for ID ${id}:`, error);
      }
    },
    [queryClient],
  );

  /**
   * Invalidate current user profile cache
   */
  const invalidateProfileCache = useCallback(
    async (forceRefetch = false) => {
      try {
        await queryClient.invalidateQueries({
          queryKey: ['user-profile'],
          refetchType: forceRefetch ? 'active' : 'none',
        });
      } catch (error) {
        console.error('Failed to invalidate profile cache:', error);
      }
    },
    [queryClient],
  );

  return {
    // Query hooks
    getCurrentProfile,
    getUserById,
    listUsers,
    getUsersInfinite,
    getUserRoles,

    // Prefetch methods
    prefetchUsers,
    prefetchUserById,

    // Cache invalidation methods
    invalidateUsersCache,
    invalidateUserCache,
    invalidateProfileCache,

    // Error handling
    queryError,
    resetQueryError,
  };
};
