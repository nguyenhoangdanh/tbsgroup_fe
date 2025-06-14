'use client';

import React, { createContext, useContext, ReactNode, useMemo, useEffect, useState, useRef } from 'react';
import { userService } from '@/services/user/user.service';
import { departmentService } from '@/services/department/department.service';

interface SharedData {
  users: any[];
  departments: any[];
}

interface SharedDataContextType {
  sharedData: SharedData;
  loadingStates: {
    users: boolean;
    departments: boolean;
  };
  refreshUsers: () => Promise<void>;
  refreshDepartments: () => Promise<void>;
}

const SharedDataContext = createContext<SharedDataContextType | null>(null);

export interface SharedDataProviderProps {
  children: ReactNode;
}

export const SharedDataProvider: React.FC<SharedDataProviderProps> = ({ children }) => {
  const [sharedData, setSharedData] = useState<SharedData>({
    users: [],
    departments: [],
  });

  const [loadingStates, setLoadingStates] = useState({
    users: false,
    departments: false,
  });

  // CRITICAL FIX: Prevent multiple simultaneous requests with flag-based approach
  const loadingRef = useRef({
    isLoadingUsers: false,
    isLoadingDepartments: false,
    hasInitialized: false, // Add initialization flag
  });

  // Cache timestamps to prevent frequent refetches
  const cacheRef = useRef({
    usersLastFetch: 0,
    departmentsLastFetch: 0,
  });

  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  const loadUsers = async (force = false) => {
    // CRITICAL FIX: Strict check to prevent duplicate calls
    if (loadingRef.current.isLoadingUsers) {
      return;
    }
    
    const now = Date.now();
    if (!force && now - cacheRef.current.usersLastFetch < CACHE_DURATION) {
      return;
    }

    loadingRef.current.isLoadingUsers = true;
    setLoadingStates(prev => ({ ...prev, users: true }));

    try {
      const usersResponse = await userService.getList();
      const users = usersResponse?.data || [];
      
      setSharedData(prev => ({ ...prev, users }));
    } catch (error) {
      setSharedData(prev => ({ ...prev, users: [] }));
    } finally {
      setLoadingStates(prev => ({ ...prev, users: false }));
      loadingRef.current.isLoadingUsers = false;
    }
  };

  const loadDepartments = async (force = false) => {
    // CRITICAL FIX: Strict check to prevent duplicate calls
    if (loadingRef.current.isLoadingDepartments) {
      return;
    }
    
    const now = Date.now();
    if (!force && now - cacheRef.current.departmentsLastFetch < CACHE_DURATION) {
      return;
    }

    loadingRef.current.isLoadingDepartments = true;
    setLoadingStates(prev => ({ ...prev, departments: true }));

    try {
      const departmentsResponse = await departmentService.getList();
      const departments = departmentsResponse?.data || [];
      
      setSharedData(prev => ({ ...prev, departments }));
      cacheRef.current.departmentsLastFetch = now;
    } catch (error) {
      console.error('[SharedDataContext] Failed to load departments:', error);
      setSharedData(prev => ({ ...prev, departments: [] }));
    } finally {
      setLoadingStates(prev => ({ ...prev, departments: false }));
      loadingRef.current.isLoadingDepartments = false;
    }
  };

  // CRITICAL FIX: Use initialization flag to prevent StrictMode double execution
  useEffect(() => {
    if (loadingRef.current.hasInitialized) {
      return;
    }

    loadingRef.current.hasInitialized = true;
    
    // Load data with slight delay to avoid race conditions
    const initializeData = async () => {
      await Promise.all([
        loadUsers(),
        loadDepartments(),
      ]);
    };

    initializeData();

    // Cleanup function
    return () => {
      loadingRef.current.hasInitialized = false;
    };
  }, []); // Empty dependency array

  // Public refresh functions
  const refreshUsers = async () => {
    return loadUsers(true);
  };
  
  const refreshDepartments = async () => {
    return loadDepartments(true);
  };

  const contextValue = useMemo(() => ({
    sharedData,
    loadingStates,
    refreshUsers,
    refreshDepartments,
  }), [sharedData, loadingStates]);

  return (
    <SharedDataContext.Provider value={contextValue}>
      {children}
    </SharedDataContext.Provider>
  );
};

export const useSharedData = (): SharedDataContextType => {
  const context = useContext(SharedDataContext);
  if (!context) {
    throw new Error('useSharedData must be used within a SharedDataProvider');
  }
  return context;
};
