// src/utils/permission-utils.ts

import {
  NavItem,
  Project,
} from '../components/common/layouts/admin/sidebar/_components/sidebar-data';

// Define role types based on your application's roles
export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'FACTORY_ADMIN' | 'USER';

// Define permission mapping for each menu item
export interface PermissionConfig {
  // Map of menu item URLs to the roles that can access them
  routes: {
    [key: string]: UserRole[];
  };
}

// Route permissions mapping
export const routePermissions: Record<string, UserRole[]> = {
  // Dashboard
  '/admin/dashboard': ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'USER'],

  // User management
  '/admin/users': ['SUPER_ADMIN', 'ADMIN'],
  '/admin/users/all': ['SUPER_ADMIN', 'ADMIN'],
  '/admin/users/roles': ['SUPER_ADMIN', 'ADMIN'],

  // Organization structure
  '/admin/departments': ['SUPER_ADMIN', 'ADMIN', 'MANAGER'],
  '/admin/factories': ['SUPER_ADMIN', 'ADMIN', 'MANAGER'],
  '/admin/lines': ['SUPER_ADMIN', 'ADMIN', 'MANAGER'],
  '/admin/teams': ['SUPER_ADMIN', 'ADMIN', 'MANAGER'],
  '/admin/groups': ['SUPER_ADMIN', 'ADMIN', 'MANAGER'],

  // Handbags
  '/admin/handbags': ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'USER'],
  '/admin/handbags/all': ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'USER'],
  '/admin/handbags/bag-colors': ['SUPER_ADMIN', 'ADMIN', 'MANAGER'],
  '/admin/handbags/bag-processes': ['SUPER_ADMIN', 'ADMIN', 'MANAGER'],
  '/admin/handbags/bag-group-rates': ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'USER'],
  '/admin/handbags/bag-group-rates/stats': ['SUPER_ADMIN', 'ADMIN', 'MANAGER'],
  '/admin/handbags/bag-group-rates/history': ['SUPER_ADMIN', 'ADMIN', 'MANAGER'],
  '/admin/handbags/bag-group-rates/details': ['SUPER_ADMIN', 'ADMIN', 'MANAGER'],
  '/admin/handbags/models': ['SUPER_ADMIN', 'ADMIN', 'MANAGER'],
  '/admin/handbags/materials': ['SUPER_ADMIN', 'ADMIN', 'MANAGER'],

  // Reports
  '/admin/reports': ['SUPER_ADMIN', 'ADMIN', 'MANAGER'],
  '/admin/reports/performance': ['SUPER_ADMIN', 'ADMIN', 'MANAGER'],
  '/admin/reports/production': ['SUPER_ADMIN', 'ADMIN', 'MANAGER'],
  '/admin/reports/quality': ['SUPER_ADMIN', 'ADMIN', 'MANAGER'],
  '/admin/reports/hr': ['SUPER_ADMIN', 'ADMIN'],

  // Permissions
  '/admin/permissions': ['SUPER_ADMIN'],
  '/admin/settings/permissions-management': ['SUPER_ADMIN'],
  '/admin/settings/role-permissions-assignment': ['SUPER_ADMIN'],

  // Settings
  '/admin/settings': ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'USER'],
  '/admin/settings/general': ['SUPER_ADMIN', 'ADMIN'],
  '/admin/settings/profile': ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'USER'],
  '/admin/settings/change-password': ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'USER'],
  '/admin/settings/system-config': ['SUPER_ADMIN'],
};

