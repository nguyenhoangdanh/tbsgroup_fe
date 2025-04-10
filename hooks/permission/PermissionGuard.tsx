'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useProtectedResource } from '@/hooks/permission/useProtectedResource';
import { useLoading } from '@/components/common/loading/LoadingProvider';
import AccessDeniedMessage from '@/components/common/notifications/AccessDeniedMessage';

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
    useDefaultAccessDenied?: boolean;
};

/**
 * Component that conditionally renders children based on user permissions
 */
export const PermissionGuard: React.FC<PermissionGuardProps> = React.memo(({
    permissionCode,
    pageCode,
    featureCode,
    anyOf,
    allOf,
    children,
    fallback = null,
    renderNull = true,
    loadingMessage = 'Đang tải...',
    loadingDelay = 3000,
    useDefaultAccessDenied = false,

}) => {
    const { hasPermission, hasPageAccess, hasFeatureAccess, hasAnyPermission, hasAllPermissions, userPermissions } = useProtectedResource();
    const { startLoading, stopLoading } = useLoading();
    const [hasAccess, setHasAccess] = useState<boolean | null>(null);

    // Tạo stable loadingKey theo cách tối ưu hơn
    const loadingKey = useMemo(() => {
        const keyParts = [];
        if (permissionCode) keyParts.push(`perm-${permissionCode}`);
        if (pageCode) keyParts.push(`page-${pageCode}`);
        if (featureCode) keyParts.push(`feat-${featureCode}`);
        if (anyOf?.length) keyParts.push(`any-${anyOf.join('-')}`);
        if (allOf?.length) keyParts.push(`all-${allOf.join('-')}`);
        return `pg-${keyParts.join('-') || 'default'}`;
    }, [permissionCode, pageCode, featureCode, anyOf, allOf]);

    // Cải thiện checkAccess để không phụ thuộc vào các hàm trong useEffect
    const checkAccess = useMemo(() => {
        let result = false;
        if (permissionCode) result = hasPermission(permissionCode);
        else if (pageCode) result = hasPageAccess(pageCode);
        else if (featureCode) result = hasFeatureAccess(featureCode);
        else if (allOf?.length) result = hasAllPermissions(allOf);
        else if (anyOf?.length) result = hasAnyPermission(anyOf);
        return result;
    }, [
        permissionCode, pageCode, featureCode, anyOf, allOf,
        hasPermission, hasPageAccess, hasFeatureAccess, hasAnyPermission, hasAllPermissions
    ]);

    // Tách biệt useEffect cho việc khởi tạo loading và kiểm tra quyền
    useEffect(() => {
        startLoading(loadingKey, { variant: 'fullscreen', message: loadingMessage, delay: 0 });

        const timer = setTimeout(() => {
            setHasAccess(checkAccess);
            stopLoading(loadingKey);
        }, loadingDelay);

        return () => {
            clearTimeout(timer);
            stopLoading(loadingKey);
        };
    }, [loadingKey, checkAccess, loadingMessage, loadingDelay, startLoading, stopLoading]);

    // console.log('hasAccess:', userPermissions.isLoading); // Giữ lại để debug, có thể xóa sau

    // Xử lý fallback khi không có quyền truy cập
    const accessDeniedContent = useMemo(() => {
        if (useDefaultAccessDenied) return <AccessDeniedMessage />;
        return fallback;
    }, [fallback, useDefaultAccessDenied]);

    // Chỉ render khi đã kiểm tra quyền xong
    if (hasAccess === null) return null;
    if (hasAccess) return <>{children}</>;
    if (!renderNull) return null;
    return <>{accessDeniedContent}</>;
});

type FeatureGuardProps = Omit<PermissionGuardProps, 'featureCode'> & {
    featureCode: string;
};

/**
 * Specialized guard for feature access permissions
 */
export const FeatureGuard: React.FC<FeatureGuardProps> = React.memo(({
    featureCode,
    children,
    fallback,
    ...rest
}) => {
    return (
        <PermissionGuard featureCode={featureCode} fallback={fallback} {...rest}>
            {children}
        </PermissionGuard>
    );
});

type PageGuardProps = Omit<PermissionGuardProps, 'pageCode'> & {
    pageCode: string;
};

/**
 * Specialized guard for page access permissions
 */
export const PageGuard: React.FC<PageGuardProps> = React.memo(({
    pageCode,
    children,
    fallback,
    ...rest
}) => {
    return (
        <PermissionGuard pageCode={pageCode} fallback={fallback} {...rest}>
            {children}
        </PermissionGuard>
    );
});

