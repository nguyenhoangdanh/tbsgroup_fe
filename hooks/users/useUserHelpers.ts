'use client';

import { useCallback, useEffect, useState, useRef } from 'react';

import { useUserMutations } from './userMutations';

import { UserStatusEnum } from '@/common/enum';
import { UserProfileType, UserListParams, UserUpdateRequest } from '@/common/interface/user';
import { useDebounce } from '@/hooks/useDebounce';
import { TUserSchema } from '@/schemas/user';

/**
 * Hook for user-related helper functions and state management
 */
export const useUserHelpers = () => {
  // State
  const [selectedUser, setSelectedUser] = useState<UserProfileType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  // Filter state matching backend UserCondDTO
  const [filterValues, setFilterValues] = useState<Omit<UserListParams, 'page' | 'limit' | 'sortBy' | 'sortOrder'>>({
    username: '',
    fullName: '',
    roleId: undefined,
    roleCode: undefined,
    status: undefined,
    factoryId: undefined,
    lineId: undefined,
    teamId: undefined,
    groupId: undefined,
    positionId: undefined,
  });

  // Pagination state matching backend PaginationDTO
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc' as 'asc' | 'desc',
  });

  // Prevent duplicate refetches
  const isSubmittingRef = useRef(false);
  const isSearchingRef = useRef(false);

  // Debounced filter values for optimized search
  const debouncedUsername = useDebounce(filterValues.username || '');
  const debouncedFullName = useDebounce(filterValues.fullName || '');

  // Combined filters with debounced values
  const [activeFilters, setActiveFilters] = useState<UserListParams>({
    username: '',
    fullName: '',
    roleId: undefined,
    roleCode: undefined,
    status: undefined,
    factoryId: undefined,
    lineId: undefined,
    teamId: undefined,
    groupId: undefined,
    positionId: undefined,
    page: 1,
    limit: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  // Ref to track if filters have changed (for pagination reset)
  const previousFiltersRef = useRef({
    username: '',
    fullName: '',
    roleId: undefined as string | undefined,
    roleCode: undefined as string | undefined,
    status: undefined as UserStatusEnum | undefined,
    factoryId: undefined as string | undefined,
    lineId: undefined as string | undefined,
    teamId: undefined as string | undefined,
    groupId: undefined as string | undefined,
    positionId: undefined as string | undefined,
  });

  const updatePagination = useCallback((page: number, limit: number, sortBy?: string, sortOrder?: 'asc' | 'desc') => {
    setPagination(prev => {
      // Không trigger re-render nếu giá trị không thay đổi
      if (prev.page === page && prev.limit === limit && 
          prev.sortBy === (sortBy || prev.sortBy) && 
          prev.sortOrder === (sortOrder || prev.sortOrder)) {
        return prev;
      }
      return { 
        page, 
        limit, 
        sortBy: sortBy || prev.sortBy,
        sortOrder: sortOrder || prev.sortOrder,
      };
    });
  }, []);

  // Update active filters when debounced values change
  useEffect(() => {
    // Kiểm tra xem bộ lọc đã thay đổi hay chưa
    const hasFilterChanged =
      debouncedUsername !== previousFiltersRef.current.username ||
      debouncedFullName !== previousFiltersRef.current.fullName ||
      filterValues.roleId !== previousFiltersRef.current.roleId ||
      filterValues.roleCode !== previousFiltersRef.current.roleCode ||
      filterValues.status !== previousFiltersRef.current.status ||
      filterValues.factoryId !== previousFiltersRef.current.factoryId ||
      filterValues.lineId !== previousFiltersRef.current.lineId ||
      filterValues.teamId !== previousFiltersRef.current.teamId ||
      filterValues.groupId !== previousFiltersRef.current.groupId ||
      filterValues.positionId !== previousFiltersRef.current.positionId;

    // Lưu giá trị bộ lọc hiện tại để so sánh lần sau
    previousFiltersRef.current = {
      username: debouncedUsername,
      fullName: debouncedFullName,
      roleId: filterValues.roleId,
      roleCode: filterValues.roleCode,
      status: filterValues.status,
      factoryId: filterValues.factoryId,
      lineId: filterValues.lineId,
      teamId: filterValues.teamId,
      groupId: filterValues.groupId,
      positionId: filterValues.positionId,
    };

    // Nếu bộ lọc thay đổi, reset về trang 1
    const newPage = hasFilterChanged ? 1 : pagination.page;

    // Cập nhật active filters
    setActiveFilters(prev => ({
      ...prev,
      username: debouncedUsername || undefined,
      fullName: debouncedFullName || undefined,
      roleId: filterValues.roleId,
      roleCode: filterValues.roleCode,
      status: filterValues.status,
      factoryId: filterValues.factoryId,
      lineId: filterValues.lineId,
      teamId: filterValues.teamId,
      groupId: filterValues.groupId,
      positionId: filterValues.positionId,
      page: newPage,
      limit: pagination.limit,
      sortBy: pagination.sortBy,
      sortOrder: pagination.sortOrder,
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
    filterValues.roleId,
    filterValues.roleCode,
    filterValues.status,
    filterValues.factoryId,
    filterValues.lineId,
    filterValues.teamId,
    filterValues.groupId,
    filterValues.positionId,
    pagination.page,
    pagination.limit,
    pagination.sortBy,
    pagination.sortOrder,
  ]);

  // Đồng bộ thay đổi pagination vào active filters
  useEffect(() => {
    setActiveFilters(prev => {
      // Kiểm tra nếu thực sự có thay đổi
      if (prev.page === pagination.page && 
          prev.limit === pagination.limit &&
          prev.sortBy === pagination.sortBy &&
          prev.sortOrder === pagination.sortOrder) {
        return prev;
      }

      return {
        ...prev,
        page: pagination.page,
        limit: pagination.limit,
        sortBy: pagination.sortBy,
        sortOrder: pagination.sortOrder,
      };
    });
  }, [pagination.page, pagination.limit, pagination.sortBy, pagination.sortOrder]);

  // Get mutations
  const { createUserMutation, updateUserMutation, deleteUserMutation, updateUserStatusMutation } =
    useUserMutations();

  /**
   * Update filter values with memoization to prevent unnecessary re-renders
   */
  const updateFilter = useCallback((key: keyof typeof filterValues, value: any) => {
    setFilterValues(prev => {
      // Nếu giá trị không thay đổi, không trigger render
      if (prev[key] === value) return prev;

      // Flag đang tìm kiếm để tránh trigger nhiều API call
      isSearchingRef.current = true;

      return { ...prev, [key]: value };
    });
  }, []);

  /**
   * Reset all filters
   */
  const resetFilters = useCallback(() => {
    setFilterValues({
      username: '',
      fullName: '',
      roleId: undefined,
      roleCode: undefined,
      status: undefined,
      factoryId: undefined,
      lineId: undefined,
      teamId: undefined,
      groupId: undefined,
      positionId: undefined,
    });

    // Reset về trang 1 khi clear bộ lọc
    setPagination(prev => ({
      ...prev,
      page: 1,
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
    async (id: string, data: UserUpdateRequest) => {
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
