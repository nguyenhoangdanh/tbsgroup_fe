'use client';

import React, { createContext, useContext, ReactNode, useMemo, useEffect, useState, useRef, useCallback } from 'react';

import { DepartmentTreeNode } from '@/common/interface/department';
import { departmentService } from '@/services/department/department.service';

import { useDepartment } from './useDepartment';

// Create department context with type definitions
export type DepartmentContextType = ReturnType<typeof useDepartment> & {
  config?: DepartmentProviderConfig;
  relatedData?: {
    organizationTree: DepartmentTreeNode[];
    rootDepartments: any[];
    headOffices: any[];
    factoryOffices: any[];
  };
  loadingStates?: {
    organizationTree: boolean;
    rootDepartments: boolean;
    headOffices: boolean;
    factoryOffices: boolean;
  };
  // Add refresh methods
  refreshOrganizationTree: () => Promise<void>;
  refreshAllData: () => Promise<void>;
};

const DepartmentContext = createContext<DepartmentContextType | null>(null);

// Enhanced props for the provider component
export interface DepartmentProviderConfig {
  enableAutoRefresh?: boolean;
  prefetchRelatedData?: boolean;
  cacheStrategy?: 'aggressive' | 'conservative' | 'minimal';
}

export interface DepartmentProviderProps {
  children: ReactNode;
  config?: DepartmentProviderConfig;
}

// Global cache and request tracking to prevent duplicate calls across components
const globalCache = {
  organizationTree: null as DepartmentTreeNode[] | null,
  rootDepartments: null as any[] | null,
  headOffices: null as any[] | null,
  factoryOffices: null as any[] | null,
  lastFetch: {
    organizationTree: 0,
    rootDepartments: 0,
    headOffices: 0,
    factoryOffices: 0,
  }
};

const activeRequests = {
  organizationTree: null as Promise<DepartmentTreeNode[]> | null,
  rootDepartments: null as Promise<any[]> | null,
  headOffices: null as Promise<any[]> | null,
  factoryOffices: null as Promise<any[]> | null,
};

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Enhanced Provider component with performance optimizations and related data loading
 */
