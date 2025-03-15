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

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
  });

// Prevent duplicate refetches
const isSubmittingRef = useRef(false);
const isSearchingRef = useRef(false);

  // Debounced filter values for optimized search
  const debouncedCode = useDebounce(filterValues.code);
  const debouncedName = useDebounce(filterValues.name);

  // Combined filters with debounced values
  const [activeFilters, setActiveFilters] = useState({
    code: '',
    name: '',
    level: undefined as number | undefined,
    isSystem: undefined as boolean | undefined,
    page: 1,
    limit: 10,
  });

  // Ref to track if filters have changed (for pagination reset)
  const previousFiltersRef = useRef({
    code: '',
    name: '',
    level: undefined as number | undefined,
    isSystem: undefined as boolean | undefined,
  });

  const updatePagination = useCallback((page: number, limit: number) => {
    setPagination(prev => {
      // Không trigger re-render nếu giá trị không thay đổi
      if (prev.page === page && prev.limit === limit) {
        console.log('No change in pagination values, skipping update');
        return prev;
      }
      console.log(
        `Updating pagination state from {page: ${prev.page}, limit: ${prev.limit}} to {page: ${page}, limit: ${limit}}`,
      );
      return {page, limit};
    });
  }, []);

  // Update active filters when debounced values change
  useEffect(() => {
    // Kiểm tra xem bộ lọc đã thay đổi hay chưa
    const hasFilterChanged =
      debouncedCode !== previousFiltersRef.current.code ||
      debouncedName !== previousFiltersRef.current.name ||
      filterValues.level !== previousFiltersRef.current.level ||
      filterValues.isSystem !== previousFiltersRef.current.isSystem;

    // Lưu giá trị bộ lọc hiện tại để so sánh lần sau
    previousFiltersRef.current = {
      code: debouncedCode,
      name: debouncedName,
      level: filterValues.level,
      isSystem: filterValues.isSystem,
    };

    // Nếu bộ lọc thay đổi, reset về trang 1
    const newPage = hasFilterChanged ? 1 : pagination.page;

    // Cập nhật active filters
    setActiveFilters(prev => ({
      ...prev,
      code: debouncedCode,
      name: debouncedName,
      level: filterValues.level,
      isSystem: filterValues.isSystem,
      page: newPage,
      limit: pagination.limit,
    }));

    // Nếu bộ lọc thay đổi, đồng bộ lại state pagination
    if (hasFilterChanged && pagination.page !== 1) {
      setPagination(prev => ({
        ...prev,
        page: 1,
      }));
    }
  }, [
    debouncedCode,
    debouncedName,
    filterValues.level,
    filterValues.isSystem,
    pagination.page,
    pagination.limit,
  ]);

  // Đồng bộ thay đổi pagination vào active filters
  useEffect(() => {
    console.log(
      `Pagination state changed: page=${pagination.page}, limit=${pagination.limit}`,
    );

    setActiveFilters(prev => {
      // Kiểm tra nếu thực sự có thay đổi
      if (prev.page === pagination.page && prev.limit === pagination.limit) {
        console.log(
          'No change in pagination for active filters, skipping update',
        );
        return prev;
      }

      console.log(
        `Updating active filters with new pagination: page=${pagination.page}, limit=${pagination.limit}`,
      );
      return {
        ...prev,
        page: pagination.page,
        limit: pagination.limit,
      };
    });
  }, [pagination.page, pagination.limit]);

  // Get mutations
  const {createRoleMutation, updateRoleMutation, deleteRoleMutation} =
    useRoleMutations();

  /**
   * Update filter values with memoization to prevent unnecessary re-renders
   */
  const updateFilter = useCallback(
    (key: keyof typeof filterValues, value: any) => {
      setFilterValues(prev => {
        // Nếu giá trị không thay đổi, không trigger render
        if (prev[key] === value) return prev;

        // Flag đang tìm kiếm để tránh trigger nhiều API call
        isSearchingRef.current = true;

        return {...prev, [key]: value};
      });
    },
    [],
  );

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

     // Reset về trang 1 khi clear bộ lọc
     setPagination(prev => ({
      ...prev,
      page: 1
    }));
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
    pagination,

    // Actions
    setSelectedRole,
    // selectRole,
    resetError,
    updateFilter,
    resetFilters,
    setActiveFilters, // Thêm vào
    updatePagination, // Thêm vào

    // Handlers
    handleCreateRole,
    handleUpdateRole,
    handleDeleteRole,
  };
};
