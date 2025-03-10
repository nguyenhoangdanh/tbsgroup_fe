"use client";

import { UserStatusEnum } from "@/common/enum";
import { useAuthManager, AuthUser } from "@/hooks/useAuthManager";
import { usePathname, useRouter } from "next/navigation";
import React, { createContext, useContext, useEffect, useMemo } from "react";

type AuthContextType = {
    user: AuthUser | null;
    error: any;
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

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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

    // 🔥 Dùng useMemo để tránh user thay đổi tham chiếu không cần thiết
    const userStatus = useMemo(() => user?.status, [user?.status]);
    const errorMessage = useMemo(() => error?.message, [error?.message]);

    // Xử lý chuyển hướng nếu cần
    // useEffect(() => {
    //     if (needsPasswordReset && pathname !== "/reset-password") {
    //         router.replace("/reset-password");
    //     } else if (!isAuthenticated && !isLoading && pathname !== "/login" && pathname !== "/reset-password") {
    //         router.replace("/login");
    //     }
    // }, [needsPasswordReset, isAuthenticated, isLoading, router, pathname]);

    return (
        <AuthContext.Provider
            value={{
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
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuthContext = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuthContext must be used within a AuthProvider");
    }
    return context;
};