"use client";

import React, { createContext, useContext, useState, useEffect, useMemo } from "react";
import { useMediaQuery } from "@/hooks/useMediaQuery";

// Interface cho context
interface SidebarStateContextType {
    collapsed: boolean;
    setCollapsed: (value: boolean) => void;
    isMobileView: boolean;
}

type SidebarSetCollapsedContextType = (value: boolean) => void;

// Tách riêng context để tối ưu re-renders
const SidebarIsMobileViewContext = createContext<boolean>(false);
const SidebarCollapsedContext = createContext<boolean>(false);
const SidebarSetCollapsedContext = createContext<SidebarSetCollapsedContextType>(() => { });


// Custom hooks để truy cập từng phần của state
export const useSidebarCollapsed = () => useContext(SidebarCollapsedContext);
export const useSidebarSetCollapsed = () => useContext(SidebarSetCollapsedContext);
export const useSidebarIsMobileView = () => useContext(SidebarIsMobileViewContext);

// Hook tiện ích để sử dụng tất cả trạng thái
export const useSidebarState = () => {
    return {
        collapsed: useSidebarCollapsed(),
        setCollapsed: useSidebarSetCollapsed(),
        isMobileView: useSidebarIsMobileView()
    };
};


// Provider component
export const SidebarStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Xác định thiết bị
    const isMobileScreen = useMediaQuery("(max-width: 768px)");
    const isTabletScreen = useMediaQuery("(min-width: 769px) and (max-width: 1023px)");
    const isSmallScreen = isMobileScreen || isTabletScreen;
    const [isClient, setIsClient] = useState(false);

    // Trạng thái sidebar - Mặc định đóng trên tất cả thiết bị
    // Sử dụng lazy initializer để tối ưu
    // const [collapsed, setCollapsed] = useState(() => {
    //     if (typeof window !== 'undefined') {
    //         const savedState = localStorage.getItem('sidebarCollapsed');
    //         if (savedState !== null) {
    //             return savedState === 'true';
    //         }
    //     }
    //     return isSmallScreen;
    // });

    //  useEffect(() => {
    //         setIsClient(true);

    //         // Khôi phục trạng thái sidebar từ localStorage cho desktop
    //         if (!isSmallScreen) {
    //             const savedState = localStorage.getItem('sidebarCollapsed');
    //             if (savedState !== null) {
    //                 setCollapsed(savedState === 'true');
    //             } else {
    //                 // Mặc định mở trên desktop
    //                 setCollapsed(false);
    //             }
    //         }
    //     }, [isSmallScreen]);

    //     // Lưu trạng thái khi thay đổi
    //     useEffect(() => {
    //         if (isClient && !isSmallScreen) {
    //             localStorage.setItem('sidebarCollapsed', String(collapsed));
    //         }
    //     }, [collapsed, isClient, isSmallScreen]);

    //     // Memoize setCollapsed để đảm bảo không thay đổi giữa các renders
    //     const setCollapsedCallback = useMemo(() => {
    //         return (value: boolean) => setCollapsed(value);
    //     }, []);


    // Khởi tạo trạng thái ban đầu - luôn đóng cho thiết bị nhỏ
    const [collapsed, setCollapsed] = useState(true); // Mặc định đóng trên tất cả thiết bị

    // Sau khi client-side code chạy, cập nhật trạng thái dựa trên device và localStorage
    useEffect(() => {
        setIsClient(true);

        // Dành cho desktop, kiểm tra trong localStorage
        if (!isSmallScreen) {
            const savedState = localStorage.getItem('sidebarCollapsed');
            if (savedState !== null) {
                setCollapsed(savedState === 'true');
            } else {
                // Mặc định mở trên desktop nếu không có lưu trữ
                setCollapsed(false);
            }
        } else {
            // Đảm bảo luôn đóng trên thiết bị nhỏ
            setCollapsed(true);
        }
    }, [isSmallScreen]);

    // Lưu trạng thái khi thay đổi - chỉ lưu cho desktop
    useEffect(() => {
        if (isClient && !isSmallScreen) {
            localStorage.setItem('sidebarCollapsed', String(collapsed));
        }
    }, [collapsed, isClient, isSmallScreen]);

    // Memoize setCollapsed để đảm bảo không thay đổi giữa các renders
    const setCollapsedCallback = useMemo(() => {
        return (value: boolean) => {
            // Khi trên thiết bị nhỏ và cố gắng mở sidebar, kiểm tra điều kiện
            if (isSmallScreen && value === false) {
                // Cho phép mở nếu được gọi rõ ràng
                setCollapsed(false);
            } else {
                setCollapsed(value);
            }
        };
    }, [isSmallScreen]);


    return (
        <SidebarIsMobileViewContext.Provider value={isSmallScreen}>
            <SidebarCollapsedContext.Provider value={collapsed}>
                <SidebarSetCollapsedContext.Provider value={setCollapsedCallback}>
                    {children}
                </SidebarSetCollapsedContext.Provider>
            </SidebarCollapsedContext.Provider>
        </SidebarIsMobileViewContext.Provider>
    );
};
