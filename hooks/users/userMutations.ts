'use client';

import {useMutation, useQueryClient} from '@tanstack/react-query';
import {
  registerMutationFn,
  updateStatusMutationFn,
  loginMutationFn,
  updateUserMutationFn,
} from '@/apis/user/user.api';
import {TUserSchema} from '@/schemas/user';
import {toast} from '../use-toast';
import {UserType} from './useUserQueries';
import {UserStatusEnum} from '@/common/enum';

// API functions cho user management
const createUser = async (data: Omit<TUserSchema, 'id'>) => {
  return registerMutationFn(data);
};

const updateUser = async ({
  id,
  data,
}: {
  id: string;
  data: Omit<TUserSchema, 'id'>;
}) => {
  return updateUserMutationFn({id, data});
}; 


const deleteUser = async (id: string) => {
  try {
    const response = await fetch(`/api/users/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to delete user');
    }

    return await response.json();
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
};

/**
 * Hook for user-related mutations with optimistic updates
 */
export const useUserMutations = () => {
  const queryClient = useQueryClient();

  /**
   * Create a new user with optimistic update
   */
  const createUserMutation = useMutation({
    mutationFn: (data: Omit<TUserSchema, 'id'>) => createUser(data),
    onMutate: async newUserData => {
      // Cancel any outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({queryKey: ['users-list']});

      // Find and store the current query data for users-list
      const queries = queryClient.getQueriesData({queryKey: ['users-list']});
      const previousUsersListData = [];

      for (const [queryKey, queryData] of queries) {
        previousUsersListData.push({queryKey, queryData});
      }

      // Tạo user mới với ID tạm thời
      const tempId = `temp-${Date.now()}`;
      const optimisticUser = {
        ...newUserData,
        id: tempId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Update each users-list query with optimistic data
      for (const {queryKey} of previousUsersListData) {
        queryClient.setQueryData(queryKey, (oldData: any) => {
          if (!oldData || !oldData.data) return oldData;

          return {
            ...oldData,
            data: [optimisticUser, ...oldData.data],
            total: oldData.total + 1,
          };
        });
      }

      return {previousUsersListData, tempId};
    },
    onSuccess: async (result, variables, context) => {
      // Hiển thị thông báo thành công
      toast({
        title: 'Người dùng đã được tạo thành công',
        duration: 2000,
      });

      // Chỉ đánh dấu queries là stale mà không tự động refetch
      // Component sẽ quyết định khi nào refetch
      queryClient.invalidateQueries({
        queryKey: ['users-list'],
        refetchType: 'none',
      });

      queryClient.invalidateQueries({
        queryKey: ['users'],
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
        variant: 'destructive',
        duration: 2000,
      });

      // Rollback to the previous state for all users-list queries
      if (context?.previousUsersListData) {
        for (const {queryKey, queryData} of context.previousUsersListData) {
          queryClient.setQueryData(queryKey, queryData);
        }
      }
    },
  });

  /**
   * Update an existing user with optimistic update
   */
  const updateUserMutation = useMutation({
    mutationFn: ({id, data}: {id: string; data: Partial<TUserSchema>}) =>
      updateUser({id, data: data as Omit<TUserSchema, 'id'>}),
    onMutate: async ({id, data}) => {
      // Cancel any outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({queryKey: ['users-list']});
      await queryClient.cancelQueries({queryKey: ['user', id]});

      // Get current data
      const previousUser = queryClient.getQueryData(['user', id]);

      // Find and store the current query data for users-list
      const queries = queryClient.getQueriesData({queryKey: ['users-list']});
      const previousUsersListData = [];

      for (const [queryKey, queryData] of queries) {
        previousUsersListData.push({queryKey, queryData});

        // Update the users list data optimistically
        queryClient.setQueryData(queryKey, (old: any) => {
          if (!old || !old.data) return old;
          return {
            ...old,
            data: old.data.map((user: UserType) =>
              user.id === id
                ? {...user, ...data, updatedAt: new Date().toISOString()}
                : user,
            ),
          };
        });
      }

      // Update individual user
      if (previousUser) {
        queryClient.setQueryData(['user', id], (old: any) => ({
          ...old,
          ...data,
          updatedAt: new Date().toISOString(),
        }));
      }

      return {previousUser, previousUsersListData};
    },
    onSuccess: async (_, variables) => {
      // Show success toast
      toast({
        title: 'Người dùng đã được cập nhật thành công',
        duration: 2000,
      });

      // Chỉ đánh dấu queries là stale mà không tự động refetch
      queryClient.invalidateQueries({
        queryKey: ['users-list'],
        refetchType: 'none',
      });

      queryClient.invalidateQueries({
        queryKey: ['users'],
        refetchType: 'none',
      });

      queryClient.invalidateQueries({
        queryKey: ['user', variables.id],
        refetchType: 'none',
      });
    },
    onError: (error, variables, context) => {
      // Show error toast
      toast({
        title: 'Không thể cập nhật người dùng',
        description: (error as Error).message,
        variant: 'destructive',
        duration: 2000,
      });

      // Rollback
      if (context?.previousUser) {
        queryClient.setQueryData(['user', variables.id], context.previousUser);
      }

      // Restore all users-list queries
      if (context?.previousUsersListData) {
        for (const {queryKey, queryData} of context.previousUsersListData) {
          queryClient.setQueryData(queryKey, queryData);
        }
      }
    },
  });

  /**
   * Delete a user with optimistic update
   */
  const deleteUserMutation = useMutation({
    mutationFn: (id: string) => deleteUser(id),
    onMutate: async id => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({queryKey: ['users-list']});

      // Find and store the current query data for users-list
      const queries = queryClient.getQueriesData({queryKey: ['users-list']});
      const previousUsersListData = [];

      for (const [queryKey, queryData] of queries) {
        previousUsersListData.push({queryKey, queryData});

        // Update the users list data optimistically
        queryClient.setQueryData(queryKey, (old: any) => {
          if (!old || !old.data) return old;
          return {
            ...old,
            data: old.data.filter((user: UserType) => user.id !== id),
            total: Math.max(0, old.total - 1),
          };
        });
      }

      return {previousUsersListData};
    },
    onSuccess: async (_, id) => {
      // Show success toast
      toast({
        title: 'Người dùng đã được xóa thành công',
        duration: 2000,
      });

      // Chỉ đánh dấu queries là stale mà không tự động refetch
      queryClient.invalidateQueries({
        queryKey: ['users-list'],
        refetchType: 'none',
      });

      queryClient.invalidateQueries({
        queryKey: ['users'],
        refetchType: 'none',
      });

      // Remove specific user queries
      queryClient.removeQueries({queryKey: ['user', id]});
    },
    onError: (error, id, context) => {
      // Show error toast
      toast({
        title: 'Không thể xóa người dùng',
        description: (error as Error).message,
        variant: 'destructive',
        duration: 2000,
      });

      // Restore all users-list queries
      if (context?.previousUsersListData) {
        for (const {queryKey, queryData} of context.previousUsersListData) {
          queryClient.setQueryData(queryKey, queryData);
        }
      }
    },
  });

  /**
   * Update user status mutation
   */
  const updateUserStatusMutation = useMutation({
    mutationFn: (data: {id: string; status: UserStatusEnum}) =>
      updateUser({
        id: data.id,
        data: {
          username: '', // provide actual values
          employeeId: '', // provide actual values
          roleId: '', // provide actual values
          fullName: '', // provide actual values
          cardId: '', // provide actual values
          status: data.status,
        },
      }),
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
        variant: 'destructive',
        duration: 2000,
      });
    },
  });

  return {
    createUserMutation,
    updateUserMutation,
    deleteUserMutation,
    updateUserStatusMutation,
  };
};
