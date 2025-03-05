"use client";

import useAuth from "@/hooks/useAuth";
import { usePathname, useRouter } from "next/navigation";
import React, { createContext, useContext, useEffect, useMemo } from "react";

type UserType = {
    username: string;
    email: string;
    isEmailVerified: boolean;
    role: string;
    position: string;
    department: string;
    fullName: string;
    createdAt: Date;
    updatedAt: Date;
    avatar?: string;
    userPreferences: {
        enable2FA: boolean;
    };
    employeeId?: string;
    cardId?: string;
    status: string;
};

type AuthContextType = {
    user?: UserType;
    error: any;
    isLoading: boolean;
    isFetching: boolean;
    refetch: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    const { user, error, isLoading, isFetching, refetch } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    // 🔥 Dùng useMemo để tránh user thay đổi tham chiếu không cần thiết
    const userStatus = useMemo(() => user?.status, [user?.status]);
    const errorMessage = useMemo(() => error?.message, [error?.message]);

    useEffect(() => {
        if (userStatus === "first_login" && pathname !== "/reset-password") {
            router.replace("/reset-password");
        } else if (errorMessage && pathname !== "/login" && pathname !== "/reset-password") {
            router.replace("/login");
        }
    }, [userStatus, errorMessage, router]);
    return (
        <AuthContext.Provider
            value={{ user, error, isLoading, isFetching, refetch }}
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