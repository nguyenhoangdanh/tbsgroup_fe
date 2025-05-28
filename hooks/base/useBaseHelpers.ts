import { useState, useCallback, useEffect, useRef } from 'react';

import { useDebounce } from '@/hooks/useDebounce';

// Type definitions for better type safety
export type PaginationState = {
  page: number;
  limit: number;
};

/**
 * Hook cơ sở cho các helper functions, có thể tái sử dụng cho bất kỳ module nào
 * Redesigned to prevent infinite loops and fix TypeScript errors
 */
export const useBaseHelpers = <T, FilterParams extends Record<string, any>>(
  defaultFilters: FilterParams,
  defaultPagination: PaginationState = { page: 1, limit: 10 },
) => {
  // Type for the combined state
  type FilterState = {
    values: FilterParams;
    active: FilterParams & PaginationState;
    pagination: PaginationState;
  };

  // State - using single state objects to reduce the number of state updates
  const [selectedItem, setSelectedItem] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Critical refs to prevent state update loops
  const filtersRef = useRef<FilterParams>({ ...defaultFilters });
  const paginationRef = useRef<PaginationState>({ ...defaultPagination });

  // Use a single state object for all filters to reduce state update frequency
  const [filterState, setFilterState] = useState<FilterState>({
    values: { ...defaultFilters },
    active: { ...defaultFilters, ...defaultPagination },
    pagination: { ...defaultPagination },
  });

  // Flag to track first render and other refs
  const isFirstRender = useRef(true);
  const isUpdatingRef = useRef(false);
  const isSubmittingRef = useRef(false);
  const updateCountRef = useRef(0);
  const debouncedUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);
  // Only allow a maximum of 50 updates per session
  const MAX_UPDATES = 50;

  // Clean up timers on unmount
  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      isUpdatingRef.current = false;

      if (debouncedUpdateTimeoutRef.current) {
        clearTimeout(debouncedUpdateTimeoutRef.current);
        debouncedUpdateTimeoutRef.current = null;
      }
    };
  }, []);

  // Apply initial values on first render only
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;

      // Reset update count for a new session
      updateCountRef.current = 0;

      // Initialize refs
      filtersRef.current = { ...defaultFilters };
      paginationRef.current = { ...defaultPagination };

      // Set initial state
      setFilterState({
        values: { ...defaultFilters },
        active: { ...defaultFilters, ...defaultPagination },
        pagination: { ...defaultPagination },
      });
    }

    // Cleanup on unmount
    return () => {
      isUpdatingRef.current = false;
    };
  }, []);

  // Debounce string filter values only
  const debouncedFilters = Object.entries(filterState.values).reduce<Record<string, any>>(
    (acc, [key, value]) => {
      // Only debounce string values
      if (typeof value === 'string') {
        acc[key] = useDebounce(value, 300);
      } else {
        acc[key] = value;
      }
      return acc;
    },
    {} as Record<string, any>,
  ) as FilterParams;

  // Update active filters when debounced values change
  useEffect(() => {
    // Skip if currently updating to prevent loops
    if (isUpdatingRef.current) return;

    // Limit total number of updates to prevent infinite loops
    if (updateCountRef.current >= MAX_UPDATES) {
      console.warn(`Exceeded maximum updates (${MAX_UPDATES}) in useBaseHelpers`);
      return;
    }

    updateCountRef.current++;
    isUpdatingRef.current = true;

    try {
      // Check if actual filter values have changed
      const hasFilterChanged = Object.keys(defaultFilters).some(
        key => debouncedFilters[key] !== filtersRef.current[key],
      );

      // Update filter ref
      filtersRef.current = { ...debouncedFilters };

      // Reset to page 1 if filters changed
      let newPagination = { ...filterState.pagination };
      if (hasFilterChanged) {
        newPagination = { ...newPagination, page: 1 };
        paginationRef.current = { ...paginationRef.current, page: 1 };
      }

      // Update state in a single batch with proper typing
      setFilterState(prev => ({
        values: filtersRef.current,
        pagination: newPagination,
        active: {
          ...filtersRef.current,
          ...newPagination,
        },
      }));
    } finally {
      // Use RAF to ensure this happens after React rendering is complete
      requestAnimationFrame(() => {
        isUpdatingRef.current = false;
      });
    }
  }, [debouncedFilters, defaultFilters]);

  /**
   * Update filter values safely
   */
  const updateFilter = useCallback((key: keyof FilterParams, value: any) => {
    // Prevent updates if we've hit the limit
    if (updateCountRef.current >= MAX_UPDATES) {
      console.warn(`Skipped filter update: exceeded maximum updates (${MAX_UPDATES})`);
      return;
    }

    // Skip update if value hasn't changed
    if (filtersRef.current[key] === value) return;

    // Update filter value directly in the ref
    filtersRef.current = {
      ...filtersRef.current,
      [key]: value,
    };

    // Then update the state
    setFilterState(prev => ({
      ...prev,
      values: { ...filtersRef.current },
    }));
  }, []);

  /**
   * Update pagination safely
   */
  const updatePagination = useCallback((page: number, limit?: number) => {
    // Prevent updates if we've hit the limit
    if (updateCountRef.current >= MAX_UPDATES) {
      console.warn(`Skipped pagination update: exceeded maximum updates (${MAX_UPDATES})`);
      return;
    }

    // Skip if values haven't changed
    const newLimit = limit ?? paginationRef.current.limit;
    if (paginationRef.current.page === page && paginationRef.current.limit === newLimit) {
      return;
    }

    // Update the pagination ref first
    paginationRef.current = {
      page,
      limit: newLimit,
    };

    // Then update the state once
    setFilterState(prev => ({
      ...prev,
      pagination: { ...paginationRef.current },
      active: {
        ...prev.active,
        ...paginationRef.current,
      },
    }));
  }, []);

  /**
   * Reset all filters safely
   */
  const resetFilters = useCallback(() => {
    // Prevent updates if we've hit the limit
    if (updateCountRef.current >= MAX_UPDATES) {
      console.warn(`Skipped filter reset: exceeded maximum updates (${MAX_UPDATES})`);
      return;
    }

    // Update refs directly
    filtersRef.current = { ...defaultFilters };
    paginationRef.current = {
      ...paginationRef.current,
      page: 1, // Reset to page 1
    };

    // Then update state once
    setFilterState({
      values: { ...defaultFilters },
      pagination: { ...paginationRef.current },
      active: {
        ...defaultFilters,
        ...paginationRef.current,
      },
    });
  }, [defaultFilters]);

  /**
   * Reset error state
   */
  const resetError = useCallback(() => setError(null), []);

  // Public interface - expose only what's needed
  return {
    // State
    selectedItem,
    loading,
    error,
    filterValues: filterState.values,
    activeFilters: filterState.active,
    pagination: filterState.pagination,

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
