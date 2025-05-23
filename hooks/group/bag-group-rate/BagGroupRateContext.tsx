"use client";

import React, {
    createContext,
    useContext,
    useState,
    useCallback,
    useMemo,
    useRef,
    useEffect
} from "react";
import { BasePaginationParams } from "@/hooks/base/useBaseQueries";
import { useGroupQueries } from "@/hooks/group/useGroupQueries";
import { BagGroupRate } from "@/common/interface/bag-group-rate";
import { BatchCreateBagGroupRateDTO, getGroupedBagGroupRates, getHandBagGroupRatesDetailsApi, HandBagDetailsResponse, HandBagWithStats } from "@/apis/group/bagGroupRate/bag-group-rate.api";
import { useBagGroupRateQueries } from "./useBagGroupRateQueries";
import { useHandBagQueries } from "@/hooks/handbag/useHandBagQueries";
import { useBagGroupRateMutations } from "./useBagGroupRateMutations";
import { toast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

// Default values for context data
const DEFAULT_STATS = {
    totalRates: 0,
    averageOutputRate: 0,
    highestOutputRate: 0,
    lowestOutputRate: 0,
};

// Default pagination metadata
const DEFAULT_PAGINATION_META = {
    totalItems: 0,
    totalPages: 1,
    currentPage: 1,
    pageSize: 10,
};

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

    handleBatchUpdateBagGroupRates: (dto: BatchCreateBagGroupRateDTO) => Promise<string[]>;
    handleBatchDeleteBagGroupRates: (ids: string[]) => Promise<void>;
    // Thêm vào interface BagGroupRateContextType
    getAllHandBagsWithStats: () => Promise<{ handBags: HandBagWithStats[] }>;
    getHandBagGroupRatesDetails: (handBagId: string) => Promise<HandBagDetailsResponse>;
}

// Create context with default values to prevent "undefined" errors
const defaultContextValue: BagGroupRateContextType = {
    loading: false,
    activeFilters: {
        page: 1,
        limit: 10,
        active: true,
    },
    stats: DEFAULT_STATS,
    bagGroupRates: [],
    handBags: [],
    groups: [],
    isLoading: false,
    calculatedPaginationMeta: DEFAULT_PAGINATION_META,
    initialPageIndex: 0,

    // Add stub implementations for all methods to avoid undefined errors
    handleCreateBagGroupRate: async () => { throw new Error("Context not initialized"); },
    handleBatchCreateBagGroupRates: async () => { throw new Error("Context not initialized"); },
    handleUpdateBagGroupRate: async () => { throw new Error("Context not initialized"); },
    handleDeleteBagGroupRate: async () => { throw new Error("Context not initialized"); },
    handleBagGroupRateFormSubmit: async () => { throw new Error("Context not initialized"); },
    handlePageChange: () => { },
    resetFilters: () => { },
    filterByHandBag: () => { },
    filterByGroup: () => { },
    filterByActive: () => { },
    safeRefetch: () => { },
    getProductivityAnalysis: async () => { throw new Error("Context not initialized"); },
    handleBatchUpdateBagGroupRates: async () => { throw new Error("Context not initialized"); },
    handleBatchDeleteBagGroupRates: async () => { throw new Error("Context not initialized"); },
    getAllHandBagsWithStats: async () => { throw new Error("Context not initialized"); },
    getHandBagGroupRatesDetails: async () => { throw new Error("Context not initialized"); },
};

// Create context with default values
const BagGroupRateContext = createContext<BagGroupRateContextType>(defaultContextValue);

// Max operations to prevent infinite loops
const MAX_OPERATIONS = 200;

