'use client';

import React, { createContext, useContext, ReactNode, useMemo, useEffect, useState } from 'react';
import { useUser } from './useUser';
import { useRoleContext } from '../roles/roleContext';
import { UserStatusEnum } from '@/common/enum';
import { factoryService } from '@/services/factory/factory.service';
import { lineService } from '@/services/line/line.service';
import { teamService } from '@/services/team/team.service';
import { groupService } from '@/services/group/group.service';
import { departmentService } from '@/services/department/department.service';
import { useSharedData } from '@/hooks/shared/SharedDataContext';

interface RelatedData {
  roles: any[];
  factories: any[];
  lines: any[];
  teams: any[];
  groups: any[];
  departments: any[];
}

// Create user context with type definitions
export type UserContextType = ReturnType<typeof useUser> & {
  config?: UserProviderConfig;
  relatedData?: RelatedData;
  loadingStates?: {
    roles: boolean;
    factories: boolean;
    lines: boolean;
    teams: boolean;
    groups: boolean;
    departments: boolean;
  };
};

const UserContext = createContext<UserContextType | null>(null);

// Enhanced props for the provider component
export interface UserProviderConfig {
  enableAutoRefresh?: boolean;
  prefetchRelatedData?: boolean;
  cacheStrategy?: 'aggressive' | 'conservative' | 'minimal';
}

export interface UserProviderProps {
  children: ReactNode;
  config?: UserProviderConfig;
}

/**
 * Enhanced Provider component with performance optimizations and related data loading
 */
export const UserProvider: React.FC<UserProviderProps> = ({ 
  children, 
  config = {
    enableAutoRefresh: true,
    prefetchRelatedData: true,
    cacheStrategy: 'conservative'
  }
}) => {
  // Initialize the user context state
  const userState = useUser();
  
  // Get role context for related data
  const roleContext = useRoleContext();
  
  // Use shared data context
  const { sharedData, loadingStates: sharedLoadingStates } = useSharedData();
  
  // State for related data
  const [relatedData, setRelatedData] = useState<RelatedData>({
    roles: [],
    factories: [],
    lines: [],
    teams: [],
    groups: [],
    departments: [],
  });
  
  const [loadingStates, setLoadingStates] = useState({
    roles: false,
    factories: false,
    lines: false,
    teams: false,
    groups: false,
    departments: false,
  });

  // Sync departments from shared context
  useEffect(() => {
    setRelatedData(prev => ({ 
      ...prev, 
      departments: sharedData.departments 
    }));
    setLoadingStates(prev => ({ 
      ...prev, 
      departments: sharedLoadingStates.departments 
    }));
  }, [sharedData.departments, sharedLoadingStates.departments]);

  // CRITICAL FIX: Add initialization flag to prevent StrictMode duplicate calls
  const loadingRef = React.useRef({
    isLoadingFactories: false,
    isLoadingLines: false,
    isLoadingTeams: false,
    isLoadingGroups: false,
    hasInitialized: false, // Add initialization flag
  });

  // CRITICAL FIX: Stable effect with initialization check
  useEffect(() => {
    if (!config.prefetchRelatedData) {
      console.log('[UserContext] prefetchRelatedData is disabled, skipping load');
      return;
    }

    if (loadingRef.current.hasInitialized) {
      console.log('[UserContext] Already initialized, skipping duplicate initialization');
      return;
    }

    loadingRef.current.hasInitialized = true;
    console.log('[UserContext] Initializing user context data...');

    const loadRelatedData = async () => {
      try {
        console.log('[UserContext] Starting to load related data...');
        
        // Load roles (high priority) - get from existing context
        setLoadingStates(prev => ({ ...prev, roles: true }));
        const roles = roleContext.getAllRoles?.data || [];
        setRelatedData(prev => ({ ...prev, roles }));
        setLoadingStates(prev => ({ ...prev, roles: false }));
        console.log('[UserContext] Roles loaded:', roles.length);

        // Load other data with staggered timing and strict duplicate prevention
        const loadFactories = async () => {
          if (loadingRef.current.isLoadingFactories) return;
          loadingRef.current.isLoadingFactories = true;
          
          setLoadingStates(prev => ({ ...prev, factories: true }));
          try {
            const factoriesResponse = await factoryService.getList();
            const factories = factoriesResponse?.data || [];
            setRelatedData(prev => ({ ...prev, factories }));
            console.log('[UserContext] Factories loaded:', factories.length);
          } catch (error) {
            console.error('[UserContext] Failed to load factories:', error);
            setRelatedData(prev => ({ ...prev, factories: [] }));
          } finally {
            setLoadingStates(prev => ({ ...prev, factories: false }));
            loadingRef.current.isLoadingFactories = false;
          }
        };

        const loadLines = async () => {
          if (loadingRef.current.isLoadingLines) return;
          loadingRef.current.isLoadingLines = true;
          
          setLoadingStates(prev => ({ ...prev, lines: true }));
          try {
            const linesResponse = await lineService.getList();
            const lines = linesResponse?.data || [];
            setRelatedData(prev => ({ ...prev, lines }));
            console.log('[UserContext] Lines loaded:', lines.length);
          } catch (error) {
            console.error('[UserContext] Failed to load lines:', error);
            setRelatedData(prev => ({ ...prev, lines: [] }));
          } finally {
            setLoadingStates(prev => ({ ...prev, lines: false }));
            loadingRef.current.isLoadingLines = false;
          }
        };

        const loadTeams = async () => {
          if (loadingRef.current.isLoadingTeams) return;
          loadingRef.current.isLoadingTeams = true;
          
          setLoadingStates(prev => ({ ...prev, teams: true }));
          try {
            const teamsResponse = await teamService.getList();
            const teams = teamsResponse?.data || [];
            setRelatedData(prev => ({ ...prev, teams }));
            console.log('[UserContext] Teams loaded:', teams.length);
          } catch (error) {
            console.error('[UserContext] Failed to load teams:', error);
            setRelatedData(prev => ({ ...prev, teams: [] }));
          } finally {
            setLoadingStates(prev => ({ ...prev, teams: false }));
            loadingRef.current.isLoadingTeams = false;
          }
        };

        const loadGroups = async () => {
          if (loadingRef.current.isLoadingGroups) return;
          loadingRef.current.isLoadingGroups = true;
          
          setLoadingStates(prev => ({ ...prev, groups: true }));
          try {
            const groupsResponse = await groupService.getList();
            const groups = groupsResponse?.data || [];
            setRelatedData(prev => ({ ...prev, groups }));
            console.log('[UserContext] Groups loaded:', groups.length);
          } catch (error) {
            console.error('[UserContext] Failed to load groups:', error);
            setRelatedData(prev => ({ ...prev, groups: [] }));
          } finally {
            setLoadingStates(prev => ({ ...prev, groups: false }));
            loadingRef.current.isLoadingGroups = false;
          }
        };

        // Load sequentially to avoid overwhelming the server
        await loadFactories();
        await new Promise(resolve => setTimeout(resolve, 100));
        await loadLines();
        await new Promise(resolve => setTimeout(resolve, 100));
        await loadTeams();
        await new Promise(resolve => setTimeout(resolve, 100));
        await loadGroups();

      } catch (error) {
        console.error('[UserContext] Failed to load related data:', error);
      }
    };

    loadRelatedData();

    // Cleanup function
    return () => {
      console.log('[UserContext] Cleanup - marking as not initialized');
      loadingRef.current.hasInitialized = false;
    };
  }, [config.prefetchRelatedData]); // Remove unstable dependencies

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    ...userState,
    config,
    relatedData,
    loadingStates,
  }), [userState, config, relatedData, loadingStates]);

  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  );
};

