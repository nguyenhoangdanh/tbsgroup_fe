'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import { usePermissionQueries } from '@/hooks/permission/usePermissionQueries';
import { usePermissionMutations } from '@/hooks/permission/usePermissionMutations';
import { useAuthContext } from '@/context/auth/AuthProvider';
import { QueryObserverResult, RefetchOptions } from '@tanstack/react-query';
import { AssignPermissionsDTO, CreatePermissionDTO, PermissionDTO, UpdatePermissionDTO } from '@/common/types/permission';

// Define wrapper type for user permissions response
type UserPermissionsResponseWrapper = {
    success: boolean;
    data: {
        permissions: PermissionDTO[];
        pageAccess: string[];
        featureAccess: string[];
        dataAccess: string[];
    }
};

// Define context type
interface PermissionContextType {
    // State
    userPermissions: {
        permissions: PermissionDTO[];
        pageAccess: string[];
        featureAccess: string[];
        dataAccess: string[];
        isLoading: boolean;
    };

    // Helper methods
    hasPermission: (permissionCode: string) => boolean;
    hasPageAccess: (pageCode: string) => boolean;
    hasFeatureAccess: (featureCode: string) => boolean;
    hasDataAccess: (dataCode: string) => boolean;

    // Permission management actions
    createPermission: (data: CreatePermissionDTO) => Promise<string | null>;
    updatePermission: (id: string, data: UpdatePermissionDTO) => Promise<boolean>;
    deletePermission: (id: string) => Promise<boolean>;

    // Role-Permission management
    assignPermissionsToRole: (roleId: string, permissionIds: string[]) => Promise<boolean>;
    removePermissionsFromRole: (roleId: string, permissionIds: string[]) => Promise<boolean>;

    // Refetch operations
    refetchUserPermissions: (options?: RefetchOptions) => Promise<QueryObserverResult<UserPermissionsResponseWrapper, Error>>;

    // Permission checks
    hasAnyPermission: (codes: string[]) => boolean;
    hasAllPermissions: (codes: string[]) => boolean;
}

// Create the Permission context
const PermissionContext = createContext<PermissionContextType | undefined>(undefined);

