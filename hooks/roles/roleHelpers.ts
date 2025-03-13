'use client';

import {useCallback, useEffect, useState, useRef} from 'react';
import {useRoleMutations} from './roleMutations';
import {TRoleSchema} from '@/schemas/role';
import {RoleType} from '@/apis/roles/role.api';
import {useDebounce} from '../useDebounce';

/**
 * Hook for role-related helper functions and state management
 */
export const useRoleHelpers = () => {
  // State
  const [selectedRole, setSelectedRole] = useState<RoleType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [filterValues, setFilterValues] = useState({
    code: '',
    name: '',
    level: undefined as number | undefined,
    isSystem: undefined as boolean | undefined,
  });
  
  // Prevent duplicate refetches
  const isSubmittingRef = useRef(false);

  // Debounced filter values for optimized search
  const debouncedCode = useDebounce(filterValues.code);
  const debouncedName = useDebounce(filterValues.name);

  // Combined filters with debounced values
  const [activeFilters, setActiveFilters] = useState({
    code: '',
    name: '',
    level: undefined as number | undefined,
    isSystem: undefined as boolean | undefined,
  });

  // Update active filters when debounced values change
  useEffect(() => {
    setActiveFilters(prev => ({
      ...prev,
      code: debouncedCode,
      name: debouncedName,
    }));
  }, [debouncedCode, debouncedName]);

  // Get mutations
  const {createRoleMutation, updateRoleMutation, deleteRoleMutation} =
    useRoleMutations();

  /**
   * Update filter values with memoization to prevent unnecessary re-renders
   */
  const updateFilter = useCallback((key: keyof typeof filterValues, value: any) => {
    setFilterValues(prev => {
      // Nếu giá trị không thay đổi, không trigger render
      if (prev[key] === value) return prev;
      return { ...prev, [key]: value };
    });
  }, []);

  /**
   * Reset all filters
   */
  const resetFilters = useCallback(() => {
    setFilterValues({
      code: '',
      name: '',
      level: undefined,
      isSystem: undefined,
    });
  }, []);

  /**
   * Handle role creation with loading state and optimized API calls
   */
  const handleCreateRole = useCallback(
    async (data: Omit<TRoleSchema, 'id' | 'createdAt' | 'updatedAt'>) => {
      // Prevent duplicate submissions
      if (isSubmittingRef.current) return;
      
      isSubmittingRef.current = true;
      setLoading(true);
      setError(null);

      try {
        const result = await createRoleMutation.mutateAsync(data);
        setLoading(false);
        isSubmittingRef.current = false;
        return result;
      } catch (err) {
        setLoading(false);
        isSubmittingRef.current = false;
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        throw error;
      }
    },
    [createRoleMutation],
  );

  /**
   * Handle role update with loading state and optimized API calls
   */
  const handleUpdateRole = useCallback(
    async (
      id: string,
      data: Omit<TRoleSchema, 'id' | 'createdAt' | 'updatedAt'>,
    ) => {
      // Prevent duplicate submissions
      if (isSubmittingRef.current) return;
      
      isSubmittingRef.current = true;
      setLoading(true);
      setError(null);

      try {
        const result = await updateRoleMutation.mutateAsync({id, data});
        setLoading(false);
        isSubmittingRef.current = false;
        return result;
      } catch (err) {
        setLoading(false);
        isSubmittingRef.current = false;
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        throw error;
      }
    },
    [updateRoleMutation],
  );

  /**
   * Handle role deletion with loading state and optimized API calls
   */
  const handleDeleteRole = useCallback(
    async (id: string) => {
      // Prevent duplicate submissions
      if (isSubmittingRef.current) return;
      
      isSubmittingRef.current = true;
      setLoading(true);
      setError(null);

      try {
        const result = await deleteRoleMutation.mutateAsync(id);
        
        // If the deleted role was selected, deselect it
        if (selectedRole?.id === id) {
          setSelectedRole(null);
        }
        
        setLoading(false);
        isSubmittingRef.current = false;
        return result;
      } catch (err) {
        setLoading(false);
        isSubmittingRef.current = false;
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        throw error;
      }
    },
    [deleteRoleMutation, selectedRole],
  );

  /**
   * Reset error state
   */
  const resetError = useCallback(() => setError(null), []);

  /**
   * Select a role for editing or viewing
   */
  // const selectRole = useCallback((role: RoleType | null) => {
  //   setSelectedRole(role);
  // }, []);

  return {
    // State
    selectedRole,
    loading,
    error,
    filterValues,
    activeFilters,

    // Actions
    setSelectedRole,
    // selectRole,
    resetError,
    updateFilter,
    resetFilters,

    // Handlers
    handleCreateRole,
    handleUpdateRole,
    handleDeleteRole,
  };
};