/**
 * Enhanced hook to access the user context with selective subscription
 */
export const useUserContext = (): UserContextType => {
  const context = useContext(UserContext);

  if (!context) {
    throw new Error('useUserContext must be used within a UserProvider');
  }

  return context;
};

/**
 * Selective hook for components that only need specific user data
 */
export const useUserData = () => {
  const context = useUserContext();
  return useMemo(() => ({
    listUsers: context.getList,
    loading: context.loading,
    error: context.error,
    activeFilters: context.activeFilters,
  }), [context.getList, context.loading, context.error, context.activeFilters]);
};

/**
 * Selective hook for components that only need user actions
 */
export const useUserActions = () => {
  const context = useUserContext();
  return useMemo(() => ({
    handleCreate: context.handleCreate,
    handleUpdate: context.handleUpdate,
    handleDelete: context.handleDelete,
  }), [context.handleCreate, context.handleUpdate, context.handleDelete]);
};

/**
 * Enhanced user form hook with better performance
 */
export const useUserForm = () => {
  const [formData, setFormData] = React.useState(() => ({
    username: '',
    fullName: '',
    password: 'Abc@123',
    roleId: '',
    employeeId: '',
    cardId: '',
    status: UserStatusEnum.PENDING_ACTIVATION,
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
      username: '',
      fullName: '',
      password: 'Abc@123',
      roleId: '',
      employeeId: '',
      cardId: '',
      status: UserStatusEnum.PENDING_ACTIVATION,
    });
  }, []);

  // Function to load data into the form for editing
  const loadUserData = React.useCallback((user: any) => {
    if (user) {
      setFormData({
        username: user.username,
        fullName: user.fullName || '',
        password: 'Abc@123',
        roleId: user.roleId || '',
        employeeId: user.employeeId || '',
        cardId: user.cardId || '',
        status: user.status || UserStatusEnum.PENDING_ACTIVATION,
      });
    }
  }, []);

  return {
    formData,
    updateFormField,
    resetForm,
    loadUserData,
  };
};

export const useUserFormWithDefaults = () => useUserForm();
