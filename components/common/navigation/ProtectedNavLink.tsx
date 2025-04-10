// src/components/common/navigation/ProtectedNavLink.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useProtectedResource } from '@/hooks/permission/useProtectedResource';
import { cn } from '@/lib/utils';

interface ProtectedNavLinkProps {
    href: string;
    icon?: React.ReactNode;
    label: string;
    pageCode?: string;
    permissionCode?: string;
    featureCode?: string;
    anyOf?: string[];
    allOf?: string[];
    className?: string;
    activeClassName?: string;
}

export function ProtectedNavLink({
    href,
    icon,
    label,
    pageCode,
    permissionCode,
    featureCode,
    anyOf,
    allOf,
    className = '',
    activeClassName = 'bg-primary/10 text-primary',
}: ProtectedNavLinkProps) {
    const pathname = usePathname();
    const isActive = pathname === href;

    const {
        hasPermission,
        hasPageAccess,
        hasFeatureAccess,
        hasAnyPermission,
        hasAllPermissions,
    } = useProtectedResource();

    // Kiểm tra quyền truy cập
    let hasAccess = false;

    if (pageCode) {
        hasAccess = hasPageAccess(pageCode);
    } else if (permissionCode) {
        hasAccess = hasPermission(permissionCode);
    } else if (featureCode) {
        hasAccess = hasFeatureAccess(featureCode);
    } else if (allOf && allOf.length > 0) {
        hasAccess = hasAllPermissions(allOf);
    } else if (anyOf && anyOf.length > 0) {
        hasAccess = hasAnyPermission(anyOf);
    } else {
        hasAccess = true; // Không có ràng buộc phân quyền
    }

    if (!hasAccess) {
        return null;
    }

    return (
        <Link
            href={href}
            className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-md transition-colors',
                isActive ? activeClassName : 'hover:bg-gray-100 dark:hover:bg-gray-800',
                className
            )}
        >
            {icon && <span className="flex-shrink-0">{icon}</span>}
            <span>{label}</span>
        </Link>
    );
}