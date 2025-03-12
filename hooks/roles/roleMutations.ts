'use client';

import {useMutation, useQueryClient} from '@tanstack/react-query';
import {
  createRole,
  deleteRole,
  RoleType,
  updateRole,
} from '@/apis/roles/role.api';
import {TRoleSchema} from '@/schemas/role';
import {toast} from '../use-toast';

/**
 * Hook for role-related mutations with optimistic updates
 */
export const useRoleMutations = () => {
  const queryClient = useQueryClient();

  /**
   * Create a new role with optimistic update
   */
  const createRoleMutation = useMutation({
    mutationFn: (data: Omit<TRoleSchema, 'id' | 'createdAt' | 'updatedAt'>) =>
      createRole(data),
    onMutate: async newRoleData => {
      // Cancel any outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({queryKey: ['roles-list']});

      // Find and store the current query data for roles-list
      const queries = queryClient.getQueriesData({queryKey: ['roles-list']});
      const previousRolesListData = [];
      
      for (const [queryKey, queryData] of queries) {
        previousRolesListData.push({queryKey, queryData});
      }

      // Tạo role mới với ID tạm thời
      const tempId = `temp-${Date.now()}`;
      const optimisticRole = {
        ...newRoleData,
        id: tempId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Update each roles-list query with optimistic data
      for (const {queryKey} of previousRolesListData) {
        queryClient.setQueryData(queryKey, (oldData: any) => {
          if (!oldData || !oldData.data) return oldData;
          
          return {
            ...oldData,
            data: [optimisticRole, ...oldData.data],
            total: oldData.total + 1,
          };
        });
      }

      return {previousRolesListData, tempId};
    },
    onSuccess: async (result, variables, context) => {
      // Hiển thị thông báo thành công
      toast({
        title: 'Vai trò đã được tạo thành công',
        duration: 2000,
      });

      // Chỉ đánh dấu queries là stale mà không tự động refetch
      // Component sẽ quyết định khi nào refetch
      queryClient.invalidateQueries({
        queryKey: ['roles-list'],
        refetchType: 'none',
      });
      
      queryClient.invalidateQueries({
        queryKey: ['roles'],
        refetchType: 'none',
      });
      
      queryClient.invalidateQueries({
        queryKey: ['roles-infinite'],
        refetchType: 'none',
      });
    },
    onError: (error, variables, context) => {
      toast({
        title: 'Không thể tạo vai trò',
        description: (error as Error).message,
        variant: 'destructive',
        duration: 2000,
      });

      // Rollback to the previous state for all roles-list queries
      if (context?.previousRolesListData) {
        for (const {queryKey, queryData} of context.previousRolesListData) {
          queryClient.setQueryData(queryKey, queryData);
        }
      }
    },
  });

  /**
   * Update an existing role with optimistic update
   */
  const updateRoleMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Omit<TRoleSchema, 'id' | 'createdAt' | 'updatedAt'>;
    }) => updateRole({id, data}),
    onMutate: async ({id, data}) => {
      // Cancel any outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({queryKey: ['roles-list']});
      await queryClient.cancelQueries({queryKey: ['role', id]});

      // Get current data
      const previousRole = queryClient.getQueryData(['role', id]);
      
      // Find and store the current query data for roles-list
      const queries = queryClient.getQueriesData({queryKey: ['roles-list']});
      const previousRolesListData = [];
      
      for (const [queryKey, queryData] of queries) {
        previousRolesListData.push({queryKey, queryData});
        
        // Update the roles list data optimistically
        queryClient.setQueryData(queryKey, (old: any) => {
          if (!old || !old.data) return old;
          return {
            ...old,
            data: old.data.map((role: RoleType) =>
              role.id === id ? {...role, ...data, updatedAt: new Date()} : role,
            ),
          };
        });
      }

      // Update individual role
      if (previousRole) {
        queryClient.setQueryData(['role', id], (old: any) => ({
          ...old,
          ...data,
          updatedAt: new Date(),
        }));
      }

      return {previousRole, previousRolesListData};
    },
    onSuccess: async (_, variables) => {
      // Show success toast
      toast({
        title: 'Vai trò đã được cập nhật thành công',
        duration: 2000,
      });

      // Chỉ đánh dấu queries là stale mà không tự động refetch
      queryClient.invalidateQueries({
        queryKey: ['roles-list'],
        refetchType: 'none',
      });

      queryClient.invalidateQueries({
        queryKey: ['roles'],
        refetchType: 'none',
      });

      queryClient.invalidateQueries({
        queryKey: ['role', variables.id],
        refetchType: 'none',
      });

      // If code is updated, invalidate that query too
      if (variables.data.code) {
        queryClient.invalidateQueries({
          queryKey: ['role-by-code', variables.data.code],
          refetchType: 'none',
        });
      }
    },
    onError: (error, variables, context) => {
      // Show error toast
      toast({
        title: 'Không thể cập nhật vai trò',
        description: (error as Error).message,
        variant: 'destructive',
        duration: 2000,
      });

      // Rollback
      if (context?.previousRole) {
        queryClient.setQueryData(['role', variables.id], context.previousRole);
      }
      
      // Restore all roles-list queries
      if (context?.previousRolesListData) {
        for (const {queryKey, queryData} of context.previousRolesListData) {
          queryClient.setQueryData(queryKey, queryData);
        }
      }
    },
  });

  /**
   * Delete a role with optimistic update
   */
  const deleteRoleMutation = useMutation({
    mutationFn: (id: string) => deleteRole(id),
    onMutate: async id => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({queryKey: ['roles-list']});

      // Find and store the current query data for roles-list
      const queries = queryClient.getQueriesData({queryKey: ['roles-list']});
      const previousRolesListData = [];
      
      for (const [queryKey, queryData] of queries) {
        previousRolesListData.push({queryKey, queryData});
        
        // Update the roles list data optimistically
        queryClient.setQueryData(queryKey, (old: any) => {
          if (!old || !old.data) return old;
          return {
            ...old,
            data: old.data.filter((role: RoleType) => role.id !== id),
            total: Math.max(0, old.total - 1),
          };
        });
      }

      return {previousRolesListData};
    },
    onSuccess: async (_, id) => {
      // Show success toast
      toast({
        title: 'Vai trò đã được xóa thành công',
        duration: 2000,
      });

      // Chỉ đánh dấu queries là stale mà không tự động refetch
      queryClient.invalidateQueries({
        queryKey: ['roles-list'],
        refetchType: 'none',
      });

      queryClient.invalidateQueries({
        queryKey: ['roles'],
        refetchType: 'none',
      });

      // Remove specific role queries
      queryClient.removeQueries({queryKey: ['role', id]});
      queryClient.removeQueries({queryKey: ['role-with-relations', id]});
    },
    onError: (error, id, context) => {
      // Show error toast
      toast({
        title: 'Không thể xóa vai trò',
        description: (error as Error).message,
        variant: 'destructive',
        duration: 2000,
      });

      // Restore all roles-list queries
      if (context?.previousRolesListData) {
        for (const {queryKey, queryData} of context.previousRolesListData) {
          queryClient.setQueryData(queryKey, queryData);
        }
      }
    },
  });

  return {
    createRoleMutation,
    updateRoleMutation,
    deleteRoleMutation,
  };
};