'use client';

import React, { createContext, useContext, ReactNode, useMemo, useEffect, useState } from 'react';

import { teamService } from '@/services/team/team.service';
import { userService } from '@/services/user/user.service';

import { useGroup } from './useGroup';

// Create group context with type definitions
export type GroupContextType = ReturnType<typeof useGroup> & {
    config?: GroupProviderConfig;
    relatedData?: {
        teams: any[];
        leaders: any[];
        users: any[];
    };
    loadingStates?: {
        teams: boolean;
        leaders: boolean;
        users: boolean;
    };
};

const GroupContext = createContext<GroupContextType | null>(null);

// Enhanced props for the provider component
export interface GroupProviderConfig {
    enableAutoRefresh?: boolean;
    prefetchRelatedData?: boolean;
    cacheStrategy?: 'aggressive' | 'conservative' | 'minimal';
}

export interface GroupProviderProps {
    children: ReactNode;
    config?: GroupProviderConfig;
}

/**
 * Enhanced Provider component with performance optimizations and related data loading
 */
export const GroupProvider: React.FC<GroupProviderProps> = ({
    children,
    config = {
        enableAutoRefresh: true,
        prefetchRelatedData: true,
        cacheStrategy: 'conservative'
    }
}) => {
    // Initialize the group context state
    const groupState = useGroup();

    // State for other related data
    const [relatedData, setRelatedData] = useState({
        teams: [],
        leaders: [],
        users: [],
    });

    const [loadingStates, setLoadingStates] = useState({
        teams: false,
        leaders: false,
        users: false,
    });

    // Add ref to prevent multiple simultaneous API calls
    const loadingRef = React.useRef({
        isLoadingTeams: false,
        isLoadingLeaders: false,
        isLoadingUsers: false,
    });

    // Load other related data based on configuration
    useEffect(() => {
        if (config.prefetchRelatedData) {
            const loadRelatedData = async () => {
                try {
                    console.log('[GroupContext] Starting to load related data...');

                    // Load teams (high priority)
                    if (!loadingRef.current.isLoadingTeams) {
                        loadingRef.current.isLoadingTeams = true;

                        setTimeout(async () => {
                            setLoadingStates(prev => ({ ...prev, teams: true }));
                            try {
                                console.log('[GroupContext] Loading teams...');
                                const teamsResponse = await teamService.getList();
                                console.log('[GroupContext] Teams API response:', teamsResponse);

                                const teams = teamsResponse?.data || [];
                                setRelatedData(prev => ({ ...prev, teams }));
                                console.log('[GroupContext] Teams loaded successfully:', teams.length);
                            } catch (error) {
                                console.error('[GroupContext] Failed to load teams:', error);
                                setRelatedData(prev => ({ ...prev, teams: [] }));
                            } finally {
                                setLoadingStates(prev => ({ ...prev, teams: false }));
                                loadingRef.current.isLoadingTeams = false;
                            }
                        }, 100);
                    }

                    // Load users (medium priority)
                    if (!loadingRef.current.isLoadingUsers) {
                        loadingRef.current.isLoadingUsers = true;

                        setTimeout(async () => {
                            setLoadingStates(prev => ({ ...prev, users: true }));
                            try {
                                console.log('[GroupContext] Loading users...');
                                const usersResponse = await userService.getList();
                                console.log('[GroupContext] Users API response:', usersResponse);

                                const users = usersResponse?.data || [];
                                setRelatedData(prev => ({ ...prev, users }));
                                console.log('[GroupContext] Users loaded successfully:', users.length);
                            } catch (error) {
                                console.error('[GroupContext] Failed to load users:', error);
                                setRelatedData(prev => ({ ...prev, users: [] }));
                            } finally {
                                setLoadingStates(prev => ({ ...prev, users: false }));
                                loadingRef.current.isLoadingUsers = false;
                            }
                        }, 200);
                    }

                } catch (error) {
                    console.error('[GroupContext] Failed to load related data:', error);
                }
            };

            console.log('[GroupContext] prefetchRelatedData is enabled, starting load...');
            loadRelatedData();
        } else {
            console.log('[GroupContext] prefetchRelatedData is disabled, skipping load');
        }
    }, [config.prefetchRelatedData]);

    // Cleanup function to reset loading refs
    useEffect(() => {
        return () => {
            loadingRef.current.isLoadingTeams = false;
            loadingRef.current.isLoadingLeaders = false;
            loadingRef.current.isLoadingUsers = false;
        };
    }, []);

    // Memoize the context value to prevent unnecessary re-renders
    const contextValue = useMemo(() => ({
        ...groupState,
        config,
        relatedData,
        loadingStates,
    }), [groupState, config, relatedData, loadingStates]);

    return (
        <GroupContext.Provider value={contextValue}>
            {children}
        </GroupContext.Provider>
    );
};

/**
 * Enhanced hook to access the group context with selective subscription
 */
export const useGroupContext = (): GroupContextType => {
    const context = useContext(GroupContext);

    if (!context) {
        throw new Error('useGroupContext must be used within a GroupProvider');
    }

    return context;
};

/**
 * Selective hook for components that only need specific group data
 */
export const useGroupData = () => {
    const context = useGroupContext();
    return useMemo(() => ({
        getList: context.getList,
        loading: context.loading,
        error: context.error,
        activeFilters: context.activeFilters,
    }), [context.getList, context.loading, context.error, context.activeFilters]);
};

/**
 * Selective hook for components that only need group actions
 */
export const useGroupActions = () => {
    const context = useGroupContext();
    return useMemo(() => ({
        handleCreate: context.handleCreate,
        handleUpdate: context.handleUpdate,
        handleDelete: context.handleDelete,
    }), [context.handleCreate, context.handleUpdate, context.handleDelete]);
};

/**
 * Enhanced group form hook with better performance
 */
export const useGroupForm = () => {
    const [formData, setFormData] = React.useState(() => ({
        code: '',
        name: '',
        description: '',
        teamId: '',
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
            teamId: '',
        });
    }, []);

    // Function to load data into the form for editing
    const loadGroupData = React.useCallback((group: any) => {
        if (group) {
            setFormData({
                code: group.code || '',
                name: group.name || '',
                description: group.description || '',
                teamId: group.teamId || '',
            });
        }
    }, []);

    return {
        formData,
        updateFormField,
        resetForm,
        loadGroupData,
    };
};

export const useGroupFormWithDefaults = () => useGroupForm();

/**
 * Custom hook to access team groups data
 */
export const useTeamGroups = (teamId?: string) => {
    const context = useGroupContext();
    
    // Use the existing getList with team filter
    const listQuery = context.getList({ teamId });
    
    return {
        groups: listQuery.data?.data || [],
        isLoading: listQuery.isLoading,
        error: listQuery.error,
        refetch: listQuery.refetch,
    };
};

/**
 * Custom hook to access detailed group data with options
 */
export const useGroupDetails = (groupId?: string) => {
    const context = useGroupContext();
    
    const detailQuery = context.getById(groupId);
    
    return {
        groupDetails: detailQuery.data,
        isLoading: detailQuery.isLoading,
        error: detailQuery.error,
    };
};
