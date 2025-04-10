// src/hooks/permission/usePermissionUI.ts
import { useState, useCallback, useMemo } from 'react';
import { usePermissionQueries } from './usePermissionQueries';
import { toast } from '@/hooks/use-toast';
import { usePermissionContext } from './PermissionContext';
import { PaginationDTO, PermissionCondDTO } from '@/common/types/permission';
import { PermissionType } from '@/common/enum';
import { useQueryClient } from '@tanstack/react-query';
import { ids } from 'googleapis/build/src/apis/ids';
import { batchDeletePermissionApi } from '@/apis/permission/permission.api';

/**
 * Hook for permission-related UI operations and state management
 */
export const usePermissionUI = () => {
  const { 
    userPermissions, 
    hasPermission, 
    hasPageAccess, 
    hasFeatureAccess,
    createPermission,
    updatePermission,
    deletePermission,
    assignPermissionsToRole,
    removePermissionsFromRole,
  } = usePermissionContext();
  
  const { listPermissions } = usePermissionQueries();
  const queryClient = useQueryClient();
  
  // UI state
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [searchFilters, setSearchFilters] = useState<PermissionCondDTO>({});
  const [pagination, setPagination] = useState<PaginationDTO>({
    page: 1,
    limit: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });

  // Fetch permissions list with current filters and pagination
  const {
    data: permissionsListData,
    isLoading: isLoadingPermissions,
    refetch: refetchPermissions
  } = listPermissions(
    { ...searchFilters, ...pagination }
    // Removed all options due to TypeScript errors
  );

  // Selection handlers
  const handleSelectPermission = useCallback((permissionId: string) => {
    setSelectedPermissions(prev => {
      if (prev.includes(permissionId)) {
        return prev.filter(id => id !== permissionId);
      } else {
        return [...prev, permissionId];
      }
    });
  }, []);

  const handleSelectAll = useCallback((permissionIds: string[]) => {
    setSelectedPermissions(permissionIds);
  }, []);

  const handleClearSelection = useCallback(() => {
    setSelectedPermissions([]);
  }, []);
  
  // Filter handlers
  const handleFilterChange = useCallback((filters: PermissionCondDTO) => {
    setSearchFilters(filters);
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page on filter change
  }, []);
  
  // Pagination handlers
  const handlePageChange = useCallback((page: number) => {
    setPagination(prev => ({ ...prev, page }));
  }, []);
  
  const handleLimitChange = useCallback((limit: number) => {
    setPagination(prev => ({ ...prev, limit, page: 1 }));
  }, []);
  
  const handleSortChange = useCallback((sortBy: string, sortOrder: 'asc' | 'desc') => {
    setPagination(prev => ({ ...prev, sortBy, sortOrder }));
  }, []);

  // Permission management actions with UI feedback
  const handleCreatePermission = useCallback(async (data: any) => {
    try {
      const id = await createPermission(data);
      if (id) {
        toast({
          title: 'Permission created',
          description: 'New permission has been created successfully',
        });
        await queryClient.refetchQueries({ queryKey: ['permission-list'] });
        return true;
      }
      return false;
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create permission',
        variant: 'destructive',
      });
      return false;
    }
  }, [createPermission, queryClient]);

  const handleUpdatePermission = useCallback(async (id: string, data: any) => {
    try {
      const success = await updatePermission(id, data);
      if (success) {
        toast({
          title: 'Permission updated',
          description: 'Permission has been updated successfully',
        });
        await refetchPermissions();
        return true;
      }
      return false;
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update permission',
        variant: 'destructive',
      });
      return false;
    }
  }, [updatePermission, refetchPermissions]);

  const handleDeletePermission = useCallback(async (id: string) => {
    try {
      const success = await deletePermission(id);
      if (success) {
        toast({
          title: 'Permission deleted',
          description: 'Permission has been deleted successfully',
        });
        await refetchPermissions();
        return true;
      }
      return false;
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete permission',
        variant: 'destructive',
      });
      return false;
    }
  }, [deletePermission, refetchPermissions]);

  const handleBulkDelete = useCallback(async () => {
    if (selectedPermissions.length === 0) {
      toast({
        title: 'No permissions selected',
        description: 'Please select at least one permission to delete',
        variant: 'destructive',
      });
      return false;
    }

    try {
      let success = true;
      for (const id of selectedPermissions) {
        const result = await deletePermission(id);
        if (!result) success = false;
      }

      if (success) {
        toast({
          title: 'Permissions deleted',
          description: `${selectedPermissions.length} permissions have been deleted successfully`,
        });
      } else {
        toast({
          title: 'Partial success',
          description: 'Some permissions could not be deleted',
          variant: 'destructive',
        });
      }

      setSelectedPermissions([]);
      await refetchPermissions();
      return success;
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete permissions',
        variant: 'destructive',
      });
      return false;
    }
  }, [selectedPermissions, deletePermission, refetchPermissions]);

  // Role permission management
  const handleAssignToRole = useCallback(async (roleId: string) => {
    if (selectedPermissions.length === 0) {
      toast({
        title: 'No permissions selected',
        description: 'Please select at least one permission to assign',
        variant: 'destructive',
      });
      return false;
    }

    try {
      const success = await assignPermissionsToRole(roleId, selectedPermissions);
      if (success) {
        toast({
          title: 'Permissions assigned',
          description: `${selectedPermissions.length} permissions have been assigned to the role`,
        });
        setSelectedPermissions([]);
        return true;
      }
      return false;
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to assign permissions to role',
        variant: 'destructive',
      });
      return false;
    }
  }, [selectedPermissions, assignPermissionsToRole]);

  const handleRemoveFromRole = useCallback(async (roleId: string) => {
    if (selectedPermissions.length === 0) {
      toast({
        title: 'No permissions selected',
        description: 'Please select at least one permission to remove',
        variant: 'destructive',
      });
      return false;
    }

    try {
      const success = await removePermissionsFromRole(roleId, selectedPermissions);
      if (success) {
        toast({
          title: 'Permissions removed',
          description: `${selectedPermissions.length} permissions have been removed from the role`,
        });
        setSelectedPermissions([]);
        return true;
      }
      return false;
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to remove permissions from role',
        variant: 'destructive',
      });
      return false;
    }
  }, [selectedPermissions, removePermissionsFromRole]);

  // Helper for permission type display
  const getPermissionTypeLabel = useCallback((type: PermissionType): string => {
    switch (type) {
      case PermissionType.PAGE_ACCESS:
        return 'Page Access';
      case PermissionType.FEATURE_ACCESS:
        return 'Feature Access';
      case PermissionType.DATA_ACCESS:
        return 'Data Access';
      default:
        return 'Unknown';
    }
  }, []);

  // Check if current user can manage permissions
  const canManagePermissions = useMemo(() => {
    return hasPermission('MANAGE_PERMISSIONS') || hasPermission('ADMIN_ACCESS');
  }, [hasPermission]);

  // Calculate permissions stats
  const permissionStats = useMemo(() => {
    if (!userPermissions.permissions) return null;
    
    return {
      total: userPermissions.permissions.length,
      pageAccess: userPermissions.pageAccess.length,
      featureAccess: userPermissions.featureAccess.length,
      dataAccess: userPermissions.dataAccess.length,
    };
  }, [userPermissions]);

  const handleBatchDeletePermissions = useCallback(async (ids: string[]): Promise<void> => {
    try {
      await batchDeletePermissionApi(ids);
      setSelectedPermissions([]);
      await queryClient.invalidateQueries({ queryKey: ['permission-list'] }); // Làm mới cache
      await refetchPermissions(); // Tải lại dữ liệu
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete permissions',
        variant: 'destructive',
      });
    }
  }, [queryClient, refetchPermissions]);

  return {
    // State
    selectedPermissions,
    permissionsList: permissionsListData?.data || [],
    total: permissionsListData?.total || 0,
    page: permissionsListData?.page || 1,
    limit: permissionsListData?.limit || 10,
    isLoading: isLoadingPermissions,
    filters: searchFilters,
    pagination,
    userPermissions,
    permissionStats,
    canManagePermissions,
    
    // Selection handlers
    handleSelectPermission,
    handleSelectAll,
    handleClearSelection,
    
    // Filter/pagination handlers
    handleFilterChange,
    handlePageChange,
    handleLimitChange,
    handleSortChange,
    
    // Permission actions
    handleCreatePermission,
    handleUpdatePermission,
    handleDeletePermission,
    handleBulkDelete,
    
    // Role permission management
    handleAssignToRole,
    handleRemoveFromRole,
    
    // Helpers
    getPermissionTypeLabel,
    hasPermission,
    hasPageAccess,
    hasFeatureAccess,
    
    // Refetch
    refetchPermissions,
    handleBatchDeletePermissions,
  };
};