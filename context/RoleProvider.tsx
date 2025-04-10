'use client';

import React, { createContext, useContext, useMemo } from 'react';
import useAuthManager from '@/hooks/useAuthManager';
import { defaultPermissions, hasRouteAccess, PermissionConfig, UserRole } from '@/utils/permission-utils';

// Define the context type
interface RoleContextType {
    userRole: UserRole | null;
    permissions: PermissionConfig;
    hasAccess: (route: string) => boolean;
    isAdmin: boolean;
    isManager: boolean;
    isUser: boolean;
}

// Create the context with default values
const RoleContext = createContext<RoleContextType>({
    userRole: null,
    permissions: defaultPermissions,
    hasAccess: () => false,
    isAdmin: false,
    isManager: false,
    isUser: false,
});

// Custom hook to use the role context
export const useRole = () => useContext(RoleContext);

// Provider component
export const RoleProvider: React.FC<{
    children: React.ReactNode;
    customPermissions?: PermissionConfig;
}> = ({ children, customPermissions }) => {
    const { user, isAuthenticated } = useAuthManager();

    // Combine default permissions with any custom permissions
    const permissions = useMemo(() => {
        if (!customPermissions) return defaultPermissions;

        return {
            routes: {
                ...defaultPermissions.routes,
                ...customPermissions.routes
            }
        };
    }, [customPermissions]);

    // Extract user role
    const userRole = useMemo<UserRole | null>(() => {
        if (!user || !isAuthenticated) return null;
        return user.role as UserRole;
    }, [user, isAuthenticated]);

    // Helper function to check route access
    const hasAccess = useMemo(() => {
        return (route: string): boolean => {
            if (!userRole) return false;
            return hasRouteAccess(route, userRole, permissions);
        };
    }, [userRole, permissions]);

    // Helper flags for common roles
    const isAdmin = useMemo(() => userRole === 'ADMIN', [userRole]);
    const isManager = useMemo(() => userRole === 'MANAGER', [userRole]);
    const isUser = useMemo(() => userRole === 'USER', [userRole]);

    // Create the context value
    const contextValue = useMemo(() => ({
        userRole,
        permissions,
        hasAccess,
        isAdmin,
        isManager,
        isUser,
    }), [userRole, permissions, hasAccess, isAdmin, isManager, isUser]);

    return (
        <RoleContext.Provider value={contextValue}>
            {children}
        </RoleContext.Provider>
    );
};

export default RoleProvider;