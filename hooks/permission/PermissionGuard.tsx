'use client';

import React, { useEffect, useState, useMemo } from 'react';

import { useLoading } from '@/components/common/loading/LoadingProvider';
import AccessDeniedMessage from '@/components/common/notifications/AccessDeniedMessage';
import { useProtectedResource } from '@/hooks/permission/useProtectedResource';

type PermissionGuardProps = {
  permissionCode?: string;
  pageCode?: string;
  featureCode?: string;
  anyOf?: string[];
  allOf?: string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
  renderNull?: boolean;
  loadingMessage?: string;
  loadingDelay?: number;
};

/**
 * Component that conditionally renders children based on user permissions
 * Optimized for performance with memoization and reduced state updates
 */
export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  permissionCode,
  pageCode,
  featureCode,
  anyOf,
  allOf,
  children,
  fallback = null,
  renderNull = true,
  loadingMessage = 'Đang tải...',
  loadingDelay = 300, // Reduced from 800ms for better UX
}) => {
  const {
    hasPermission,
    hasPageAccess,
    hasFeatureAccess,
    hasAnyPermission,
    hasAllPermissions,
    userPermissions,
  } = useProtectedResource();

  const { startLoading, stopLoading } = useLoading();
  const [isReady, setIsReady] = useState(false);
  const [accessGranted, setAccessGranted] = useState<boolean | null>(null);

  // Generate a unique loading key once using useMemo to avoid rerenders
  const loadingKey = useMemo(() => 
    `permission-guard-${pageCode || permissionCode || featureCode || Math.random().toString(36).substring(2, 9)}`,
    [pageCode, permissionCode, featureCode]
  );

  // Memoize access check function to prevent recreating on each render
  const checkAccess = useMemo(() => {
    return () => {
      // Skip check if already determined
      if (accessGranted !== null) return accessGranted;

      // Evaluate access based on prop priority
      if (permissionCode) {
        return hasPermission(permissionCode);
      } else if (pageCode) {
        return hasPageAccess(pageCode);
      } else if (featureCode) {
        return hasFeatureAccess(featureCode);
      } else if (allOf && allOf.length > 0) {
        return hasAllPermissions(allOf);
      } else if (anyOf && anyOf.length > 0) {
        return hasAnyPermission(anyOf);
      }
      
      // If no permission criteria provided, default to true
      return true;
    };
  }, [
    accessGranted,
    hasPermission, 
    hasPageAccess, 
    hasFeatureAccess, 
    hasAnyPermission, 
    hasAllPermissions,
    permissionCode,
    pageCode,
    featureCode,
    anyOf,
    allOf
  ]);

  useEffect(() => {
    let mounted = true;
    let timer: NodeJS.Timeout | null = null;

    // Skip loading if we're still waiting for permissions
    if (userPermissions.isLoading) {
      return () => {
        mounted = false;
        if (timer) clearTimeout(timer);
      };
    }

    // Start loading animation with debounce
    startLoading(loadingKey, {
      variant: 'fullscreen',
      message: loadingMessage,
      delay: loadingDelay > 100 ? 100 : loadingDelay, // Start loading indicator quickly but debounce completion
    });

    // Set a timer to check access after delay
    timer = setTimeout(() => {
      if (mounted) {
        const hasAccess = checkAccess();
        console.log('PermissionGuard access check:', {
          permissionCode,
          pageCode,
          featureCode,
          anyOf,
          allOf,
          hasAccess,
        });
        setAccessGranted(hasAccess);
        setIsReady(true);
        stopLoading(loadingKey);
      }
    }, loadingDelay);

    return () => {
      mounted = false;
      if (timer) clearTimeout(timer);
      stopLoading(loadingKey);
    };
  }, [
    startLoading,
    stopLoading,
    checkAccess,
    loadingKey,
    loadingDelay,
    loadingMessage,
    userPermissions.isLoading
  ]);

  // While loading or checking permissions, return nothing
  // The loading animation is handled by LoadingProvider
  if (!isReady) {
    return null;
  }

  // After checking, show appropriate content based on permission result
  if (accessGranted) {
    return <>{children}</>;
  }

  // If access denied and renderNull is true, but no fallback provided, show AccessDeniedMessage
  if (renderNull) {
    return <>{fallback || <AccessDeniedMessage />}</>;
  }

  // Otherwise render nothing
  return null;
};

type FeatureGuardProps = Omit<PermissionGuardProps, 'featureCode'> & {
  featureCode: string;
};

/**
 * Specialized guard for feature access permissions
 */
export const FeatureGuard: React.FC<FeatureGuardProps> = ({
  featureCode,
  children,
  ...rest
}) => {
  return (
    <PermissionGuard featureCode={featureCode} {...rest}>
      {children}
    </PermissionGuard>
  );
};

type PageGuardProps = Omit<PermissionGuardProps, 'pageCode'> & {
  pageCode: string;
};

/**
 * Specialized guard for page access permissions
 */
export const PageGuard: React.FC<PageGuardProps> = ({ 
  pageCode, 
  children, 
  ...rest 
}) => {
  return (
    <PermissionGuard pageCode={pageCode} {...rest}>
      {children}
    </PermissionGuard>
  );
};

export default PermissionGuard;
