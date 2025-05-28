'use client';

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useRef,
  useEffect,
} from 'react';

import { useBagGroupRateMutations } from './useBagGroupRateMutations';
import { useBagGroupRateQueries } from './useBagGroupRateQueries';

import {
  BagGroupRateCreateDTO,
  BatchCreateBagGroupRateDTO,
} from '@/apis/group/bagGroupRate/bag-group-rate.api';
import { BagGroupRate } from '@/common/interface/bag-group-rate';
import { toast } from 'react-toast-kit';
import { BasePaginationParams } from '@/hooks/base/useBaseQueries';
import { useGroupQueries } from '@/hooks/group/useGroupQueries';
import { useHandBagQueries } from '@/hooks/handbag/useHandBagQueries';

// Define type for filter conditions
export interface BagGroupRateCondDTO {
  handBagId?: string;
  groupId?: string;
  active?: boolean;
}

// Define context type
interface BagGroupRateContextType {
  // State
  loading: boolean;
  activeFilters: BagGroupRateCondDTO & BasePaginationParams;
  stats: {
    totalRates: number;
    averageOutputRate: number;
    highestOutputRate: number;
    lowestOutputRate: number;
  };
  bagGroupRates: BagGroupRate[];
  handBags: any[];
  groups: any[];
  isLoading: boolean;
  calculatedPaginationMeta: {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    pageSize: number;
  };
  initialPageIndex: number;

  // Actions
  handleCreateBagGroupRate: (dto: any) => Promise<BagGroupRate>;
  handleBatchCreateBagGroupRates: (dto: BatchCreateBagGroupRateDTO) => Promise<string[]>;
  handleUpdateBagGroupRate: (id: string, updateData: any) => Promise<BagGroupRate>;
  handleDeleteBagGroupRate: (id: string) => Promise<void>;
  handleBagGroupRateFormSubmit: (data: any) => Promise<boolean>;
  handlePageChange: (pageIndex: number, pageSize: number) => void;
  resetFilters: () => void;
  filterByHandBag: (handBagId: string | null) => void;
  filterByGroup: (groupId: string | null) => void;
  filterByActive: (active: boolean | null) => void;
  safeRefetch: () => void;
  getProductivityAnalysis: (handBagId: string) => Promise<any>;
}

// Create context
const BagGroupRateContext = createContext<BagGroupRateContextType | undefined>(undefined);

// Max operations to prevent infinite loops
const MAX_OPERATIONS = 200;

