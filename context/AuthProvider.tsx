"use client";

import useAuth from "@/hooks/useAuth";
import React, { createContext, useContext } from "react";

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

    React.useEffect(() => {
        if (user && user.status === "first_login" && window.location.pathname !== "/reset-password") {
            window.location.href = "/reset-password";
        }
    }, [user]);

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
}; ``