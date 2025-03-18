'use client';

import {
  useQuery,
  useInfiniteQuery,
  useQueryClient,
  UseQueryResult,
  UseInfiniteQueryResult,
  InfiniteData,
} from '@tanstack/react-query';
import {
  getAllUsersQueryFn,
  getUserProfileQueryFn,
  getUsersListQueryFn,
} from '@/apis/user/user.api';
import { useCallback, useMemo, useState } from 'react';
import { toast } from '../use-toast';
import { UserStatusEnum } from '@/common/enum';

// Định nghĩa các interface
export interface UserListParams {
  page?: number;
  limit?: number;
  username?: string;
  fullName?: string;
  role?: string;
  status?: UserStatusEnum;
}

export interface UserType {
  id: string;
  username: string;
  email?: string;
  fullName: string;
  employeeId?: string;
  cardId?: string;
  roleId?: string;
  role?: string;
  status?: UserStatusEnum;
  createdAt: string;
  updatedAt?: string;
  lastLogin?: string;
}

export interface UserItemType extends UserType {}

export interface UserWithRelationsType extends UserType {
  // Thêm các trường quan hệ nếu cần
}

export interface UserListResponse {
  data: UserType[];
  meta: {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    itemsPerPage: number;
  };
}

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
 * Hook for user-related queries with optimized caching
 */
export const useUserQueries = () => {
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
   * Prefetch users data
   */
  const prefetchUsers = useCallback(async () => {
    try {
      await queryClient.prefetchQuery({
        queryKey: ['users'],
        queryFn: getAllUsersQueryFn,
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
          queryFn: () => fetchUserById(id),
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

  // Hàm để gọi API lấy thông tin người dùng theo ID
  const fetchUserById = async (id: string) => {
    try {
      const response = await fetch(`/api/users/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch user');
      }
      return await response.json();
    } catch (error) {
      console.error(`Error fetching user with ID ${id}:`, error);
      throw error;
    }
  };

  // API để lấy danh sách users với phân trang và lọc
  const fetchUsersList = async (params: UserListParams = {}):
    Promise<UserListResponse> => {
    const queryParams = new URLSearchParams();
    
    // Thêm các tham số vào URL nếu chúng tồn tại
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.username) queryParams.append('username', params.username);
    if (params.fullName) queryParams.append('fullName', params.fullName);
    if (params.role) queryParams.append('role', params.role);
    if (params.status) queryParams.append('status', params.status);
    
    try {
      // Sử dụng hàm fetchWithAuth từ lib/fetcher để gọi API
      
      return await getUsersListQueryFn(params);
    } catch (error) {
      console.error('Error fetching users list:', error);
      throw error;
    }
  };

  /**
   * Get all users
   */
  const getAllUsers = useQuery<UserType[], Error>({
    queryKey: ['users'],
    queryFn: async () => {
      try {
        return await getAllUsersQueryFn();
      } catch (error) {
        handleQueryError(error, 'danh sách người dùng');
        throw error;
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
    options?: {enabled?: boolean},
  ): UseQueryResult<UserItemType, Error> =>
    useQuery<UserItemType, Error>({
      queryKey: ['user', id],
      queryFn: async () => {
        if (!id) throw new Error('User ID is required');
        try {
          return await fetchUserById(id);
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
          // return await fetchUsersList(params);
          return await getAllUsersQueryFn();
        } catch (error) {
          handleQueryError(error, 'danh sách người dùng');
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
   * Get users with infinite scrolling
   */
  const getUsersInfinite = (
    limit = 20,
    filters: Omit<UserListParams, 'page' | 'limit'> = {},
  ): UseInfiniteQueryResult<InfiniteData<UserListResponse>, Error> => {
    // Create stable query key
    const stableFilters = useMemo(
      () => createStableQueryKey(filters),
      [filters],
    );
  
    return useInfiniteQuery<UserListResponse, Error>({
      queryKey: ['users-infinite', limit, stableFilters],
      initialPageParam: 1,
      queryFn: async ({pageParam}) => {
        try {
          return await fetchUsersList({
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
   * Invalidate users cache without forcing a refetch
   */
  const invalidateUsersCache = useCallback(
    async (forceRefetch = false) => {
      try {
        await queryClient.invalidateQueries({
          queryKey: ['users'],
          refetchType: forceRefetch ? 'active' : 'none',
        });

        await queryClient.invalidateQueries({
          queryKey: ['users-list'],
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
      } catch (error) {
        console.error(`Failed to invalidate user cache for ID ${id}:`, error);
      }
    },
    [queryClient],
  );

  return {
    // Query hooks
    getAllUsers,
    getUserById,
    listUsers,
    getUsersInfinite,

    // Prefetch methods
    prefetchUsers,
    prefetchUserById,

    // Cache invalidation methods
    invalidateUsersCache,
    invalidateUserCache,
    
    // Error handling
    queryError,
    resetQueryError,
  };
};