// Permission Provider component
export const PermissionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuthContext();
    const userId = user?.id;

    // Get queries and mutations
    const {
        getUserPermissions,
        checkUserHasPermission,
        getClientAccessPermissions,
        showErrorToast
    } = usePermissionQueries();

    const {
        createPermissionMutation,
        updatePermissionMutation,
        deletePermissionMutation,
        assignPermissionsToRoleMutation,
        removePermissionsFromRoleMutation
    } = usePermissionMutations();

    // State for user permissions
    const [userPageAccess, setUserPageAccess] = useState<string[]>([]);
    const [userFeatureAccess, setUserFeatureAccess] = useState<string[]>([]);
    const [userDataAccess, setUserDataAccess] = useState<string[]>([]);
    const [userPermissionsList, setUserPermissionsList] = useState<PermissionDTO[]>([]);

    // Get current user's permissions
    const {
        data: userPermissionsData,
        isLoading: isLoadingUserPermissions,
        refetch: refetchUserPermissions,
        error: userPermissionsError
    } = getUserPermissions(
        { userId },
        {
            enabled: !!userId,
            refetchOnWindowFocus: false,
            staleTime: 5 * 60 * 1000 // 5 minutes
        }
    );

    // Show error toast if permissions fetch fails
    useEffect(() => {
        if (userPermissionsError) {
            showErrorToast(userPermissionsError, 'user permissions');
        }
    }, [userPermissionsError, showErrorToast]);

    // Get client access permissions (for navigation)
    const {
        data: clientAccessData,
        isLoading: isLoadingClientAccess,
        error: clientAccessError
    } = getClientAccessPermissions({
        enabled: !!userId,
        refetchOnWindowFocus: false,
        staleTime: 5 * 60 * 1000
    });

    // Show error toast if client access fetch fails
    useEffect(() => {
        if (clientAccessError) {
            showErrorToast(clientAccessError, 'client permissions');
        }
    }, [clientAccessError, showErrorToast]);

    // Update state when permissions data changes
    useEffect(() => {
        if (userPermissionsData && userPermissionsData.success && userPermissionsData.data) {
            const { permissions, pageAccess, featureAccess, dataAccess } = userPermissionsData.data;
            setUserPermissionsList(permissions || []);
            setUserPageAccess(pageAccess || []);
            setUserFeatureAccess(featureAccess || []);
            setUserDataAccess(dataAccess || []);
        }
    }, [userPermissionsData]);

    // Helper methods to check permissions
    const hasPermission = useCallback((permissionCode: string): boolean => {
        return userPermissionsList.some(p => p.code === permissionCode && p.isActive);
    }, [userPermissionsList]);

    const hasPageAccess = useCallback((pageCode: string): boolean => {
        return userPageAccess.includes(pageCode);
    }, [userPageAccess]);

    const hasFeatureAccess = useCallback((featureCode: string): boolean => {
        return userFeatureAccess.includes(featureCode);
    }, [userFeatureAccess]);

    const hasDataAccess = useCallback((dataCode: string): boolean => {
        return userDataAccess.includes(dataCode);
    }, [userDataAccess]);

    // Permission management actions
    const createPermission = useCallback(async (data: CreatePermissionDTO): Promise<string | null> => {
        try {
            const result = await createPermissionMutation.mutateAsync(data);
            return result.id;
        } catch (error) {
            console.error("Failed to create permission:", error);
            return null;
        }
    }, [createPermissionMutation]);

    const updatePermission = useCallback(async (id: string, data: UpdatePermissionDTO): Promise<boolean> => {
        try {
            await updatePermissionMutation.mutateAsync({ id, data });
            return true;
        } catch (error) {
            console.error("Failed to update permission:", error);
            return false;
        }
    }, [updatePermissionMutation]);

    const deletePermission = useCallback(async (id: string): Promise<boolean> => {
        try {
            await deletePermissionMutation.mutateAsync(id);
            return true;
        } catch (error) {
            console.error("Failed to delete permission:", error);
            return false;
        }
    }, [deletePermissionMutation]);

    // Role-Permission management
    const assignPermissionsToRole = useCallback(async (roleId: string, permissionIds: string[]): Promise<boolean> => {
        try {
            const data: AssignPermissionsDTO = { permissionIds };
            await assignPermissionsToRoleMutation.mutateAsync({ roleId, data });
            await refetchUserPermissions();
            return true;
        } catch (error) {
            console.error("Failed to assign permissions to role:", error);
            return false;
        }
    }, [assignPermissionsToRoleMutation, refetchUserPermissions]);

    const removePermissionsFromRole = useCallback(async (roleId: string, permissionIds: string[]): Promise<boolean> => {
        try {
            const data: AssignPermissionsDTO = { permissionIds };
            await removePermissionsFromRoleMutation.mutateAsync({ roleId, data });
            await refetchUserPermissions();
            return true;
        } catch (error) {
            console.error("Failed to remove permissions from role:", error);
            return false;
        }
    }, [removePermissionsFromRoleMutation, refetchUserPermissions]);

    // const hasAnyPermission = (codes: string[]) => codes.some(code => hasPermission(code));
    // const hasAllPermissions = (codes: string[]) => codes.every(code => hasPermission(code));
    const hasAnyPermission = useCallback((codes: string[]): boolean => {
        return codes.some(code => hasPermission(code));
    }
        , [hasPermission]);
    const hasAllPermissions = useCallback((codes: string[]): boolean => {
        return codes.every(code => hasPermission(code));
    }
        , [hasPermission]);

    // Memoized context value
    const contextValue = useMemo(() => ({
        userPermissions: {
            permissions: userPermissionsList,
            pageAccess: userPageAccess,
            featureAccess: userFeatureAccess,
            dataAccess: userDataAccess,
            isLoading: isLoadingUserPermissions || isLoadingClientAccess
        },
        hasPermission,
        hasPageAccess,
        hasFeatureAccess,
        hasDataAccess,
        createPermission,
        updatePermission,
        deletePermission,
        assignPermissionsToRole,
        removePermissionsFromRole,
        refetchUserPermissions,
        hasAnyPermission,
        hasAllPermissions,
    }), [
        userPermissionsList,
        userPageAccess,
        userFeatureAccess,
        userDataAccess,
        isLoadingUserPermissions,
        isLoadingClientAccess,
        hasPermission,
        hasPageAccess,
        hasFeatureAccess,
        hasDataAccess,
        createPermission,
        updatePermission,
        deletePermission,
        assignPermissionsToRole,
        removePermissionsFromRole,
        refetchUserPermissions,
        hasAnyPermission,
        hasAllPermissions,
    ]);

    return (
        <PermissionContext.Provider value={contextValue}>
            {children}
        </PermissionContext.Provider>
    );
};

// Hook to use the Permission context
export const usePermissionContext = (): PermissionContextType => {
    const context = useContext(PermissionContext);
    if (context === undefined) {
        throw new Error('usePermissionContext must be used within a PermissionProvider');
    }
    return context;
};