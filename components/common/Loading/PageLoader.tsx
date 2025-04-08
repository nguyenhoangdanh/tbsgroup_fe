"use client";
import { useState, useEffect, ReactNode, useCallback, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { TableSkeleton } from "../table/TableSkeleton";
import LazyLoader from "./LazyLoader";

interface PageLoaderProps {
    children?: ReactNode;
    showTableSkeleton?: boolean;
    skeletonColumns?: number;
    skeletonRows?: number;
    loadingTime?: number;
    skeletonLoadingTime?: number;
    darkMode?: boolean;
    isLoading?: boolean;
}


const PageLoader = ({
    children,
    showTableSkeleton = false,
    skeletonColumns,
    skeletonRows,
    loadingTime = 2000,
    skeletonLoadingTime = 2500,
    darkMode = false,
    isLoading: externalLoading,
}: PageLoaderProps) => {
    const pathname = usePathname();

    const [internalLoading, setInternalLoading] = useState(false);
    const [showSkeleton, setShowSkeleton] = useState(true);
    const [showLazyLoader, setShowLazyLoader] = useState(true);

    // Kiểm tra thiết bị để điều chỉnh số cột và hàng cho skeleton
    const isMobile = useMediaQuery("(max-width: 640px)");
    const isTablet = useMediaQuery("(min-width: 641px) and (max-width: 1024px)")

    // Điều chỉnh thông số dựa vào kích thước màn hình
    const adjustedColumns = useCallback(() => {
        if (skeletonColumns) return skeletonColumns;
        if (isMobile) return 3;
        if (isTablet) return 4;
        return 5;
    }, [isMobile, isTablet, skeletonColumns]);

    const adjustedRows = useCallback(() => {
        if (skeletonRows) return skeletonRows;
        if (isMobile) return 4;
        if (isTablet) return 5;
        return 6;
    }, [isMobile, isTablet, skeletonRows]);

    // Điều chỉnh thời gian loading trên các thiết bị
    const adjustedLoadingTime = isMobile ? loadingTime * 0.8 : loadingTime;
    const adjustedSkeletonLoadingTime = isMobile ? skeletonLoadingTime * 0.8 : skeletonLoadingTime;

    // Nếu externalLoading được cung cấp, sử dụng nó, nếu không thì dùng internalLoading
    const isLoading = externalLoading !== undefined ? externalLoading : internalLoading


    useEffect(() => {
        // Chỉ xử lý loading tự động khi không có prop isLoading từ bên ngoài
        if (externalLoading === undefined) {
            // Start loading immediately on path change
            setInternalLoading(true);
            setShowLazyLoader(true);
            setShowSkeleton(true);

            // LazyLoader biến mất trước
            const lazyLoaderTimer = setTimeout(() => {
                setShowLazyLoader(false);
            }, adjustedLoadingTime - 500); // LazyLoader biến mất sớm hơn 500ms

            // TableSkeleton tồn tại lâu hơn
            const skeletonTimer = setTimeout(() => {
                setShowSkeleton(false);
                setInternalLoading(false); // Kết thúc quá trình loading khi skeleton biến mất
            }, adjustedSkeletonLoadingTime);

            // Cleanup to prevent memory leaks
            return () => {
                clearTimeout(lazyLoaderTimer);
                clearTimeout(skeletonTimer);
            };
        } else {
            // Khi có externalLoading, vẫn cần xử lý các trạng thái
            if (externalLoading) {
                setShowLazyLoader(true);
                setShowSkeleton(true);

                // LazyLoader biến mất trước
                const lazyLoaderTimer = setTimeout(() => {
                    setShowLazyLoader(false);
                }, adjustedLoadingTime - 500);

                // TableSkeleton tồn tại lâu hơn
                const skeletonTimer = setTimeout(() => {
                    setShowSkeleton(false);
                }, adjustedSkeletonLoadingTime);

                return () => {
                    clearTimeout(lazyLoaderTimer);
                    clearTimeout(skeletonTimer);
                };
            } else {
                // Reset states when externalLoading turns false
                setShowLazyLoader(false);
                setShowSkeleton(false);
            }
        }
    }, [pathname, adjustedSkeletonLoadingTime, adjustedLoadingTime, externalLoading]);

    if (isLoading) {
        return (
            <div className="relative">
                {/* TableSkeleton hiển thị bên dưới */}
                {showTableSkeleton && showSkeleton && (
                    <div className={`w-full ${darkMode ? 'dark' : ''}`}>
                        <TableSkeleton
                            columns={adjustedColumns()}
                            rows={adjustedRows()}
                        />
                    </div>
                )}

                {/* LazyLoader hiển thị ở trên, nhưng sẽ biến mất trước */}
                {showLazyLoader && <LazyLoader />}
            </div>
        );
    }

    return (
        children ? <>{children}</> : null
    )
}

export default PageLoader;