// src/hooks/permission/useBulkPermissions.ts
import { useState, useEffect, useMemo, useCallback } from 'react';
import { usePermissionQueries } from './usePermissionQueries';
import { usePermissionMutations } from './usePermissionMutations';
import { PermissionDTO } from '@/common/types/permission';
import { toast } from '@/hooks/use-toast';
import { isEqual } from 'lodash';

interface UseBulkPermissionsOptions {
    initialRoleIds?: string[];
}

/**
 * Custom hook for managing permissions across multiple roles simultaneously
 */
export const useBulkPermissions = (options: UseBulkPermissionsOptions = {}) => {
    const { initialRoleIds = [] } = options;

    // State for selected roles and permissions
    const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>(initialRoleIds);
    const [selectedPermissionIds, setSelectedPermissionIds] = useState<string[]>([]);

    // State for operation status
    const [isProcessing, setIsProcessing] = useState(false);

    // Get queries and mutations
    const { getPermissionsByRole, listPermissions } = usePermissionQueries();
    const {
        assignPermissionsToRoleMutation,
        removePermissionsFromRoleMutation,
        invalidateRelatedCaches
    } = usePermissionMutations();

    // State to track permissions for each role
    const [rolePermissionsMap, setRolePermissionsMap] = useState<Record<string, Record<string, boolean>>>({});
    const [isFetchingRolePermissions, setIsFetchingRolePermissions] = useState(false);
    // Fetch all available permissions
    const { data: allPermissionsData, isLoading: isLoadingAllPermissions } = listPermissions({});
    const fetchRolePermissions = useCallback(async () => {
        if (selectedRoleIds.length === 0 || isFetchingRolePermissions) {
            return;
        }

        setIsFetchingRolePermissions(true);
        const newMap: Record<string, Record<string, boolean>> = { ...rolePermissionsMap };
        let hasChanges = false;

        for (const roleId of selectedRoleIds) {
            try {
                const result = await getPermissionsByRole(roleId).refetch();
                if (result.data?.data) {
                    const permissionsObj: Record<string, boolean> = {};
                    result.data.data.forEach((permission: PermissionDTO) => {
                        permissionsObj[permission.id] = true;
                    });

                    // Only update if different from current state
                    if (!isEqual(newMap[roleId], permissionsObj)) {
                        newMap[roleId] = permissionsObj;
                        hasChanges = true;
                    }
                }
            } catch (error) {
                console.error(`Failed to fetch permissions for role ${roleId}:`, error);
            }
        }

        if (hasChanges) {
            setRolePermissionsMap(newMap);
        }
        setIsFetchingRolePermissions(false);
    }, [selectedRoleIds, getPermissionsByRole, rolePermissionsMap]);

    // Fetch permissions for selected roles
    useEffect(() => {
        if (selectedRoleIds.length === 0) {
            setRolePermissionsMap({});
            return;
        }

        fetchRolePermissions();
    }, [selectedRoleIds, fetchRolePermissions]);

    // Calculate common and partial permission assignments
    const { commonPermissions, partialPermissions } = useMemo(() => {
        const roleIds = Object.keys(rolePermissionsMap);
        if (roleIds.length === 0) {
            return { commonPermissions: {}, partialPermissions: {} };
        }

        const commonMap: Record<string, boolean> = {};
        const partialMap: Record<string, boolean> = {};

        // If there's only one role, all its permissions are "common"
        if (roleIds.length === 1) {
            const soloRolePermissions = rolePermissionsMap[roleIds[0]] || {};
            return {
                commonPermissions: { ...soloRolePermissions },
                partialPermissions: {}
            };
        }

        // Start with the first role's permissions as potential commons
        const firstRolePermissions = rolePermissionsMap[roleIds[0]] || {};
        Object.keys(firstRolePermissions).forEach(permId => {
            commonMap[permId] = true;
        });

        // Check each permission against all other roles
        for (let i = 1; i < roleIds.length; i++) {
            const rolePermissions = rolePermissionsMap[roleIds[i]] || {};

            // Remove from commons if not in this role
            Object.keys(commonMap).forEach(permId => {
                if (!rolePermissions[permId]) {
                    delete commonMap[permId];
                    partialMap[permId] = true;
                }
            });

            // Add to partials if in this role but not common to all
            Object.keys(rolePermissions).forEach(permId => {
                if (!commonMap[permId]) {
                    partialMap[permId] = true;
                }
            });
        }

        return { commonPermissions: commonMap, partialPermissions: partialMap };
    }, [rolePermissionsMap]);


    // Helper to determine permission status relative to selected roles
    const getPermissionStatus = useCallback((permissionId: string): 'all' | 'some' | 'none' => {
        if (selectedRoleIds.length === 0) return 'none';

        const roleIds = Object.keys(rolePermissionsMap);
        if (roleIds.length === 0) return 'none';

        let assignedCount = 0;
        for (const roleId of roleIds) {
            if (rolePermissionsMap[roleId]?.[permissionId]) {
                assignedCount++;
            }
        }

        if (assignedCount === 0) return 'none';
        if (assignedCount === roleIds.length) return 'all';
        return 'some';
    }, [rolePermissionsMap, selectedRoleIds]);

    // Role selection methods
    const selectRoles = useCallback((roleIds: string[]) => {
        setSelectedRoleIds(roleIds);
    }, []);

    const toggleRoleSelection = useCallback((roleId: string) => {
        setSelectedRoleIds(prev =>
            prev.includes(roleId)
                ? prev.filter(id => id !== roleId)
                : [...prev, roleId]
        );
    }, []);

    const clearRoleSelection = useCallback(() => {
        setSelectedRoleIds([]);
    }, []);

    // Permission selection methods
    const selectPermissions = useCallback((permissionIds: string[]) => {
        setSelectedPermissionIds(permissionIds);
    }, []);

    const togglePermissionSelection = useCallback((permissionId: string) => {
        setSelectedPermissionIds(prev =>
            prev.includes(permissionId)
                ? prev.filter(id => id !== permissionId)
                : [...prev, permissionId]
        );
    }, []);

    const clearPermissionSelection = useCallback(() => {
        setSelectedPermissionIds([]);
    }, []);

    // Select common permissions
    const selectCommonPermissions = useCallback(() => {
        setSelectedPermissionIds(Object.keys(commonPermissions));
    }, [commonPermissions]);

    // Select partial permissions
    const selectPartialPermissions = useCallback(() => {
        setSelectedPermissionIds(Object.keys(partialPermissions));
    }, [partialPermissions]);

    // Operation methods
    const assignPermissions = useCallback(async (): Promise<boolean> => {
        if (selectedRoleIds.length === 0 || selectedPermissionIds.length === 0) {
            toast({
                title: 'Selection required',
                description: 'Please select both roles and permissions',
                variant: 'destructive',
            });
            return false;
        }

        setIsProcessing(true);

        let successCount = 0;
        let failCount = 0;

        try {
            for (const roleId of selectedRoleIds) {
                try {
                    await assignPermissionsToRoleMutation.mutateAsync({
                        roleId,
                        data: { permissionIds: selectedPermissionIds }
                    });
                    successCount++;
                } catch (error) {
                    console.error(`Failed to assign permissions to role ${roleId}:`, error);
                    failCount++;
                }
            }

            // Invalidate caches to refresh data
            await invalidateRelatedCaches();

            // Show result toast
            if (failCount === 0) {
                toast({
                    title: 'Permissions assigned',
                    description: `Successfully assigned permissions to ${successCount} roles`,
                });
                return true;
            } else {
                toast({
                    title: 'Partial success',
                    description: `Assigned permissions to ${successCount} roles, failed for ${failCount} roles`,
                    variant: 'destructive',
                });
                return successCount > 0;
            }
        } catch (error) {
            toast({
                title: 'Operation failed',
                description: 'Failed to assign permissions',
                variant: 'destructive',
            });
            return false;
        } finally {
            setIsProcessing(false);
        }
    }, [selectedRoleIds, selectedPermissionIds, assignPermissionsToRoleMutation, invalidateRelatedCaches]);

    const removePermissions = useCallback(async (): Promise<boolean> => {
        if (selectedRoleIds.length === 0 || selectedPermissionIds.length === 0) {
            toast({
                title: 'Selection required',
                description: 'Please select both roles and permissions',
                variant: 'destructive',
            });
            return false;
        }

        setIsProcessing(true);

        let successCount = 0;
        let failCount = 0;

        try {
            for (const roleId of selectedRoleIds) {
                try {
                    await removePermissionsFromRoleMutation.mutateAsync({
                        roleId,
                        data: { permissionIds: selectedPermissionIds }
                    });
                    successCount++;
                } catch (error) {
                    console.error(`Failed to remove permissions from role ${roleId}:`, error);
                    failCount++;
                }
            }

            // Invalidate caches to refresh data
            await invalidateRelatedCaches();

            // Show result toast
            if (failCount === 0) {
                toast({
                    title: 'Permissions removed',
                    description: `Successfully removed permissions from ${successCount} roles`,
                });
                return true;
            } else {
                toast({
                    title: 'Partial success',
                    description: `Removed permissions from ${successCount} roles, failed for ${failCount} roles`,
                    variant: 'destructive',
                });
                return successCount > 0;
            }
        } catch (error) {
            toast({
                title: 'Operation failed',
                description: 'Failed to remove permissions',
                variant: 'destructive',
            });
            return false;
        } finally {
            setIsProcessing(false);
        }
    }, [selectedRoleIds, selectedPermissionIds, removePermissionsFromRoleMutation, invalidateRelatedCaches]);

    // After successful operation, refresh data
    const refreshPermissionData = useCallback(async () => {
        // First invalidate all caches
        await invalidateRelatedCaches();

        // Then refetch permissions for selected roles
        const newMap: Record<string, Record<string, boolean>> = {};

        for (const roleId of selectedRoleIds) {
            try {
                const result = await getPermissionsByRole(roleId).refetch();
                if (result.data?.data) {
                    newMap[roleId] = {};
                    result.data.data.forEach((permission: PermissionDTO) => {
                        newMap[roleId][permission.id] = true;
                    });
                }
            } catch (error) {
                console.error(`Failed to refresh permissions for role ${roleId}:`, error);
            }
        }

        setRolePermissionsMap(newMap);
    }, [selectedRoleIds, getPermissionsByRole, invalidateRelatedCaches]);

    return {
        // State
        selectedRoleIds,
        selectedPermissionIds,
        rolePermissionsMap,
        commonPermissions,
        partialPermissions,
        isProcessing,
        isLoading: isLoadingAllPermissions || isFetchingRolePermissions,
        allPermissions: allPermissionsData?.data || [],

        // Role selection
        selectRoles,
        toggleRoleSelection,
        clearRoleSelection,

        // Permission selection
        selectPermissions,
        togglePermissionSelection,
        clearPermissionSelection,
        selectCommonPermissions,
        selectPartialPermissions,

        // Status helpers
        getPermissionStatus,

        // Operations
        assignPermissions,
        removePermissions,
        refreshPermissionData
    };
};

/**
 * Example usage:
 * 
 * const {
 *   selectedRoleIds,
 *   selectedPermissionIds,
 *   toggleRoleSelection,
 *   togglePermissionSelection,
 *   assignPermissions,
 *   removePermissions,
 *   getPermissionStatus
 * } = useBulkPermissions();
 * 
 * // To toggle selection
 * <Checkbox onChange={() => toggleRoleSelection(role.id)} />
 * 
 * // To assign permissions
 * <Button onClick={assignPermissions}>Assign</Button>
 * 
 * // To check permission status
 * const status = getPermissionStatus(permission.id); // 'all', 'some', or 'none'
 */