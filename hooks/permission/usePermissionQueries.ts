import { useQuery, useQueryClient, UseQueryResult, UseQueryOptions } from '@tanstack/react-query';
import { useCallback } from 'react';
import { toast } from 'react-toast-kit';

import {
  getPermissionListApi,
  getPermissionByIdApi,
  getPermissionByCodeApi,
  getPermissionsByRoleApi,
  getUserPermissionsApi,
  checkUserHasPermissionApi,
  getClientAccessPermissionsApi,
} from '@/apis/permission/permission.api';
import {
  ClientAccessResponse,
  PaginationDTO,
  PermissionCondDTO,
  PermissionDTO,
  PermissionListResponse,
  UserPermissionsQueryDTO,
  UserPermissionsResponse,
} from '@/common/types/permission';
import { validateUUIDOrShowError } from '@/utils/uuid-utils';

interface RolePermissionResponse {
  data: PermissionDTO[];
}

const PERMISSIONS_STALE_TIME = 5 * 60 * 1000; // 5 minutes
const USER_PERMISSIONS_STALE_TIME = 1 * 60 * 1000; // 1 minute
const CLIENT_ACCESS_STALE_TIME = 5 * 60 * 1000; // 5 minutes

/**
 * Custom hook for Permission queries
 */
export const usePermissionQueries = () => {
  const queryClient = useQueryClient();

  /**
   * Handle query errors with toast notification
   */
  const showErrorToast = useCallback((error: any, queryName: string) => {
    // Safely extract error message
    let errorMessage = 'Lỗi không xác định';
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'object' && error !== null && 'message' in error) {
      errorMessage = error.message as string;
    }

    toast({
      title: `Không thể tải ${queryName}`,
      description: errorMessage || 'Vui lòng thử lại sau',
      variant: 'error',
      duration: 3000,
    });
  }, []);

  /**
   * List permissions with filtering and pagination
   */
  const listPermissions = (
    params: PermissionCondDTO & PaginationDTO = {},
    options?: Omit<
      UseQueryOptions<PermissionListResponse, Error, PermissionListResponse, unknown[]>,
      'queryKey' | 'queryFn'
    >,
  ): UseQueryResult<PermissionListResponse, Error> => {
    // Create stable query key from params
    const queryKey = ['permission-list', JSON.stringify(params)];

    return useQuery({
      queryKey,
      queryFn: () => getPermissionListApi(params),
      staleTime: PERMISSIONS_STALE_TIME,
      gcTime: 5 * 60 * 1000, // Cache for 5 minutes
      ...options,
    });
  };

  /**
   * Get permission by ID
   */
  const getPermissionById = (
    id?: string,
    options?: Omit<
      UseQueryOptions<PermissionDTO, Error, PermissionDTO, unknown[]>,
      'queryKey' | 'queryFn' | 'enabled'
    >,
  ): UseQueryResult<PermissionDTO, Error> => {
    return useQuery({
      queryKey: ['permission', id],
      queryFn: () => {
        //  Validate UUID before making API call
        const validatedId = validateUUIDOrShowError(id);
        if (!validatedId) {
          throw new Error('ID quyền không hợp lệ');
        }
        return getPermissionByIdApi(validatedId);
      },
      enabled: !!id,
      staleTime: PERMISSIONS_STALE_TIME,
      ...options,
    });
  };

  /**
   * Get permission by code
   */
  const getPermissionByCode = (
    code?: string,
    options?: Omit<
      UseQueryOptions<PermissionDTO, Error, PermissionDTO, unknown[]>,
      'queryKey' | 'queryFn' | 'enabled'
    >,
  ): UseQueryResult<PermissionDTO, Error> => {
    return useQuery({
      queryKey: ['permission-code', code],
      queryFn: async () => {
        if (!code) throw new Error('Mã quyền không được để trống');
        return await getPermissionByCodeApi(code);
      },
      enabled: !!code,
      staleTime: PERMISSIONS_STALE_TIME,
      ...options,
    });
  };

  /**
   * Get permissions by role
   */
  const getPermissionsByRole = (
    roleId?: string,
    options?: Omit<
      UseQueryOptions<RolePermissionResponse, Error, RolePermissionResponse, unknown[]>,
      'queryKey' | 'queryFn' | 'enabled'
    >,
  ): UseQueryResult<RolePermissionResponse, Error> => {
    return useQuery({
      queryKey: ['permissions-by-role', roleId],
      queryFn: () => {
        // Validate UUID before making API call
        const validatedId = validateUUIDOrShowError(roleId);
        if (!validatedId) {
          throw new Error('ID vai trò không hợp lệ');
        }
        return getPermissionsByRoleApi(validatedId);
      },
      enabled: !!roleId,
      staleTime: PERMISSIONS_STALE_TIME,
      retry: 2,
      retryDelay: attempt => Math.min(1000 * 2 ** attempt, 10000),
      ...options,
    });
  };

  /**
   * Get user permissions
   */
  type UserPermissionsResponseWrapper = {
    success: boolean;
    data: UserPermissionsResponse;
  };

  const getUserPermissions = (
    params: UserPermissionsQueryDTO = {},
    options?: Omit<
      UseQueryOptions<
        UserPermissionsResponseWrapper,
        Error,
        UserPermissionsResponseWrapper,
        unknown[]
      >,
      'queryKey' | 'queryFn'
    >,
  ): UseQueryResult<UserPermissionsResponseWrapper, Error> => {
    // Create stable query key from params
    const queryKey = ['user-permissions', JSON.stringify(params)];

    return useQuery({
      queryKey,
      queryFn: () => getUserPermissionsApi(params),
      staleTime: USER_PERMISSIONS_STALE_TIME,
      retry: 3, // Thử lại 3 lần nếu thất bại
      retryDelay: attempt => Math.min(1000 * 2 ** attempt, 30000), // Tăng delay theo cấp số nhân
      ...options,
    });
  };

  /**
   * Check if user has specific permission
   */
  type CheckPermissionResponseWrapper = {
    success: boolean;
    data: { hasPermission: boolean };
  };

  const checkUserHasPermission = (
    permissionCode?: string,
    options?: Omit<
      UseQueryOptions<
        CheckPermissionResponseWrapper,
        Error,
        CheckPermissionResponseWrapper,
        unknown[]
      >,
      'queryKey' | 'queryFn' | 'enabled'
    >,
  ): UseQueryResult<CheckPermissionResponseWrapper, Error> => {
    return useQuery({
      queryKey: ['has-permission', permissionCode],
      queryFn: () => {
        if (!permissionCode) throw new Error('Mã quyền không được để trống');
        return checkUserHasPermissionApi(permissionCode);
      },
      enabled: !!permissionCode,
      staleTime: USER_PERMISSIONS_STALE_TIME,
      ...options,
    });
  };

  /**
   * Get client access permissions for UI rendering
   */
  type ClientAccessResponseWrapper = {
    success: boolean;
    data: ClientAccessResponse;
  };

  const getClientAccessPermissions = (
    options?: Omit<
      UseQueryOptions<ClientAccessResponseWrapper, Error, ClientAccessResponseWrapper, unknown[]>,
      'queryKey' | 'queryFn'
    >,
  ): UseQueryResult<ClientAccessResponseWrapper, Error> => {
    return useQuery({
      queryKey: ['client-permissions'],
      queryFn: () => getClientAccessPermissionsApi(),
      staleTime: CLIENT_ACCESS_STALE_TIME,
      ...options,
    });
  };

  /**
   * Invalidate permission cache for a specific permission
   */
  const invalidatePermissionCache = useCallback(
    async (id: string, forceRefetch = false) => {
      if (!id) return;

      try {
        await queryClient.invalidateQueries({
          queryKey: ['permission', id],
          refetchType: forceRefetch ? 'active' : 'none',
        });
      } catch (error) {
        console.error(`Không thể làm mới cache cho quyền có ID ${id}:`, error);
      }
    },
    [queryClient],
  );

  /**
   * Invalidate permissions list cache
   */
  const invalidatePermissionsCache = useCallback(
    async (forceRefetch = false) => {
      try {
        // Invalidate permission list
        await queryClient.invalidateQueries({
          queryKey: ['permission-list'],
          refetchType: forceRefetch ? 'active' : 'none',
        });

        // Invalidate role permissions
        await queryClient.invalidateQueries({
          queryKey: ['permissions-by-role'],
          refetchType: forceRefetch ? 'active' : 'none',
        });
      } catch (error) {
        console.error('Không thể làm mới cache quyền:', error);
      }
    },
    [queryClient],
  );

  /**
   * Invalidate user permissions cache
   */
  const invalidateUserPermissionsCache = useCallback(
    async (userId?: string, forceRefetch = false) => {
      try {
        // If userId is provided, only invalidate for that specific user
        if (userId) {
          await queryClient.invalidateQueries({
            queryKey: ['user-permissions'],
            refetchType: forceRefetch ? 'active' : 'none',
            predicate: query => {
              const [, paramsString] = query.queryKey as [string, string];
              if (typeof paramsString === 'string') {
                try {
                  const params = JSON.parse(paramsString);
                  return params.userId === userId;
                } catch (e) {
                  return false;
                }
              }
              return false;
            },
          });
        } else {
          // Otherwise invalidate all user permissions
          await queryClient.invalidateQueries({
            queryKey: ['user-permissions'],
            refetchType: forceRefetch ? 'active' : 'none',
          });
        }

        // Also invalidate permission checks and client access permissions
        await queryClient.invalidateQueries({
          queryKey: ['has-permission'],
          refetchType: forceRefetch ? 'active' : 'none',
        });

        await queryClient.invalidateQueries({
          queryKey: ['client-permissions'],
          refetchType: forceRefetch ? 'active' : 'none',
        });
      } catch (error) {
        console.error('Không thể làm mới cache quyền của người dùng:', error);
      }
    },
    [queryClient],
  );

  // Return all query functions and the error handler for manual use
  return {
    listPermissions,
    getPermissionById,
    getPermissionByCode,
    getPermissionsByRole,
    getUserPermissions,
    checkUserHasPermission,
    getClientAccessPermissions,
    invalidatePermissionCache,
    invalidatePermissionsCache,
    invalidateUserPermissionsCache,
    showErrorToast,
  };
};
