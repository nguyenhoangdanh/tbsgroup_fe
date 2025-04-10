"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useLoading } from "./LoadingProvider";

interface PageLoaderProps {
    children: React.ReactNode;
    showTableSkeleton?: boolean;
}

const PageLoader: React.FC<PageLoaderProps> = ({ children, showTableSkeleton = false }) => {
    const pathname = usePathname();
    const { startLoading, stopLoading, isLoading } = useLoading();
    const [isPageLoading, setIsPageLoading] = useState(false);

    useEffect(() => {
        const loadingKey = `page-${pathname}`;
        setIsPageLoading(true);
        startLoading(loadingKey, { variant: showTableSkeleton ? "table" : "fullscreen" });

        const timer = setTimeout(() => {
            stopLoading(loadingKey);
            setIsPageLoading(false);
        }, 1000); // Giả lập thời gian tải trang, thay bằng logic thực tế nếu cần

        return () => clearTimeout(timer);
    }, [pathname, startLoading, stopLoading, showTableSkeleton]);

    if (isPageLoading) return null; // LoadingRenderer sẽ xử lý hiển thị
    return <>{children}</>;
};

export default PageLoader;