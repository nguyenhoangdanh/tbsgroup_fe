'use client';

import React, { createContext, useContext, ReactNode, useMemo, useEffect, useState } from 'react';

import { useSharedData } from '@/hooks/shared/SharedDataContext';
import { factoryService } from '@/services/factory/factory.service';
import { userService } from '@/services/user/user.service';

import { useLine } from './useLine';

// Create line context with type definitions
export type LineContextType = ReturnType<typeof useLine> & {
    config?: LineProviderConfig;
    relatedData?: {
        factories: any[];
        managers: any[];
        users: any[];
    };
    loadingStates?: {
        factories: boolean;
        managers: boolean;
        users: boolean;
    };
};

const LineContext = createContext<LineContextType | null>(null);

// Enhanced props for the provider component
export interface LineProviderConfig {
    enableAutoRefresh?: boolean;
    prefetchRelatedData?: boolean;
    cacheStrategy?: 'aggressive' | 'conservative' | 'minimal';
}

export interface LineProviderProps {
    children: ReactNode;
    config?: LineProviderConfig;
}

/**
 * Enhanced Provider component with performance optimizations and related data loading
 */
export const LineProvider: React.FC<LineProviderProps> = ({
    children,
    config = {
        enableAutoRefresh: true,
        prefetchRelatedData: true,
        cacheStrategy: 'conservative'
    }
}) => {
    // Initialize the line context state
    const lineState = useLine();
    
    // Use shared data context for users
    const { sharedData, loadingStates: sharedLoadingStates } = useSharedData();

    // State for other related data
    const [relatedData, setRelatedData] = useState({
        factories: [],
        managers: [],
        users: [],
    });

    const [loadingStates, setLoadingStates] = useState({
        factories: false,
        managers: false,
        users: false,
    });

    // Add ref to prevent multiple simultaneous API calls
    const loadingRef = React.useRef({
        isLoadingFactories: false,
        isLoadingManagers: false,
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

    // Load other related data based on configuration
    useEffect(() => {
        if (config.prefetchRelatedData) {
            const loadRelatedData = async () => {
                try {
                    console.log('[LineContext] Starting to load related data...');
                    console.log('[LineContext] Using shared user data, no need to load separately');

                    // Load factories (high priority)
                    if (!loadingRef.current.isLoadingFactories) {
                        loadingRef.current.isLoadingFactories = true;

                        setTimeout(async () => {
                            setLoadingStates(prev => ({ ...prev, factories: true }));
                            try {
                                console.log('[LineContext] Loading factories...');
                                const factoriesResponse = await factoryService.getList();
                                console.log('[LineContext] Factories API response:', factoriesResponse);

                                const factories = factoriesResponse?.data || [];
                                setRelatedData(prev => ({ ...prev, factories }));
                                console.log('[LineContext] Factories loaded successfully:', factories.length);
                            } catch (error) {
                                console.error('[LineContext] Failed to load factories:', error);
                                setRelatedData(prev => ({ ...prev, factories: [] }));
                            } finally {
                                setLoadingStates(prev => ({ ...prev, factories: false }));
                                loadingRef.current.isLoadingFactories = false;
                            }
                        }, 100);
                    }

                } catch (error) {
                    console.error('[LineContext] Failed to load related data:', error);
                }
            };

            console.log('[LineContext] prefetchRelatedData is enabled, starting load...');
            loadRelatedData();
        } else {
            console.log('[LineContext] prefetchRelatedData is disabled, skipping load');
        }
    }, [config.prefetchRelatedData]);

    // Cleanup function to reset loading refs
    useEffect(() => {
        return () => {
            loadingRef.current.isLoadingFactories = false;
            loadingRef.current.isLoadingManagers = false;
            loadingRef.current.isLoadingUsers = false;
        };
    }, []);

    // Memoize the context value to prevent unnecessary re-renders
    const contextValue = useMemo(() => ({
        ...lineState,
        config,
        relatedData,
        loadingStates,
    }), [lineState, config, relatedData, loadingStates]);

    return (
        <LineContext.Provider value={contextValue}>
            {children}
        </LineContext.Provider>
    );
};

/**
 * Enhanced hook to access the line context with selective subscription
 */
export const useLineContext = (): LineContextType => {
    const context = useContext(LineContext);

    if (!context) {
        throw new Error('useLineContext must be used within a LineProvider');
    }

    return context;
};

/**
 * Selective hook for components that only need specific line data
 */
export const useLineData = () => {
    const context = useLineContext();
    return useMemo(() => ({
        getList: context.getList,
        loading: context.loading,
        error: context.error,
        activeFilters: context.activeFilters,
    }), [context.getList, context.loading, context.error, context.activeFilters]);
};

/**
 * Selective hook for components that only need line actions
 */
export const useLineActions = () => {
    const context = useLineContext();
    return useMemo(() => ({
        handleCreate: context.handleCreate,
        handleUpdate: context.handleUpdate,
        handleDelete: context.handleDelete,
    }), [context.handleCreate, context.handleUpdate, context.handleDelete]);
};

/**
 * Enhanced line form hook with better performance
 */
export const useLineForm = () => {
    const [formData, setFormData] = React.useState(() => ({
        code: '',
        name: '',
        description: '',
        factoryId: '',
        capacity: 0,
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
            factoryId: '',
            capacity: 0,
        });
    }, []);

    // Function to load data into the form for editing
    const loadLineData = React.useCallback((line: any) => {
        if (line) {
            setFormData({
                code: line.code || '',
                name: line.name || '',
                description: line.description || '',
                factoryId: line.factoryId || '',
                capacity: line.capacity || 0,
            });
        }
    }, []);

    return {
        formData,
        updateFormField,
        resetForm,
        loadLineData,
    };
};

export const useLineFormWithDefaults = () => useLineForm();

/**
 * Custom hook to access factory lines data
 */
export const useFactoryLines = (factoryId?: string) => {
    const context = useLineContext();
    
    // Use the existing getList with factory filter
    const listQuery = context.getList({ factoryId });
    
    return {
        lines: listQuery.data?.data || [],
        isLoading: listQuery.isLoading,
        error: listQuery.error,
        refetch: listQuery.refetch,
    };
};

/**
 * Custom hook to access detailed line data with options
 */
export const useLineDetails = (lineId?: string) => {
    const context = useLineContext();
    
    const detailQuery = context.getById(lineId);
    
    return {
        lineDetails: detailQuery.data,
        isLoading: detailQuery.isLoading,
        error: detailQuery.error,
    };
};
