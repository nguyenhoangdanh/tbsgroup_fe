import { useState, useCallback, useEffect, useRef } from 'react';
import { useDebounce } from '@/hooks/useDebounce';

// Type definitions for better type safety
export type PaginationState = {
  page: number;
  limit: number;
};

/**
 * Hook cơ sở cho các helper functions, có thể tái sử dụng cho bất kỳ module nào
 * Completely rewritten to prevent infinite loops and memory leaks
 */
export const useBaseHelpers = <T, FilterParams extends Record<string, any>>(
  defaultFilters: FilterParams,
  defaultPagination: PaginationState = { page: 1, limit: 10 }
) => {
  // Type for the combined state
  type FilterState = {
    values: FilterParams;
    active: FilterParams & PaginationState;
    pagination: PaginationState;
  };

  // Track component mount state
  const isMountedRef = useRef(true);
  
  // Initialize refs on first render only
  const initializedRef = useRef(false);
  
  // Critical refs to prevent state update loops
  const filtersRef = useRef<FilterParams>({...defaultFilters});
  const paginationRef = useRef<PaginationState>({...defaultPagination});
  
  // Flags to track render state and prevent loops
  const isUpdatingRef = useRef(false);
  const isSubmittingRef = useRef(false);
  const updateCountRef = useRef(0);
  const debounceTriggerRef = useRef(0);
  const pendingTimeoutsRef = useRef<Set<NodeJS.Timeout>>(new Set());
  
  // Only allow a maximum number of updates to prevent infinite loops
  const MAX_UPDATES = 200; // Increased limit
  const operationTypeCountsRef = useRef<Record<string, number>>({});

  // State management with proper initialization
  const [selectedItem, setSelectedItem] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Special refs just for reset operations
const resetCountRef = useRef(0);
const isResettingRef = useRef(false);

  // Initialize state only once with proper defaults
  const [filterState, setFilterState] = useState<FilterState>(() => ({
    values: {...defaultFilters},
    active: {...defaultFilters, ...defaultPagination},
    pagination: {...defaultPagination}
  }));
  
  // Setup and cleanup effect
  useEffect(() => {
    isMountedRef.current = true;
    
    // Initialize refs on first mount only
    if (!initializedRef.current) {
      initializedRef.current = true;
      updateCountRef.current = 0;
      filtersRef.current = {...defaultFilters};
      paginationRef.current = {...defaultPagination};
    }
    
    // Clear all timeouts on unmount
    return () => {
      isMountedRef.current = false;
      isUpdatingRef.current = false;
      
      // Clear all pending timeouts
      pendingTimeoutsRef.current.forEach(timeoutId => {
        clearTimeout(timeoutId);
      });
      pendingTimeoutsRef.current.clear();
    };
  }, [defaultFilters, defaultPagination]);

  // Safely create a timeout that will be cleaned up
  const safeTimeout = useCallback((callback: () => void, delay: number): void => {
    if (!isMountedRef.current) return;
    
    const timeoutId = setTimeout(() => {
      if (isMountedRef.current) {
        pendingTimeoutsRef.current.delete(timeoutId);
        callback();
      }
    }, delay);
    
    pendingTimeoutsRef.current.add(timeoutId);
  }, []);
  
  // Track operations to prevent infinite loops, with type tracking
  const incrementOperationCount = useCallback((operationType = 'general') => {
    // Increment global counter
    updateCountRef.current++;
    
    // Initialize and increment type counter
    if (!operationTypeCountsRef.current[operationType]) {
      operationTypeCountsRef.current[operationType] = 0;
    }
    operationTypeCountsRef.current[operationType]++;
    
    // Only warn and limit if we're way over the limit
    if (updateCountRef.current > MAX_UPDATES) {
      console.warn(`Exceeded maximum operations (${MAX_UPDATES}) in useBaseHelpers [${operationType}]`);
      return false;
    }
    
    // For most operation types, be more lenient
    const typeLimit = operationType === 'filter_reset' ? 10 : 100;
    if (operationTypeCountsRef.current[operationType] > typeLimit) {
      console.warn(`Exceeded maximum operations for type ${operationType} (${typeLimit})`);
      return false;
    }
    
    return true;
  }, []);

  // Debounce string filter values only
  const debouncedFilters = Object.entries(filterState.values).reduce<Record<string, any>>(
    (acc, [key, value]) => {
      // Only debounce string values that need it
      if (typeof value === 'string') {
        acc[key] = useDebounce(value, 300);
      } else {
        acc[key] = value;
      }
      return acc;
    }, 
    {} as Record<string, any>
  ) as FilterParams;
  
  // Update active filters when debounced values change, with safeguards
  useEffect(() => {
    // Skip if not mounted, updating, or exceeded max updates
    if (!isMountedRef.current || isUpdatingRef.current || updateCountRef.current >= MAX_UPDATES) return;
    
    // Use a unique trigger ID to prevent stale closures
    const triggerID = ++debounceTriggerRef.current;
    
    // Set updating flag
    isUpdatingRef.current = true;
    
    // Batch update with timeout to reduce render frequency
    safeTimeout(() => {
      // Skip if no longer the most recent trigger or not mounted
      if (triggerID !== debounceTriggerRef.current || !isMountedRef.current) {
        isUpdatingRef.current = false;
        return;
      }
      
      try {
        // Track this as an operation
        if (!incrementOperationCount()) {
          isUpdatingRef.current = false;
          return;
        }
        
        // Check if actual filter values have changed using deep comparison
        const hasFilterChanged = Object.keys(defaultFilters).some(
          key => debouncedFilters[key] !== filtersRef.current[key]
        );
        
        // Only update if something changed
        if (hasFilterChanged) {
          // Update reference first
          filtersRef.current = {...debouncedFilters};
          
          // Reset to page 1 when filter changes
          let newPagination = {...filterState.pagination};
          if (hasFilterChanged) {
            newPagination = { ...newPagination, page: 1 };
            paginationRef.current = {...paginationRef.current, page: 1};
          }
          
          // Update state in a single batch
          setFilterState(prev => ({
            values: {...filtersRef.current},
            pagination: newPagination,
            active: {
              ...filtersRef.current,
              ...newPagination
            }
          }));
        }
      } finally {
        // Clear updating flag after state update is processed
        safeTimeout(() => {
          isUpdatingRef.current = false;
        }, 0);
      }
    }, 50);
    
  }, [debouncedFilters, defaultFilters, incrementOperationCount, safeTimeout]);

  /**
   * Update filter values safely with proper validation
   */
  const updateFilter = useCallback((key: keyof FilterParams, value: any) => {
    // Skip if not mounted or exceeded max updates
    if (!isMountedRef.current || !incrementOperationCount('update_filter')) {
      return;
    }
    
    // Skip update if value hasn't changed (performance optimization)
    if (filtersRef.current[key] === value) return;
    
    // Update filter reference first
    filtersRef.current = {
      ...filtersRef.current,
      [key]: value
    };
    
    // Then update the state (will trigger the effect)
    if (isMountedRef.current) {
      setFilterState(prev => ({
        ...prev,
        values: {...filtersRef.current}
      }));
    }
  }, [incrementOperationCount]);

  /**
   * Update pagination safely with validation and proper synchronization
   */
  const updatePagination = useCallback((page: number, limit?: number) => {
    // Skip if not mounted or exceeded max updates
    if (!isMountedRef.current || !incrementOperationCount('update_pagination')) {
      return;
    }
    
    // Get new limit value
    const newLimit = limit ?? paginationRef.current.limit;
    
    // Skip if values haven't changed (performance optimization)
    if (paginationRef.current.page === page && paginationRef.current.limit === newLimit) {
      return;
    }
    
    // Update pagination reference first
    paginationRef.current = {
      page,
      limit: newLimit
    };
    
    // Then update the state as a single operation
    if (isMountedRef.current) {
      setFilterState(prev => ({
        ...prev,
        pagination: {...paginationRef.current},
        active: {
          ...prev.active,
          ...paginationRef.current
        }
      }));
    }
  }, [incrementOperationCount]);

  /**
   * Reset all filters safely with proper validation
   */
  const resetFilters = useCallback(() => {
    // Use a separate counter for reset operations that doesn't impact other operations
    // This allows us to strictly limit filter resets without affecting other functionality
    if (!resetCountRef.current) {
      resetCountRef.current = 0;
    }
    
    resetCountRef.current++;
    
    // Special limit just for resets - much stricter
    const RESET_LIMIT = 5;
    
    if (resetCountRef.current > RESET_LIMIT) {
      console.warn(`Skipped filter reset: exceeded dedicated reset limit (${RESET_LIMIT})`);
      return;
    }
    
    // Skip if not mounted
    if (!isMountedRef.current) return;
    
    // Guard against concurrent resets
    if (isResettingRef.current) {
      console.log("Reset already in progress, skipping");
      return;
    }
    
    try {
      // Mark reset as in progress to prevent concurrent resets
      isResettingRef.current = true;
      
      // Reset refs first
      filtersRef.current = {...defaultFilters};
      paginationRef.current = {
        ...paginationRef.current,
        page: 1  // Always reset to page 1
      };
      
      // Create a local stable copy to prevent dependencies on mutable objects
      const resetFilterValues = {...defaultFilters};
      const resetPaginationValues = {...paginationRef.current};
      
      // Schedule state update with delay to avoid React update cycles
      const timeoutId = setTimeout(() => {
        if (isMountedRef.current) {
          // Use functional update to ensure we're working with latest state
          setFilterState(prevState => ({
            values: resetFilterValues,
            pagination: resetPaginationValues,
            active: {
              ...resetFilterValues,
              ...resetPaginationValues
            }
          }));
          
          // Clear reset flag after update is processed
          setTimeout(() => {
            isResettingRef.current = false;
          }, 50);
        }
      }, 50);
      
      pendingTimeoutsRef.current.add(timeoutId);
      
      return () => {
        clearTimeout(timeoutId);
        pendingTimeoutsRef.current.delete(timeoutId);
      };
    } catch (error) {
      console.error("Error in resetFilters:", error);
      isResettingRef.current = false;
    }
  }, [defaultFilters]);

  /**
   * Reset error state safely
   */
  const resetError = useCallback(() => {
    if (isMountedRef.current && incrementOperationCount('reset_error')) {
      setError(null);
    }
  }, [incrementOperationCount]);

  useEffect(() => {
    isMountedRef.current = true;
    resetCountRef.current = 0;

    return () => {
      isMountedRef.current = false;
      isResettingRef.current = false;
      
      // Clear all pending timeouts
      pendingTimeoutsRef.current.forEach(timeoutId => {
        clearTimeout(timeoutId);
      });
      pendingTimeoutsRef.current.clear();
    };
  }, []);

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



































// import { useState, useCallback, useEffect, useRef } from 'react';
// import { useDebounce } from '@/hooks/useDebounce';

// // Type definitions for better type safety
// export type PaginationState = {
//   page: number;
//   limit: number;
// };

// /**
//  * Hook cơ sở cho các helper functions, có thể tái sử dụng cho bất kỳ module nào
//  * Redesigned to prevent infinite loops and fix TypeScript errors
//  */
// export const useBaseHelpers = <T, FilterParams extends Record<string, any>>(
//   defaultFilters: FilterParams,
//   defaultPagination: PaginationState = { page: 1, limit: 10 }
// ) => {
//   // Type for the combined state
//   type FilterState = {
//     values: FilterParams;
//     active: FilterParams & PaginationState;
//     pagination: PaginationState;
//   };

//   // State - using single state objects to reduce the number of state updates
//   const [selectedItem, setSelectedItem] = useState<T | null>(null);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState<Error | null>(null);
  
//   // Critical refs to prevent state update loops
//   const filtersRef = useRef<FilterParams>({...defaultFilters});
//   const paginationRef = useRef<PaginationState>({...defaultPagination});
  
//   // Use a single state object for all filters to reduce state update frequency
//   const [filterState, setFilterState] = useState<FilterState>({
//     values: {...defaultFilters},
//     active: {...defaultFilters, ...defaultPagination},
//     pagination: {...defaultPagination}
//   });
  
//   // Flag to track first render and other refs
//   const isFirstRender = useRef(true);
//   const isUpdatingRef = useRef(false);
//   const isSubmittingRef = useRef(false);
//   const updateCountRef = useRef(0);
//   const debouncedUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
//   const isMountedRef = useRef(true); 
//   // Only allow a maximum of 50 updates per session
//   const MAX_UPDATES = 50;


//    // Clean up timers on unmount
//    useEffect(() => {
//     isMountedRef.current = true;

//     return () => {
//       isMountedRef.current = false;
//       isUpdatingRef.current = false;
      
//       if (debouncedUpdateTimeoutRef.current) {
//         clearTimeout(debouncedUpdateTimeoutRef.current);
//         debouncedUpdateTimeoutRef.current = null;
//       }
//     };
//   }, []);
  
//   // Apply initial values on first render only
//   useEffect(() => {
//     if (isFirstRender.current) {
//       isFirstRender.current = false;
      
//       // Reset update count for a new session
//       updateCountRef.current = 0;
      
//       // Initialize refs
//       filtersRef.current = {...defaultFilters};
//       paginationRef.current = {...defaultPagination};
      
//       // Set initial state
//       setFilterState({
//         values: {...defaultFilters},
//         active: {...defaultFilters, ...defaultPagination},
//         pagination: {...defaultPagination}
//       });
//     }
    
//     // Cleanup on unmount
//     return () => {
//       isUpdatingRef.current = false;
//     };
//   }, []);

//   // Debounce string filter values only
//   const debouncedFilters = Object.entries(filterState.values).reduce<Record<string, any>>(
//     (acc, [key, value]) => {
//       // Only debounce string values
//       if (typeof value === 'string') {
//         acc[key] = useDebounce(value, 300);
//       } else {
//         acc[key] = value;
//       }
//       return acc;
//     }, 
//     {} as Record<string, any>
//   ) as FilterParams;
  
//   // Update active filters when debounced values change
//   useEffect(() => {
//     // Skip if currently updating to prevent loops
//     if (isUpdatingRef.current) return;
    
//     // Limit total number of updates to prevent infinite loops
//     if (updateCountRef.current >= MAX_UPDATES) {
//       console.warn(`Exceeded maximum updates (${MAX_UPDATES}) in useBaseHelpers`);
//       return;
//     }
    
//     updateCountRef.current++;
//     isUpdatingRef.current = true;
    
//     try {
//       // Check if actual filter values have changed
//       const hasFilterChanged = Object.keys(defaultFilters).some(
//         key => debouncedFilters[key] !== filtersRef.current[key]
//       );
      
//       // Update filter ref
//       filtersRef.current = {...debouncedFilters};
      
//       // Reset to page 1 if filters changed
//       let newPagination = {...filterState.pagination};
//       if (hasFilterChanged) {
//         newPagination = { ...newPagination, page: 1 };
//         paginationRef.current = {...paginationRef.current, page: 1};
//       }
      
//       // Update state in a single batch with proper typing
//       setFilterState(prev => ({
//         values: filtersRef.current,
//         pagination: newPagination,
//         active: {
//           ...filtersRef.current,
//           ...newPagination
//         }
//       }));
//     } finally {
//       // Use RAF to ensure this happens after React rendering is complete
//       requestAnimationFrame(() => {
//         isUpdatingRef.current = false;
//       });
//     }
//   }, [debouncedFilters, defaultFilters]);

//   /**
//    * Update filter values safely
//    */
//   const updateFilter = useCallback((key: keyof FilterParams, value: any) => {
//     // Prevent updates if we've hit the limit
//     if (updateCountRef.current >= MAX_UPDATES) {
//       console.warn(`Skipped filter update: exceeded maximum updates (${MAX_UPDATES})`);
//       return;
//     }
    
//     // Skip update if value hasn't changed
//     if (filtersRef.current[key] === value) return;
    
//     // Update filter value directly in the ref
//     filtersRef.current = {
//       ...filtersRef.current,
//       [key]: value
//     };
    
//     // Then update the state
//     setFilterState(prev => ({
//       ...prev,
//       values: {...filtersRef.current}
//     }));
//   }, []);

//   /**
//    * Update pagination safely
//    */
//   const updatePagination = useCallback((page: number, limit?: number) => {
//     // Prevent updates if we've hit the limit
//     if (updateCountRef.current >= MAX_UPDATES) {
//       console.warn(`Skipped pagination update: exceeded maximum updates (${MAX_UPDATES})`);
//       return;
//     }
    
//     // Skip if values haven't changed
//     const newLimit = limit ?? paginationRef.current.limit;
//     if (paginationRef.current.page === page && paginationRef.current.limit === newLimit) {
//       return;
//     }
    
//     // Update the pagination ref first
//     paginationRef.current = {
//       page,
//       limit: newLimit
//     };
    
//     // Then update the state once
//     setFilterState(prev => ({
//       ...prev,
//       pagination: {...paginationRef.current},
//       active: {
//         ...prev.active,
//         ...paginationRef.current
//       }
//     }));
//   }, []);

//   /**
//    * Reset all filters safely
//    */
//   const resetFilters = useCallback(() => {
//     // Prevent updates if we've hit the limit
//     if (updateCountRef.current >= MAX_UPDATES) {
//       console.warn(`Skipped filter reset: exceeded maximum updates (${MAX_UPDATES})`);
//       return;
//     }
    
//     // Update refs directly
//     filtersRef.current = {...defaultFilters};
//     paginationRef.current = {
//       ...paginationRef.current,
//       page: 1 // Reset to page 1
//     };
    
//     // Then update state once
//     setFilterState({
//       values: {...defaultFilters},
//       pagination: {...paginationRef.current},
//       active: {
//         ...defaultFilters,
//         ...paginationRef.current
//       }
//     });
//   }, [defaultFilters]);

//   /**
//    * Reset error state
//    */
//   const resetError = useCallback(() => setError(null), []);

//   // Public interface - expose only what's needed
//   return {
//     // State
//     selectedItem,
//     loading,
//     error,
//     filterValues: filterState.values,
//     activeFilters: filterState.active,
//     pagination: filterState.pagination,

//     // Setters
//     setSelectedItem,
//     setLoading,
//     setError,

//     // Actions
//     resetError,
//     updateFilter,
//     resetFilters,
//     updatePagination,

//     // Refs
//     isSubmittingRef,
//   };
// };





