export const BagGroupRateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Get queries and mutations
    const {
        listBagGroupRates,
        getBagGroupRateById,
        getBagGroupRatesForHandBag,
        getProductivityAnalysis: fetchProductivityAnalysis,
        invalidateBagGroupRateCache,
        invalidateBagGroupRatesCache
    } = useBagGroupRateQueries();

    const { listHandBags } = useHandBagQueries();
    const { listGroups } = useGroupQueries();

    const {
        createBagGroupRateMutation,
        batchCreateBagGroupRatesMutation,
        updateBagGroupRateMutation,
        deleteBagGroupRateMutation,
        onBagGroupRateMutationSuccess
    } = useBagGroupRateMutations();

    // State management
    const [loading, setLoading] = useState(false);
    const [isMounted, setIsMounted] = useState(true);

    // Stats for dashboard cards
    const [stats, setStats] = useState(DEFAULT_STATS);
    const pendingPromises = useRef<Record<string, Promise<any>>>({});

    // Initial active filters
    const [activeFilters, setActiveFilters] = useState<BagGroupRateCondDTO & BasePaginationParams>({
        page: 1,
        limit: 10,
        handBagId: undefined,
        groupId: undefined,
        active: true,
    });

    // Synchronized filter trackers to prevent race conditions
    const [filterTrackers, setFilterTrackers] = useState({
        page: activeFilters.page || 1,
        limit: activeFilters.limit || 10,
        handBagId: activeFilters.handBagId,
        groupId: activeFilters.groupId,
        active: activeFilters.active
    });

    // Refs to track state across renders and prevent loops
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
    const errorLoggedRef = useRef(false);
    const queryClient = useQueryClient();

    // Reset state on mount and cleanup on unmount
    useEffect(() => {
        // Reset operation counters
        operationCountRef.current = 0;
        operationTypeCountsRef.current = {};
        errorLoggedRef.current = false;
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

    // Count operations to prevent infinite loops
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
            if (!errorLoggedRef.current) {
                console.warn(`Exceeded maximum operations (${MAX_OPERATIONS}) in BagGroupRateContext [${operationType}]`);
                errorLoggedRef.current = true;
            }
            return false;
        }

        // Type-specific limits
        const typeLimit = operationType === 'effect' ? 50 : 100;
        if (operationTypeCountsRef.current[operationType] > typeLimit) {
            if (!errorLoggedRef.current) {
                console.warn(`Exceeded maximum operations for type ${operationType} (${typeLimit})`);
                errorLoggedRef.current = true;
            }
            return false;
        }

        return true;
    }, []);

    // Update trackers when activeFilters change - with safety mechanisms
    useEffect(() => {
        // Skip invalid states
        if (!incrementOperationCount('filter_sync_effect')) {
            return;
        }

        // Skip if already updating or syncing
        if (isUpdatingTrackersRef.current || syncingRef.current) return;

        // Deep comparison to avoid unnecessary updates
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
                active: activeFilters.active
            });

            // Reset sync flag with a safe timeout
            const timeoutId = setTimeout(() => {
                syncingRef.current = false;
            }, 0);

            return () => {
                clearTimeout(timeoutId);
            };
        }
    }, [activeFilters, incrementOperationCount]);

    // Create stable filters object for data fetching
    const stableFilters = useMemo(() => ({
        page: filterTrackers.page,
        limit: filterTrackers.limit,
        handBagId: filterTrackers.handBagId,
        groupId: filterTrackers.groupId,
        active: filterTrackers.active
    }), [filterTrackers]);

    // Fetch bag group rates using React Query
    const {
        data: bagGroupRatesList,
        isLoading: isLoadingBagGroupRates,
        refetch: refetchBagGroupRates,
        isRefetching
    } = listBagGroupRates(stableFilters, {
        refetchOnWindowFocus: false,
        refetchOnMount: true,
        refetchOnReconnect: false,
        staleTime: 30000,
        cacheTime: 300000,
    });

    // Fetch HandBags and Groups for dropdowns
    const { data: handBagsData } = listHandBags({}, {
        refetchOnWindowFocus: false,
        staleTime: 300000,
    });

    const { data: groupsData } = listGroups({}, {
        refetchOnWindowFocus: false,
        staleTime: 300000,
    });

    // Helper function to get productivity analysis
    const getProductivityAnalysis = useCallback(async (handBagId: string) => {
        if (!handBagId) return null;

        try {
            const result = await fetchProductivityAnalysis(handBagId);
            return result || null;
        } catch (error) {
            console.error("Error fetching productivity analysis:", error);
            toast({
                title: "Lỗi phân tích",
                description: error instanceof Error ? error.message : "Không thể tải dữ liệu phân tích",
                variant: "destructive",
            });
            return null;
        }
    }, [fetchProductivityAnalysis]);

    // Safe data refetch with debounce
    const safeRefetch = useCallback(() => {
        if (!isMounted || !incrementOperationCount('refetch')) return;

        // Clear existing timeout if any
        if (refetchTimeoutRef.current) {
            clearTimeout(refetchTimeoutRef.current);
        }

        // If updating pagination, mark for refetch later
        if (isUpdatingPaginationRef.current) {
            shouldRefetchRef.current = true;
            return;
        }

        // Create unique request ID
        const requestId = `refetch-${Date.now()}`;
        pendingRequestsRef.current.add(requestId);

        // Debounce refetch to prevent multiple calls
        refetchTimeoutRef.current = setTimeout(() => {
            if (isMounted) {
                refetchBagGroupRates({
                    // Cấu hình để giảm thiểu việc truy vấn không cần thiết
                    cancelRefetch: false,
                    throwOnError: false
                }).finally(() => {
                    if (isMounted) {
                        pendingRequestsRef.current.delete(requestId);
                        refetchTimeoutRef.current = null;
                    }
                });
            }
        }, 300);
    }, [refetchBagGroupRates, isMounted, incrementOperationCount]);

    // Update pagination with safety checks
    const updatePagination = useCallback((page: number, limit?: number) => {
        // Skip if already updating
        if (isUpdatingPaginationRef.current) return;

        // Skip if too many operations
        if (!incrementOperationCount('pagination')) {
            return;
        }

        // Skip if values haven't changed
        if (activeFilters.page === page && (!limit || activeFilters.limit === limit)) {
            return;
        }

        // Set flag to prevent re-entry
        isUpdatingPaginationRef.current = true;

        try {
            setActiveFilters(prev => ({
                ...prev,
                page,
                limit: limit || prev.limit
            }));

            // Clear flag after a safe delay
            setTimeout(() => {
                if (isMounted) {
                    isUpdatingPaginationRef.current = false;
                }
            }, 50);
        } catch (error) {
            // Ensure flag is cleared even on error
            console.error("Error updating pagination:", error);
            isUpdatingPaginationRef.current = false;
        }
    }, [activeFilters.page, activeFilters.limit, isMounted, incrementOperationCount]);

    // Handle page changes from DataTable
    const handlePageChange = useCallback((pageIndex: number, pageSize: number) => {
        if (isUpdatingPaginationRef.current || !incrementOperationCount('page_change')) return;

        isUpdatingPaginationRef.current = true;
        isUpdatingTrackersRef.current = true;

        const apiPage = pageIndex + 1;

        // Calculate valid page number
        const totalItems = bagGroupRatesList?.total || 0;
        const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
        const validPage = Math.min(apiPage, totalPages);

        try {
            // Update local tracker first
            setFilterTrackers(prev => ({
                ...prev,
                page: validPage,
                limit: pageSize
            }));

            // Debounce the context update
            const timeoutId = setTimeout(() => {
                updatePagination(validPage, pageSize);

                // Clear flags when complete
                setTimeout(() => {
                    isUpdatingPaginationRef.current = false;
                    isUpdatingTrackersRef.current = false;

                    // Handle pending refetch if needed
                    if (shouldRefetchRef.current && isMounted) {
                        shouldRefetchRef.current = false;
                        safeRefetch();
                    }
                }, 50);
            }, 50);

            return () => clearTimeout(timeoutId);
        } catch (error) {
            console.error("Error during pagination:", error);
            isUpdatingPaginationRef.current = false;
            isUpdatingTrackersRef.current = false;
        }
    }, [updatePagination, safeRefetch, isMounted, incrementOperationCount, bagGroupRatesList?.total]);

    // Filter action handlers
    const filterByHandBag = useCallback((handBagId: string | null) => {
        setActiveFilters(prev => ({
            ...prev,
            handBagId: handBagId || undefined,
            page: 1 // Reset to first page
        }));
    }, []);

    const filterByGroup = useCallback((groupId: string | null) => {
        setActiveFilters(prev => ({
            ...prev,
            groupId: groupId || undefined,
            page: 1 // Reset to first page
        }));
    }, []);

    const filterByActive = useCallback((active: boolean | null) => {
        setActiveFilters(prev => ({
            ...prev,
            active: active === null ? undefined : active,
            page: 1 // Reset to first page
        }));
    }, []);

    // Fetch latest BagGroupRate by ID
    const fetchLatestBagGroupRate = useCallback(async (id: string): Promise<BagGroupRate | null> => {
        try {
            const result = await getBagGroupRateById(id).refetch();
            return result.data as BagGroupRate;
        } catch (error) {
            console.error("Error fetching latest bagGroupRate:", error);
            return null;
        }
    }, [getBagGroupRateById]);

    // Handle batch create operation
    const handleBatchCreateBagGroupRates = useCallback(async (dto: BatchCreateBagGroupRateDTO): Promise<string[]> => {
        if (isSubmittingRef.current || !incrementOperationCount('batch_create')) {
            throw new Error("Thao tác đang được xử lý, vui lòng đợi");
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
                console.error("API response missing IDs:", result);
                throw new Error("Không thể tạo năng suất nhóm túi - Không có ID trả về từ API");
            }

            // Invalidate caches
            await Promise.all(createdIds.map(id => invalidateBagGroupRateCache(id)));
            await invalidateBagGroupRatesCache(true);

            // Show success toast
            toast({
                title: 'Thành công',
                description: `Đã lưu ${createdIds.length} năng suất nhóm túi thành công`,
                duration: 2000,
            });

            // Schedule a refetch
            setTimeout(() => {
                if (isMounted) {
                    safeRefetch();
                }
            }, 300);

            return createdIds;
        } catch (error) {
            console.error("Error during batch creation:", error);

            // Show error toast
            toast({
                title: 'Lỗi',
                description: error instanceof Error ? error.message : "Đã xảy ra lỗi khi lưu dữ liệu",
                variant: 'destructive',
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
    }, [
        batchCreateBagGroupRatesMutation,
        invalidateBagGroupRateCache,
        invalidateBagGroupRatesCache,
        safeRefetch,
        isMounted,
        incrementOperationCount
    ]);

    // Handle delete operation
    const handleDeleteBagGroupRate = useCallback(async (id: string): Promise<void> => {
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

            // Schedule a refetch
            setTimeout(() => {
                if (isMounted) {
                    safeRefetch();
                }
            }, 50);
        } catch (error) {
            console.error("Error deleting bagGroupRate:", error);

            // Show error toast
            toast({
                title: 'Lỗi khi xóa',
                description: error instanceof Error ? error.message : "Đã xảy ra lỗi khi xóa dữ liệu",
                variant: 'destructive',
                duration: 3000,
            });
        } finally {
            if (isMounted) {
                isSubmittingRef.current = false;
                pendingRequestsRef.current.delete(requestId);
                setLoading(false);
            }
        }
    }, [
        deleteBagGroupRateMutation,
        safeRefetch,
        isMounted,
        incrementOperationCount
    ]);

    // Handle create operation
    const handleCreateBagGroupRate = useCallback(async (data: any): Promise<BagGroupRate> => {
        if (!incrementOperationCount('create')) {
            throw new Error("Quá nhiều thao tác, vui lòng thử lại sau");
        }

        const requestId = `create-${Date.now()}`;
        if (pendingRequestsRef.current.has(requestId)) {
            throw new Error("Thao tác đang được xử lý");
        }

        pendingRequestsRef.current.add(requestId);
        setLoading(true);

        try {
            // Create new record
            const result = await createBagGroupRateMutation.mutateAsync(data);

            // Get ID from result
            const createdId = result?.id;

            if (!createdId) {
                console.error("API response missing ID:", result);
                throw new Error("Không thể tạo năng suất nhóm túi - Không có ID trả về từ API");
            }

            // Show success toast
            toast({
                title: 'Tạo thành công',
                description: 'Đã tạo năng suất nhóm túi thành công',
                duration: 2000,
            });

            // Invalidate cache
            await onBagGroupRateMutationSuccess(createdId);

            // Fetch complete object with relations
            let createdBagGroupRate: BagGroupRate;

            try {
                const fetchedBagGroupRate = await fetchLatestBagGroupRate(createdId);
                if (fetchedBagGroupRate) {
                    createdBagGroupRate = fetchedBagGroupRate;
                } else {
                    // Fallback if fetch fails
                    createdBagGroupRate = {
                        id: createdId,
                        ...data,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                    } as BagGroupRate;
                }
            } catch (fetchError) {
                console.warn("Failed to fetch created bagGroupRate, using fallback:", fetchError);
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
                description: error instanceof Error ? error.message : "Đã xảy ra lỗi khi tạo dữ liệu",
                variant: 'destructive',
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
    }, [
        createBagGroupRateMutation,
        onBagGroupRateMutationSuccess,
        fetchLatestBagGroupRate,
        incrementOperationCount,
        isMounted
    ]);

    // Handle update operation
    const handleUpdateBagGroupRate = useCallback(async (id: string, updateData: any): Promise<BagGroupRate> => {
        if (!incrementOperationCount('update')) {
            throw new Error("Quá nhiều thao tác, vui lòng thử lại sau");
        }

        const requestId = `update-${id}-${Date.now()}`;
        if (pendingRequestsRef.current.has(requestId)) {
            throw new Error("Thao tác đang được xử lý");
        }

        pendingRequestsRef.current.add(requestId);
        setLoading(true);

        try {
            // Update record
            await updateBagGroupRateMutation.mutateAsync({
                id,
                data: updateData
            });

            // Show success toast
            toast({
                title: 'Cập nhật thành công',
                description: 'Đã cập nhật năng suất nhóm túi thành công',
                duration: 2000,
            });

            // Invalidate cache
            await onBagGroupRateMutationSuccess(id);

            // Fetch updated record
            const updatedBagGroupRate = await fetchLatestBagGroupRate(id);

            if (!updatedBagGroupRate) {
                throw new Error('Không thể lấy thông tin sau khi cập nhật');
            }

            return updatedBagGroupRate;
        } catch (error) {
            // Show error toast
            toast({
                title: 'Lỗi cập nhật',
                description: error instanceof Error ? error.message : "Đã xảy ra lỗi khi cập nhật dữ liệu",
                variant: 'destructive',
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
    }, [
        updateBagGroupRateMutation,
        onBagGroupRateMutationSuccess,
        fetchLatestBagGroupRate,
        incrementOperationCount,
        isMounted
    ]);

    // Handle form submission (create or update)
    const handleBagGroupRateFormSubmit = useCallback(async (data: any): Promise<boolean> => {
        if (isSubmittingRef.current || !isMounted || !incrementOperationCount('form_submit')) return false;

        const requestId = `submit-${Date.now()}`;
        try {
            isSubmittingRef.current = true;
            pendingRequestsRef.current.add(requestId);

            // Determine if creating or updating
            if (data.id) {
                // Update - remove read-only fields
                const { id, createdAt, updatedAt, ...updateData } = data;
                await handleUpdateBagGroupRate(id, updateData);
            } else {
                // Create - remove empty fields
                const { id, createdAt, updatedAt, ...createData } = data;
                await handleCreateBagGroupRate(createData);
            }

            // Ensure UI updates after operation completes
            setTimeout(() => {
                if (isMounted) {
                    safeRefetch();
                }
            }, 50);

            return true;
        } catch (error) {
            console.error("Error saving bagGroupRate data:", error);
            return false;
        } finally {
            if (isMounted) {
                isSubmittingRef.current = false;
                pendingRequestsRef.current.delete(requestId);
            }
        }
    }, [
        handleCreateBagGroupRate,
        handleUpdateBagGroupRate,
        safeRefetch,
        isMounted,
        incrementOperationCount
    ]);

    // Calculate pagination metadata
    const calculatedPaginationMeta = useMemo(() => {
        const totalItems = bagGroupRatesList?.total || 0;
        const pageSize = filterTrackers.limit || 10;
        const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

        // Ensure currentPage is within valid bounds
        const currentPage = Math.min(Math.max(1, filterTrackers.page || 1), totalPages);

        return {
            totalItems,
            totalPages,
            currentPage,
            pageSize
        };
    }, [bagGroupRatesList?.total, filterTrackers.page, filterTrackers.limit]);

    // Calculate initialPageIndex for DataTable
    const initialPageIndex = useMemo(() =>
        Math.max(0, (calculatedPaginationMeta.currentPage || 1) - 1),
        [calculatedPaginationMeta.currentPage]
    );

    // Derive data from API results
    const bagGroupRates = useMemo(() => bagGroupRatesList?.data || [], [bagGroupRatesList?.data]);
    const handBags = useMemo(() => handBagsData?.data || [], [handBagsData?.data]);
    const groups = useMemo(() => groupsData?.data || [], [groupsData?.data]);
    const isLoading = loading || isLoadingBagGroupRates || isRefetching;

    // Update stats when data changes
    useEffect(() => {
        if (bagGroupRatesList?.data) {
            // Calculate stats
            const total = bagGroupRatesList.total || 0;

            // Calculate metrics if we have data
            if (bagGroupRatesList.data.length > 0) {
                const outputRates = bagGroupRatesList.data.map(rate => rate.outputRate);
                const average = outputRates.reduce((sum, rate) => sum + rate, 0) / outputRates.length;
                const highest = Math.max(...outputRates);
                const lowest = Math.min(...outputRates);

                setStats({
                    totalRates: total,
                    averageOutputRate: average,
                    highestOutputRate: highest,
                    lowestOutputRate: lowest
                });
            } else {
                setStats({
                    totalRates: total,
                    averageOutputRate: 0,
                    highestOutputRate: 0,
                    lowestOutputRate: 0
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


    // const handleBatchUpdateBagGroupRates = useCallback(async (dto: BatchCreateBagGroupRateDTO): Promise<string[]> => {

    //     console.log('Batch Update DTO:', dto);
    //     console.log('Batch Update BagGroupRates:', bagGroupRates);

    //     const comparePayload = dto.groupRates.map(record => {
    //         const originalRecord = bagGroupRates.find(r =>
    //             r.groupId === record.groupId
    //         );
    //         if (!originalRecord) return null;
    //         return {
    //             ...originalRecord,
    //             outputRate: record.outputRate
    //         };
    //     });
    //     console.log('Compare Payload:', comparePayload);

    //     // Define changedRecords by comparing the incoming payload with existing records
    //     const changedRecords = dto.groupRates.filter(record => {
    //         const originalRecord = bagGroupRates.find(r =>
    //             r.groupId === record.groupId &&
    //             r.handBagId === dto.handBagId
    //         );

    //         // If record doesn't exist in current state or outputRate has changed
    //         if (!originalRecord) return true;

    //         // Check if the outputRate has changed
    //         return record.outputRate !== originalRecord.outputRate;
    //     });

    //     // If no records changed, show toast and return early
    //     if (changedRecords.length === 0) {
    //         toast({
    //             title: 'Không có thay đổi',
    //             description: 'Không có bản ghi nào cần cập nhật',
    //             duration: 2000,
    //         });
    //         return [];
    //     }


    //     console.log('Changed Records:', changedRecords);

    //     const filteredDto: BatchCreateBagGroupRateDTO = {
    //         handBagId: dto.handBagId,
    //         groupRates: changedRecords
    //     };

    //     console.log('Update Payload:', {
    //         originalPayload: dto,
    //         filteredPayload: filteredDto
    //     });
    //     if (isSubmittingRef.current || !incrementOperationCount('batch_update')) {
    //         throw new Error("Thao tác đang được xử lý, vui lòng đợi");
    //     }

    //     const requestId = `batch-update-${Date.now()}`;
    //     try {
    //         isSubmittingRef.current = true;
    //         pendingRequestsRef.current.add(requestId);
    //         setLoading(true);

    //         const result = await batchCreateBagGroupRatesMutation.mutateAsync(filteredDto);

    //         await invalidateBagGroupRatesCache(false);

    //         // Get IDs from result
    //         const updatedIds = result || [];

    //         if (!updatedIds.length) {
    //             console.error("API response missing IDs:", result);
    //             throw new Error("Không thể cập nhật năng suất nhóm túi - Không có ID trả về từ API");
    //         }

    //         // Invalidate caches
    //         await Promise.all(updatedIds.map(id => invalidateBagGroupRateCache(id)));
    //         await invalidateBagGroupRatesCache(true);

    //         toast({
    //             title: 'Thành công',
    //             description: `Đã cập nhật ${updatedIds.length} năng suất nhóm túi thành công`,
    //             duration: 2000,
    //         });

    //         queryClient.setQueryData(['bag-group-rate-list'], (oldData: any) => {
    //             if (!oldData) return oldData;

    //             // Cập nhật dữ liệu cục bộ để tránh gọi API
    //             const updatedData = {
    //                 ...oldData,
    //                 data: oldData.data.map(item =>
    //                     changedRecords.some(changed => changed.groupId === item.groupId)
    //                         ? { ...item, ...changedRecords.find(r => r.groupId === item.groupId) }
    //                         : item
    //                 )
    //             };

    //             return updatedData;
    //         });

    //         return updatedIds;
    //     } catch (error) {
    //         console.error("Error during batch update:", error);

    //         // Show error toast
    //         toast({
    //             title: 'Lỗi',
    //             description: error instanceof Error ? error.message : "Đã xảy ra lỗi khi cập nhật dữ liệu",
    //             variant: 'destructive',
    //             duration: 3000,
    //         });

    //         throw error;
    //     } finally {
    //         if (isMounted) {
    //             isSubmittingRef.current = false;
    //             pendingRequestsRef.current.delete(requestId);
    //             setLoading(false);
    //         }
    //     }
    // }, [
    //     batchCreateBagGroupRatesMutation,
    //     invalidateBagGroupRateCache,
    //     invalidateBagGroupRatesCache,
    //     safeRefetch,
    //     isMounted,
    //     incrementOperationCount
    // ]);


    // Updated handleBatchUpdateBagGroupRates function to handle both updates and removals
    const handleBatchUpdateBagGroupRates = useCallback(async (dto: BatchCreateBagGroupRateDTO): Promise<string[]> => {
        console.log('Batch Update DTO:', dto);
        console.log('Current BagGroupRates:', bagGroupRates);

        // Find all existing records for the selected handBag
        const existingRecords = bagGroupRates.filter(r => r.handBagId === dto.handBagId);
        console.log('Existing Records for this HandBag:', existingRecords);

        // Split operations into updates and removals

        // 1. Find records to update (changed output rates)
        const recordsToUpdate = dto.groupRates.filter(record => {
            const originalRecord = existingRecords.find(r => r.groupId === record.groupId);

            // If record exists and output rate has changed
            return originalRecord && record.outputRate !== originalRecord.outputRate;
        });

        // 2. Find records to remove (exist in database but not in the submitted DTO)
        const existingGroupIds = existingRecords.map(r => r.groupId);
        const submittedGroupIds = dto.groupRates.map(r => r.groupId);

        // IDs that exist in database but not in submission should be removed
        const groupIdsToRemove = existingGroupIds.filter(id => !submittedGroupIds.includes(id));
        const recordsToRemove = existingRecords.filter(r => groupIdsToRemove.includes(r.groupId));

        console.log('Records to Update:', recordsToUpdate);
        console.log('Records to Remove:', recordsToRemove);

        // If no updates or removals, show message and return early
        if (recordsToUpdate.length === 0 && recordsToRemove.length === 0) {
            toast({
                title: 'Không có thay đổi',
                description: 'Không có bản ghi nào cần cập nhật',
                duration: 2000,
            });
            return [];
        }

        // Handle operations
        const updatedIds: string[] = [];
        const removedIds: string[] = [];

        // Set loading state and guards
        if (isSubmittingRef.current || !incrementOperationCount('batch_update')) {
            throw new Error("Thao tác đang được xử lý, vui lòng đợi");
        }

        const requestId = `batch-update-${Date.now()}`;
        try {
            isSubmittingRef.current = true;
            pendingRequestsRef.current.add(requestId);
            setLoading(true);

            // 1. Perform updates if needed
            if (recordsToUpdate.length > 0) {
                const updateDto: BatchCreateBagGroupRateDTO = {
                    handBagId: dto.handBagId,
                    groupRates: recordsToUpdate
                };
                const result = await batchCreateBagGroupRatesMutation.mutateAsync(updateDto);
                updatedIds.push(...(result || []));
            }

            // 2. Perform removals if needed
            if (recordsToRemove.length > 0) {
                // Delete each record in parallel
                const removedResults = await Promise.all(
                    recordsToRemove.map(record =>
                        deleteBagGroupRateMutation.mutateAsync(record.id)
                            .then(() => record.id)
                            .catch(error => {
                                console.error(`Error deleting record ${record.id}:`, error);
                                return null;
                            })
                    )
                );

                // Filter out any null results (failed deletions)
                removedIds.push(...removedResults.filter(id => id !== null));
            }

            // Invalidate caches
            await invalidateBagGroupRatesCache(true);

            // Show success toast with appropriate message
            let toastMessage = '';
            if (updatedIds.length > 0 && removedIds.length > 0) {
                toastMessage = `Đã cập nhật ${updatedIds.length} và xóa ${removedIds.length} năng suất nhóm túi`;
            } else if (updatedIds.length > 0) {
                toastMessage = `Đã cập nhật ${updatedIds.length} năng suất nhóm túi`;
            } else {
                toastMessage = `Đã xóa ${removedIds.length} năng suất nhóm túi`;
            }

            toast({
                title: 'Thành công',
                description: toastMessage,
                duration: 2000,
            });

            // Optimistic UI update to avoid unnecessary API call
            queryClient.setQueryData(['bag-group-rate-list'], (oldData: any) => {
                if (!oldData) return oldData;

                // Update data locally
                let updatedData = {
                    ...oldData,
                    data: oldData.data
                        // Remove deleted records
                        .filter((item: { id: string }) => !removedIds.includes(item.id))
                        // Update changed records
                        .map((item: { id: string; groupId: string; outputRate: number }) => {
                            const updatedRecord = recordsToUpdate.find(r => r.groupId === item.groupId);
                            return updatedRecord ? { ...item, outputRate: updatedRecord.outputRate } : item;
                        })
                };

                return updatedData;
            });

            // Return all affected IDs
            return [...updatedIds, ...removedIds];
        } catch (error) {
            console.error("Error during batch update:", error);
            toast({
                title: 'Lỗi',
                description: error instanceof Error ? error.message : "Đã xảy ra lỗi khi cập nhật dữ liệu",
                variant: 'destructive',
                duration: 3000,
            });
            throw error;
        } finally {
            if (isMounted) {
                isSubmittingRef.current = false;
                pendingRequestsRef.current.delete(requestId);
                setLoading(false);

                // Refresh the data if needed
                safeRefetch();
            }
        }
    }, [
        bagGroupRates,
        batchCreateBagGroupRatesMutation,
        deleteBagGroupRateMutation,
        invalidateBagGroupRateCache,
        invalidateBagGroupRatesCache,
        queryClient,
        safeRefetch,
        isMounted,
        incrementOperationCount
    ]);


    // Thêm cài đặt cho handleBatchDeleteBagGroupRates
    const handleBatchDeleteBagGroupRates = useCallback(async (ids: string[]): Promise<void> => {
        if (isSubmittingRef.current || !incrementOperationCount('batch_delete') || !ids.length) {
            throw new Error("Thao tác đang được xử lý, vui lòng đợi");
        }

        const requestId = `batch-delete-${Date.now()}`;
        try {
            isSubmittingRef.current = true;
            pendingRequestsRef.current.add(requestId);
            setLoading(true);

            // Xóa từng record song song
            await Promise.all(ids.map(id => deleteBagGroupRateMutation.mutateAsync(id)));

            // Show success toast
            toast({
                title: 'Xóa thành công',
                description: `Đã xóa ${ids.length} năng suất nhóm túi thành công`,
                duration: 2000,
            });

            // Invalidate cache for the list
            await invalidateBagGroupRatesCache(true);

            // Schedule a refetch
            setTimeout(() => {
                if (isMounted) {
                    safeRefetch();
                }
            }, 300);

        } catch (error) {
            console.error("Error during batch deletion:", error);

            // Show error toast
            toast({
                title: 'Lỗi',
                description: error instanceof Error ? error.message : "Đã xảy ra lỗi khi xóa dữ liệu",
                variant: 'destructive',
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
    }, [
        deleteBagGroupRateMutation,
        invalidateBagGroupRatesCache,
        safeRefetch,
        isMounted,
        incrementOperationCount
    ]);


    const getAllHandBagsWithStats = useCallback(async () => {
        try {
            // Tạo cache key để theo dõi request đang xử lý
            const cacheKey = "handbags-stats-request";

            // Kiểm tra xem key có tồn tại trong object không
            if (cacheKey in pendingPromises.current) {
                // Trả về kết quả từ promise đã cache
                return await pendingPromises.current[cacheKey];
            }

            // Tạo promise và lưu vào cache
            const promise = getGroupedBagGroupRates();
            pendingPromises.current[cacheKey] = promise;

            try {
                // Await và trả về kết quả
                const result = await promise;
                return result;
            } finally {
                // Xóa promise khỏi cache khi đã hoàn thành
                delete pendingPromises.current[cacheKey];
            }
        } catch (error) {
            console.error('Error fetching hand bags with stats:', error);
            toast({
                title: 'Lỗi',
                description: 'Không thể tải dữ liệu túi xách',
                variant: 'destructive',
            });
            return { handBags: [] };
        }
    }, []);

    const getHandBagGroupRatesDetails = useCallback(async (handBagId: string) => {
        if (!handBagId) {
            throw new Error("ID túi xách là bắt buộc");
        }

        const cacheKey = `handbag-details-${handBagId}`;

        try {
            // Kiểm tra xem key có tồn tại trong object không
            if (cacheKey in pendingPromises.current) {
                // Trả về kết quả từ promise đã cache
                return await pendingPromises.current[cacheKey];
            }

            const promise = getHandBagGroupRatesDetailsApi(handBagId);
            pendingPromises.current[cacheKey] = promise;

            try {
                // Await và trả về kết quả
                const result = await promise;
                return result;
            } finally {
                // Xóa promise khỏi cache khi đã hoàn thành
                delete pendingPromises.current[cacheKey];
            }
        } catch (error) {
            console.error('Error fetching hand bag details:', error);
            toast({
                title: 'Lỗi',
                description: 'Không thể tải chi tiết túi xách',
                variant: 'destructive',
            });
            throw error;
        }
    }, []);

    // Memoize context value to prevent unnecessary re-renders
    const contextValue = useMemo<BagGroupRateContextType>(() => ({
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

        handleBatchUpdateBagGroupRates,
        handleBatchDeleteBagGroupRates,
        getAllHandBagsWithStats,
        getHandBagGroupRatesDetails,
    }), [
        loading,
        activeFilters,
        stats,
        bagGroupRates,
        handBags,
        groups,
        isLoading,
        calculatedPaginationMeta,
        initialPageIndex,
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
        handleBatchUpdateBagGroupRates,
        handleBatchDeleteBagGroupRates,
        getAllHandBagsWithStats,
        getHandBagGroupRatesDetails,
    ]);

    // Provide context value
    return (
        <BagGroupRateContext.Provider value={contextValue}>
            {children}
        </BagGroupRateContext.Provider>
    );
};

// Custom hook to use the BagGroupRateContext
export const useBagGroupRateContext = () => {
    const context = useContext(BagGroupRateContext);

    // Even if this throws an error, BagGroupRateContextBridge will catch it
    if (!context) {
        throw new Error("useBagGroupRateContext must be used within a BagGroupRateProvider");
    }

    return context;
};

































// "use client";
// import React, {
//     createContext,
//     useContext,
//     useState,
//     useCallback,
//     useMemo,
//     useRef,
//     useEffect
// } from "react";
// import { BasePaginationParams } from "@/hooks/base/useBaseQueries";
// import { useGroupQueries } from "@/hooks/group/useGroupQueries";
// import { BagGroupRate } from "@/common/interface/bag-group-rate";
// import { BatchCreateBagGroupRateDTO } from "@/apis/group/bagGroupRate/bag-group-rate.api";
// import { useBagGroupRateQueries } from "./useBagGroupRateQueries";
// import { useHandBagQueries } from "@/hooks/handbag/useHandBagQueries";
// import { useBagGroupRateMutations } from "./useBagGroupRateMutations";
// import { toast } from "@/hooks/use-toast";

// // Define type for filter conditions
// export interface BagGroupRateCondDTO {
//     handBagId?: string;
//     groupId?: string;
//     active?: boolean;
// }

// // Define context type
// interface BagGroupRateContextType {
//     // State
//     loading: boolean;
//     activeFilters: BagGroupRateCondDTO & BasePaginationParams;
//     stats: {
//         totalRates: number;
//         averageOutputRate: number;
//         highestOutputRate: number;
//         lowestOutputRate: number;
//     };
//     bagGroupRates: BagGroupRate[];
//     handBags: any[];
//     groups: any[];
//     isLoading: boolean;
//     calculatedPaginationMeta: {
//         totalItems: number;
//         totalPages: number;
//         currentPage: number;
//         pageSize: number;
//     };
//     initialPageIndex: number;

//     // Actions
//     handleCreateBagGroupRate: (dto: any) => Promise<BagGroupRate>;
//     handleBatchCreateBagGroupRates: (dto: BatchCreateBagGroupRateDTO) => Promise<string[]>;
//     handleUpdateBagGroupRate: (id: string, updateData: any) => Promise<BagGroupRate>;
//     handleDeleteBagGroupRate: (id: string) => Promise<void>;
//     handleBagGroupRateFormSubmit: (data: any) => Promise<boolean>;
//     handlePageChange: (pageIndex: number, pageSize: number) => void;
//     resetFilters: () => void;
//     filterByHandBag: (handBagId: string | null) => void;
//     filterByGroup: (groupId: string | null) => void;
//     filterByActive: (active: boolean | null) => void;
//     safeRefetch: () => void;
//     getProductivityAnalysis: (handBagId: string) => Promise<any>;
// }

// // Create context
// const BagGroupRateContext = createContext<BagGroupRateContextType | undefined>(undefined);

// // Max operations to prevent infinite loops
// const MAX_OPERATIONS = 200;

// export const BagGroupRateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
//     // Get queries and mutations
//     const {
//         listBagGroupRates,
//         getBagGroupRateById,
//         getBagGroupRatesForHandBag,
//         getProductivityAnalysis: fetchProductivityAnalysis,
//         invalidateBagGroupRateCache,
//         invalidateBagGroupRatesCache
//     } = useBagGroupRateQueries();

//     const { listHandBags } = useHandBagQueries();
//     const { listGroups } = useGroupQueries();

//     const {
//         createBagGroupRateMutation,
//         batchCreateBagGroupRatesMutation,
//         updateBagGroupRateMutation,
//         deleteBagGroupRateMutation,
//         onBagGroupRateMutationSuccess
//     } = useBagGroupRateMutations();

//     // State management
//     const [loading, setLoading] = useState(false);
//     const [isMounted, setIsMounted] = useState(true);

//     // Stats for dashboard cards
//     const [stats, setStats] = useState({
//         totalRates: 0,
//         averageOutputRate: 0,
//         highestOutputRate: 0,
//         lowestOutputRate: 0,
//     });

//     // Initial active filters
//     const [activeFilters, setActiveFilters] = useState<BagGroupRateCondDTO & BasePaginationParams>({
//         page: 1,
//         limit: 10,
//         handBagId: undefined,
//         groupId: undefined,
//         active: true,
//     });

//     // Filter trackers
//     const [filterTrackers, setFilterTrackers] = useState({
//         page: activeFilters.page || 1,
//         limit: activeFilters.limit || 10,
//         handBagId: activeFilters.handBagId,
//         groupId: activeFilters.groupId,
//         active: activeFilters.active
//     });

//     // Refs for preventing loops and handling state updates safely
//     const prevActiveFiltersRef = useRef({ ...activeFilters });
//     const isUpdatingTrackersRef = useRef(false);
//     const refetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
//     const isSubmittingRef = useRef(false);
//     const pendingRequestsRef = useRef(new Set<string>());
//     const isUpdatingPaginationRef = useRef(false);
//     const shouldRefetchRef = useRef(false);
//     const operationCountRef = useRef(0);
//     const syncingRef = useRef(false);
//     const operationTypeCountsRef = useRef<Record<string, number>>({});

//     // Cleanup on unmount
//     useEffect(() => {
//         operationCountRef.current = 0;
//         setIsMounted(true);

//         return () => {
//             setIsMounted(false);
//             if (refetchTimeoutRef.current) {
//                 clearTimeout(refetchTimeoutRef.current);
//             }
//             pendingRequestsRef.current.clear();
//             isSubmittingRef.current = false;
//             isUpdatingPaginationRef.current = false;
//             shouldRefetchRef.current = false;
//             isUpdatingTrackersRef.current = false;
//             operationCountRef.current = 0;
//             syncingRef.current = false;
//         };
//     }, []);

//     // Count operations to prevent infinite loops, with type tracking
//     const incrementOperationCount = useCallback((operationType = 'general') => {
//         // Increment global counter
//         operationCountRef.current++;

//         // Initialize and increment type counter
//         if (!operationTypeCountsRef.current[operationType]) {
//             operationTypeCountsRef.current[operationType] = 0;
//         }
//         operationTypeCountsRef.current[operationType]++;

//         // Only warn and limit if we're way over the limit
//         if (operationCountRef.current > MAX_OPERATIONS) {
//             console.warn(`Exceeded maximum operations (${MAX_OPERATIONS}) in BagGroupRateContext [${operationType}]`);
//             return false;
//         }

//         // Most operation types allow more operations
//         const typeLimit = operationType === 'effect' ? 50 : 100;
//         if (operationTypeCountsRef.current[operationType] > typeLimit) {
//             console.warn(`Exceeded maximum operations for type ${operationType} (${typeLimit})`);
//             return false;
//         }

//         return true;
//     }, []);

//     // Update trackers when activeFilters change - with safeguards
//     useEffect(() => {
//         // Prevent excessive executions using operation counting
//         if (!incrementOperationCount('filter_sync_effect')) {
//             console.warn("Max effect executions reached in activeFilters sync");
//             return;
//         }

//         // Skip if we're already updating or in the middle of a sync
//         if (isUpdatingTrackersRef.current || syncingRef.current) return;

//         // Perform a deep comparison to avoid unnecessary updates
//         const hasChanged =
//             prevActiveFiltersRef.current.page !== (activeFilters.page || 1) ||
//             prevActiveFiltersRef.current.limit !== (activeFilters.limit || 10) ||
//             prevActiveFiltersRef.current.handBagId !== activeFilters.handBagId ||
//             prevActiveFiltersRef.current.groupId !== activeFilters.groupId ||
//             prevActiveFiltersRef.current.active !== activeFilters.active;

//         if (hasChanged) {
//             // Set syncing flag to prevent loops
//             syncingRef.current = true;

//             // Update reference
//             prevActiveFiltersRef.current = { ...activeFilters };

//             // Update state
//             setFilterTrackers({
//                 page: activeFilters.page || 1,
//                 limit: activeFilters.limit || 10,
//                 handBagId: activeFilters.handBagId,
//                 groupId: activeFilters.groupId,
//                 active: activeFilters.active
//             });

//             // Reset sync flag after update with a stable timeout
//             const timeoutId = setTimeout(() => {
//                 syncingRef.current = false;
//             }, 0);

//             return () => {
//                 clearTimeout(timeoutId);
//             };
//         }
//     }, [activeFilters, incrementOperationCount]);

//     // Stable filters for data fetching
//     const stableFilters = useMemo(() => ({
//         page: filterTrackers.page,
//         limit: filterTrackers.limit,
//         handBagId: filterTrackers.handBagId,
//         groupId: filterTrackers.groupId,
//         active: filterTrackers.active
//     }), [filterTrackers]);

//     // Fetch bag group rates list with query options
//     const {
//         data: bagGroupRatesList,
//         isLoading: isLoadingBagGroupRates,
//         refetch: refetchBagGroupRates,
//         isRefetching
//     } = listBagGroupRates(stableFilters, {
//         refetchOnWindowFocus: false,
//         refetchOnMount: true,
//         refetchOnReconnect: false,
//         staleTime: 30000,
//         cacheTime: 300000,
//     });

//     // Fetch handBags and groups for dropdowns
//     const { data: handBagsData } = listHandBags({}, {
//         refetchOnWindowFocus: false,
//         staleTime: 300000,
//     });

//     const { data: groupsData } = listGroups({}, {
//         refetchOnWindowFocus: false,
//         staleTime: 300000,
//     });

//     // Handle fetchProductivityAnalysis
//     const getProductivityAnalysis = useCallback(async (handBagId: string) => {
//         if (!handBagId) return null;

//         try {
//             const result = await fetchProductivityAnalysis(handBagId);
//             return result || null;
//         } catch (error) {
//             console.error("Error fetching productivity analysis:", error);
//             return null;
//         }
//     }, [fetchProductivityAnalysis]);

//     // Safely refetch data
//     const safeRefetch = useCallback(() => {
//         if (!isMounted || !incrementOperationCount('refetch')) return;

//         if (refetchTimeoutRef.current) {
//             clearTimeout(refetchTimeoutRef.current);
//         }

//         if (isUpdatingPaginationRef.current) {
//             shouldRefetchRef.current = true;
//             return;
//         }

//         const requestId = `refetch-${Date.now()}`;
//         pendingRequestsRef.current.add(requestId);

//         refetchTimeoutRef.current = setTimeout(() => {
//             if (isMounted) {
//                 refetchBagGroupRates().finally(() => {
//                     if (isMounted) {
//                         pendingRequestsRef.current.delete(requestId);
//                         refetchTimeoutRef.current = null;
//                     }
//                 });
//             }
//         }, 300);
//     }, [refetchBagGroupRates, isMounted, incrementOperationCount]);

//     // Update pagination
//     const updatePagination = useCallback((page: number, limit?: number) => {
//         // Skip if already updating
//         if (isUpdatingPaginationRef.current) return;

//         // Skip if we've exceeded operation count for pagination operations
//         if (!incrementOperationCount('pagination')) {
//             console.warn("Too many pagination updates, skipping");
//             return;
//         }

//         // Check if values actually changed
//         if (activeFilters.page === page && (!limit || activeFilters.limit === limit)) {
//             return; // No change needed
//         }

//         // Set flag to prevent re-entry
//         isUpdatingPaginationRef.current = true;

//         try {
//             setActiveFilters(prev => ({
//                 ...prev,
//                 page,
//                 limit: limit || prev.limit
//             }));

//             // Clear flag after a safe delay
//             setTimeout(() => {
//                 if (isMounted) {
//                     isUpdatingPaginationRef.current = false;
//                 }
//             }, 50);
//         } catch (error) {
//             // Ensure flag is cleared even if error occurs
//             console.error("Error updating pagination:", error);
//             isUpdatingPaginationRef.current = false;
//         }
//     }, [activeFilters.page, activeFilters.limit, isMounted, incrementOperationCount]);

//     // Handle page changes
//     const handlePageChange = useCallback((pageIndex: number, pageSize: number) => {
//         if (isUpdatingPaginationRef.current || !incrementOperationCount('page_change')) return;

//         isUpdatingPaginationRef.current = true;
//         isUpdatingTrackersRef.current = true;

//         const apiPage = pageIndex + 1;

//         // Get the current total pages
//         const totalItems = bagGroupRatesList?.total || 0;
//         const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

//         // Ensure we don't set page beyond total pages
//         const validPage = Math.min(apiPage, totalPages);

//         try {
//             // Set local tracker first
//             setFilterTrackers(prev => ({
//                 ...prev,
//                 page: validPage,
//                 limit: pageSize
//             }));

//             // Debounce the context update to prevent racing conditions
//             const timeoutId = setTimeout(() => {
//                 updatePagination(validPage, pageSize);

//                 // Clear flags after update is completed
//                 setTimeout(() => {
//                     isUpdatingPaginationRef.current = false;
//                     isUpdatingTrackersRef.current = false;

//                     if (shouldRefetchRef.current && isMounted) {
//                         shouldRefetchRef.current = false;
//                         safeRefetch();
//                     }
//                 }, 50);
//             }, 50);

//             return () => clearTimeout(timeoutId);
//         } catch (error) {
//             console.error("Error during pagination update:", error);
//             isUpdatingPaginationRef.current = false;
//             isUpdatingTrackersRef.current = false;
//         }
//     }, [updatePagination, safeRefetch, isMounted, incrementOperationCount, bagGroupRatesList?.total]);

//     // Filter by handBag
//     const filterByHandBag = useCallback((handBagId: string | null) => {
//         setActiveFilters(prev => ({
//             ...prev,
//             handBagId: handBagId || undefined,
//             page: 1 // Reset to first page
//         }));
//     }, []);

//     // Filter by group
//     const filterByGroup = useCallback((groupId: string | null) => {
//         setActiveFilters(prev => ({
//             ...prev,
//             groupId: groupId || undefined,
//             page: 1 // Reset to first page
//         }));
//     }, []);

//     // Filter by active status
//     const filterByActive = useCallback((active: boolean | null) => {
//         setActiveFilters(prev => ({
//             ...prev,
//             active: active === null ? undefined : active,
//             page: 1 // Reset to first page
//         }));
//     }, []);

//     // Helper function to fetch latest bagGroupRate by ID
//     const fetchLatestBagGroupRate = useCallback(async (id: string): Promise<BagGroupRate | null> => {
//         try {
//             const result = await getBagGroupRateById(id).refetch();
//             return result.data as BagGroupRate;
//         } catch (error) {
//             console.error("Error fetching latest bagGroupRate:", error);
//             return null;
//         }
//     }, [getBagGroupRateById]);

//     // Handling batch create bagGroupRate
//     const handleBatchCreateBagGroupRates = useCallback(async (dto: BatchCreateBagGroupRateDTO): Promise<string[]> => {
//         if (isSubmittingRef.current || !incrementOperationCount('batch_create')) {
//             throw new Error("Operation already in progress");
//         }

//         const requestId = `batch-create-${Date.now()}`;
//         try {
//             isSubmittingRef.current = true;
//             pendingRequestsRef.current.add(requestId);
//             setLoading(true);

//             const result = await batchCreateBagGroupRatesMutation.mutateAsync(dto);

//             // Get IDs from result
//             const createdIds = result || [];

//             if (!createdIds.length) {
//                 console.error("API response missing IDs:", result);
//                 throw new Error("Could not create bag group rates - No IDs returned from API");
//             }

//             // Invalidate cache for all created IDs
//             await Promise.all(createdIds.map(id => invalidateBagGroupRateCache(id)));

//             // Invalidate cache for handBag
//             await invalidateBagGroupRatesCache(true);

//             // Show success toast
//             toast({
//                 title: 'Thành công',
//                 description: `Đã lưu ${createdIds.length} năng suất nhóm túi thành công`,
//                 duration: 2000,
//             });

//             setTimeout(() => {
//                 if (isMounted) {
//                     safeRefetch();
//                 }
//             }, 300);

//             return createdIds;
//         } catch (error) {
//             console.error("Error during batch creation:", error);

//             // Show error toast
//             toast({
//                 title: 'Lỗi',
//                 description: error instanceof Error ? error.message : "Đã xảy ra lỗi khi lưu dữ liệu",
//                 variant: 'destructive',
//                 duration: 3000,
//             });

//             throw error;
//         } finally {
//             if (isMounted) {
//                 isSubmittingRef.current = false;
//                 pendingRequestsRef.current.delete(requestId);
//                 setLoading(false);
//             }
//         }
//     }, [
//         batchCreateBagGroupRatesMutation,
//         invalidateBagGroupRateCache,
//         invalidateBagGroupRatesCache,
//         safeRefetch,
//         isMounted,
//         incrementOperationCount
//     ]);

//     // Handle delete operations
//     const handleDeleteBagGroupRate = useCallback(async (id: string): Promise<void> => {
//         if (isSubmittingRef.current || !incrementOperationCount('delete')) return;

//         const requestId = `delete-${Date.now()}`;
//         try {
//             isSubmittingRef.current = true;
//             pendingRequestsRef.current.add(requestId);
//             setLoading(true);

//             await deleteBagGroupRateMutation.mutateAsync(id);

//             // Show success toast
//             toast({
//                 title: 'Xóa thành công',
//                 description: 'Đã xóa năng suất nhóm túi thành công',
//                 duration: 2000,
//             });

//             setTimeout(() => {
//                 if (isMounted) {
//                     safeRefetch();
//                 }
//             }, 50);
//         } catch (error) {
//             console.error("Error deleting bagGroupRate:", error);

//             // Show error toast
//             toast({
//                 title: 'Lỗi khi xóa',
//                 description: error instanceof Error ? error.message : "Đã xảy ra lỗi khi xóa dữ liệu",
//                 variant: 'destructive',
//                 duration: 3000,
//             });
//         } finally {
//             if (isMounted) {
//                 isSubmittingRef.current = false;
//                 pendingRequestsRef.current.delete(requestId);
//                 setLoading(false);
//             }
//         }
//     }, [
//         deleteBagGroupRateMutation,
//         safeRefetch,
//         isMounted,
//         incrementOperationCount
//     ]);

//     // Memoized create handler with proper operation tracking
//     const handleCreateBagGroupRate = useCallback(async (data: any): Promise<BagGroupRate> => {
//         // Skip if we've exceeded operation count for create operations
//         if (!incrementOperationCount('create')) {
//             throw new Error("Too many create operations, try again later");
//         }

//         // Create a unique request ID
//         const requestId = `create-${Date.now()}`;

//         // Check if operation is already in progress
//         if (pendingRequestsRef.current.has(requestId)) {
//             throw new Error("Operation already in progress");
//         }

//         pendingRequestsRef.current.add(requestId);
//         setLoading(true);

//         try {
//             // Perform mutation
//             const result = await createBagGroupRateMutation.mutateAsync(data);

//             // Get ID from result
//             const createdId = result?.id;

//             if (!createdId) {
//                 console.error("API response missing ID:", result);
//                 throw new Error("Could not create bagGroupRate - No ID returned from API");
//             }

//             // Show success toast
//             toast({
//                 title: 'Tạo thành công',
//                 description: 'Đã tạo năng suất nhóm túi thành công',
//                 duration: 2000,
//             });

//             // Invalidate cache
//             await onBagGroupRateMutationSuccess(createdId);

//             // Fetch complete BagGroupRate object
//             let createdBagGroupRate: BagGroupRate;

//             try {
//                 const fetchedBagGroupRate = await fetchLatestBagGroupRate(createdId);
//                 if (fetchedBagGroupRate) {
//                     createdBagGroupRate = fetchedBagGroupRate;
//                 } else {
//                     // Fallback
//                     createdBagGroupRate = {
//                         id: createdId,
//                         ...data,
//                         createdAt: new Date().toISOString(),
//                         updatedAt: new Date().toISOString(),
//                     } as BagGroupRate;
//                 }
//             } catch (fetchError) {
//                 console.warn("Failed to fetch created bagGroupRate, using fallback:", fetchError);
//                 // Fallback
//                 createdBagGroupRate = {
//                     id: createdId,
//                     ...data,
//                     createdAt: new Date().toISOString(),
//                     updatedAt: new Date().toISOString(),
//                 } as BagGroupRate;
//             }

//             return createdBagGroupRate;
//         } catch (error) {
//             // Show error toast
//             toast({
//                 title: 'Lỗi tạo năng suất',
//                 description: error instanceof Error ? error.message : "Đã xảy ra lỗi khi tạo dữ liệu",
//                 variant: 'destructive',
//                 duration: 3000,
//             });

//             throw error;
//         } finally {
//             // Clean up
//             if (isMounted) {
//                 pendingRequestsRef.current.delete(requestId);
//                 setLoading(false);
//             }
//         }
//     }, [
//         createBagGroupRateMutation,
//         onBagGroupRateMutationSuccess,
//         fetchLatestBagGroupRate,
//         incrementOperationCount,
//         isMounted
//     ]);

//     // Memoized update handler with proper operation tracking
//     const handleUpdateBagGroupRate = useCallback(async (id: string, updateData: any): Promise<BagGroupRate> => {
//         // Skip if we've exceeded operation count for update operations
//         if (!incrementOperationCount('update')) {
//             throw new Error("Too many update operations, try again later");
//         }

//         // Create a unique request ID
//         const requestId = `update-${id}-${Date.now()}`;

//         // Check if operation is already in progress
//         if (pendingRequestsRef.current.has(requestId)) {
//             throw new Error("Operation already in progress");
//         }

//         pendingRequestsRef.current.add(requestId);
//         setLoading(true);

//         try {
//             // Perform mutation
//             await updateBagGroupRateMutation.mutateAsync({
//                 id,
//                 data: updateData
//             });

//             // Show success toast
//             toast({
//                 title: 'Cập nhật thành công',
//                 description: 'Đã cập nhật năng suất nhóm túi thành công',
//                 duration: 2000,
//             });

//             // Invalidate cache
//             await onBagGroupRateMutationSuccess(id);

//             // Fetch updated BagGroupRate
//             const updatedBagGroupRate = await fetchLatestBagGroupRate(id);

//             if (!updatedBagGroupRate) {
//                 throw new Error('Không thể lấy thông tin sau khi cập nhật');
//             }

//             return updatedBagGroupRate;
//         } catch (error) {
//             // Show error toast
//             toast({
//                 title: 'Lỗi cập nhật',
//                 description: error instanceof Error ? error.message : "Đã xảy ra lỗi khi cập nhật dữ liệu",
//                 variant: 'destructive',
//                 duration: 3000,
//             });

//             throw error;
//         } finally {
//             // Clean up
//             if (isMounted) {
//                 pendingRequestsRef.current.delete(requestId);
//                 setLoading(false);
//             }
//         }
//     }, [
//         updateBagGroupRateMutation,
//         onBagGroupRateMutationSuccess,
//         fetchLatestBagGroupRate,
//         incrementOperationCount,
//         isMounted
//     ]);

//     // Handle form submission
//     const handleBagGroupRateFormSubmit = useCallback(async (data: any): Promise<boolean> => {
//         if (isSubmittingRef.current || !isMounted || !incrementOperationCount('form_submit')) return false;

//         const requestId = `submit-${Date.now()}`;
//         try {
//             isSubmittingRef.current = true;
//             pendingRequestsRef.current.add(requestId);

//             if (data.id) {
//                 const { id, createdAt, updatedAt, ...updateData } = data;
//                 await handleUpdateBagGroupRate(id, updateData);
//             } else {
//                 const { id, createdAt, updatedAt, ...createData } = data;
//                 await handleCreateBagGroupRate(createData);
//             }

//             // Wait for context updates to complete
//             setTimeout(() => {
//                 if (isMounted) {
//                     safeRefetch();
//                 }
//             }, 50);

//             return true;
//         } catch (error) {
//             console.error("Error saving bagGroupRate data:", error);
//             return false;
//         } finally {
//             if (isMounted) {
//                 isSubmittingRef.current = false;
//                 pendingRequestsRef.current.delete(requestId);
//             }
//         }
//     }, [
//         handleCreateBagGroupRate,
//         handleUpdateBagGroupRate,
//         safeRefetch,
//         isMounted,
//         incrementOperationCount
//     ]);

//     // Calculate pagination metadata
//     const calculatedPaginationMeta = useMemo(() => {
//         const totalItems = bagGroupRatesList?.total || 0;
//         const pageSize = filterTrackers.limit || 10;
//         const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

//         // Ensure currentPage is within valid bounds (1 to totalPages)
//         const currentPage = Math.min(Math.max(1, filterTrackers.page || 1), totalPages);

//         return {
//             totalItems,
//             totalPages,
//             currentPage,
//             pageSize
//         };
//     }, [bagGroupRatesList?.total, filterTrackers.page, filterTrackers.limit]);

//     // Initial page index calculation
//     const initialPageIndex = useMemo(() =>
//         Math.max(0, (calculatedPaginationMeta.currentPage || 1) - 1),
//         [calculatedPaginationMeta.currentPage]
//     );

//     // Memoized derived values
//     const bagGroupRates = useMemo(() => bagGroupRatesList?.data || [], [bagGroupRatesList?.data]);
//     const handBags = useMemo(() => handBagsData?.data || [], [handBagsData?.data]);
//     const groups = useMemo(() => groupsData?.data || [], [groupsData?.data]);
//     const isLoading = loading || isLoadingBagGroupRates || isRefetching;

//     // Update stats whenever bagGroupRatesList changes
//     useEffect(() => {
//         if (bagGroupRatesList?.data) {
//             // Calculate stats
//             const total = bagGroupRatesList.total || 0;

//             // Calculate output rate metrics if we have data
//             if (bagGroupRatesList.data.length > 0) {
//                 const outputRates = bagGroupRatesList.data.map(rate => rate.outputRate);
//                 const average = outputRates.reduce((sum, rate) => sum + rate, 0) / outputRates.length;
//                 const highest = Math.max(...outputRates);
//                 const lowest = Math.min(...outputRates);

//                 setStats({
//                     totalRates: total,
//                     averageOutputRate: average,
//                     highestOutputRate: highest,
//                     lowestOutputRate: lowest
//                 });
//             } else {
//                 setStats({
//                     totalRates: total,
//                     averageOutputRate: 0,
//                     highestOutputRate: 0,
//                     lowestOutputRate: 0
//                 });
//             }
//         }
//     }, [bagGroupRatesList]);

//     // Reset filters function
//     const resetFilters = useCallback(() => {
//         setActiveFilters({
//             page: 1,
//             limit: 10,
//             handBagId: undefined,
//             groupId: undefined,
//             active: true,
//         });
//     }, []);

//     // Memoize context value to prevent unnecessary re-renders
//     const contextValue = useMemo<BagGroupRateContextType>(() => ({
//         // State
//         loading,
//         activeFilters,
//         stats,
//         bagGroupRates,
//         handBags,
//         groups,
//         isLoading,
//         calculatedPaginationMeta,
//         initialPageIndex,

//         // Actions
//         handleCreateBagGroupRate,
//         handleBatchCreateBagGroupRates,
//         handleUpdateBagGroupRate,
//         handleDeleteBagGroupRate,
//         handleBagGroupRateFormSubmit,
//         handlePageChange,
//         resetFilters,
//         filterByHandBag,
//         filterByGroup,
//         filterByActive,
//         safeRefetch,
//         getProductivityAnalysis,
//     }), [
//         loading,
//         activeFilters,
//         stats,
//         bagGroupRates,
//         handBags,
//         groups,
//         isLoading,
//         calculatedPaginationMeta,
//         initialPageIndex,

//         // Actions
//         handleCreateBagGroupRate,
//         handleBatchCreateBagGroupRates,
//         handleUpdateBagGroupRate,
//         handleDeleteBagGroupRate,
//         handleBagGroupRateFormSubmit,
//         handlePageChange,
//         resetFilters,
//         filterByHandBag,
//         filterByGroup,
//         filterByActive,
//         safeRefetch,
//         getProductivityAnalysis,
//     ]);

//     // Provide context value
//     return (
//         <BagGroupRateContext.Provider value={contextValue}>
//             {children}
//         </BagGroupRateContext.Provider>
//     );
// };

// // Custom hook to use the BagGroupRateContext
// export const useBagGroupRateContext = () => {
//     const context = useContext(BagGroupRateContext);
//     if (context === undefined) {
//         throw new Error("useBagGroupRateContext must be used within a BagGroupRateProvider");
//     }
//     return context;
// };