export const DepartmentProvider: React.FC<DepartmentProviderProps> = ({ 
  children, 
  config = {
    enableAutoRefresh: true,
    prefetchRelatedData: true,
    cacheStrategy: 'conservative'
  }
}) => {
  // Initialize the department context state
  const departmentState = useDepartment();
  
  // State for related data
  const [relatedData, setRelatedData] = useState({
    organizationTree: globalCache.organizationTree || [],
    rootDepartments: globalCache.rootDepartments || [],
    headOffices: globalCache.headOffices || [],
    factoryOffices: globalCache.factoryOffices || [],
  });
  
  const [loadingStates, setLoadingStates] = useState({
    organizationTree: false,
    rootDepartments: false,
    headOffices: false,
    factoryOffices: false,
  });

  const mountedRef = useRef(true);

  // Helper function to check if cache is valid
  const isCacheValid = (dataType: keyof typeof globalCache.lastFetch) => {
    const cacheTime = globalCache.lastFetch[dataType];
    return Date.now() - cacheTime < CACHE_DURATION;
  };

  // Deduplicated fetch organization tree
  const fetchOrganizationTree = async (): Promise<DepartmentTreeNode[]> => {
    // Return cached data if valid
    if (globalCache.organizationTree && isCacheValid('organizationTree')) {
      return globalCache.organizationTree;
    }

    // Return existing request if in progress
    if (activeRequests.organizationTree) {
      return activeRequests.organizationTree;
    }

    // Create new request
    const request = departmentService.getOrganizationTree();
    activeRequests.organizationTree = request;

    try {
      const data = await request;
      globalCache.organizationTree = data;
      globalCache.lastFetch.organizationTree = Date.now();
      return data;
    } catch (error) {
      console.error('[DepartmentContext] Failed to fetch organization tree:', error);
      return [];
    } finally {
      activeRequests.organizationTree = null;
    }
  };

  // Deduplicated fetch root departments
  const fetchRootDepartments = async (): Promise<any[]> => {
    if (globalCache.rootDepartments && isCacheValid('rootDepartments')) {
      return globalCache.rootDepartments;
    }

    if (activeRequests.rootDepartments) {
      return activeRequests.rootDepartments;
    }

    const request = departmentService.getRootDepartments();
    activeRequests.rootDepartments = request;

    try {
      const data = await request;
      globalCache.rootDepartments = data;
      globalCache.lastFetch.rootDepartments = Date.now();
      return data;
    } catch (error) {
      console.error('[DepartmentContext] Failed to fetch root departments:', error);
      return [];
    } finally {
      activeRequests.rootDepartments = null;
    }
  };

  // Deduplicated fetch head offices
  const fetchHeadOffices = async (): Promise<any[]> => {
    if (globalCache.headOffices && isCacheValid('headOffices')) {
      return globalCache.headOffices;
    }

    if (activeRequests.headOffices) {
      return activeRequests.headOffices;
    }

    const request = (async () => {
      const response = await departmentService.getList({ departmentType: 'HEAD_OFFICE' });
      return response?.data || [];
    })();
    activeRequests.headOffices = request;

    try {
      const data = await request;
      globalCache.headOffices = data;
      globalCache.lastFetch.headOffices = Date.now();
      return data;
    } catch (error) {
      console.error('[DepartmentContext] Failed to fetch head offices:', error);
      return [];
    } finally {
      activeRequests.headOffices = null;
    }
  };

  // Deduplicated fetch factory offices
  const fetchFactoryOffices = async (): Promise<any[]> => {
    if (globalCache.factoryOffices && isCacheValid('factoryOffices')) {
      return globalCache.factoryOffices;
    }

    if (activeRequests.factoryOffices) {
      return activeRequests.factoryOffices;
    }

    const request = (async () => {
      const response = await departmentService.getList({ departmentType: 'FACTORY_OFFICE' });
      return response?.data || [];
    })();
    activeRequests.factoryOffices = request;

    try {
      const data = await request;
      globalCache.factoryOffices = data;
      globalCache.lastFetch.factoryOffices = Date.now();
      return data;
    } catch (error) {
      console.error('[DepartmentContext] Failed to fetch factory offices:', error);
      return [];
    } finally {
      activeRequests.factoryOffices = null;
    }
  };

  // Refresh organization tree manually
  const refreshOrganizationTree = useCallback(async () => {
    if (!mountedRef.current) return;
    
    setLoadingStates(prev => ({ ...prev, organizationTree: true }));
    try {
      // Clear cache to force refresh
      globalCache.organizationTree = null;
      globalCache.lastFetch.organizationTree = 0;
      
      const data = await fetchOrganizationTree();
      if (mountedRef.current) {
        setRelatedData(prev => ({ ...prev, organizationTree: data }));
      }
    } finally {
      if (mountedRef.current) {
        setLoadingStates(prev => ({ ...prev, organizationTree: false }));
      }
    }
  }, []);

  // Refresh all data manually
  const refreshAllData = useCallback(async () => {
    if (!mountedRef.current) return;

    // Clear all caches properly
    globalCache.organizationTree = null;
    globalCache.rootDepartments = null;
    globalCache.headOffices = null;
    globalCache.factoryOffices = null;
    globalCache.lastFetch = {
      organizationTree: 0,
      rootDepartments: 0,
      headOffices: 0,
      factoryOffices: 0,
    };

    setLoadingStates({
      organizationTree: true,
      rootDepartments: true,
      headOffices: true,
      factoryOffices: true,
    });

    try {
      const [organizationTree, rootDepartments, headOffices, factoryOffices] = await Promise.all([
        fetchOrganizationTree(),
        fetchRootDepartments(),
        fetchHeadOffices(),
        fetchFactoryOffices(),
      ]);

      if (mountedRef.current) {
        setRelatedData({
          organizationTree,
          rootDepartments,
          headOffices,
          factoryOffices,
        });
      }
    } finally {
      if (mountedRef.current) {
        setLoadingStates({
          organizationTree: false,
          rootDepartments: false,
          headOffices: false,
          factoryOffices: false,
        });
      }
    }
  }, []);

  // Load related data based on configuration
  useEffect(() => {
    if (!config.prefetchRelatedData || !mountedRef.current) {
      return;
    }

    const loadRelatedData = async () => {
      
      // Load root departments first (high priority for forms)
      setLoadingStates(prev => ({ ...prev, rootDepartments: true }));
      try {
        const rootDepartments = await fetchRootDepartments();
        if (mountedRef.current) {
          setRelatedData(prev => ({ ...prev, rootDepartments }));
        }
      } finally {
        if (mountedRef.current) {
          setLoadingStates(prev => ({ ...prev, rootDepartments: false }));
        }
      }

      // Load organization tree (medium priority)
      setLoadingStates(prev => ({ ...prev, organizationTree: true }));
      try {
        const organizationTree = await fetchOrganizationTree();
        if (mountedRef.current) {
          setRelatedData(prev => ({ ...prev, organizationTree }));
        }
      } finally {
        if (mountedRef.current) {
          setLoadingStates(prev => ({ ...prev, organizationTree: false }));
        }
      }

      // Load other data in parallel with delays based on priority
      const loadOtherData = async () => {
        await Promise.all([
          // Head offices (medium priority)
          (async () => {
            if (!mountedRef.current) return;
            setLoadingStates(prev => ({ ...prev, headOffices: true }));
            try {
              const headOffices = await fetchHeadOffices();
              if (mountedRef.current) {
                setRelatedData(prev => ({ ...prev, headOffices }));
              }
            } finally {
              if (mountedRef.current) {
                setLoadingStates(prev => ({ ...prev, headOffices: false }));
              }
            }
          })(),
          
          // Factory offices (low priority)
          (async () => {
            if (!mountedRef.current) return;
            setLoadingStates(prev => ({ ...prev, factoryOffices: true }));
            try {
              const factoryOffices = await fetchFactoryOffices();
              if (mountedRef.current) {
                setRelatedData(prev => ({ ...prev, factoryOffices }));
              }
            } finally {
              if (mountedRef.current) {
                setLoadingStates(prev => ({ ...prev, factoryOffices: false }));
              }
            }
          })(),
        ]);
      };

      // Load other data after a small delay
      setTimeout(loadOtherData, 100);
    };

    loadRelatedData();
  }, [config.prefetchRelatedData]);

  // Cleanup function
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Memoize the context value
  const contextValue = useMemo(() => ({
    ...departmentState,
    config,
    relatedData,
    loadingStates,
    refreshOrganizationTree,
    refreshAllData,
  }), [departmentState, config, relatedData, loadingStates, refreshOrganizationTree, refreshAllData]);

  return (
    <DepartmentContext.Provider value={contextValue}>
      {children}
    </DepartmentContext.Provider>
  );
};

