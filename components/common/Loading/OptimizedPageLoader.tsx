"use client";
import { useState, useEffect, ReactNode, useCallback, useRef } from "react";
import { usePathname } from "next/navigation";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import EnhancedLoadingOverlay from "./EnhancedLoadingOverlay";
import HandbagLoader from "./HandbagLoader";

interface OptimizedPageLoaderProps {
    children?: ReactNode;
    /** Type of content being loaded */
    contentType?: 'default' | 'table' | 'form' | 'handbag' | 'stats';
    /** Auto-calculated based on contentType, can be overridden */
    loaderType?: 'fullscreen' | 'container' | 'minimal' | 'list' | 'detail' | 'stats';
    /** Optional custom loading text */
    loadingText?: string;
    /** Control initial loading time */
    initialLoadingTime?: number;
    /** Control content skeleton time */
    skeletonTime?: number;
    /** Dark mode override */
    darkMode?: boolean;
    /** External loading state */
    isLoading?: boolean;
    /** Callback after loading is complete */
    onLoadingComplete?: () => void;
}

const OptimizedPageLoader = ({
    children,
    contentType = 'default',
    loaderType,
    loadingText,
    initialLoadingTime = 1000, // Reduced from 2000ms for better UX
    skeletonTime = 1500, // Reduced from 2500ms
    darkMode,
    isLoading: externalLoading,
    onLoadingComplete,
}: OptimizedPageLoaderProps) => {
    const pathname = usePathname();
    const isMounted = useRef(true);
    const [internalLoading, setInternalLoading] = useState(true);
    const [showOverlay, setShowOverlay] = useState(true);
    const [showSkeleton, setShowSkeleton] = useState(true);

    // Determine device for responsive adjustments
    const isMobile = useMediaQuery("(max-width: 640px)");
    const isTablet = useMediaQuery("(min-width: 641px) and (max-width: 1024px)");

    // Adjust loading times based on device
    const adjustedInitialTime = isMobile ? initialLoadingTime * 0.7 :
        isTablet ? initialLoadingTime * 0.85 :
            initialLoadingTime;

    const adjustedSkeletonTime = isMobile ? skeletonTime * 0.7 :
        isTablet ? skeletonTime * 0.85 :
            skeletonTime;

    // Default text based on content type                             
    const getDefaultText = useCallback(() => {
        switch (contentType) {
            case 'handbag': return 'Đang tải dữ liệu túi xách...';
            case 'table': return 'Đang tải bảng dữ liệu...';
            case 'form': return 'Đang tải biểu mẫu...';
            case 'stats': return 'Đang tải thống kê...';
            default: return 'Đang tải...';
        }
    }, [contentType]);

    // Determine loader type if not explicitly provided
    const resolvedLoaderType = loaderType || (
        contentType === 'default' ? 'fullscreen' :
            contentType === 'table' ? 'list' :
                contentType === 'form' ? 'detail' :
                    contentType === 'handbag' ? 'list' :
                        contentType === 'stats' ? 'stats' : 'fullscreen'
    );

    // Use external loading state if provided, internal otherwise
    const isLoading = externalLoading !== undefined ? externalLoading : internalLoading;

    // If no children and not loading, don't render anything
    if (!children && !isLoading) return null;

    // Handle loading transitions
    useEffect(() => {
        isMounted.current = true;

        // Reset loading state for internal navigation
        if (externalLoading === undefined) {
            setInternalLoading(true);
            setShowOverlay(true);
            setShowSkeleton(true);

            // First dismiss the overlay loader
            const overlayTimer = setTimeout(() => {
                if (isMounted.current) {
                    setShowOverlay(false);
                }
            }, adjustedInitialTime);

            // Then dismiss the skeleton loader
            const skeletonTimer = setTimeout(() => {
                if (isMounted.current) {
                    setShowSkeleton(false);
                    setInternalLoading(false);
                    if (onLoadingComplete) onLoadingComplete();
                }
            }, adjustedSkeletonTime);

            return () => {
                clearTimeout(overlayTimer);
                clearTimeout(skeletonTimer);
                isMounted.current = false;
            };
        } else if (externalLoading) {
            // Handle external loading state
            setShowOverlay(true);
            setShowSkeleton(true);

            const overlayTimer = setTimeout(() => {
                if (isMounted.current) {
                    setShowOverlay(false);
                }
            }, adjustedInitialTime);

            return () => {
                clearTimeout(overlayTimer);
            };
        } else {
            // External loading is false
            setShowOverlay(false);
            setShowSkeleton(false);
        }
    }, [
        pathname,
        externalLoading,
        adjustedInitialTime,
        adjustedSkeletonTime,
        onLoadingComplete
    ]);

    // Choose between a handbag-specific loader or generic loader
    if (isLoading) {
        return (
            <div className="relative w-full h-full">
                {/* Fullscreen overlay loader (shows first, disappears quickly) */}
                {showOverlay && ['fullscreen', 'container', 'minimal'].includes(resolvedLoaderType) && (
                    <EnhancedLoadingOverlay
                        isLoading={true}
                        type={resolvedLoaderType as 'fullscreen' | 'container' | 'minimal'}
                        text={loadingText || getDefaultText()}
                        forceDarkMode={darkMode}
                        autoDismiss={adjustedInitialTime}
                    />
                )}

                {/* Content-specific skeleton loader (persists longer) */}
                {showSkeleton && (
                    contentType === 'handbag' || ['list', 'detail', 'stats'].includes(resolvedLoaderType) ? (
                        <HandbagLoader
                            type={resolvedLoaderType as 'list' | 'detail' | 'stats'}
                            text={loadingText || getDefaultText()}
                            forceDarkMode={darkMode}
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center py-8">
                            <EnhancedLoadingOverlay
                                isLoading={true}
                                type="minimal"
                                text={loadingText || getDefaultText()}
                                forceDarkMode={darkMode}
                            />
                        </div>
                    )
                )}
            </div>
        );
    }

    return children ? <>{children}</> : null;
};

export default OptimizedPageLoader;