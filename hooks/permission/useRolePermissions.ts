import { useState, useCallback, useMemo, useEffect } from 'react';
import { toast } from 'react-toast-kit';

import { PermissionType } from '@/common/enum';
import { AssignPermissionsDTO, PermissionDTO } from '@/common/types/permission';

import { usePermissionMutations } from './usePermissionMutations';
import { usePermissionQueries } from './usePermissionQueries';



interface RolePermissionsHookOptions {
  initialRoleId?: string;
}

/**
 * Hook for managing role-permission associations
 */
export const useRolePermissions = (options?: RolePermissionsHookOptions) => {
  const initialRoleId = options?.initialRoleId || '';

  const [currentRoleId, setCurrentRoleId] = useState<string>(initialRoleId);
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<string[]>([]);
  const [availablePermissions, setAvailablePermissions] = useState<PermissionDTO[]>([]);
  const [assignedPermissions, setAssignedPermissions] = useState<PermissionDTO[]>([]);

  // Get queries and mutations
  const { getPermissionsByRole, listPermissions, invalidatePermissionsCache } =
    usePermissionQueries();

  const { assignPermissionsToRoleMutation, removePermissionsFromRoleMutation } =
    usePermissionMutations();

  // Fetch role permissions when role changes
  const {
    data: rolePermissionsData,
    isLoading: isLoadingRolePermissions,
    refetch: refetchRolePermissions,
  } = getPermissionsByRole(currentRoleId, {
    // The 'enabled' property is included in the queryFn and not needed here
  });

  // Set assigned permissions when data is loaded
  useEffect(() => {
    if (rolePermissionsData?.data) {
      setAssignedPermissions(rolePermissionsData.data);
    }
  }, [rolePermissionsData]);

  // Fetch all available permissions
  const {
    data: allPermissionsData,
    isLoading: isLoadingAllPermissions,
    refetch: refetchAllPermissions,
  } = listPermissions({});

  // Set available permissions when data is loaded
  useEffect(() => {
    if (allPermissionsData?.data) {
      setAvailablePermissions(allPermissionsData.data);
    }
  }, [allPermissionsData]);

  // Change the current role
  const changeRole = useCallback((roleId: string) => {
    setCurrentRoleId(roleId);
    setSelectedPermissionIds([]); // Clear selection when role changes
  }, []);

  // Toggle selection of a permission
  const togglePermissionSelection = useCallback((permissionId: string) => {
    setSelectedPermissionIds(prev => {
      if (prev.includes(permissionId)) {
        return prev.filter(id => id !== permissionId);
      } else {
        return [...prev, permissionId];
      }
    });
  }, []);

  // Select all permissions of a specific type
  const selectPermissionsByType = useCallback(
    (type: PermissionType) => {
      const permissionIds = availablePermissions.filter(p => p.type === type).map(p => p.id);

      setSelectedPermissionIds(prev => {
        const newSelection = [...prev];

        // Add only the ones that aren't already selected
        permissionIds.forEach(id => {
          if (!newSelection.includes(id)) {
            newSelection.push(id);
          }
        });

        return newSelection;
      });
    },
    [availablePermissions],
  );

  //Select all permissions
  const selectAllPermissions = useCallback(() => {
    const allIds = availablePermissions.map(p => p.id);
    setSelectedPermissionIds(allIds);
  }, [availablePermissions]);

  // Clear all selections
  const clearAllSelections = useCallback(() => {
    setSelectedPermissionIds([]);
  }, []);

  //  Assign selected permissions to the current role
  const assignSelectedPermissions = useCallback(async () => {
    if (!currentRoleId) {
      toast({
        title: 'No role selected',
        description: 'Please select a role first',
        variant: 'error',
      });
      return false;
    }

    if (selectedPermissionIds.length === 0) {
      toast({
        title: 'No permissions selected',
        description: 'Please select at least one permission to assign',
        variant: 'error',
      });
      return false;
    }

    try {
      const data: AssignPermissionsDTO = {
        permissionIds: selectedPermissionIds,
      };

      await assignPermissionsToRoleMutation.mutateAsync({
        roleId: currentRoleId,
        data,
      });

      // Refresh data
      await refetchRolePermissions();
      setSelectedPermissionIds([]);

      toast({
        title: 'Permissions assigned',
        description: `${selectedPermissionIds.length} permissions have been assigned to the role`,
      });

      return true;
    } catch (error) {
      console.error('Failed to assign permissions:', error);
      toast({
        title: 'Error',
        description: 'Failed to assign permissions to role',
        variant: 'error',
      });
      return false;
    }
  }, [
    currentRoleId,
    selectedPermissionIds,
    assignPermissionsToRoleMutation,
    refetchRolePermissions,
  ]);

  // Remove selected permissions from the current role
  const removeSelectedPermissions = useCallback(async () => {
    if (!currentRoleId) {
      toast({
        title: 'No role selected',
        description: 'Please select a role first',
        variant: 'error',
      });
      return false;
    }

    if (selectedPermissionIds.length === 0) {
      toast({
        title: 'No permissions selected',
        description: 'Please select at least one permission to remove',
        variant: 'error',
      });
      return false;
    }

    try {
      const data: AssignPermissionsDTO = {
        permissionIds: selectedPermissionIds,
      };

      await removePermissionsFromRoleMutation.mutateAsync({
        roleId: currentRoleId,
        data,
      });

      // Refresh data
      await refetchRolePermissions();
      setSelectedPermissionIds([]);

      toast({
        title: 'Permissions removed',
        description: `${selectedPermissionIds.length} permissions have been removed from the role`,
      });

      return true;
    } catch (error) {
      console.error('Failed to remove permissions:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove permissions from role',
        variant: 'error',
      });
      return false;
    }
  }, [
    currentRoleId,
    selectedPermissionIds,
    removePermissionsFromRoleMutation,
    refetchRolePermissions,
  ]);

  // Refresh all data
  const refreshAllData = useCallback(async () => {
    await invalidatePermissionsCache(true);
    await refetchAllPermissions();
    if (currentRoleId) {
      await refetchRolePermissions();
    }
  }, [invalidatePermissionsCache, refetchAllPermissions, refetchRolePermissions, currentRoleId]);

  // Check if a permission is assigned to the current role
  const isPermissionAssigned = useCallback(
    (permissionId: string): boolean => {
      return assignedPermissions.some(p => p.id === permissionId);
    },
    [assignedPermissions],
  );

  // Unassigned permissions
  const unassignedPermissions = useMemo(() => {
    if (!assignedPermissions.length) return availablePermissions;

    const assignedIds = assignedPermissions.map(p => p.id);
    return availablePermissions.filter(p => !assignedIds.includes(p.id));
  }, [availablePermissions, assignedPermissions]);

  // Group permissions by type
  const permissionsByType = useMemo(() => {
    const grouped: Record<PermissionType, PermissionDTO[]> = {
      [PermissionType.PAGE_ACCESS]: [],
      [PermissionType.FEATURE_ACCESS]: [],
      [PermissionType.DATA_ACCESS]: [],
    };

    availablePermissions.forEach(permission => {
      if (permission.type in grouped) {
        grouped[permission.type].push(permission);
      }
    });

    return grouped;
  }, [availablePermissions]);

  //  Statistics
  const stats = useMemo(() => {
    return {
      total: availablePermissions.length,
      assigned: assignedPermissions.length,
      unassigned: unassignedPermissions.length,
      selected: selectedPermissionIds.length,
      byType: {
        [PermissionType.PAGE_ACCESS]: permissionsByType[PermissionType.PAGE_ACCESS].length,
        [PermissionType.FEATURE_ACCESS]: permissionsByType[PermissionType.FEATURE_ACCESS].length,
        [PermissionType.DATA_ACCESS]: permissionsByType[PermissionType.DATA_ACCESS].length,
      },
    };
  }, [
    availablePermissions,
    assignedPermissions,
    unassignedPermissions,
    selectedPermissionIds,
    permissionsByType,
  ]);

  return {
    // State
    currentRoleId,
    selectedPermissionIds,
    availablePermissions,
    assignedPermissions,
    unassignedPermissions,
    permissionsByType,
    stats,
    isLoading: isLoadingRolePermissions || isLoadingAllPermissions,

    // Actions
    changeRole,
    togglePermissionSelection,
    selectPermissionsByType,
    selectAllPermissions,
    clearAllSelections,
    assignSelectedPermissions,
    removeSelectedPermissions,
    refreshAllData,

    // Helpers
    isPermissionAssigned,
  };
};