/**
 * Enhanced hook to access the department context
 */
export const useDepartmentContext = (): DepartmentContextType => {
  const context = useContext(DepartmentContext);

  if (!context) {
    throw new Error('useDepartmentContext must be used within a DepartmentProvider');
  }

  return context;
};

/**
 * Selective hooks for specific department data
 */
export const useDepartmentData = () => {
  const context = useDepartmentContext();
  return useMemo(() => ({
    getList: context.getList,
    loading: context.loading,
    error: context.error,
    activeFilters: context.activeFilters,
  }), [context.getList, context.loading, context.error, context.activeFilters]);
};

export const useDepartmentActions = () => {
  const context = useDepartmentContext();
  return useMemo(() => ({
    handleCreate: context.handleCreate,
    handleUpdate: context.handleUpdate,
    handleDelete: context.handleDelete,
  }), [context.handleCreate, context.handleUpdate, context.handleDelete]);
};

export const useDepartmentForm = () => {
  const [formData, setFormData] = React.useState(() => ({
    code: '',
    name: '',
    description: '',
    departmentType: 'HEAD_OFFICE' as 'HEAD_OFFICE' | 'FACTORY_OFFICE',
    parentId: null as string | null,
  }));

  const updateFormField = React.useCallback((field: string, value: any) => {
    setFormData(prev => {
      if (prev[field as keyof typeof prev] === value) return prev;
      return { ...prev, [field]: value };
    });
  }, []);

  const resetForm = React.useCallback(() => {
    setFormData({
      code: '',
      name: '',
      description: '',
      departmentType: 'HEAD_OFFICE',
      parentId: null,
    });
  }, []);

  const loadDepartmentData = React.useCallback((department: any) => {
    if (department) {
      setFormData({
        code: department.code || '',
        name: department.name || '',
        description: department.description || '',
        departmentType: department.departmentType || 'HEAD_OFFICE',
        parentId: department.parentId || null,
      });
    }
  }, []);

  return {
    formData,
    updateFormField,
    resetForm,
    loadDepartmentData,
  };
};

export const useDepartmentFormWithDefaults = () => useDepartmentForm();
