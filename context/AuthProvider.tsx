"use client";

import { toast } from "@/hooks/use-toast";
import { useAuthManager, AuthUser } from "@/hooks/useAuthManager";
import { usePathname, useRouter } from "next/navigation";
import React, { createContext, useContext, useEffect, useMemo } from "react";

type AuthError = {
    message: string;
    code?: string;
}

type AuthContextType = {
    user: AuthUser | null;
    error: AuthError | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    needsPasswordReset: boolean;
    login: (credentials: { username: string; password: string }, opts?: { message?: string }) => void;
    logout: () => void;
    resetPassword: (params: {
        resetToken?: string;
        username?: string;
        password: string;
        confirmPassword: string;
    }) => void;
    requestPasswordReset: (params: {
        employeeId: string;
        cardId: string;
    }) => void;
    refetchUser: () => Promise<any>;
};

// Thêm context để quản lý phiên bảo mật
type SecurityContext = {
    lastActivity: number;
    updateActivity: () => void;
    securityLevel: 'high' | 'medium' | 'low';
    setSecurityLevel: (level: 'high' | 'medium' | 'low') => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const SecurityContext = createContext<SecurityContext | undefined>(undefined);

// Thời gian tối đa không hoạt động trước khi tự động đăng xuất (ms)
const SESSION_TIMEOUTS = {
    high: 15 * 60 * 1000, // 15 phút
    medium: 30 * 60 * 1000, // 30 phút
    low: 60 * 60 * 1000 // 60 phút
};

// SecurityProvider quản lý các vấn đề bảo mật chung
export const SecurityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [lastActivity, setLastActivity] = React.useState<number>(Date.now());
    const [securityLevel, setSecurityLevel] = React.useState<'high' | 'medium' | 'low'>('medium');

    const updateActivity = () => {
        setLastActivity(Date.now());
    };

    useEffect(() => {
        // Cập nhật hoạt động mỗi khi người dùng tương tác
        const events = ['mousemove', 'keydown', 'click', 'touchstart', 'scroll'];

        const handleActivity = () => {
            updateActivity();
        };

        events.forEach(event => {
            window.addEventListener(event, handleActivity);
        });

        return () => {
            events.forEach(event => {
                window.removeEventListener(event, handleActivity);
            });
        };
    }, []);

    const contextValue = useMemo(() => ({
        lastActivity,
        updateActivity,
        securityLevel,
        setSecurityLevel
    }), [lastActivity, securityLevel]);

    return (
        <SecurityContext.Provider value={contextValue}>
            {children}
        </SecurityContext.Provider>
    );
};

// Hook để sử dụng context bảo mật
export const useSecurityContext = () => {
    const context = useContext(SecurityContext);
    if (!context) {
        throw new Error("useSecurityContext must be used within a SecurityProvider");
    }
    return context;
};


export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    const {
        user,
        error,
        isLoading,
        isAuthenticated,
        needsPasswordReset,
        login,
        logout,
        resetPassword,
        requestPasswordReset,
        refetchUser
    } = useAuthManager();

    const router = useRouter();
    const pathname = usePathname();

    // Sử dụng context bảo mật
    const { lastActivity, securityLevel } = useSecurityContext();

    // Tự động đăng xuất khi phiên hết hạn
    useEffect(() => {
        if (!isAuthenticated) return;

        const sessionTimeout = SESSION_TIMEOUTS[securityLevel];

        const checkSessionTimeout = setInterval(() => {
            const now = Date.now();
            if (now - lastActivity > sessionTimeout) {
                logout();
                // Hiển thị thông báo phiên đã hết hạn
                toast({
                    title: "Phiên đã hết hạn",
                    description: "Vui lòng đăng nhập lại để tiếp tục",
                    variant: "destructive",
                    duration: 4000
                })
            }
        }, 60000); // Kiểm tra mỗi phút

        return () => clearInterval(checkSessionTimeout);
    }, [lastActivity, securityLevel, isAuthenticated, logout]);

    // Memoize the entire auth context value to prevent unnecessary renders
    const authContextValue = useMemo(() => ({
        user,
        error,
        isLoading,
        isAuthenticated,
        needsPasswordReset,
        login,
        logout,
        resetPassword,
        requestPasswordReset,
        refetchUser
    }), [user, error, isLoading, isAuthenticated, needsPasswordReset, login, logout, resetPassword, requestPasswordReset, refetchUser]);

    // Uncomment and modify the navigation guard for better user experience
    useEffect(() => {
        // Các routes được phép truy cập khi chưa đăng nhập
        const publicRoutes = ['/login', '/reset-password', '/forgot-password', '/'];

        if (needsPasswordReset && pathname !== "/reset-password") {
            router.replace("/reset-password");
        } else if (!isAuthenticated && !isLoading && !publicRoutes.includes(pathname)
            && pathname !== "/" // Add this condition to prevent redirects from root path
        ) {
            // Thêm độ trễ nhỏ để tránh nhấp nháy khi điều hướng
            const timer = setTimeout(() => {
                router.replace("/login");
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [needsPasswordReset, isAuthenticated, isLoading, router, pathname]);



    return (
        <AuthContext.Provider value={authContextValue}>
            {children}
        </AuthContext.Provider>
    );
};

// Kết hợp cả hai providers
export const AuthSecurityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <SecurityProvider>
            <AuthProvider>
                {children}
            </AuthProvider>
        </SecurityProvider>
    );
};

export const useAuthContext = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuthContext must be used within a AuthProvider");
    }
    return context;
};