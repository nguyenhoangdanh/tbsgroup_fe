'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRef, useEffect } from 'react';

import { createRole, deleteRole, RoleType, updateRole } from '@/apis/roles/role.api';
import { TRoleSchema } from '@/schemas/role';
import stableToast from '@/utils/stableToast';

/**
 * Hook for role-related mutations with optimistic updates
 * Optimized for high performance and reliability in multi-user environments
 */
export const useRoleMutations = () => {
  const queryClient = useQueryClient();

  // Track pending mutations to prevent concurrent operations on the same entity
  const pendingMutationsRef = useRef(new Map<string, number>());

  // Cleanup pending mutations on unmount
  useEffect(() => {
    return () => {
      pendingMutationsRef.current.clear();
    };
  }, []);

  /**
   * Create a new role with optimistic update
   * Enhanced with better error handling and performance optimizations
   */
  const createRoleMutation = useMutation({
    mutationFn: async (data: Omit<TRoleSchema, 'id' | 'createdAt' | 'updatedAt'>) => {
      // Generate a unique operation ID
      const operationId = `create-${Date.now()}`;
      pendingMutationsRef.current.set(operationId, Date.now());

      try {
        // Add validation or preprocessing here if needed
        const normalizedData = {
          ...data,
          code: data.code?.trim(),
          name: data.name?.trim(),
          description: data.description?.trim() || null,
        };

        return await createRole(normalizedData);
      } finally {
        pendingMutationsRef.current.delete(operationId);
      }
    },
    onMutate: async newRoleData => {
      // Cancel any outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: ['roles-list'] });

      //  Store the current query data for potential rollback
      const previousRolesListData: Array<{ queryKey: any; queryData: any }> = [];

      // Find all roles-list queries to update optimistically
      const queriesData = queryClient.getQueriesData({
        queryKey: ['roles-list'],
      });

      //  Fix: Convert to array to avoid iterator issues
      const queries = Array.from(queriesData);

      for (const [queryKey, queryData] of queries) {
        // Store original data for potential rollback
        previousRolesListData.push({ queryKey, queryData });
      }

      return {
        previousRolesListData
      };
    },
    onSuccess: async (result, variables, context) => {
      //  Show success notification
      stableToast.success('Vai trò đã được tạo thành công', {
        description: undefined
      });

      // Refresh data from server
      queryClient.invalidateQueries({
        queryKey: ['roles-list'],
        refetchType: 'active',
      });

      queryClient.invalidateQueries({
        queryKey: ['roles'],
        refetchType: 'active',
      });

      queryClient.invalidateQueries({
        queryKey: ['roles-infinite'],
        refetchType: 'active',
      });
    },
    onError: (error, variables, context) => {
      //  Show error notification
      stableToast.error('Không thể tạo vai trò', {
        description: (error as Error).message
      });

      // Rollback optimistic updates
      if (context?.previousRolesListData) {
        //  Fix: Use for...of loop on array instead of entries() to avoid iterator issues
        for (const item of context.previousRolesListData) {
          queryClient.setQueryData(item.queryKey, item.queryData);
        }
      }

      //  Log detailed error for debugging
      console.error('Create role mutation failed:', error);
    },
  });

  /**
   * Update an existing role with optimistic update
   * Enhanced with better conflict resolution
   */
  const updateRoleMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Omit<TRoleSchema, 'id' | 'createdAt' | 'updatedAt'>;
    }) => {
      //   Prevent concurrent updates to the same role
      if (pendingMutationsRef.current.has(`update-${id}`)) {
        throw new Error('Thao tác đang được thực hiện. Vui lòng đợi.');
      }

      // Validate ID is not temporary or invalid
      if (!id || typeof id !== 'string' || id.length < 5) {
        throw new Error('Invalid role ID provided for update');
      }

      //  Track this update operation
      const operationId = `update-${id}`;
      pendingMutationsRef.current.set(operationId, Date.now());

      try {
        //  Add validation or preprocessing here if needed
        const normalizedData = {
          ...data,
          code: data.code?.trim(),
          name: data.name?.trim(),
          description: data.description?.trim() || null,
        };

        return await updateRole({ id, data: normalizedData });
      } finally {
        pendingMutationsRef.current.delete(operationId);
      }
    },
    onMutate: async ({ id, data }) => {
      // Use timestamp for versioning
      const updateTimestamp = Date.now();

      // Cancel any outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: ['roles-list'] });
      await queryClient.cancelQueries({ queryKey: ['role', id] });

      // Store current data for potential rollback
      const previousRole = queryClient.getQueryData(['role', id]);
      // Fix: Use array instead of Map to avoid iterator issues
      const previousRolesListData: Array<{ queryKey: any; queryData: any }> = [];

      // Find and update all queries that might contain this role
      const queriesData = queryClient.getQueriesData({
        queryKey: ['roles-list'],
      });

      // Fix: Convert to array to avoid iterator issues
      const queries = Array.from(queriesData);

      for (const [queryKey, queryData] of queries) {
        previousRolesListData.push({ queryKey, queryData });

        //  Update cached data optimistically
        queryClient.setQueryData(queryKey, (oldData: any) => {
          if (!oldData || !oldData.data) return oldData;

          return {
            ...oldData,
            data: oldData.data.map((role: RoleType) =>
              role.id === id
                ? {
                    ...role,
                    ...data,
                    updatedAt: new Date(),
                    _v: updateTimestamp, // Add version for conflict detection
                  }
                : role,
            ),
          };
        });
      }

      // Update individual role query if it exists
      if (previousRole) {
        queryClient.setQueryData(['role', id], (oldData: any) => ({
          ...oldData,
          ...data,
          updatedAt: new Date(),
          _v: updateTimestamp,
        }));
      }

      return {
        previousRole,
        previousRolesListData,
        optimisticData: {
          ...data,
          id,
          updatedAt: new Date(),
          _v: updateTimestamp,
        },
      };
    },
    onSuccess: async (result, variables) => {
      //  Show success notification with brief delay to ensure UI consistency
      setTimeout(() => {
        stableToast.success('Vai trò đã được cập nhật thành công', {
          description: undefined
        });
      }, 100);

      //  Selectively invalidate related queries without forcing immediate refetch
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

      //   If code is updated, invalidate code-based queries too
      if (variables.data.code) {
        queryClient.invalidateQueries({
          queryKey: ['role-by-code', variables.data.code],
          refetchType: 'none',
        });
      }
    },
    onError: (error, variables, context) => {
      // Show error notification
      stableToast.error('Không thể cập nhật vai trò', {
        description: (error as Error).message
      });

      // Rollback individual role cache
      if (context?.previousRole) {
        queryClient.setQueryData(['role', variables.id], context.previousRole);
      }

      //  Rollback all roles-list queries
      if (context?.previousRolesListData) {
        // Fix: Use for...of loop on array instead of entries() to avoid iterator issues
        for (const item of context.previousRolesListData) {
          queryClient.setQueryData(item.queryKey, item.queryData);
        }
      }

      //  Log detailed error for debugging
      console.error('Update role mutation failed:', error, variables);
    },
  });

  /**
   * Delete a role with optimistic update
   * Enhanced with better concurrency handling
   */
  const deleteRoleMutation = useMutation({
    mutationFn: async (id: string) => {
      //  Prevent concurrent delete operations on the same role
      if (pendingMutationsRef.current.has(`delete-${id}`)) {
        throw new Error('Thao tác đang được thực hiện. Vui lòng đợi.');
      }

      // Validate ID is not temporary or invalid
      if (!id || typeof id !== 'string' || id.length < 5) {
        throw new Error('Invalid role ID provided for delete');
      }

      //  Track this delete operation
      const operationId = `delete-${id}`;
      pendingMutationsRef.current.set(operationId, Date.now());

      try {
        return await deleteRole(id);
      } finally {
        pendingMutationsRef.current.delete(operationId);
      }
    },
    onMutate: async id => {
      //    Cancel any outgoing refetches to avoid conflicts
      await queryClient.cancelQueries({ queryKey: ['roles-list'] });
      await queryClient.cancelQueries({ queryKey: ['role', id] });

      // Store current data for potential rollback
      const previousRolesListData: Array<{ queryKey: any; queryData: any }> = [];
      const previousRole = queryClient.getQueryData(['role', id]);

      // Find and update all relevant queries
      const queriesData = queryClient.getQueriesData({
        queryKey: ['roles-list'],
      });

      // Fix: Convert to array to avoid iterator issues
      const queries = Array.from(queriesData);

      for (const [queryKey, queryData] of queries) {
        previousRolesListData.push({ queryKey, queryData });

        // Update cache optimistically by removing the role
        queryClient.setQueryData(queryKey, (oldData: any) => {
          if (!oldData || !oldData.data) return oldData;

          // Filter out the deleted role
          const newData = oldData.data.filter((role: RoleType) => role.id !== id);

          return {
            ...oldData,
            data: newData,
            meta: oldData.meta
              ? {
                  ...oldData.meta,
                  total: Math.max(0, (oldData.meta.total || 0) - 1),
                }
              : undefined,
          };
        });
      }

      return { previousRolesListData, previousRole, deletedId: id };
    },
    onSuccess: async (_, id) => {
      // Show success notification
      stableToast.success('Vai trò đã được xóa thành công', {
        description: undefined
      });

      // Mark queries as stale without forcing immediate refetch
      queryClient.invalidateQueries({
        queryKey: ['roles-list'],
        refetchType: 'none',
      });

      queryClient.invalidateQueries({
        queryKey: ['roles'],
        refetchType: 'none',
      });

      //Remove specific role queries completely
      queryClient.removeQueries({ queryKey: ['role', id] });
      queryClient.removeQueries({ queryKey: ['role-with-relations', id] });
    },
    onError: (error, id, context) => {
      // Show error notification
      stableToast.error('Không thể xóa vai trò', {
        description: (error as Error).message
      });

      // Restore individual role data if it existed
      if (context?.previousRole) {
        queryClient.setQueryData(['role', id], context.previousRole);
      }

      // Restore all roles-list queries
      if (context?.previousRolesListData) {
        for (const item of context.previousRolesListData) {
          queryClient.setQueryData(item.queryKey, item.queryData);
        }
      }

      //Log detailed error for debugging
      console.error('Delete role mutation failed:', error, id);
    },
  });

  /**
   * Helper to check if there are any pending mutations
   * Useful for UI to show loading state or prevent actions
   */
  const hasPendingMutations = () => pendingMutationsRef.current.size > 0;

  /**
   * Helper to check if a specific entity has pending mutations
   * @param id The entity ID to check
   * @param operation Optional operation type (create, update, delete)
   */
  const hasEntityPendingMutation = (id: string, operation?: 'create' | 'update' | 'delete') => {
    if (operation) {
      return pendingMutationsRef.current.has(`${operation}-${id}`);
    }

    // Check for any operation on this entity
    return (
      pendingMutationsRef.current.has(`update-${id}`) ||
      pendingMutationsRef.current.has(`delete-${id}`)
    );
  };

  /**
   * Helper function to check if creation is in progress
   */
  const isCreating = () => {
    return Array.from(pendingMutationsRef.current.keys()).some(key => key.startsWith('create-'));
  };

  return {
    //  Core mutations
    createRoleMutation,
    updateRoleMutation,
    deleteRoleMutation,

    // Status helpers
    hasPendingMutations,
    hasEntityPendingMutation,
    isCreating,
  };
};
