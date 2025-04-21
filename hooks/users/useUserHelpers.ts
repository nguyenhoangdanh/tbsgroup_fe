"use client"


import { useState, useCallback, useRef } from 'react';
import { TUserSchema } from '@/schemas/user';
import { useDebounce } from '@/hooks/useDebounce';
import { UserType } from '@/common/interface/user';
import { useUserMutations } from './userMutations';

export const useUserHelpers = () => {
  // State definitions - unchanged
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
  
  // Refs for preventing double submissions
  const isSubmittingRef = useRef(false);
  
  // Get mutations
  const { createUserMutation, updateUserMutation, deleteUserMutation } = useUserMutations();
  
  // Debounced values for search optimization
  const debouncedUsername = useDebounce(filterValues.username);
  const debouncedFullName = useDebounce(filterValues.fullName);
  
  // Create a computed active filters object
  const activeFilters = useCallback(() => ({
    username: debouncedUsername,
    fullName: debouncedFullName,
    role: filterValues.role,
    status: filterValues.status,
    page: pagination.page,
    limit: pagination.limit,
  }), [debouncedUsername, debouncedFullName, filterValues.role, filterValues.status, pagination]);
  
  // Update pagination with memoization
  const updatePagination = useCallback((page: number, limit: number) => {
    setPagination(prev => {
      if (prev.page === page && prev.limit === limit) return prev;
      return { page, limit };
    });
  }, []);
  
  // Filter update with memoization
  const updateFilter = useCallback((key: keyof typeof filterValues, value: any) => {
    setFilterValues(prev => {
      if (prev[key] === value) return prev;
      return { ...prev, [key]: value };
    });
    
    // Reset to page 1 when filters change
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);
  
  // Reset filters
  const resetFilters = useCallback(() => {
    setFilterValues({
      username: '',
      fullName: '',
      role: undefined,
      status: undefined,
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);
  
  // Wrapped mutation handlers with loading state management
  const handleCreateUser = useCallback(async (data: Omit<TUserSchema, 'id'>) => {
    if (isSubmittingRef.current) return;
    
    try {
      isSubmittingRef.current = true;
      setLoading(true);
      setError(null);
      
      return await createUserMutation.mutateAsync(data);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      throw error;
    } finally {
      setLoading(false);
      isSubmittingRef.current = false;
    }
  }, [createUserMutation]);
  
  // Similar handlers for update and delete...


  const handleUpdateUser = useCallback(async (id: string, data: Partial<TUserSchema>) => {
    if (isSubmittingRef.current) return;
    try {
      isSubmittingRef.current = true;
      setLoading(true);
      setError(null);
      
      return await updateUserMutation.mutateAsync({ id, data });
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      throw error;
    } finally {
      setLoading(false);
      isSubmittingRef.current = false;
    }
  }, [updateUserMutation]);


  const handleDeleteUser = useCallback(async (id: string) => {
    if (isSubmittingRef.current) return;
    try {
      isSubmittingRef.current = true;
      setLoading(true);
      setError(null);
      const result = await deleteUserMutation.mutateAsync(id);
      if (selectedUser?.id === id) {
        setSelectedUser(null);
      }
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      throw error;
    } finally {
      setLoading(false);
      isSubmittingRef.current = false;
    }
  }, [deleteUserMutation, selectedUser]);
  // Reset error state
  const resetError = useCallback(() => setError(null), []);
  // Return all state and actions
  // to be used in components
  // This includes state, actions, and handlers
  
  return {
    // State
    selectedUser,
    loading,
    error,
    filterValues,
    activeFilters: activeFilters(),
    pagination,
    
    // Actions
    setSelectedUser,
    resetError: useCallback(() => setError(null), []),
    updateFilter,
    resetFilters,
    updatePagination,
    
    // User CRUD handlers
    handleCreateUser,
    handleUpdateUser, // Similar to handleCreateUser
    handleDeleteUser, // Similar to handleCreateUser
  };
};



























// 'use client';

// import { useCallback, useEffect, useState, useRef } from 'react';
// import { TUserSchema } from '@/schemas/user';
// import { useDebounce } from '../useDebounce';
// import { useUserMutations } from './userMutations';
// import { UserStatusEnum } from '@/common/enum';
// import { UserType } from '@/common/interface/user';

// /**
//  * Hook for user-related helper functions and state management
//  */
// export const useUserHelpers = () => {
//   // State
//   const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState<Error | null>(null);
//   const [filterValues, setFilterValues] = useState({
//     username: '',
//     fullName: '',
//     role: undefined as string | undefined,
//     status: undefined as string | undefined,
//   });

//   const [pagination, setPagination] = useState({
//     page: 1,
//     limit: 10,
//   });

//   // Prevent duplicate refetches
//   const isSubmittingRef = useRef(false);
//   const isSearchingRef = useRef(false);

//   // Debounced filter values for optimized search
//   const debouncedUsername = useDebounce(filterValues.username);
//   const debouncedFullName = useDebounce(filterValues.fullName);

//   // Combined filters with debounced values
//   const [activeFilters, setActiveFilters] = useState({
//     username: '',
//     fullName: '',
//     role: undefined as string | undefined,
//     status: undefined as string | undefined,
//     page: 1,
//     limit: 10,
//   });

//   // Ref to track if filters have changed (for pagination reset)
//   const previousFiltersRef = useRef({
//     username: '',
//     fullName: '',
//     role: undefined as string | undefined,
//     status: undefined as string | undefined,
//   });

//   const updatePagination = useCallback((page: number, limit: number) => {
//     setPagination(prev => {
//       // Không trigger re-render nếu giá trị không thay đổi
//       if (prev.page === page && prev.limit === limit) {
//         return prev;
//       }
//       return { page, limit };
//     });
//   }, []);

//   // Update active filters when debounced values change
//   useEffect(() => {
//     // Kiểm tra xem bộ lọc đã thay đổi hay chưa
//     const hasFilterChanged =
//       debouncedUsername !== previousFiltersRef.current.username ||
//       debouncedFullName !== previousFiltersRef.current.fullName ||
//       filterValues.role !== previousFiltersRef.current.role ||
//       filterValues.status !== previousFiltersRef.current.status;

//     // Lưu giá trị bộ lọc hiện tại để so sánh lần sau
//     previousFiltersRef.current = {
//       username: debouncedUsername,
//       fullName: debouncedFullName,
//       role: filterValues.role,
//       status: filterValues.status,
//     };

//     // Nếu bộ lọc thay đổi, reset về trang 1
//     const newPage = hasFilterChanged ? 1 : pagination.page;

//     // Cập nhật active filters
//     setActiveFilters(prev => ({
//       ...prev,
//       username: debouncedUsername,
//       fullName: debouncedFullName,
//       role: filterValues.role,
//       status: filterValues.status,
//       page: newPage,
//       limit: pagination.limit,
//     }));

//     // Nếu bộ lọc thay đổi, đồng bộ lại state pagination
//     if (hasFilterChanged && pagination.page !== 1) {
//       setPagination(prev => ({
//         ...prev,
//         page: 1,
//       }));
//     }
//   }, [
//     debouncedUsername,
//     debouncedFullName,
//     filterValues.role,
//     filterValues.status,
//     pagination.page,
//     pagination.limit,
//   ]);

//   // Đồng bộ thay đổi pagination vào active filters
//   useEffect(() => {
//     setActiveFilters(prev => {
//       // Kiểm tra nếu thực sự có thay đổi
//       if (prev.page === pagination.page && prev.limit === pagination.limit) {
//         return prev;
//       }

//       return {
//         ...prev,
//         page: pagination.page,
//         limit: pagination.limit,
//       };
//     });
//   }, [pagination.page, pagination.limit]);

//   // Get mutations
//   const {
//     createUserMutation,
//     updateUserMutation,
//     deleteUserMutation,
//     updateUserStatusMutation,
//   } = useUserMutations();

//   /**
//    * Update filter values with memoization to prevent unnecessary re-renders
//    */
//   const updateFilter = useCallback(
//     (key: keyof typeof filterValues, value: any) => {
//       setFilterValues(prev => {
//         // Nếu giá trị không thay đổi, không trigger render
//         if (prev[key] === value) return prev;

//         // Flag đang tìm kiếm để tránh trigger nhiều API call
//         isSearchingRef.current = true;

//         return { ...prev, [key]: value };
//       });
//     },
//     [],
//   );

//   /**
//    * Reset all filters
//    */
//   const resetFilters = useCallback(() => {
//     setFilterValues({
//       username: '',
//       fullName: '',
//       role: undefined,
//       status: undefined,
//     });

//     // Reset về trang 1 khi clear bộ lọc
//     setPagination(prev => ({
//       ...prev,
//       page: 1
//     }));
//   }, []);

//   /**
//    * Handle user creation with loading state and optimized API calls
//    */
//   const handleCreateUser = useCallback(
//     async (data: Omit<TUserSchema, 'id'>) => {
//       // Prevent duplicate submissions
//       if (isSubmittingRef.current) return;

//       isSubmittingRef.current = true;
//       setLoading(true);
//       setError(null);

//       try {
//         const result = await createUserMutation.mutateAsync(data);
//         setLoading(false);
//         isSubmittingRef.current = false;
//         return result;
//       } catch (err) {
//         setLoading(false);
//         isSubmittingRef.current = false;
//         const error = err instanceof Error ? err : new Error(String(err));
//         setError(error);
//         throw error;
//       }
//     },
//     [createUserMutation],
//   );

//   /**
//    * Handle user update with loading state and optimized API calls
//    */
//   const handleUpdateUser = useCallback(
//     async (
//       id: string,
//       data: Partial<TUserSchema>,
//     ) => {
//       // Prevent duplicate submissions
//       if (isSubmittingRef.current) return;

//       isSubmittingRef.current = true;
//       setLoading(true);
//       setError(null);

//       try {
//         const result = await updateUserMutation.mutateAsync({ id, data });
//         setLoading(false);
//         isSubmittingRef.current = false;
//         return result;
//       } catch (err) {
//         setLoading(false);
//         isSubmittingRef.current = false;
//         const error = err instanceof Error ? err : new Error(String(err));
//         setError(error);
//         throw error;
//       }
//     },
//     [updateUserMutation],
//   );

//   /**
//    * Handle user deletion with loading state and optimized API calls
//    */
//   const handleDeleteUser = useCallback(
//     async (id: string) => {
//       // Prevent duplicate submissions
//       if (isSubmittingRef.current) return;

//       isSubmittingRef.current = true;
//       setLoading(true);
//       setError(null);

//       try {
//         const result = await deleteUserMutation.mutateAsync(id);

//         // If the deleted user was selected, deselect it
//         if (selectedUser?.id === id) {
//           setSelectedUser(null);
//         }

//         setLoading(false);
//         isSubmittingRef.current = false;
//         return result;
//       } catch (err) {
//         setLoading(false);
//         isSubmittingRef.current = false;
//         const error = err instanceof Error ? err : new Error(String(err));
//         setError(error);
//         throw error;
//       }
//     },
//     [deleteUserMutation, selectedUser],
//   );

//   /**
//    * Handle user status update
//    */
//   const handleUpdateUserStatus = useCallback(
//     async (id: string, status: UserStatusEnum) => {
//       // Prevent duplicate submissions
//       if (isSubmittingRef.current) return;

//       isSubmittingRef.current = true;
//       setLoading(true);
//       setError(null);

//       try {
//         const result = await updateUserStatusMutation.mutateAsync({ id, status });
//         setLoading(false);
//         isSubmittingRef.current = false;
//         return result;
//       } catch (err) {
//         setLoading(false);
//         isSubmittingRef.current = false;
//         const error = err instanceof Error ? err : new Error(String(err));
//         setError(error);
//         throw error;
//       }
//     },
//     [updateUserStatusMutation],
//   );

//   /**
//    * Reset error state
//    */
//   const resetError = useCallback(() => setError(null), []);

//   return {
//     // State
//     selectedUser,
//     loading,
//     error,
//     filterValues,
//     activeFilters,
//     pagination,

//     // Actions
//     setSelectedUser,
//     resetError,
//     updateFilter,
//     resetFilters,
//     setActiveFilters,
//     updatePagination,

//     // Handlers
//     handleCreateUser,
//     handleUpdateUser,
//     handleDeleteUser,
//     handleUpdateUserStatus,
//   };
// };