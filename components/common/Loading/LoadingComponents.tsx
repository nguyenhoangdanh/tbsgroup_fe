// LoadingComponents.tsx
"use client";

import React from 'react';
import { useLoading, LoadingConfig } from './UnifieldLoadingSystem';
import { Loader2 } from 'lucide-react';
import { TableSkeleton } from '../table/TableSkeleton';
import { useTheme } from 'next-themes';

/**
 * Nút có trạng thái loading tích hợp
 */
interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    isLoading?: boolean;
    loadingText?: string;
    children: React.ReactNode;
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
    size?: 'default' | 'sm' | 'lg' | 'icon';
}

export const LoadingButton: React.FC<LoadingButtonProps> = ({
    isLoading,
    loadingText,
    children,
    disabled,
    variant = 'default',
    size = 'default',
    ...props
}) => {
    // Lấy classes theo variant
    const getVariantClasses = () => {
        switch (variant) {
            case 'destructive':
                return 'bg-destructive text-destructive-foreground hover:bg-destructive/90';
            case 'outline':
                return 'border border-input bg-background hover:bg-accent hover:text-accent-foreground';
            case 'secondary':
                return 'bg-secondary text-secondary-foreground hover:bg-secondary/80';
            case 'ghost':
                return 'hover:bg-accent hover:text-accent-foreground';
            case 'link':
                return 'text-primary underline-offset-4 hover:underline';
            default:
                return 'bg-primary text-primary-foreground hover:bg-primary/90';
        }
    };

    // Lấy classes theo kích thước
    const getSizeClasses = () => {
        switch (size) {
            case 'sm':
                return 'h-9 px-3 rounded-md text-xs';
            case 'lg':
                return 'h-11 px-8 rounded-md text-base';
            case 'icon':
                return 'h-10 w-10 rounded-md';
            default:
                return 'h-10 px-4 py-2 rounded-md text-sm';
        }
    };

    const baseClasses = 'inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background';

    return (
        <button
            className={`${baseClasses} ${getVariantClasses()} ${getSizeClasses()}`}
            disabled={isLoading || disabled}
            {...props}
        >
            {isLoading ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {loadingText || children}
                </>
            ) : (
                children
            )}
        </button>
    );
};

/**
 * Bảng với trạng thái loading tích hợp
 */
interface LoadingTableProps {
    isLoading?: boolean;
    loadingConfig?: LoadingConfig;
    children: React.ReactNode;
    className?: string;
}

export const LoadingTable: React.FC<LoadingTableProps> = ({
    isLoading = false,
    loadingConfig,
    children,
    className = ''
}) => {
    const { startLoading, stopLoading } = useLoading();
    const loadingKey = 'table-' + Math.random().toString(36).substring(2, 9);
    const { theme } = useTheme(); // Nếu bạn đang sử dụng next-themes
    const isDark = theme === 'dark';
    React.useEffect(() => {
        if (isLoading) {
            startLoading(loadingKey, {
                variant: 'table',
                ...loadingConfig
            });
        } else {
            stopLoading(loadingKey);
        }

        return () => {
            stopLoading(loadingKey);
        };
    }, [isLoading]);

    return (
        <div className={`relative ${className}`}>
            <div className={isLoading ? 'opacity-0' : 'opacity-100'}>
                {children}
            </div>
            {isLoading && (
                <div className="absolute inset-0 bg-white/70 dark:bg-gray-900/70 backdrop-blur-sm z-10">
                    <TableSkeleton
                        columns={loadingConfig?.skeletonConfig?.columns || 5}
                        rows={loadingConfig?.skeletonConfig?.rows || 10}
                        darkMode={isDark}
                    />
                </div>
            )}
        </div>
    );
};

/**
 * Form với trạng thái loading tích hợp
 */
interface LoadingFormProps extends React.FormHTMLAttributes<HTMLFormElement> {
    isLoading?: boolean;
    loadingConfig?: LoadingConfig;
    onSubmit?: (e: React.FormEvent) => void;
    children: React.ReactNode;
}

export const LoadingForm: React.FC<LoadingFormProps> = ({
    isLoading = false,
    loadingConfig,
    onSubmit,
    children,
    ...props
}) => {
    const { startLoading, stopLoading } = useLoading();
    const loadingKey = 'form-' + Math.random().toString(36).substring(2, 9);

    React.useEffect(() => {
        if (isLoading) {
            startLoading(loadingKey, {
                variant: 'form',
                ...loadingConfig
            });
        } else {
            stopLoading(loadingKey);
        }

        return () => {
            stopLoading(loadingKey);
        };
    }, [isLoading]);

    const handleSubmit = (e: React.FormEvent) => {
        if (isLoading) {
            e.preventDefault();
            return;
        }

        if (onSubmit) {
            onSubmit(e);
        }
    };

    return (
        <form {...props} onSubmit={handleSubmit} className={`relative ${props.className || ''}`}>
            <div className={isLoading ? 'opacity-50 pointer-events-none' : ''}>
                {children}
            </div>
        </form>
    );
};

/**
 * Section với skeleton loading tích hợp
 */
interface SkeletonSectionProps {
    isLoading?: boolean;
    loadingConfig?: LoadingConfig;
    children: React.ReactNode;
    className?: string;
}

export const SkeletonSection: React.FC<SkeletonSectionProps> = ({
    isLoading = false,
    loadingConfig,
    children,
    className = ''
}) => {
    const { startLoading, stopLoading } = useLoading();
    const loadingKey = 'skeleton-' + Math.random().toString(36).substring(2, 9);

    React.useEffect(() => {
        if (isLoading) {
            startLoading(loadingKey, {
                variant: 'skeleton',
                ...loadingConfig
            });
        } else {
            stopLoading(loadingKey);
        }

        return () => {
            stopLoading(loadingKey);
        };
    }, [isLoading]);

    return (
        <div className={`relative ${className}`}>
            <div className={isLoading ? 'opacity-0' : 'opacity-100'}>
                {children}
            </div>
        </div>
    );
};

/**
 * Overlay loading cho containers
 */
interface LoadingOverlayProps {
    isLoading?: boolean;
    message?: string;
    children: React.ReactNode;
    className?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
    isLoading = false,
    message = 'Đang tải...',
    children,
    className = ''
}) => {
    return (
        <div className={`relative ${className}`}>
            {children}

            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/70 dark:bg-gray-900/70 backdrop-blur-sm z-10 rounded-lg">
                    <div className="flex flex-col items-center p-4 bg-white/90 dark:bg-gray-800/90 rounded-xl shadow-lg">
                        <div className="relative w-16 h-16">
                            <div className="absolute inset-0 border-3 border-transparent border-t-primary border-r-primary rounded-full animate-spin"></div>
                            <div className="absolute inset-0 border-3 border-transparent border-b-primary-foreground border-l-primary-foreground rounded-full animate-spin-reverse"></div>
                        </div>
                        {message && <p className="mt-3 text-sm font-medium text-center">{message}</p>}
                    </div>
                </div>
            )}
        </div>
    );
};