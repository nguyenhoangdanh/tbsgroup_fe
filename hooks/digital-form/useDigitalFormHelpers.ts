// hooks/useDigitalFormHelpers-fixed.ts
import { useState, useCallback, useEffect, useRef } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { 
  TDigitalFormCond, 
  TPaginationParams 
} from '@/schemas/digital-form.schema';

/**
 * Hook for digital form-related helper functions and state management
 * Simplified version with better performance and fewer dependencies
 */
export const useDigitalFormHelpers = () => {
  // Define default filter values
  const defaultFilters: TDigitalFormCond = {
    factoryId: undefined,
    lineId: undefined,
    teamId: undefined,
    groupId: undefined,
    createdById: undefined,
    status: undefined,
    dateFrom: undefined,
    dateTo: undefined,
    shiftType: undefined,
    search: '',
  };

  // Define default pagination values
  const defaultPagination: TPaginationParams = {
    page: 1,
    limit: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  };
  
  // State management with simpler approach
  const [filterValues, setFilterValues] = useState<TDigitalFormCond>({...defaultFilters});
  const [pagination, setPagination] = useState<TPaginationParams>({...defaultPagination});
  const [activeFilters, setActiveFilters] = useState<TDigitalFormCond & TPaginationParams>({
    ...defaultFilters,
    ...defaultPagination
  });
  const [selectedForm, setSelectedForm] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  // Track if component is mounted
  const isMountedRef = useRef(true);
  
  // Use refs only for operations that shouldn't trigger re-renders
  const operationsRef = useRef({
    isSubmitting: false,
    isSearching: false,
  });
  
  // Setup and cleanup effect
  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  
  // Debounce search input
  const debouncedSearch = useDebounce(filterValues.search || '', 300);
  
  // Update active filters when debounced values change
  useEffect(() => {
    // Only update if the component is still mounted
    if (!isMountedRef.current) return;

     // Kiểm tra xem có thay đổi thực sự không trước khi cập nhật state
  const searchChanged = debouncedSearch !== activeFilters.search;
  const filterChanged = 
    filterValues.factoryId !== activeFilters.factoryId ||
    filterValues.lineId !== activeFilters.lineId ||
    filterValues.teamId !== activeFilters.teamId ||
    filterValues.groupId !== activeFilters.groupId ||
    filterValues.createdById !== activeFilters.createdById ||
    filterValues.status !== activeFilters.status ||
    filterValues.dateFrom !== activeFilters.dateFrom ||
    filterValues.dateTo !== activeFilters.dateTo ||
    filterValues.shiftType !== activeFilters.shiftType;
  
  // Chỉ cập nhật khi thực sự có thay đổi
  if (!searchChanged && !filterChanged) return;
    
    // Create a new object with combined filter and pagination values
    const newActiveFilters = {
      ...filterValues,
      ...pagination,
      search: debouncedSearch // Use debounced search value
    };
    
    // // Reset to page 1 when filters change (except for pagination changes)
    // if (debouncedSearch !== activeFilters.search ||
    //     filterValues.factoryId !== activeFilters.factoryId ||
    //     filterValues.lineId !== activeFilters.lineId ||
    //     filterValues.teamId !== activeFilters.teamId ||
    //     filterValues.groupId !== activeFilters.groupId ||
    //     filterValues.createdById !== activeFilters.createdById ||
    //     filterValues.status !== activeFilters.status ||
    //     filterValues.dateFrom !== activeFilters.dateFrom ||
    //     filterValues.dateTo !== activeFilters.dateTo ||
    //     filterValues.shiftType !== activeFilters.shiftType) {
      
    //   newActiveFilters.page = 1;
      
    //   // Also update pagination state if page changed
    //   if (pagination.page !== 1) {
    //     setPagination(prev => ({
    //       ...prev,
    //       page: 1
    //     }));
    //   }
    // }
    
    // setActiveFilters(newActiveFilters);
    
    // Reset to page 1 when filters change (except for pagination changes)
  if (searchChanged || filterChanged) {
    newActiveFilters.page = 1;
    
    // Also update pagination state if page changed
    if (pagination.page !== 1) {
      setPagination(prev => ({
        ...prev,
        page: 1
      }));
    }
  }
  
  // Cập nhật active filters chỉ khi cần thiết
  setActiveFilters(newActiveFilters);
  }, [
    debouncedSearch,
    filterValues,
    pagination,
  ]);

  /**
   * Update filter values safely
   */
  const updateFilter = useCallback((key: keyof TDigitalFormCond, value: any) => {
    // Skip update if value hasn't changed
    if (filterValues[key] === value) return;
    
    // Update filter values state
    setFilterValues(prev => ({
      ...prev,
      [key]: value
    }));
  }, [filterValues]);

  /**
   * Update pagination safely
   */
  const updatePagination = useCallback((updates: Partial<TPaginationParams>) => {
    // Skip if no actual changes
    const hasChanges = Object.entries(updates).some(
      ([key, value]) => pagination[key as keyof TPaginationParams] !== value
    );
    
    if (!hasChanges) return;
    
    // Update pagination state
    setPagination(prev => ({
      ...prev,
      ...updates
    }));
  }, [pagination]);

  /**
   * Reset all filters
   */
  const resetFilters = useCallback(() => {
    // Reset filters to defaults
    setFilterValues({...defaultFilters});
    setPagination({...defaultPagination});
    
    // Full reset of active filters
    setActiveFilters({
      ...defaultFilters,
      ...defaultPagination
    });
  }, []);

  /**
   * Reset error state
   */
  const resetError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // State
    selectedForm,
    loading,
    error,
    filterValues,
    activeFilters,
    pagination,

    // Setters
    setSelectedForm,
    setLoading,
    setError,

    // Actions
    resetError,
    updateFilter,
    resetFilters,
    updatePagination,

    // Refs for other components to check
    isSubmitting: operationsRef.current.isSubmitting,
  };
};