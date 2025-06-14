'use client';
import { useMemo } from 'react';
import { useAuthContext } from '@/contexts/auth/AuthProvider';

import { sidebarData } from './sidebar-data';
import {
  filterNavItemsByRole,
  filterProjectsByRole,
  UserRole,
} from '@/utils/permission-utils';

/**
 * Custom hook to get sidebar items filtered by user permissions
 */
export function useSidebarPermissions() {
  const { user } = useAuthContext();

  //Get user role from auth context
  const userRole = user?.role as UserRole || 'USER';

  // Filter navigation items based on user role
  const filteredNavMain = useMemo(() => {
    return filterNavItemsByRole(sidebarData.navMain, userRole);
  }, [userRole]);

  //  Filter project items based on user role
  const filteredProjects = useMemo(() => {
    return filterProjectsByRole(sidebarData.projects, userRole);
  }, [userRole]);

  return {
    navMain: filteredNavMain,
    projects: filteredProjects,
    teams: sidebarData.teams,
    userRole,
  };
}

export default useSidebarPermissions;
