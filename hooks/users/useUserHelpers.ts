'use client';

import { useCallback, useEffect, useState, useRef } from 'react';
import { TUserSchema } from '@/schemas/user';
import { UserType } from './useUserQueries';
import { useDebounce } from '../useDebounce';
import { useUserMutations } from './userMutations';
import { UserStatusEnum } from '@/common/enum';

/**
 * Hook for user-related helper functions and state management
 */
export const useUserHelpers = () => {
  // State
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [filterValues, setFilterValues] = useState({
    username: '',
    fullName: '',
    role: undefined as string | undefined,
    status: undefined as string | undefined,
  });

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
  });

  // Prevent duplicate refetches
  const isSubmittingRef = useRef(false);
  const isSearchingRef = useRef(false);

  // Debounced filter values for optimized search
  const debouncedUsername = useDebounce(filterValues.username);
  const debouncedFullName = useDebounce(filterValues.fullName);

  // Combined filters with debounced values
  const [activeFilters, setActiveFilters] = useState({
    username: '',
    fullName: '',
    role: undefined as string | undefined,
    status: undefined as string | undefined,
    page: 1,
    limit: 10,
  });

  // Ref to track if filters have changed (for pagination reset)
  const previousFiltersRef = useRef({
    username: '',
    fullName: '',
    role: undefined as string | undefined,
    status: undefined as string | undefined,
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
      return { page, limit };
    });
  }, []);

  // Update active filters when debounced values change
  useEffect(() => {
    // Kiểm tra xem bộ lọc đã thay đổi hay chưa
    const hasFilterChanged =
      debouncedUsername !== previousFiltersRef.current.username ||
      debouncedFullName !== previousFiltersRef.current.fullName ||
      filterValues.role !== previousFiltersRef.current.role ||
      filterValues.status !== previousFiltersRef.current.status;

    // Lưu giá trị bộ lọc hiện tại để so sánh lần sau
    previousFiltersRef.current = {
      username: debouncedUsername,
      fullName: debouncedFullName,
      role: filterValues.role,
      status: filterValues.status,
    };

    // Nếu bộ lọc thay đổi, reset về trang 1
    const newPage = hasFilterChanged ? 1 : pagination.page;

    // Cập nhật active filters
    setActiveFilters(prev => ({
      ...prev,
      username: debouncedUsername,
      fullName: debouncedFullName,
      role: filterValues.role,
      status: filterValues.status,
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
    debouncedUsername,
    debouncedFullName,
    filterValues.role,
    filterValues.status,
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
  const {
    createUserMutation,
    updateUserMutation,
    deleteUserMutation,
    updateUserStatusMutation,
  } = useUserMutations();

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

        return { ...prev, [key]: value };
      });
    },
    [],
  );

  /**
   * Reset all filters
   */
  const resetFilters = useCallback(() => {
    setFilterValues({
      username: '',
      fullName: '',
      role: undefined,
      status: undefined,
    });

    // Reset về trang 1 khi clear bộ lọc
    setPagination(prev => ({
      ...prev,
      page: 1
    }));
  }, []);

  /**
   * Handle user creation with loading state and optimized API calls
   */
  const handleCreateUser = useCallback(
    async (data: Omit<TUserSchema, 'id'>) => {
      // Prevent duplicate submissions
      if (isSubmittingRef.current) return;

      isSubmittingRef.current = true;
      setLoading(true);
      setError(null);

      try {
        const result = await createUserMutation.mutateAsync(data);
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
    [createUserMutation],
  );

  /**
   * Handle user update with loading state and optimized API calls
   */
  const handleUpdateUser = useCallback(
    async (
      id: string,
      data: Partial<TUserSchema>,
    ) => {
      // Prevent duplicate submissions
      if (isSubmittingRef.current) return;

      isSubmittingRef.current = true;
      setLoading(true);
      setError(null);

      try {
        const result = await updateUserMutation.mutateAsync({ id, data });
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
    [updateUserMutation],
  );

  /**
   * Handle user deletion with loading state and optimized API calls
   */
  const handleDeleteUser = useCallback(
    async (id: string) => {
      // Prevent duplicate submissions
      if (isSubmittingRef.current) return;

      isSubmittingRef.current = true;
      setLoading(true);
      setError(null);

      try {
        const result = await deleteUserMutation.mutateAsync(id);

        // If the deleted user was selected, deselect it
        if (selectedUser?.id === id) {
          setSelectedUser(null);
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
    [deleteUserMutation, selectedUser],
  );

  /**
   * Handle user status update
   */
  const handleUpdateUserStatus = useCallback(
    async (id: string, status: UserStatusEnum) => {
      // Prevent duplicate submissions
      if (isSubmittingRef.current) return;

      isSubmittingRef.current = true;
      setLoading(true);
      setError(null);

      try {
        const result = await updateUserStatusMutation.mutateAsync({ id, status });
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
    [updateUserStatusMutation],
  );

  /**
   * Reset error state
   */
  const resetError = useCallback(() => setError(null), []);

  return {
    // State
    selectedUser,
    loading,
    error,
    filterValues,
    activeFilters,
    pagination,

    // Actions
    setSelectedUser,
    resetError,
    updateFilter,
    resetFilters,
    setActiveFilters,
    updatePagination,

    // Handlers
    handleCreateUser,
    handleUpdateUser,
    handleDeleteUser,
    handleUpdateUserStatus,
  };
};