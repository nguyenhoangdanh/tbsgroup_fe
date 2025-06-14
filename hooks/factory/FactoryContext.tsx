'use client';

import React, { createContext, useContext, ReactNode, useMemo, useEffect, useState } from 'react';
import { useFactory } from './useFactory';
import { useDepartmentContext } from '@/hooks/department/DepartmentContext';
import { userService } from '@/services/user/user.service';
import { useSharedData } from '@/hooks/shared/SharedDataContext';

// Create factory context with type definitions
export type FactoryContextType = ReturnType<typeof useFactory> & {
    config?: FactoryProviderConfig;
    relatedData?: {
        departments: any[];
        users: any[];
    };
    loadingStates?: {
        departments: boolean;
        users: boolean;
    };
};

const FactoryContext = createContext<FactoryContextType | null>(null);

// Enhanced props for the provider component
export interface FactoryProviderConfig {
    enableAutoRefresh?: boolean;
    prefetchRelatedData?: boolean;
    cacheStrategy?: 'aggressive' | 'conservative' | 'minimal';
}

export interface FactoryProviderProps {
    children: ReactNode;
    config?: FactoryProviderConfig;
}

/**
 * Enhanced Provider component with performance optimizations and related data loading
 */
export const FactoryProvider: React.FC<FactoryProviderProps> = ({
    children,
    config = {
        enableAutoRefresh: true,
        prefetchRelatedData: true,
        cacheStrategy: 'conservative'
    }
}) => {
    // Initialize the factory context state
    const factoryState = useFactory();

    // Use department context for related departments
    const departmentContext = useDepartmentContext();
    
    // Use shared data context for users
    const { sharedData, loadingStates: sharedLoadingStates } = useSharedData();

    // State for other related data
    const [relatedData, setRelatedData] = useState({
        departments: [],
        users: [],
    });

    const [loadingStates, setLoadingStates] = useState({
        departments: false,
        users: false,
    });

    // Add ref to prevent multiple simultaneous API calls
    const loadingRef = React.useRef({
        isLoadingDepartments: false,
        isLoadingUsers: false,
    });

    // Sync users from shared context
    useEffect(() => {
        setRelatedData(prev => ({
            ...prev,
            users: sharedData.users
        }));
        setLoadingStates(prev => ({
            ...prev,
            users: sharedLoadingStates.users
        }));
    }, [sharedData.users, sharedLoadingStates.users]);

    // Sync department data from context
    useEffect(() => {
        if (departmentContext.relatedData) {
            const allDepartments = [
                ...(departmentContext.relatedData.headOffices || []),
                ...(departmentContext.relatedData.factoryOffices || [])
            ];

            // Transform departments to match expected format
            const transformedDepartments = allDepartments.map(dept => ({
                id: dept.id,
                name: dept.name,
                type: dept.departmentType, // Map departmentType to type for FactoryForm
            }));

            setRelatedData(prev => ({
                ...prev,
                departments: transformedDepartments
            }));

            setLoadingStates(prev => ({
                ...prev,
                departments: departmentContext.loadingStates?.headOffices || departmentContext.loadingStates?.factoryOffices || false
            }));
        }
    }, [departmentContext]);

    // Load other related data based on configuration
    useEffect(() => {
        if (config.prefetchRelatedData) {
            const loadRelatedData = async () => {
                try {
                    console.log('[FactoryContext] Starting to load related data...');
                    console.log('[FactoryContext] Using shared user data, no need to load separately');

                    // Load departments from context
                    if (departmentContext?.relatedData) {
                        const allDepartments = [
                            ...(departmentContext.relatedData.headOffices || []),
                            ...(departmentContext.relatedData.factoryOffices || [])
                        ];

                        const transformedDepartments = allDepartments.map(dept => ({
                            id: dept.id,
                            name: dept.name,
                            type: dept.departmentType,
                        }));

                        setRelatedData(prev => ({
                            ...prev,
                            departments: transformedDepartments
                        }));
                    }

                } catch (error) {
                    console.error('[FactoryContext] Failed to load related data:', error);
                }
            };

            console.log('[FactoryContext] prefetchRelatedData is enabled, starting load...');
            loadRelatedData();
        } else {
            console.log('[FactoryContext] prefetchRelatedData is disabled, skipping load');
        }
    }, [config.prefetchRelatedData, departmentContext?.relatedData]);

    // Cleanup function to reset loading refs
    useEffect(() => {
        return () => {
            loadingRef.current.isLoadingDepartments = false;
            loadingRef.current.isLoadingUsers = false;
        };
    }, []);

    // Memoize the context value to prevent unnecessary re-renders
    const contextValue = useMemo(() => ({
        ...factoryState,
        config,
        relatedData,
        loadingStates,
    }), [factoryState, config, relatedData, loadingStates]);

    return (
        <FactoryContext.Provider value={contextValue}>
            {children}
        </FactoryContext.Provider>
    );
};

/**
 * Enhanced hook to access the factory context with selective subscription
 */
export const useFactoryContext = (): FactoryContextType => {
    const context = useContext(FactoryContext);

    if (!context) {
        throw new Error('useFactoryContext must be used within a FactoryProvider');
    }

    return context;
};

/**
 * Selective hook for components that only need specific factory data
 */
export const useFactoryData = () => {
    const context = useFactoryContext();
    return useMemo(() => ({
        getList: context.getList, // Use the correct method name from useFactory
        loading: context.loading,
        error: context.error,
        activeFilters: context.activeFilters,
    }), [context.getList, context.loading, context.error, context.activeFilters]);
};

/**
 * Selective hook for components that only need factory actions
 */
export const useFactoryActions = () => {
    const context = useFactoryContext();
    return useMemo(() => ({
        handleCreate: context.handleCreate,
        handleUpdate: context.handleUpdate,
        handleDelete: context.handleDelete,
    }), [context.handleCreate, context.handleUpdate, context.handleDelete]);
};

/**
 * Enhanced factory form hook with better performance
 */
export const useFactoryForm = () => {
    const [formData, setFormData] = React.useState(() => ({
        code: '',
        name: '',
        description: '',
        address: '',
        phone: '',
        departmentId: '',
        managingDepartmentId: '',
    }));

    // Optimized update function that prevents unnecessary re-renders
    const updateFormField = React.useCallback((field: string, value: any) => {
        setFormData(prev => {
            // Skip update if value hasn't changed
            if (prev[field as keyof typeof prev] === value) return prev;
            return { ...prev, [field]: value };
        });
    }, []);

    // Function to reset the form
    const resetForm = React.useCallback(() => {
        setFormData({
            code: '',
            name: '',
            description: '',
            address: '',
            phone: '',
            departmentId: '',
            managingDepartmentId: '',
        });
    }, []);

    // Function to load data into the form for editing
    const loadFactoryData = React.useCallback((factory: any) => {
        if (factory) {
            setFormData({
                code: factory.code || '',
                name: factory.name || '',
                description: factory.description || '',
                address: factory.address || '',
                phone: factory.phone || '',
                departmentId: factory.departmentId || '',
                managingDepartmentId: factory.managingDepartmentId || '',
            });
        }
    }, []);

    return {
        formData,
        updateFormField,
        resetForm,
        loadFactoryData,
    };
};

export const useFactoryFormWithDefaults = () => useFactoryForm();
