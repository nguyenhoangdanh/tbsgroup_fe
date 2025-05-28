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

// Default permission configuration - customize based on your needs
export const defaultPermissions: PermissionConfig = {
  routes: {
    // Dashboard accessible to all authenticated users
    '/admin/dashboard': ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'FACTORY_ADMIN', 'USER'],

    // User management only for admins and super admins
    '/admin/users': ['SUPER_ADMIN', 'ADMIN'],
    '/admin/users/all': ['SUPER_ADMIN', 'ADMIN'],
    '/admin/users/groups': ['SUPER_ADMIN', 'ADMIN'],
    '/admin/users/roles': ['SUPER_ADMIN', 'ADMIN'],

    // Handbags accessible to admins, managers, and factory admins
    '/admin/handbags': ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'FACTORY_ADMIN'],
    '/admin/handbags/all': ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'FACTORY_ADMIN'],
    '/admin/handbags/bag-colors': ['SUPER_ADMIN', 'ADMIN', 'MANAGER'],
    '/admin/handbags/bag-processes': ['SUPER_ADMIN', 'ADMIN', 'MANAGER'],
    '/admin/handbags/bag-group-rates': ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'FACTORY_ADMIN', 'USER'],
    '/admin/handbags/bag-group-rates/stats': ['SUPER_ADMIN', 'ADMIN', 'MANAGER'],
    '/admin/handbags/bag-group-rates/history': ['SUPER_ADMIN', 'ADMIN', 'MANAGER'],
    '/admin/handbags/bag-group-rates/details': ['SUPER_ADMIN', 'ADMIN', 'MANAGER'],
    '/admin/handbags/models': ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'FACTORY_ADMIN'],
    '/admin/handbags/materials': ['SUPER_ADMIN', 'ADMIN', 'MANAGER'],

    // Factories accessible to admins, managers, and factory admins
    '/admin/factories': ['SUPER_ADMIN', 'ADMIN', 'MANAGER'],

    // Settings - different permissions for different roles
    '/admin/settings': ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'USER'],
    '/admin/settings/general': ['SUPER_ADMIN', 'ADMIN'],
    '/admin/settings/permissions': ['SUPER_ADMIN', 'ADMIN'],
    '/admin/settings/profile': ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'USER'],
    '/admin/settings/change-password': ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'USER'],
    '/admin/settings/system-config': ['SUPER_ADMIN', 'ADMIN'],
    '/admin/settings/permissions-management': ['SUPER_ADMIN', 'ADMIN'],
    '/admin/settings/role-permissions-assignment': ['SUPER_ADMIN', 'ADMIN'],
  },
};

/**
 * Check if a user with the given role has access to a specific route
 */
export function hasRouteAccess(
  route: string,
  userRole: UserRole,
  permissions: PermissionConfig = defaultPermissions,
): boolean {
  if (!userRole) return false;

  // If no specific permission is defined, deny access
  if (!permissions.routes[route]) return false;

  // Check if the user's role is in the list of allowed roles
  return permissions.routes[route].includes(userRole);
}

/**
 * Filter nav items based on user role
 * This will recursively filter nested items as well
 */
export function filterNavItemsByRole(
  items: NavItem[],
  userRole: UserRole,
  permissions: PermissionConfig = defaultPermissions,
): NavItem[] {
  if (!userRole) return [];

  return items
    .filter(item => hasRouteAccess(item.url, userRole, permissions))
    .map(item => {
      // If this item has sub-items, filter them recursively
      if (item.items && item.items.length > 0) {
        const filteredSubItems = item.items.filter(subItem =>
          hasRouteAccess(subItem.url, userRole, permissions),
        );

        // Only return this item if it has at least one accessible sub-item
        if (filteredSubItems.length > 0) {
          return { ...item, items: filteredSubItems };
        }

        // If no sub-items are accessible, only return the parent if it has a valid route
        return { ...item, items: [] };
      }

      // Item without sub-items
      return item;
    });
}

/**
 * Filter project items based on user role
 * This will recursively filter nested items as well
 */
export function filterProjectsByRole(
  projects: Project[],
  userRole: UserRole,
  permissions: PermissionConfig = defaultPermissions,
): Project[] {
  if (!userRole) return [];

  return projects
    .filter(project => hasRouteAccess(project.url, userRole, permissions))
    .map(project => {
      // If this project has sub-items, filter them recursively
      if (project.items && project.items.length > 0) {
        const filteredSubItems = project.items.filter(subItem =>
          hasRouteAccess(subItem.url, userRole, permissions),
        );

        // Only return this project if it has at least one accessible sub-item
        if (filteredSubItems.length > 0) {
          return { ...project, items: filteredSubItems };
        }

        // If no sub-items are accessible, only return the parent if it has a valid route
        return { ...project, items: [] };
      }

      // Project without sub-items
      return project;
    });
}
