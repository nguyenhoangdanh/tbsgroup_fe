'use client';

import React, { createContext, useContext, ReactNode, useMemo, useEffect, useState } from 'react';

import { useSharedData } from '@/hooks/shared/SharedDataContext';
import { lineService } from '@/services/line/line.service';

import { useTeam } from './useTeam';

// Create team context with type definitions
export type TeamContextType = ReturnType<typeof useTeam> & {
    config?: TeamProviderConfig;
    relatedData?: {
        lines: any[];
        leaders: any[];
        users: any[];
    };
    loadingStates?: {
        lines: boolean;
        leaders: boolean;
        users: boolean;
    };
};

const TeamContext = createContext<TeamContextType | null>(null);

// Enhanced props for the provider component
export interface TeamProviderConfig {
    enableAutoRefresh?: boolean;
    prefetchRelatedData?: boolean;
    cacheStrategy?: 'aggressive' | 'conservative' | 'minimal';
}

export interface TeamProviderProps {
    children: ReactNode;
    config?: TeamProviderConfig;
}

/**
 * Enhanced Provider component with performance optimizations and related data loading
 */
export const TeamProvider: React.FC<TeamProviderProps> = ({
    children,
    config = {
        enableAutoRefresh: true,
        prefetchRelatedData: true,
        cacheStrategy: 'conservative'
    }
}) => {
    // Initialize the team context state
    const teamState = useTeam();
    
    // Use shared data context for users
    const { sharedData, loadingStates: sharedLoadingStates } = useSharedData();

    // State for other related data
    const [relatedData, setRelatedData] = useState<{
        lines: any[];
        leaders: any[];
        users: any[];
    }>({
        lines: [],
        leaders: [],
        users: [],
    });

    const [loadingStates, setLoadingStates] = useState<{
        lines: boolean;
        leaders: boolean;
        users: boolean;
    }>({
        lines: false,
        leaders: false,
        users: false,
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

    // Add ref to prevent multiple simultaneous API calls
    const loadingRef = React.useRef({
        isLoadingLines: false,
        isLoadingLeaders: false,
        isLoadingUsers: false,
    });

    // Load other related data based on configuration  
    useEffect(() => {
        if (config.prefetchRelatedData) {
            const loadRelatedData = async () => {
                try {
                    console.log('[TeamContext] Starting to load related data...');
                    console.log('[TeamContext] Using shared user data, no need to load separately');

                    // Load lines (high priority)
                    if (!loadingRef.current.isLoadingLines) {
                        loadingRef.current.isLoadingLines = true;

                        setTimeout(async () => {
                            setLoadingStates(prev => ({ ...prev, lines: true }));
                            try {
                                console.log('[TeamContext] Loading lines...');
                                const linesResponse = await lineService.getList();
                                console.log('[TeamContext] Lines API response:', linesResponse);

                                const lines = linesResponse?.data || [];
                                setRelatedData(prev => ({ ...prev, lines }));
                                console.log('[TeamContext] Lines loaded successfully:', lines.length);
                            } catch (error) {
                                console.error('[TeamContext] Failed to load lines:', error);
                                setRelatedData(prev => ({ ...prev, lines: [] }));
                            } finally {
                                setLoadingStates(prev => ({ ...prev, lines: false }));
                                loadingRef.current.isLoadingLines = false;
                            }
                        }, 100);
                    }

                } catch (error) {
                    console.error('[TeamContext] Failed to load related data:', error);
                }
            };

            console.log('[TeamContext] prefetchRelatedData is enabled, starting load...');
            loadRelatedData();
        } else {
            console.log('[TeamContext] prefetchRelatedData is disabled, skipping load');
        }
    }, [config.prefetchRelatedData]);

    // Cleanup function to reset loading refs
    useEffect(() => {
        return () => {
            loadingRef.current.isLoadingLines = false;
            loadingRef.current.isLoadingLeaders = false;
            loadingRef.current.isLoadingUsers = false;
        };
    }, []);

    // Memoize the context value to prevent unnecessary re-renders
    const contextValue = useMemo(() => ({
        ...teamState,
        config,
        relatedData,
        loadingStates,
    }), [teamState, config, relatedData, loadingStates]);

    return (
        <TeamContext.Provider value={contextValue}>
            {children}
        </TeamContext.Provider>
    );
};

/**
 * Enhanced hook to access the team context with selective subscription
 */
export const useTeamContext = (): TeamContextType => {
    const context = useContext(TeamContext);

    if (!context) {
        throw new Error('useTeamContext must be used within a TeamProvider');
    }

    return context;
};

/**
 * Selective hook for components that only need specific team data
 */
export const useTeamData = () => {
    const context = useTeamContext();
    return useMemo(() => ({
        getList: context.getList,
        loading: context.loading,
        error: context.error,
        activeFilters: context.activeFilters,
    }), [context.getList, context.loading, context.error, context.activeFilters]);
};

/**
 * Selective hook for components that only need team actions
 */
export const useTeamActions = () => {
    const context = useTeamContext();
    return useMemo(() => ({
        handleCreate: context.handleCreate,
        handleUpdate: context.handleUpdate,
        handleDelete: context.handleDelete,
    }), [context.handleCreate, context.handleUpdate, context.handleDelete]);
};

/**
 * Enhanced team form hook with better performance
 */
export const useTeamForm = () => {
    const [formData, setFormData] = React.useState(() => ({
        code: '',
        name: '',
        description: '',
        lineId: '',
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
            lineId: '',
        });
    }, []);

    // Function to load data into the form for editing
    const loadTeamData = React.useCallback((team: any) => {
        if (team) {
            setFormData({
                code: team.code || '',
                name: team.name || '',
                description: team.description || '',
                lineId: team.lineId || '',
            });
        }
    }, []);

    return {
        formData,
        updateFormField,
        resetForm,
        loadTeamData,
    };
};

export const useTeamFormWithDefaults = () => useTeamForm();

/**
 * Custom hook to access line teams data
 */
export const useLineTeams = (lineId?: string) => {
    const context = useTeamContext();
    
    // Use the existing getList with line filter
    const listQuery = context.getList({ lineId });
    
    return {
        teams: listQuery.data?.data || [],
        isLoading: listQuery.isLoading,
        error: listQuery.error,
        refetch: listQuery.refetch,
    };
};

/**
 * Custom hook to access detailed team data with options
 */
export const useTeamDetails = (teamId?: string) => {
    const context = useTeamContext();
    
    const detailQuery = context.getById(teamId);
    
    return {
        teamDetails: detailQuery.data,
        isLoading: detailQuery.isLoading,
        error: detailQuery.error,
    };
};