// Default permissions for each role
export const defaultPermissions: Record<UserRole, string[]> = {
  SUPER_ADMIN: [
    'DASHBOARD_VIEW',
    'USERS_MANAGE',
    'ROLES_MANAGE',
    'DEPARTMENTS_MANAGE',
    'FACTORIES_MANAGE',
    'LINES_MANAGE',
    'TEAMS_MANAGE',
    'GROUPS_MANAGE',
    'HANDBAGS_MANAGE',
    'REPORTS_VIEW',
    'PERMISSIONS_MANAGE',
    'SETTINGS_MANAGE',
    'SYSTEM_CONFIG',
  ],
  ADMIN: [
    'DASHBOARD_VIEW',
    'USERS_MANAGE',
    'ROLES_VIEW',
    'DEPARTMENTS_MANAGE',
    'FACTORIES_MANAGE',
    'LINES_MANAGE',
    'TEAMS_MANAGE',
    'GROUPS_MANAGE',
    'HANDBAGS_MANAGE',
    'REPORTS_VIEW',
    'SETTINGS_VIEW',
  ],
  MANAGER: [
    'DASHBOARD_VIEW',
    'USERS_VIEW',
    'DEPARTMENTS_VIEW',
    'FACTORIES_VIEW',
    'LINES_MANAGE',
    'TEAMS_MANAGE',
    'GROUPS_MANAGE',
    'HANDBAGS_VIEW',
    'REPORTS_VIEW',
    'SETTINGS_VIEW',
  ],
  USER: ['DASHBOARD_VIEW', 'HANDBAGS_VIEW', 'SETTINGS_VIEW'],
};

/**
 * Check if a user with the given role has access to a specific route
 */
export function hasRouteAccess(
  route: string,
  userRole: UserRole,
  customRoutePermissions?: Record<string, UserRole[]>
): boolean {
  if (!userRole) return false;

  // Use custom permissions if provided, otherwise use default route permissions
  const permissions = customRoutePermissions || routePermissions;

  // If no specific permission is defined, deny access
  if (!permissions[route]) return false;

  // Check if the user's role is in the list of allowed roles
  return permissions[route].includes(userRole);
}

/**
 * Filter navigation items based on user role
 */
export function filterNavItemsByRole(
  navItems: any[],
  userRole: UserRole,
  customRoutePermissions?: Record<string, UserRole[]>
): any[] {
  if (!navItems || !userRole) return [];

  return navItems
    .filter(item => {
      // Check if user has access to main item
      const hasMainAccess = hasRouteAccess(item.url, userRole, customRoutePermissions);

      if (!hasMainAccess && (!item.items || item.items.length === 0)) {
        return false;
      }

      // If item has sub-items, filter them too
      if (item.items && item.items.length > 0) {
        const filteredSubItems = item.items.filter(
          (subItem: any) => hasRouteAccess(subItem.url, userRole, customRoutePermissions)
        );

        // Only include parent if it has accessible sub-items or main access
        if (filteredSubItems.length > 0 || hasMainAccess) {
          return {
            ...item,
            items: filteredSubItems,
          };
        }
        return false;
      }

      return hasMainAccess;
    })
    .map(item => {
      // Process sub-items if they exist
      if (item.items && item.items.length > 0) {
        return {
          ...item,
          items: item.items.filter((subItem: any) => 
            hasRouteAccess(subItem.url, userRole, customRoutePermissions)
          ),
        };
      }
      return item;
    });
}

/**
 * Filter project items based on user role
 */
export function filterProjectsByRole(
  projects: any[],
  userRole: UserRole,
  customRoutePermissions?: Record<string, UserRole[]>
): any[] {
  if (!projects || !userRole) return [];

  return projects
    .filter(project => {
      // Check if user has access to main project
      const hasMainAccess = hasRouteAccess(project.url, userRole, customRoutePermissions);

      if (!hasMainAccess && (!project.items || project.items.length === 0)) {
        return false;
      }

      // If project has sub-items, filter them too
      if (project.items && project.items.length > 0) {
        const filteredSubItems = project.items.filter(
          (subItem: any) => hasRouteAccess(subItem.url, userRole, customRoutePermissions)
        );

        // Only include parent if it has accessible sub-items or main access
        if (filteredSubItems.length > 0 || hasMainAccess) {
          return {
            ...project,
            items: filteredSubItems,
          };
        }
        return false;
      }

      return hasMainAccess;
    })
    .map(project => {
      // Process sub-items if they exist
      if (project.items && project.items.length > 0) {
        return {
          ...project,
          items: project.items.filter((subItem: any) => 
            hasRouteAccess(subItem.url, userRole, customRoutePermissions)
          ),
        };
      }
      return project;
    });
}