export default PermissionGuard;





























// 'use client';

// import React, { useEffect, useState, useCallback, useMemo } from 'react';
// import { useProtectedResource } from '@/hooks/permission/useProtectedResource';
// import { useLoading } from '@/components/common/loading/LoadingProvider';

// type PermissionGuardProps = {
//     permissionCode?: string;
//     pageCode?: string;
//     featureCode?: string;
//     anyOf?: string[];
//     allOf?: string[];
//     children: React.ReactNode;
//     fallback?: React.ReactNode;
//     renderNull?: boolean;
//     loadingMessage?: string;
//     loadingDelay?: number;
// };

// /**
//  * Component that conditionally renders children based on user permissions
//  */

// export const PermissionGuard: React.FC<PermissionGuardProps> = React.memo(({
//     permissionCode,
//     pageCode,
//     featureCode,
//     anyOf,
//     allOf,
//     children,
//     fallback = null,
//     renderNull = true,
//     loadingMessage = 'Đang tải...',
//     loadingDelay = 800,
// }) => {
//     const { hasPermission, hasPageAccess, hasFeatureAccess, hasAnyPermission, hasAllPermissions } = useProtectedResource();
//     const { startLoading, stopLoading } = useLoading();
//     const [hasAccess, setHasAccess] = useState<boolean | null>(null);

//     const loadingKey = useMemo(() =>
//         `pg-${permissionCode || pageCode || featureCode || (anyOf?.join('-') || '') || (allOf?.join('-') || '')}`,
//         [permissionCode, pageCode, featureCode, anyOf, allOf]
//     );

//     useEffect(() => {
//         startLoading(loadingKey, { variant: 'fullscreen', message: loadingMessage, delay: 0 });
//         const timer = setTimeout(() => {
//             let result = false;
//             if (permissionCode) result = hasPermission(permissionCode);
//             else if (pageCode) result = hasPageAccess(pageCode);
//             else if (featureCode) result = hasFeatureAccess(featureCode);
//             else if (allOf?.length) result = hasAllPermissions(allOf);
//             else if (anyOf?.length) result = hasAnyPermission(anyOf);

//             setHasAccess(result);
//             stopLoading(loadingKey);
//         }, loadingDelay);

//         return () => {
//             clearTimeout(timer);
//             stopLoading(loadingKey);
//         };
//     }, [permissionCode, pageCode, featureCode, anyOf, allOf, hasPermission, hasPageAccess, hasFeatureAccess, hasAnyPermission, hasAllPermissions, loadingKey, loadingMessage, loadingDelay]);

//     if (hasAccess !== null) {
//         console.log('PermissionGuard:', hasAccess); // Giữ lại để debug, có thể xóa sau
//     }

//     if (hasAccess === null) return null;
//     if (hasAccess) return <>{children}</>;
//     if (!renderNull) return null;
//     return <>{fallback}</>;
// });

// type FeatureGuardProps = Omit<PermissionGuardProps, 'featureCode'> & {
//     featureCode: string;
// };

// /**
//  * Specialized guard for feature access permissions
//  */
// export const FeatureGuard: React.FC<FeatureGuardProps> = ({
//     featureCode,
//     children,
//     fallback,
//     ...rest
// }) => {
//     return (
//         <PermissionGuard featureCode={featureCode} fallback={fallback} {...rest}>
//             {children}
//         </PermissionGuard>
//     );
// };

// type PageGuardProps = Omit<PermissionGuardProps, 'pageCode'> & {
//     pageCode: string;
// };

// /**
//  * Specialized guard for page access permissions
//  */
// export const PageGuard: React.FC<PageGuardProps> = ({
//     pageCode,
//     children,
//     fallback,
//     ...rest
// }) => {
//     return (
//         <PermissionGuard pageCode={pageCode} fallback={fallback} {...rest}>
//             {children}
//         </PermissionGuard>
//     );
// };

// export default PermissionGuard;





















// 'use client';

// import React, { useState, useEffect } from 'react';
// import { useProtectedResource } from '@/hooks/permission/useProtectedResource';
// import { useLoading } from '@/components/common/loading/LoadingProvider';

// type PermissionGuardProps = {
//     permissionCode?: string;
//     pageCode?: string;
//     featureCode?: string;
//     anyOf?: string[];
//     allOf?: string[];
//     children: React.ReactNode;
//     fallback?: React.ReactNode;
//     renderNull?: boolean;
//     loadingMessage?: string;
//     loadingDelay?: number;
// };

