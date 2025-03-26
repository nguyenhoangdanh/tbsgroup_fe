import { useState, useCallback, useEffect, useRef } from 'react';
import { useDebounce } from '@/hooks/useDebounce';

/**
 * Hook cơ sở cho các helper functions, có thể tái sử dụng cho bất kỳ module nào
 */
export const useBaseHelpers = <T, FilterParams extends Record<string, any>>(
  defaultFilters: FilterParams,
  defaultPagination = { page: 1, limit: 10 }
) => {
  // State
  const [selectedItem, setSelectedItem] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [filterValues, setFilterValues] = useState<FilterParams>(defaultFilters);
  const [pagination, setPagination] = useState(defaultPagination);

  // Prevent duplicate operations
  const isSubmittingRef = useRef(false);
  const isSearchingRef = useRef(false);

  // Debounce filter values that need it (assuming they're all string values for simplicity)
  // Fix: Specify the explicit type for accumulator and use Record instead of generic FilterParams
  const debouncedFilterValues = Object.keys(filterValues).reduce<Record<string, any>>((acc, key) => {
    if (typeof filterValues[key] === 'string') {
      acc[key] = useDebounce(filterValues[key], 300);
    } else {
      acc[key] = filterValues[key];
    }
    return acc;
  }, {} as Record<string, any>) as FilterParams; // Cast back to FilterParams at the end

  // Combined filters with debounced values
  const [activeFilters, setActiveFilters] = useState({
    ...defaultFilters,
    ...defaultPagination,
  });

  // Ref to track if filters have changed (for pagination reset)
  const previousFiltersRef = useRef({...defaultFilters});

  // Update pagination
  const updatePagination = useCallback((page: number, limit: number) => {
    setPagination(prev => {
      // Avoid unnecessary renders
      if (prev.page === page && prev.limit === limit) {
        return prev;
      }
      return { page, limit };
    });
  }, []);

  // Update active filters when debounced values change
  useEffect(() => {
    // Check if filters have changed
    const hasFilterChanged = Object.keys(defaultFilters).some(
      key => debouncedFilterValues[key] !== previousFiltersRef.current[key]
    );

    // Save current filter values for next comparison
    previousFiltersRef.current = { ...debouncedFilterValues };

    // If filters changed, reset to page 1
    const newPage = hasFilterChanged ? 1 : pagination.page;

    // Update active filters
    setActiveFilters(prev => ({
      ...prev,
      ...debouncedFilterValues,
      page: newPage,
      limit: pagination.limit,
    }));

    // If filters changed, synchronize pagination state
    if (hasFilterChanged && pagination.page !== 1) {
      setPagination(prev => ({
        ...prev,
        page: 1,
      }));
    }
  }, [debouncedFilterValues, defaultFilters, pagination.page, pagination.limit]);

  // Sync pagination changes to active filters
  useEffect(() => {
    setActiveFilters(prev => {
      // Check if any change is needed
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
   */
  const updateFilter = useCallback(
    (key: keyof FilterParams, value: any) => {
      setFilterValues(prev => {
        // If value hasn't changed, don't trigger re-render
        if (prev[key] === value) return prev;

        // Flag searching to avoid triggering multiple API calls
        isSearchingRef.current = true;

        return { ...prev, [key]: value };
      });
    },
    []
  );

  /**
   * Reset all filters
   */
  const resetFilters = useCallback(() => {
    setFilterValues(defaultFilters);
    
    // Reset to page 1 when clearing filters
    setPagination(prev => ({
      ...prev,
      page: 1
    }));
  }, [defaultFilters]);

  /**
   * Reset error state
   */
  const resetError = useCallback(() => setError(null), []);

  return {
    // State
    selectedItem,
    loading,
    error,
    filterValues,
    activeFilters,
    pagination,

    // Setters
    setSelectedItem,
    setLoading,
    setError,

    // Actions
    resetError,
    updateFilter,
    resetFilters,
    updatePagination,

    // Refs
    isSubmittingRef,
  };
};