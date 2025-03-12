"use client";

import React, { createContext, useContext, ReactNode } from "react";
import { initializeRoleContext } from "./useRole";
import { TRoleSchema } from "@/schemas/role";
import { RoleType } from "@/apis/roles/role.api";

// Create role context with type definitions
type RoleContextType = ReturnType<typeof initializeRoleContext>;

const RoleContext = createContext<RoleContextType | null>(null);

// Props for the provider component
interface RoleProviderProps {
    children: ReactNode;
}

/**
 * Provider component for global role state management
 */
export const RoleProvider: React.FC<RoleProviderProps> = ({ children }) => {
    // Initialize the role context state
    const roleState = initializeRoleContext();

    return (
        <RoleContext.Provider value={roleState}>
            {children}
        </RoleContext.Provider>
    );
};

/**
 * Hook to access the role context
 * Will throw an error if used outside of a RoleProvider
 */
export const useRoleContext = (): RoleContextType => {
    const context = useContext(RoleContext);

    if (!context) {
        throw new Error('useRoleContext must be used within a RoleProvider');
    }

    return context;
};

/**
 * Create role form state hook
 * Extracted for performance - only re-renders when form data changes
 */
export const useRoleForm = () => {
    const [formData, setFormData] = React.useState<Omit<TRoleSchema, "id" | "createdAt" | "updatedAt">>({
        code: "",
        name: "",
        description: "",
        level: 0,
        isSystem: false
    });

    // Function to update form fields
    const updateFormField = React.useCallback((field: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    }, []);

    // Function to reset the form
    const resetForm = React.useCallback(() => {
        setFormData({
            code: "",
            name: "",
            description: "",
            level: 0,
            isSystem: false
        });
    }, []);

    // Function to load data into the form for editing
    const loadRoleData = React.useCallback((role: RoleType) => {
        if (role) {
            setFormData({
                code: role.code,
                name: role.name,
                description: role.description || "",
                level: role.level || 0,
                isSystem: role.isSystem || false
            });
        }
    }, []);

    return {
        formData,
        updateFormField,
        resetForm,
        loadRoleData
    };
};