export const BagGroupRateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Get queries and mutations
  const {
    listBagGroupRates,
    getBagGroupRateById,
    getProductivityAnalysis: fetchProductivityAnalysis,
    invalidateBagGroupRateCache,
    invalidateBagGroupRatesCache,
  } = useBagGroupRateQueries();

  const { listHandBags } = useHandBagQueries();
  const { listGroups } = useGroupQueries();

  const {
    createBagGroupRateMutation,
    batchCreateBagGroupRatesMutation,
    updateBagGroupRateMutation,
    deleteBagGroupRateMutation,
    onBagGroupRateMutationSuccess,
  } = useBagGroupRateMutations();

  // State management
  const [loading, setLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(true);

  // Stats for dashboard cards
  const [stats, setStats] = useState({
    totalRates: 0,
    averageOutputRate: 0,
    highestOutputRate: 0,
    lowestOutputRate: 0,
  });

  // Initial active filters
  const [activeFilters, setActiveFilters] = useState<BagGroupRateCondDTO & BasePaginationParams>({
    page: 1,
    limit: 10,
    handBagId: undefined,
    groupId: undefined,
    active: true,
  });

  // Filter trackers
  const [filterTrackers, setFilterTrackers] = useState({
    page: activeFilters.page || 1,
    limit: activeFilters.limit || 10,
    handBagId: activeFilters.handBagId,
    groupId: activeFilters.groupId,
    active: activeFilters.active,
  });

  // Refs for preventing loops and handling state updates safely
  const prevActiveFiltersRef = useRef({ ...activeFilters });
  const isUpdatingTrackersRef = useRef(false);
  const refetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isSubmittingRef = useRef(false);
  const pendingRequestsRef = useRef(new Set<string>());
  const isUpdatingPaginationRef = useRef(false);
  const shouldRefetchRef = useRef(false);
  const operationCountRef = useRef(0);
  const syncingRef = useRef(false);
  const operationTypeCountsRef = useRef<Record<string, number>>({});

  // Cleanup on unmount
  useEffect(() => {
    operationCountRef.current = 0;
    setIsMounted(true);

    return () => {
      setIsMounted(false);
      if (refetchTimeoutRef.current) {
        clearTimeout(refetchTimeoutRef.current);
      }
      pendingRequestsRef.current.clear();
      isSubmittingRef.current = false;
      isUpdatingPaginationRef.current = false;
      shouldRefetchRef.current = false;
      isUpdatingTrackersRef.current = false;
      operationCountRef.current = 0;
      syncingRef.current = false;
    };
  }, []);

  // Count operations to prevent infinite loops, with type tracking
  const incrementOperationCount = useCallback((operationType = 'general') => {
    // Increment global counter
    operationCountRef.current++;

    // Initialize and increment type counter
    if (!operationTypeCountsRef.current[operationType]) {
      operationTypeCountsRef.current[operationType] = 0;
    }
    operationTypeCountsRef.current[operationType]++;

    // Only warn and limit if we're way over the limit
    if (operationCountRef.current > MAX_OPERATIONS) {
      console.warn(
        `Exceeded maximum operations (${MAX_OPERATIONS}) in BagGroupRateContext [${operationType}]`,
      );
      return false;
    }

    // Most operation types allow more operations
    const typeLimit = operationType === 'effect' ? 50 : 100;
    if (operationTypeCountsRef.current[operationType] > typeLimit) {
      console.warn(`Exceeded maximum operations for type ${operationType} (${typeLimit})`);
      return false;
    }

    return true;
  }, []);

  // Update trackers when activeFilters change - with safeguards
  useEffect(() => {
    // Prevent excessive executions using operation counting
    if (!incrementOperationCount('filter_sync_effect')) {
      console.warn('Max effect executions reached in activeFilters sync');
      return;
    }

    // Skip if we're already updating or in the middle of a sync
    if (isUpdatingTrackersRef.current || syncingRef.current) return;

    // Perform a deep comparison to avoid unnecessary updates
    const hasChanged =
      prevActiveFiltersRef.current.page !== (activeFilters.page || 1) ||
      prevActiveFiltersRef.current.limit !== (activeFilters.limit || 10) ||
      prevActiveFiltersRef.current.handBagId !== activeFilters.handBagId ||
      prevActiveFiltersRef.current.groupId !== activeFilters.groupId ||
      prevActiveFiltersRef.current.active !== activeFilters.active;

    if (hasChanged) {
      // Set syncing flag to prevent loops
      syncingRef.current = true;

      // Update reference
      prevActiveFiltersRef.current = { ...activeFilters };

      // Update state
      setFilterTrackers({
        page: activeFilters.page || 1,
        limit: activeFilters.limit || 10,
        handBagId: activeFilters.handBagId,
        groupId: activeFilters.groupId,
        active: activeFilters.active,
      });

      // Reset sync flag after update with a stable timeout
      const timeoutId = setTimeout(() => {
        syncingRef.current = false;
      }, 0);

      return () => {
        clearTimeout(timeoutId);
      };
    }
  }, [activeFilters, incrementOperationCount]);

  // Stable filters for data fetching
  const stableFilters = useMemo(
    () => ({
      page: filterTrackers.page,
      limit: filterTrackers.limit,
      handBagId: filterTrackers.handBagId,
      groupId: filterTrackers.groupId,
      active: filterTrackers.active,
    }),
    [filterTrackers],
  );

  // Fetch bag group rates list with query options
  const {
    data: bagGroupRatesList,
    isLoading: isLoadingBagGroupRates,
    refetch: refetchBagGroupRates,
    isRefetching,
  } = listBagGroupRates(stableFilters, {
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    refetchOnReconnect: false,
    staleTime: 30000,
    cacheTime: 300000,
  });

  // Fetch handBags and groups for dropdowns
  const { data: handBagsData } = listHandBags(
    {},
    {
      refetchOnWindowFocus: false,
      staleTime: 300000,
    },
  );

  const { data: groupsData } = listGroups(
    {},
    {
      refetchOnWindowFocus: false,
      staleTime: 300000,
    },
  );

  // Handle fetchProductivityAnalysis
  const getProductivityAnalysis = useCallback(
    async (handBagId: string) => {
      if (!handBagId) return null;

      try {
        const result = await fetchProductivityAnalysis(handBagId);
        return result || null;
      } catch (error) {
        console.error('Error fetching productivity analysis:', error);
        return null;
      }
    },
    [fetchProductivityAnalysis],
  );

  // Safely refetch data
  const safeRefetch = useCallback(() => {
    if (!isMounted || !incrementOperationCount('refetch')) return;

    if (refetchTimeoutRef.current) {
      clearTimeout(refetchTimeoutRef.current);
    }

    if (isUpdatingPaginationRef.current) {
      shouldRefetchRef.current = true;
      return;
    }

    const requestId = `refetch-${Date.now()}`;
    pendingRequestsRef.current.add(requestId);

    refetchTimeoutRef.current = setTimeout(() => {
      if (isMounted) {
        refetchBagGroupRates().finally(() => {
          if (isMounted) {
            pendingRequestsRef.current.delete(requestId);
            refetchTimeoutRef.current = null;
          }
        });
      }
    }, 300);
  }, [refetchBagGroupRates, isMounted, incrementOperationCount]);

  // Update pagination
  const updatePagination = useCallback(
    (page: number, limit?: number) => {
      // Skip if already updating
      if (isUpdatingPaginationRef.current) return;

      // Skip if we've exceeded operation count for pagination operations
      if (!incrementOperationCount('pagination')) {
        console.warn('Too many pagination updates, skipping');
        return;
      }

      // Check if values actually changed
      if (activeFilters.page === page && (!limit || activeFilters.limit === limit)) {
        return; // No change needed
      }

      // Set flag to prevent re-entry
      isUpdatingPaginationRef.current = true;

      try {
        setActiveFilters(prev => ({
          ...prev,
          page,
          limit: limit || prev.limit,
        }));

        // Clear flag after a safe delay
        setTimeout(() => {
          if (isMounted) {
            isUpdatingPaginationRef.current = false;
          }
        }, 50);
      } catch (error) {
        // Ensure flag is cleared even if error occurs
        console.error('Error updating pagination:', error);
        isUpdatingPaginationRef.current = false;
      }
    },
    [activeFilters.page, activeFilters.limit, isMounted, incrementOperationCount],
  );

  // Handle page changes
  const handlePageChange = useCallback(
    (pageIndex: number, pageSize: number) => {
      if (isUpdatingPaginationRef.current || !incrementOperationCount('page_change')) return;

      isUpdatingPaginationRef.current = true;
      isUpdatingTrackersRef.current = true;

      const apiPage = pageIndex + 1;

      // Get the current total pages
      const totalItems = bagGroupRatesList?.total || 0;
      const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

      // Ensure we don't set page beyond total pages
      const validPage = Math.min(apiPage, totalPages);

      try {
        // Set local tracker first
        setFilterTrackers(prev => ({
          ...prev,
          page: validPage,
          limit: pageSize,
        }));

        // Debounce the context update to prevent racing conditions
        const timeoutId = setTimeout(() => {
          updatePagination(validPage, pageSize);

          // Clear flags after update is completed
          setTimeout(() => {
            isUpdatingPaginationRef.current = false;
            isUpdatingTrackersRef.current = false;

            if (shouldRefetchRef.current && isMounted) {
              shouldRefetchRef.current = false;
              safeRefetch();
            }
          }, 50);
        }, 50);

        return () => clearTimeout(timeoutId);
      } catch (error) {
        console.error('Error during pagination update:', error);
        isUpdatingPaginationRef.current = false;
        isUpdatingTrackersRef.current = false;
      }
    },
    [updatePagination, safeRefetch, isMounted, incrementOperationCount, bagGroupRatesList?.total],
  );

  // Filter by handBag
  const filterByHandBag = useCallback((handBagId: string | null) => {
    setActiveFilters(prev => ({
      ...prev,
      handBagId: handBagId || undefined,
      page: 1, // Reset to first page
    }));
  }, []);

  // Filter by group
  const filterByGroup = useCallback((groupId: string | null) => {
    setActiveFilters(prev => ({
      ...prev,
      groupId: groupId || undefined,
      page: 1, // Reset to first page
    }));
  }, []);

  // Filter by active status
  const filterByActive = useCallback((active: boolean | null) => {
    setActiveFilters(prev => ({
      ...prev,
      active: active === null ? undefined : active,
      page: 1, // Reset to first page
    }));
  }, []);

  // Helper function to fetch latest bagGroupRate by ID
  const fetchLatestBagGroupRate = useCallback(
    async (id: string): Promise<BagGroupRate | null> => {
      try {
        const result = await getBagGroupRateById(id).refetch();
        return result.data as BagGroupRate;
      } catch (error) {
        console.error('Error fetching latest bagGroupRate:', error);
        return null;
      }
    },
    [getBagGroupRateById],
  );

  // Handling batch create bagGroupRate
  const handleBatchCreateBagGroupRates = useCallback(
    async (dto: BatchCreateBagGroupRateDTO): Promise<string[]> => {
      if (isSubmittingRef.current || !incrementOperationCount('batch_create')) {
        throw new Error('Operation already in progress');
      }

      const requestId = `batch-create-${Date.now()}`;
      try {
        isSubmittingRef.current = true;
        pendingRequestsRef.current.add(requestId);
        setLoading(true);

        const result = await batchCreateBagGroupRatesMutation.mutateAsync(dto);

        // Get IDs from result
        const createdIds = result || [];

        if (!createdIds.length) {
          console.error('API response missing IDs:', result);
          throw new Error('Could not create bag group rates - No IDs returned from API');
        }

        // Invalidate cache for all created IDs
        await Promise.all(createdIds.map(id => invalidateBagGroupRateCache(id)));

        // Invalidate cache for handBag
        await invalidateBagGroupRatesCache(true);

        // Show success toast
        toast({
          title: 'Thành công',
          description: `Đã lưu ${createdIds.length} năng suất nhóm túi thành công`,
          duration: 2000,
        });

        setTimeout(() => {
          if (isMounted) {
            safeRefetch();
          }
        }, 300);

        return createdIds;
      } catch (error) {
        console.error('Error during batch creation:', error);

        // Show error toast
        toast({
          title: 'Lỗi',
          description: error instanceof Error ? error.message : 'Đã xảy ra lỗi khi lưu dữ liệu',
          variant: 'error',
          duration: 3000,
        });

        throw error;
      } finally {
        if (isMounted) {
          isSubmittingRef.current = false;
          pendingRequestsRef.current.delete(requestId);
          setLoading(false);
        }
      }
    },
    [
      batchCreateBagGroupRatesMutation,
      invalidateBagGroupRateCache,
      invalidateBagGroupRatesCache,
      safeRefetch,
      isMounted,
      incrementOperationCount,
    ],
  );

  // Handle delete operations
  const handleDeleteBagGroupRate = useCallback(
    async (id: string): Promise<void> => {
      if (isSubmittingRef.current || !incrementOperationCount('delete')) return;

      const requestId = `delete-${Date.now()}`;
      try {
        isSubmittingRef.current = true;
        pendingRequestsRef.current.add(requestId);
        setLoading(true);

        await deleteBagGroupRateMutation.mutateAsync(id);

        // Show success toast
        toast({
          title: 'Xóa thành công',
          description: 'Đã xóa năng suất nhóm túi thành công',
          duration: 2000,
        });

        setTimeout(() => {
          if (isMounted) {
            safeRefetch();
          }
        }, 50);
      } catch (error) {
        console.error('Error deleting bagGroupRate:', error);

        // Show error toast
        toast({
          title: 'Lỗi khi xóa',
          description: error instanceof Error ? error.message : 'Đã xảy ra lỗi khi xóa dữ liệu',
          variant: 'error',
          duration: 3000,
        });
      } finally {
        if (isMounted) {
          isSubmittingRef.current = false;
          pendingRequestsRef.current.delete(requestId);
          setLoading(false);
        }
      }
    },
    [deleteBagGroupRateMutation, safeRefetch, isMounted, incrementOperationCount],
  );

  // Memoized create handler with proper operation tracking
  const handleCreateBagGroupRate = useCallback(
    async (data: BagGroupRateCreateDTO): Promise<BagGroupRate> => {
      // Skip if we've exceeded operation count for create operations
      if (!incrementOperationCount('create')) {
        throw new Error('Too many create operations, try again later');
      }

      // Create a unique request ID
      const requestId = `create-${Date.now()}`;

      // Check if operation is already in progress
      if (pendingRequestsRef.current.has(requestId)) {
        throw new Error('Operation already in progress');
      }

      pendingRequestsRef.current.add(requestId);
      setLoading(true);

      try {
        // Perform mutation
        const result = await createBagGroupRateMutation.mutateAsync(data as BagGroupRateCreateDTO);

        // Get ID from result
        const createdId = result?.id;

        if (!createdId) {
          console.error('API response missing ID:', result);
          throw new Error('Could not create bagGroupRate - No ID returned from API');
        }

        // Show success toast
        toast({
          title: 'Tạo thành công',
          description: 'Đã tạo năng suất nhóm túi thành công',
          duration: 2000,
        });

        // Invalidate cache
        await onBagGroupRateMutationSuccess(createdId);

        // Fetch complete BagGroupRate object
        let createdBagGroupRate: BagGroupRate;

        try {
          const fetchedBagGroupRate = await fetchLatestBagGroupRate(createdId);
          if (fetchedBagGroupRate) {
            createdBagGroupRate = fetchedBagGroupRate;
          } else {
            // Fallback
            createdBagGroupRate = {
              id: createdId,
              ...data,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            } as BagGroupRate;
          }
        } catch (fetchError) {
          console.warn('Failed to fetch created bagGroupRate, using fallback:', fetchError);
          // Fallback
          createdBagGroupRate = {
            id: createdId,
            ...data,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          } as BagGroupRate;
        }

        return createdBagGroupRate;
      } catch (error) {
        // Show error toast
        toast({
          title: 'Lỗi tạo năng suất',
          description: error instanceof Error ? error.message : 'Đã xảy ra lỗi khi tạo dữ liệu',
          variant: 'error',
          duration: 3000,
        });

        throw error;
      } finally {
        // Clean up
        if (isMounted) {
          pendingRequestsRef.current.delete(requestId);
          setLoading(false);
        }
      }
    },
    [
      createBagGroupRateMutation,
      onBagGroupRateMutationSuccess,
      fetchLatestBagGroupRate,
      incrementOperationCount,
      isMounted,
    ],
  );

  // Memoized update handler with proper operation tracking
  const handleUpdateBagGroupRate = useCallback(
    async (id: string, updateData: any): Promise<BagGroupRate> => {
      // Skip if we've exceeded operation count for update operations
      if (!incrementOperationCount('update')) {
        throw new Error('Too many update operations, try again later');
      }

      // Create a unique request ID
      const requestId = `update-${id}-${Date.now()}`;

      // Check if operation is already in progress
      if (pendingRequestsRef.current.has(requestId)) {
        throw new Error('Operation already in progress');
      }

      pendingRequestsRef.current.add(requestId);
      setLoading(true);

      try {
        // Perform mutation
        await updateBagGroupRateMutation.mutateAsync({
          id,
          data: updateData,
        });

        // Show success toast
        toast({
          title: 'Cập nhật thành công',
          description: 'Đã cập nhật năng suất nhóm túi thành công',
          duration: 2000,
        });

        // Invalidate cache
        await onBagGroupRateMutationSuccess(id);

        // Fetch updated BagGroupRate
        const updatedBagGroupRate = await fetchLatestBagGroupRate(id);

        if (!updatedBagGroupRate) {
          throw new Error('Không thể lấy thông tin sau khi cập nhật');
        }

        return updatedBagGroupRate;
      } catch (error) {
        // Show error toast
        toast({
          title: 'Lỗi cập nhật',
          description:
            error instanceof Error ? error.message : 'Đã xảy ra lỗi khi cập nhật dữ liệu',
          variant: 'error',
          duration: 3000,
        });

        throw error;
      } finally {
        // Clean up
        if (isMounted) {
          pendingRequestsRef.current.delete(requestId);
          setLoading(false);
        }
      }
    },
    [
      updateBagGroupRateMutation,
      onBagGroupRateMutationSuccess,
      fetchLatestBagGroupRate,
      incrementOperationCount,
      isMounted,
    ],
  );

  // Handle form submission
  const handleBagGroupRateFormSubmit = useCallback(
    async (data: any): Promise<boolean> => {
      if (isSubmittingRef.current || !isMounted || !incrementOperationCount('form_submit'))
        return false;

      const requestId = `submit-${Date.now()}`;
      try {
        isSubmittingRef.current = true;
        pendingRequestsRef.current.add(requestId);

        if (data.id) {
          const { id, ...updateData } = data;
          await handleUpdateBagGroupRate(String(id), updateData);
        } else {
          const { ...createData } = data;
          await handleCreateBagGroupRate(createData as BagGroupRateCreateDTO);
        }

        // Wait for context updates to complete
        setTimeout(() => {
          if (isMounted) {
            safeRefetch();
          }
        }, 50);

        return true;
      } catch (error) {
        console.error('Error saving bagGroupRate data:', error);
        return false;
      } finally {
        if (isMounted) {
          isSubmittingRef.current = false;
          pendingRequestsRef.current.delete(requestId);
        }
      }
    },
    [
      handleCreateBagGroupRate,
      handleUpdateBagGroupRate,
      safeRefetch,
      isMounted,
      incrementOperationCount,
    ],
  );

  // Calculate pagination metadata
  const calculatedPaginationMeta = useMemo(() => {
    const totalItems = bagGroupRatesList?.total || 0;
    const pageSize = filterTrackers.limit || 10;
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

    // Ensure currentPage is within valid bounds (1 to totalPages)
    const currentPage = Math.min(Math.max(1, filterTrackers.page || 1), totalPages);

    return {
      totalItems,
      totalPages,
      currentPage,
      pageSize,
    };
  }, [bagGroupRatesList?.total, filterTrackers.page, filterTrackers.limit]);

  // Initial page index calculation
  const initialPageIndex = useMemo(
    () => Math.max(0, (calculatedPaginationMeta.currentPage || 1) - 1),
    [calculatedPaginationMeta.currentPage],
  );

  // Memoized derived values
  const bagGroupRates = useMemo(() => bagGroupRatesList?.data || [], [bagGroupRatesList?.data]);
  const handBags = useMemo(() => handBagsData?.data || [], [handBagsData?.data]);
  const groups = useMemo(() => groupsData?.data || [], [groupsData?.data]);
  const isLoading = loading || isLoadingBagGroupRates || isRefetching;

  // Update stats whenever bagGroupRatesList changes
  useEffect(() => {
    if (bagGroupRatesList?.data) {
      // Calculate stats
      const total = bagGroupRatesList.total || 0;

      // Calculate output rate metrics if we have data
      if (bagGroupRatesList.data.length > 0) {
        const outputRates = bagGroupRatesList.data.map(rate => rate.outputRate);
        const average = outputRates.reduce((sum, rate) => sum + rate, 0) / outputRates.length;
        const highest = Math.max(...outputRates);
        const lowest = Math.min(...outputRates);

        setStats({
          totalRates: total,
          averageOutputRate: average,
          highestOutputRate: highest,
          lowestOutputRate: lowest,
        });
      } else {
        setStats({
          totalRates: total,
          averageOutputRate: 0,
          highestOutputRate: 0,
          lowestOutputRate: 0,
        });
      }
    }
  }, [bagGroupRatesList]);

  // Reset filters function
  const resetFilters = useCallback(() => {
    setActiveFilters({
      page: 1,
      limit: 10,
      handBagId: undefined,
      groupId: undefined,
      active: true,
    });
  }, []);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<BagGroupRateContextType>(
    () => ({
      // State
      loading,
      activeFilters,
      stats,
      bagGroupRates,
      handBags,
      groups,
      isLoading,
      calculatedPaginationMeta,
      initialPageIndex,

      // Actions
      handleCreateBagGroupRate,
      handleBatchCreateBagGroupRates,
      handleUpdateBagGroupRate,
      handleDeleteBagGroupRate,
      handleBagGroupRateFormSubmit,
      handlePageChange,
      resetFilters,
      filterByHandBag,
      filterByGroup,
      filterByActive,
      safeRefetch,
      getProductivityAnalysis,
    }),
    [
      loading,
      activeFilters,
      stats,
      bagGroupRates,
      handBags,
      groups,
      isLoading,
      calculatedPaginationMeta,
      initialPageIndex,

      // Actions
      handleCreateBagGroupRate,
      handleBatchCreateBagGroupRates,
      handleUpdateBagGroupRate,
      handleDeleteBagGroupRate,
      handleBagGroupRateFormSubmit,
      handlePageChange,
      resetFilters,
      filterByHandBag,
      filterByGroup,
      filterByActive,
      safeRefetch,
      getProductivityAnalysis,
    ],
  );

  // Provide context value
  return (
    <BagGroupRateContext.Provider value={contextValue}>{children}</BagGroupRateContext.Provider>
  );
};

// Custom hook to use the BagGroupRateContext
export const useBagGroupRateContext = () => {
  const context = useContext(BagGroupRateContext);
  if (context === undefined) {
    throw new Error('useBagGroupRateContext must be used within a BagGroupRateProvider');
  }
  return context;
};
