'use client';

import { useCallback, useEffect, useState, useRef } from 'react';

import { RoleType } from '@/apis/roles/role.api';
import { TRoleSchema } from '@/schemas/role';

import { useDebounce } from '../useDebounce';

import { useRoleMutations } from './roleMutations';


/**
 * Hook for role-related helper functions and state management
 * Optimized for high performance with 5000+ users
 */
export const useRoleHelpers = () => {
  const [selectedRole, setSelectedRole] = useState<RoleType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [filterValues, setFilterValues] = useState({
    code: '',
    name: '',
    level: undefined as number | undefined,
    isSystem: undefined as boolean | undefined,
  });

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
  });

  // Tracking refs to prevent duplicate operations
  const operationsRef = useRef({
    isSubmitting: false,
    isSearching: false,
    pendingRequests: new Set<string>(),
    filterChangeId: 0,
    paginationChangeId: 0,
  });

  // Debounced filter values for optimized search
  const debouncedCode = useDebounce(filterValues.code, 500); // Increased debounce timeout
  const debouncedName = useDebounce(filterValues.name, 500);

  // memoize initial state to avoid unnecessary object creation
  const initialActiveFilters = useRef({
    code: '',
    name: '',
    level: undefined as number | undefined,
    isSystem: undefined as boolean | undefined,
    page: 1,
    limit: 10,
  }).current;

  // Combined filters with debounced values - using reducer for better state updates
  const [activeFilters, setActiveFilters] = useState(initialActiveFilters);

  //  Previous filter values reference for comparison
  const previousFiltersRef = useRef({
    code: '',
    name: '',
    level: undefined as number | undefined,
    isSystem: undefined as boolean | undefined,
  });

  // Get mutations with useCallback to prevent unnecessary re-renders
  const { createRoleMutation, updateRoleMutation, deleteRoleMutation } = useRoleMutations();

  /**
   * Optimized pagination updater that prevents redundant state updates
   */
  const updatePagination = useCallback((page: number, limit: number) => {
    setPagination(prev => {
      // Skip update if values haven't changed
      if (prev.page === page && prev.limit === limit) {
        return prev;
      }

      // Track this change to coordinate with effects
      operationsRef.current.paginationChangeId++;

      return { page, limit };
    });
  }, []);

  /**
   * Effect to consolidate filter changes to minimize API calls
   * Uses a single effect to handle both filter and pagination changes
   */
  useEffect(() => {
    // Check if filters have changed
    const hasFilterChanged =
      debouncedCode !== previousFiltersRef.current.code ||
      debouncedName !== previousFiltersRef.current.name ||
      filterValues.level !== previousFiltersRef.current.level ||
      filterValues.isSystem !== previousFiltersRef.current.isSystem;

    // Only process changes if something actually changed
    if (hasFilterChanged) {
      // Track this filter change to coordinate with effects
      operationsRef.current.filterChangeId++;

      // Save filter values for future comparison
      previousFiltersRef.current = {
        code: debouncedCode,
        name: debouncedName,
        level: filterValues.level,
        isSystem: filterValues.isSystem,
      };

      // When filters change, always reset to page 1
      const newPage = hasFilterChanged ? 1 : pagination.page;

      // Batch state updates using functional update
      setActiveFilters(prev => ({
        ...prev,
        code: debouncedCode,
        name: debouncedName,
        level: filterValues.level,
        isSystem: filterValues.isSystem,
        page: newPage,
      }));

      // Sync pagination state if we reset to page 1
      if (hasFilterChanged && pagination.page !== 1) {
        setPagination(prev => ({
          ...prev,
          page: 1,
        }));
      }
    }
  }, [debouncedCode, debouncedName, filterValues.level, filterValues.isSystem, pagination.page]);

  /**
   * Separate effect to handle pagination changes
   * Intentionally has fewer dependencies than the filter effect
   */
  useEffect(() => {
    setActiveFilters(prev => {
      // Skip update if pagination hasn't changed
      if (prev.page === pagination.page && prev.limit === pagination.limit) {
        return prev;
      }

      return {
        ...prev,
        page: pagination.page,
        limit: pagination.limit,
      };
    });
  }, [pagination.page, pagination.limit]);

  /**
   * Update filter values with memoization to prevent unnecessary re-renders
   * Using a more robust approach to handle concurrent updates
   */
  const updateFilter = useCallback((key: keyof typeof filterValues, value: any) => {
    setFilterValues(prev => {
      // Skip update if value hasn't changed
      if (prev[key] === value) return prev;

      // Flag as searching to prevent redundant API calls
      operationsRef.current.isSearching = true;

      return { ...prev, [key]: value };
    });
  }, []);

  /**
   * Reset all filters with optimized implementation
   */
  const resetFilters = useCallback(() => {
    // Batch reset operations to minimize renders
    setFilterValues({
      code: '',
      name: '',
      level: undefined,
      isSystem: undefined,
    });

    // Reset to page 1 when clearing filters
    setPagination(prev => ({
      ...prev,
      page: 1,
    }));
  }, []);

  /**
   * Handle role creation with loading state and optimized API calls
   * Adds safeguards against duplicate submissions
   */
  const handleCreateRole = useCallback(
    async (data: Omit<TRoleSchema, 'id' | 'createdAt' | 'updatedAt'>) => {
      // Prevent duplicate submissions using ref
      if (operationsRef.current.isSubmitting) return;

      // Generate a unique request ID
      const requestId = `create-${Date.now()}`;

      try {
        operationsRef.current.isSubmitting = true;
        operationsRef.current.pendingRequests.add(requestId);

        setLoading(true);
        setError(null);

        const result: TRoleSchema = await createRoleMutation.mutateAsync(data);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        throw error;
      } finally {
        setLoading(false);
        operationsRef.current.isSubmitting = false;
        operationsRef.current.pendingRequests.delete(requestId);
      }
    },
    [createRoleMutation],
  );

  /**
   * Handle role update with loading state and optimized API calls
   * Similar optimizations as handleCreateRole
   */
  const handleUpdateRole = useCallback(
    async (id: string, data: Omit<TRoleSchema, 'id' | 'createdAt' | 'updatedAt'>) => {
      if (operationsRef.current.isSubmitting) return;

      const requestId = `update-${Date.now()}`;

      try {
        operationsRef.current.isSubmitting = true;
        operationsRef.current.pendingRequests.add(requestId);

        setLoading(true);
        setError(null);

        const result: TRoleSchema = await updateRoleMutation.mutateAsync({ id, data });
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        throw error;
      } finally {
        setLoading(false);
        operationsRef.current.isSubmitting = false;
        operationsRef.current.pendingRequests.delete(requestId);
      }
    },
    [updateRoleMutation],
  );

  /**
   * Handle role deletion with loading state and optimized API calls
   */
  const handleDeleteRole = useCallback(
    async (id: string) => {
      if (operationsRef.current.isSubmitting) return;

      const requestId = `delete-${Date.now()}`;

      try {
        operationsRef.current.isSubmitting = true;
        operationsRef.current.pendingRequests.add(requestId);

        setLoading(true);
        setError(null);

        const result: TRoleSchema = await deleteRoleMutation.mutateAsync(id);

        // If the deleted role was selected, deselect it
        if (selectedRole?.id === id) {
          setSelectedRole(null);
        }

        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        throw error;
      } finally {
        setLoading(false);
        operationsRef.current.isSubmitting = false;
        operationsRef.current.pendingRequests.delete(requestId);
      }
    },
    [deleteRoleMutation, selectedRole],
  );

  /**
   * Reset error state
   */
  const resetError = useCallback(() => setError(null), []);

  /**
   * Cleanup function to ensure proper resource management
   */
  useEffect(() => {
    // Cleanup function that runs on component unmount
    return () => {
      //  Clear any pending operations
      operationsRef.current.pendingRequests.clear();
      operationsRef.current.isSubmitting = false;
      operationsRef.current.isSearching = false;
    };
  }, []);

  return {
    // State
    selectedRole,
    loading,
    error,
    filterValues,
    activeFilters,
    pagination,

    // Actions
    setSelectedRole,
    resetError,
    updateFilter,
    resetFilters,
    setActiveFilters,
    updatePagination,

    // Handlers
    handleCreateRole,
    handleUpdateRole,
    handleDeleteRole,
  };
};
