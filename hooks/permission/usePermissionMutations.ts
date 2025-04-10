// src/hooks/permission/usePermissionMutations.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import {
  createPermissionApi,
  updatePermissionApi,
  deletePermissionApi,
  assignPermissionsToRoleApi,
  removePermissionsFromRoleApi,
} from '@/apis/permission/permission.api';
import { AssignPermissionsDTO, CreatePermissionDTO, UpdatePermissionDTO } from '@/common/types/permission';

/**
 * Custom hook for Permission mutations
 */
export const usePermissionMutations = () => {
  const queryClient = useQueryClient();

  /**
   * Helper to invalidate relevant caches after permission operations
   */
  const invalidateRelatedCaches = async (permissionId?: string) => {
    // Invalidate permissions list
    await queryClient.invalidateQueries({
      // queryKey: ['permission-list'],
      // refetchType: 'none',
      predicate: (query) => query.queryKey[0] === 'permission-list',
  refetchType: 'active',
    });

    // Invalidate specific permission if ID is provided
    if (permissionId) {
      await queryClient.invalidateQueries({
        queryKey: ['permission', permissionId],
        refetchType: 'none',
      });
    }

    // Invalidate role permissions since they might be affected
    await queryClient.invalidateQueries({
      queryKey: ['permissions-by-role'],
      refetchType: 'none',
    });

    // Invalidate user permissions and client access since they might be affected
    await queryClient.invalidateQueries({
      queryKey: ['user-permissions'],
      refetchType: 'none',
    });

    await queryClient.invalidateQueries({
      queryKey: ['client-permissions'],
      refetchType: 'none',
    });
  };

  /**
   * Create permission mutation
   */
  const createPermissionMutation = useMutation({
    mutationFn: (data: CreatePermissionDTO) => createPermissionApi(data),
    onSettled: async (data, error) => {
      if (!error) {
        toast({ title: 'Success', description: 'Permission created' });
        await invalidateRelatedCaches(data?.id);
      } else {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      }
    },
  });

  /**
   * Update permission mutation
   */
  const updatePermissionMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePermissionDTO }) => 
      updatePermissionApi(id, data),
    onSettled: async (data, error, variables) => {
      if (!error) {
        toast({ title: 'Success', description: 'Permission updated' });
        await invalidateRelatedCaches(variables.id);
      } else {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      }
    },
  });

  /**
   * Delete permission mutation
   */
  const deletePermissionMutation = useMutation({
    mutationFn: (id: string) => deletePermissionApi(id),
    onSettled: async (data, error, variables) => {
      if (!error) {
        toast({ title: 'Success', description: 'Permission deleted' });
        queryClient.removeQueries({ queryKey: ['permission', variables] });
        await invalidateRelatedCaches();
      } else {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      }
    },
  });

  /**
   * Assign permissions to role mutation
   */
  const assignPermissionsToRoleMutation = useMutation({
    mutationFn: ({ roleId, data }: { roleId: string; data: AssignPermissionsDTO }) => 
      assignPermissionsToRoleApi(roleId, data),
    onSuccess: async (_, { roleId }) => {
      // Show success toast
      toast({
        title: 'Permissions assigned',
        description: 'Permissions have been assigned to the role successfully.',
        duration: 3000,
      });

      // Invalidate role permissions
      await queryClient.invalidateQueries({
        queryKey: ['permissions-by-role', roleId],
        refetchType: 'active',
      });

      // Invalidate user permissions since they might be affected
      await queryClient.invalidateQueries({
        queryKey: ['user-permissions'],
        refetchType: 'active',
      });

      await queryClient.invalidateQueries({
        queryKey: ['client-permissions'],
        refetchType: 'active',
      });

       // Force refetch any active user-permissions queries to update the UI
       await queryClient.refetchQueries({ queryKey: ['user-permissions'] });
    },
    onError: (error: any) => {
      // Extract error message
      const errorMessage = error.message || 'An error occurred while assigning permissions';
      
      // Show error toast
      toast({
        title: 'Failed to assign permissions',
        description: errorMessage,
        variant: 'destructive',
        duration: 4000,
      });
    },
  });

  /**
   * Remove permissions from role mutation
   */
  const removePermissionsFromRoleMutation = useMutation({
    mutationFn: ({ roleId, data }: { roleId: string; data: AssignPermissionsDTO }) => 
      removePermissionsFromRoleApi(roleId, data),
    onSuccess: async (_, { roleId }) => {
      // Show success toast
      toast({
        title: 'Permissions removed',
        description: 'Permissions have been removed from the role successfully.',
        duration: 3000,
      });

      // Invalidate role permissions
      await queryClient.invalidateQueries({
        queryKey: ['permissions-by-role', roleId],
        refetchType: 'active',
      });

      // Invalidate user permissions since they might be affected
      await queryClient.invalidateQueries({
        queryKey: ['user-permissions'],
        refetchType: 'active',
      });

      await queryClient.invalidateQueries({
        queryKey: ['client-permissions'],
        refetchType: 'active',
      });

       // Force refetch any active user-permissions queries to update the UI
       await queryClient.refetchQueries({ queryKey: ['user-permissions'] });
    },
    onError: (error: any) => {
      // Extract error message
      const errorMessage = error.message || 'An error occurred while removing permissions';
      
      // Show error toast
      toast({
        title: 'Failed to remove permissions',
        description: errorMessage,
        variant: 'destructive',
        duration: 4000,
      });
    },
  })
    
  const refreshUserPermissions = async () => {
    await queryClient.refetchQueries({ queryKey: ['user-permissions'] });
  };;

  // Return all mutations
  return {
    createPermissionMutation,
    updatePermissionMutation,
    deletePermissionMutation,
    assignPermissionsToRoleMutation,
    removePermissionsFromRoleMutation,
    invalidateRelatedCaches,
    refreshUserPermissions,
  };
};