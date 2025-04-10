// src/hooks/useSidebarPermissions.ts
"use client";
import { useMemo } from 'react';
import useAuthManager from '@/hooks/useAuthManager';
import { 
  filterNavItemsByRole, 
  filterProjectsByRole, 
  defaultPermissions,
  UserRole
} from '@/utils/permission-utils';
import { sidebarData } from './sidebar-data';

/**
 * Custom hook to get sidebar items filtered by user permissions
 */
export function useSidebarPermissions() {
  const { user, isAuthenticated } = useAuthManager();
  
  // Get user role from auth context
  const userRole = useMemo(() => {
    if (!user || !isAuthenticated) return null;
    return user.role as UserRole;
  }, [user, isAuthenticated]);
  
  // Filter navigation items based on user role
  const navMainItems = useMemo(() => {
    if (!userRole) return [];
    return filterNavItemsByRole(sidebarData.navMain, userRole, defaultPermissions);
  }, [userRole]);
  
  // Filter project items based on user role
  const projectItems = useMemo(() => {
    if (!userRole) return [];
    return filterProjectsByRole(sidebarData.projects, userRole, defaultPermissions);
  }, [userRole]);
  
  return {
    navMainItems,
    projectItems,
    userRole,
    isAuthenticated
  };
}

export default useSidebarPermissions;