import { useCallback } from 'react';

import { usePermissionContext } from './PermissionContext';

type ResourceType = 'page' | 'feature' | 'data' | 'permission';

/**
 * Hook for controlling access to protected resources based on user permissions
 */
export const useProtectedResource = () => {
  const {
    hasPermission,
    hasPageAccess,
    hasFeatureAccess,
    hasDataAccess,
    hasAnyPermission,
    hasAllPermissions,
    userPermissions,
  } = usePermissionContext();

  /**
   * Check if user has access to a specific resource
   * @param resourceType Type of resource being checked
   * @param resourceCode Code/identifier of the resource
   * @returns Boolean indicating if the user has access
   */
  const canAccessResource = useCallback(
    (resourceType: ResourceType, resourceCode: string): boolean => {
      switch (resourceType) {
        case 'page':
          return hasPageAccess(resourceCode);
        case 'feature':
          return hasFeatureAccess(resourceCode);
        case 'data':
          return hasDataAccess(resourceCode);
        case 'permission':
          return hasPermission(resourceCode);
        default:
          return false;
      }
    },
    [hasPageAccess, hasFeatureAccess, hasDataAccess, hasPermission],
  );

  /**
   * Higher-order function to create permission-gated render functions
   * @param renderFn Function to render content if user has permission
   * @param fallbackFn Function to render fallback content if user doesn't have permission (optional)
   * @returns Function that takes a permission code and returns the appropriate rendered content
   */
  const createPermissionGate = useCallback(
    <T>(renderFn: () => T, fallbackFn?: () => T) => {
      return (permissionCode: string): T => {
        return hasPermission(permissionCode)
          ? renderFn()
          : fallbackFn
            ? fallbackFn()
            : (null as unknown as T);
      };
    },
    [hasPermission],
  );

  /**
   * Component render control based on permission
   * @param permissionCode Permission code to check
   * @param children Content to render when user has permission
   * @param fallback Fallback content when user doesn't have permission (optional)
   * @returns Children or fallback based on permission check
   */
  const renderIfHasPermission = useCallback(
    <T>(permissionCode: string, children: T, fallback?: T): T => {
      return hasPermission(permissionCode)
        ? children
        : fallback === undefined
          ? (null as unknown as T)
          : fallback;
    },
    [hasPermission],
  );

  /**
   * Component render control based on page access
   * @param pageCode Page code to check
   * @param children Content to render when user has access
   * @param fallback Fallback content when user doesn't have access (optional)
   * @returns Children or fallback based on page access check
   */
  const renderIfHasPageAccess = useCallback(
    <T>(pageCode: string, children: T, fallback?: T): T => {
      return hasPageAccess(pageCode)
        ? children
        : fallback === undefined
          ? (null as unknown as T)
          : fallback;
    },
    [hasPageAccess],
  );

  /**
   * Component render control based on feature access
   * @param featureCode Feature code to check
   * @param children Content to render when user has access
   * @param fallback Fallback content when user doesn't have access (optional)
   * @returns Children or fallback based on feature access check
   */
  const renderIfHasFeatureAccess = useCallback(
    <T>(featureCode: string, children: T, fallback?: T): T => {
      return hasFeatureAccess(featureCode)
        ? children
        : fallback === undefined
          ? (null as unknown as T)
          : fallback;
    },
    [hasFeatureAccess],
  );

  return {
    canAccessResource,
    createPermissionGate,
    renderIfHasPermission,
    renderIfHasPageAccess,
    renderIfHasFeatureAccess,
    hasAllPermissions,
    hasAnyPermission,
    // Original permission checks are also exposed
    hasPermission,
    hasPageAccess,
    hasFeatureAccess,
    hasDataAccess,
    userPermissions,
  };
};
