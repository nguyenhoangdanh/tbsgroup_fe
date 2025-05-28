import { usePermissionMutations } from './usePermissionMutations';

import { toast } from 'react-toast-kit';

/**
 * Hook that provides utility functions for the BulkOperationsPanel
 */
export const useBulkOperationsUtils = () => {
  const {
    assignPermissionsToRoleMutation,
    removePermissionsFromRoleMutation,
    invalidateRelatedCaches,
  } = usePermissionMutations();

  /**
   * Assign permissions to a role
   */
  const assignPermissionsToRole = async (
    roleId: string,
    permissionIds: string[],
  ): Promise<boolean> => {
    try {
      await assignPermissionsToRoleMutation.mutateAsync({
        roleId,
        data: { permissionIds },
      });

      // Invalidate caches to refresh data
      await invalidateRelatedCaches();

      return true;
    } catch (error) {
      console.error(`Failed to assign permissions to role ${roleId}:`, error);

      toast({
        title: 'Error',
        description: 'Failed to assign permissions to role',
        variant: 'error',
      });

      return false;
    }
  };

  /**
   * Remove permissions from a role
   */
  const removePermissionsFromRole = async (
    roleId: string,
    permissionIds: string[],
  ): Promise<boolean> => {
    try {
      await removePermissionsFromRoleMutation.mutateAsync({
        roleId,
        data: { permissionIds },
      });

      // Invalidate caches to refresh data
      await invalidateRelatedCaches();

      return true;
    } catch (error) {
      console.error(`Failed to remove permissions from role ${roleId}:`, error);

      toast({
        title: 'Error',
        description: 'Failed to remove permissions from role',
        variant: 'error',
      });

      return false;
    }
  };

  return {
    assignPermissionsToRole,
    removePermissionsFromRole,
  };
};
