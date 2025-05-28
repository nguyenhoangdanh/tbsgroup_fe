import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toast-kit';

import { 
  UserProfileType,
  UserUpdateRequest,
  UserProfileUpdateRequest,
  UserRoleAssignmentRequest
} from '@/common/interface/user';
import { UserStatusEnum } from '@/common/enum';
import { UserService } from '@/services/user/user.service';
import { TUserSchema } from '@/schemas/user';

/**
 * Hook for user-related mutations with optimistic updates
 */
export const useUserMutations = () => {
  const queryClient = useQueryClient();

  /**
   * Create a new user (via auth/register)
   */
  const createUserMutation = useMutation({
    mutationFn: (data: Omit<TUserSchema, 'id'>) => UserService.create(data),
    onMutate: async newUserData => {
      // Cancel any outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: ['users-list'] });

      // Find and store the current query data for users-list
      const queries = queryClient.getQueriesData({ queryKey: ['users-list'] });
      const previousUsersListData = [];

      for (const [queryKey, queryData] of queries) {
        previousUsersListData.push({ queryKey, queryData });
      }

      // Create optimistic user with temp ID
      const tempId = `temp-${Date.now()}`;
      const optimisticUser: UserProfileType = {
        ...newUserData,
        id: tempId,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: newUserData.status || UserStatusEnum.PENDING_ACTIVATION,
      };

      // Update each users-list query with optimistic data
      for (const { queryKey } of previousUsersListData) {
        queryClient.setQueryData(queryKey, (oldData: any) => {
          if (!oldData || !oldData.data) return oldData;

          return {
            ...oldData,
            data: [optimisticUser, ...oldData.data],
            total: oldData.total + 1,
          };
        });
      }

      return { previousUsersListData, tempId };
    },
    onSuccess: async () => {
      toast({
        title: 'Người dùng đã được tạo thành công',
        duration: 2000,
      });

      // Mark queries as stale without auto-refetch
      queryClient.invalidateQueries({
        queryKey: ['users-list'],
        refetchType: 'none',
      });

      queryClient.invalidateQueries({
        queryKey: ['users-infinite'],
        refetchType: 'none',
      });
    },
    onError: (error, variables, context) => {
      toast({
        title: 'Không thể tạo người dùng',
        description: (error as Error).message,
        variant: 'error',
        duration: 2000,
      });

      // Rollback to the previous state for all users-list queries
      if (context?.previousUsersListData) {
        for (const { queryKey, queryData } of context.previousUsersListData) {
          queryClient.setQueryData(queryKey, queryData);
        }
      }
    },
  });

  /**
   * Update an existing user
   */
  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UserUpdateRequest }) =>
      UserService.update(id, data),
    onMutate: async ({ id, data }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['users-list'] });
      await queryClient.cancelQueries({ queryKey: ['user', id] });

      // Get current data
      const previousUser = queryClient.getQueryData(['user', id]);

      // Find and store the current query data for users-list
      const queries = queryClient.getQueriesData({ queryKey: ['users-list'] });
      const previousUsersListData = [];

      for (const [queryKey, queryData] of queries) {
        previousUsersListData.push({ queryKey, queryData });

        // Update the users list data optimistically
        queryClient.setQueryData(queryKey, (old: any) => {
          if (!old || !old.data) return old;
          return {
            ...old,
            data: old.data.map((user: UserProfileType) =>
              user.id === id ? { ...user, ...data, updatedAt: new Date() } : user,
            ),
          };
        });
      }

      // Update individual user
      if (previousUser) {
        queryClient.setQueryData(['user', id], (old: any) => ({
          ...old,
          ...data,
          updatedAt: new Date(),
        }));
      }

      return { previousUser, previousUsersListData };
    },
    onSuccess: async (_, variables) => {
      toast({
        title: 'Người dùng đã được cập nhật thành công',
        duration: 2000,
      });

      // Mark queries as stale without auto-refetch
      queryClient.invalidateQueries({
        queryKey: ['users-list'],
        refetchType: 'none',
      });

      queryClient.invalidateQueries({
        queryKey: ['user', variables.id],
        refetchType: 'none',
      });
    },
    onError: (error, variables, context) => {
      toast({
        title: 'Không thể cập nhật người dùng',
        description: (error as Error).message,
        variant: 'error',
        duration: 2000,
      });

      // Rollback
      if (context?.previousUser) {
        queryClient.setQueryData(['user', variables.id], context.previousUser);
      }

      // Restore all users-list queries
      if (context?.previousUsersListData) {
        for (const { queryKey, queryData } of context.previousUsersListData) {
          queryClient.setQueryData(queryKey, queryData);
        }
      }
    },
  });

  /**
   * Update user profile (limited fields)
   */
  const updateProfileMutation = useMutation({
    mutationFn: (data: UserProfileUpdateRequest) => UserService.updateProfile(data),
    onMutate: async (data) => {
      // Cancel outgoing profile query
      await queryClient.cancelQueries({ queryKey: ['user-profile'] });

      // Get current profile data
      const previousProfile = queryClient.getQueryData(['user-profile']);

      // Update profile optimistically
      if (previousProfile) {
        queryClient.setQueryData(['user-profile'], (old: any) => ({
          ...old,
          ...data,
          updatedAt: new Date(),
        }));
      }

      return { previousProfile };
    },
    onSuccess: () => {
      toast({
        title: 'Hồ sơ đã được cập nhật thành công',
        duration: 2000,
      });

      queryClient.invalidateQueries({
        queryKey: ['user-profile'],
        refetchType: 'none',
      });
    },
    onError: (error, variables, context) => {
      toast({
        title: 'Không thể cập nhật hồ sơ',
        description: (error as Error).message,
        variant: 'error',
        duration: 2000,
      });

      // Rollback profile
      if (context?.previousProfile) {
        queryClient.setQueryData(['user-profile'], context.previousProfile);
      }
    },
  });

  /**
   * Delete a user
   */
  const deleteUserMutation = useMutation({
    mutationFn: (id: string) => UserService.delete(id),
    onMutate: async id => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['users-list'] });

      // Find and store the current query data for users-list
      const queries = queryClient.getQueriesData({ queryKey: ['users-list'] });
      const previousUsersListData = [];

      for (const [queryKey, queryData] of queries) {
        previousUsersListData.push({ queryKey, queryData });

        // Update the users list data optimistically
        queryClient.setQueryData(queryKey, (old: any) => {
          if (!old || !old.data) return old;
          return {
            ...old,
            data: old.data.filter((user: UserProfileType) => user.id !== id),
            total: Math.max(0, old.total - 1),
          };
        });
      }

      return { previousUsersListData };
    },
    onSuccess: async (_, id) => {
      toast({
        title: 'Người dùng đã được xóa thành công',
        duration: 2000,
      });

      // Mark queries as stale without auto-refetch
      queryClient.invalidateQueries({
        queryKey: ['users-list'],
        refetchType: 'none',
      });

      queryClient.invalidateQueries({
        queryKey: ['users-infinite'],
        refetchType: 'none',
      });

      // Remove specific user queries
      queryClient.removeQueries({ queryKey: ['user', id] });
      queryClient.removeQueries({ queryKey: ['user-roles', id] });
    },
    onError: (error, id, context) => {
      toast({
        title: 'Không thể xóa người dùng',
        description: (error as Error).message,
        variant: 'error',
        duration: 2000,
      });

      // Restore all users-list queries
      if (context?.previousUsersListData) {
        for (const { queryKey, queryData } of context.previousUsersListData) {
          queryClient.setQueryData(queryKey, queryData);
        }
      }
    },
  });

  /**
   * Assign role to user
   */
  const assignRoleMutation = useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: UserRoleAssignmentRequest }) =>
      UserService.assignRole(userId, data),
    onSuccess: (_, variables) => {
      toast({
        title: 'Vai trò đã được gán thành công',
        duration: 2000,
      });

      // Invalidate user roles cache
      queryClient.invalidateQueries({
        queryKey: ['user-roles', variables.userId],
        refetchType: 'none',
      });

      // Invalidate user data
      queryClient.invalidateQueries({
        queryKey: ['user', variables.userId],
        refetchType: 'none',
      });
    },
    onError: (error) => {
      toast({
        title: 'Không thể gán vai trò',
        description: (error as Error).message,
        variant: 'error',
        duration: 2000,
      });
    },
  });

  /**
   * Remove role from user
   */
  const removeRoleMutation = useMutation({
    mutationFn: ({ userId, roleId, scope }: { userId: string; roleId: string; scope?: string }) =>
      UserService.removeRole(userId, roleId, scope),
    onSuccess: (_, variables) => {
      toast({
        title: 'Vai trò đã được gỡ bỏ thành công',
        duration: 2000,
      });

      // Invalidate user roles cache
      queryClient.invalidateQueries({
        queryKey: ['user-roles', variables.userId],
        refetchType: 'none',
      });

      // Invalidate user data
      queryClient.invalidateQueries({
        queryKey: ['user', variables.userId],
        refetchType: 'none',
      });
    },
    onError: (error) => {
      toast({
        title: 'Không thể gỡ bỏ vai trò',
        description: (error as Error).message,
        variant: 'error',
        duration: 2000,
      });
    },
  });

  /**
   * Update user status mutation (legacy support)
   */
  const updateUserStatusMutation = useMutation({
    mutationFn: (data: { id: string; status: UserStatusEnum }) =>
      UserService.update(data.id, { status: data.status }),
    onSuccess: async (_, variables) => {
      toast({
        title: 'Trạng thái người dùng đã được cập nhật',
        duration: 2000,
      });

      queryClient.invalidateQueries({
        queryKey: ['users-list'],
        refetchType: 'none',
      });

      queryClient.invalidateQueries({
        queryKey: ['user', variables.id],
        refetchType: 'none',
      });
    },
    onError: error => {
      toast({
        title: 'Không thể cập nhật trạng thái người dùng',
        description: (error as Error).message,
        variant: 'error',
        duration: 2000,
      });
    },
  });

  return {
    createUserMutation,
    updateUserMutation,
    updateProfileMutation,
    deleteUserMutation,
    assignRoleMutation,
    removeRoleMutation,
    updateUserStatusMutation,
  };
};