// /**
//  * Component that conditionally renders children based on user permissions
//  */
// export const PermissionGuard: React.FC<PermissionGuardProps> = ({
//     permissionCode,
//     pageCode,
//     featureCode,
//     anyOf,
//     allOf,
//     children,
//     fallback = null,
//     renderNull = true,
//     loadingMessage = 'Đang tải...',
//     loadingDelay = 800,
// }) => {
//     const {
//         hasPermission,
//         hasPageAccess,
//         hasFeatureAccess,
//         hasAnyPermission,
//         hasAllPermissions,
//         userPermissions
//     } = useProtectedResource();

//     const { startLoading, stopLoading } = useLoading();
//     const [isReady, setIsReady] = useState(false);
//     const [accessGranted, setAccessGranted] = useState<boolean | null>(null);

//     // Generate a unique loading key for this guard instance
//     const loadingKey = `permission-guard-${pageCode || permissionCode || featureCode || 'check'}`;

//     useEffect(() => {
//         let mounted = true;

//         // Start loading animation
//         startLoading(loadingKey, {
//             variant: 'fullscreen',
//             message: loadingMessage,
//             delay: 0, // Start immediately
//         });

//         const checkAccess = () => {
//             let result = false;

//             // Evaluate access based on prop priority
//             if (permissionCode) {
//                 result = hasPermission(permissionCode);
//             } else if (pageCode) {
//                 result = hasPageAccess(pageCode);
//             } else if (featureCode) {
//                 result = hasFeatureAccess(featureCode);
//             } else if (allOf && allOf.length > 0) {
//                 result = hasAllPermissions(allOf);
//             } else if (anyOf && anyOf.length > 0) {
//                 result = hasAnyPermission(anyOf);
//             }

//             return result;
//         };

//         // Only perform the permission check once we have user permissions data
//         if (!userPermissions.isLoading) {
//             const timer = setTimeout(() => {
//                 if (mounted) {
//                     const hasAccess = checkAccess();
//                     setAccessGranted(hasAccess);
//                     setIsReady(true);
//                     stopLoading(loadingKey);
//                 }
//             }, loadingDelay);

//             return () => {
//                 mounted = false;
//                 clearTimeout(timer);
//                 stopLoading(loadingKey);
//             };
//         }

//         return () => {
//             mounted = false;
//             // Don't stop loading if we're still waiting for permissions
//             if (!userPermissions.isLoading) {
//                 stopLoading(loadingKey);
//             }
//         };
//     }, [
//         startLoading,
//         stopLoading,
//         hasPermission,
//         hasPageAccess,
//         hasFeatureAccess,
//         hasAnyPermission,
//         hasAllPermissions,
//         permissionCode,
//         pageCode,
//         featureCode,
//         anyOf,
//         allOf,
//         loadingKey,
//         loadingDelay,
//         loadingMessage,
//         userPermissions.isLoading
//     ]);

//     // While loading or checking permissions, return nothing
//     // The loading animation is handled by LoadingProvider
//     if (!isReady) {
//         return null;
//     }

//     // After checking, show appropriate content based on permission result
//     if (accessGranted) {
//         return <>{children}</>;
//     }

//     if (!renderNull) {
//         return null;
//     }

//     return <>{fallback}</>;
// };

// type FeatureGuardProps = Omit<PermissionGuardProps, 'featureCode'> & {
//     featureCode: string;
// };

// /**
//  * Specialized guard for feature access permissions
//  */
// export const FeatureGuard: React.FC<FeatureGuardProps> = ({
//     featureCode,
//     children,
//     fallback,
//     ...rest
// }) => {
//     return (
//         <PermissionGuard featureCode={featureCode} fallback={fallback} {...rest}>
//             {children}
//         </PermissionGuard>
//     );
// };

// type PageGuardProps = Omit<PermissionGuardProps, 'pageCode'> & {
//     pageCode: string;
// };

// /**
//  * Specialized guard for page access permissions
//  */
// export const PageGuard: React.FC<PageGuardProps> = ({
//     pageCode,
//     children,
//     fallback,
//     ...rest
// }) => {
//     return (
//         <PermissionGuard pageCode={pageCode} fallback={fallback} {...rest}>
//             {children}
//         </PermissionGuard>
//     );
// };

// export default PermissionGuard;