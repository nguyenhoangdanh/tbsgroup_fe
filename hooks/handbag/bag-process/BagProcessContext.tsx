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
import { BagProcess } from "@/common/interface/handbag";
import { BasePaginationParams } from "@/hooks/base/useBaseQueries";
import { useBagProcessQueries } from "@/hooks/handbag/bag-process/useBagProcessQueries";
import { useBagProcessMutations } from "@/hooks/handbag/bag-process/useBagProcessMutations";
import { useDialog, DialogType } from "@/contexts/DialogProvider";

// Define type for filter conditions
export interface BagProcessCondDTO {
    search?: string;
    active?: boolean;
    code?: string;
    name?: string;
}

// Define context type
interface BagProcessContextType {
    // State
    selectedBagProcess: BagProcess | null;
    loading: boolean;
    activeFilters: BagProcessCondDTO & BasePaginationParams;
    stats: {
        totalProcesses: number;
        activeProcesses: number;
        inactiveProcesses: number;
        uniqueCategories: number;
    };
    bagProcesses: BagProcess[];
    isLoading: boolean;
    calculatedPaginationMeta: {
        totalItems: number;
        totalPages: number;
        currentPage: number;
        pageSize: number;
    };
    initialPageIndex: number;

    // Actions
    setSelectedBagProcess: (bagProcess: BagProcess | null) => void;
    handleCreateBagProcess: (data: any) => Promise<BagProcess>;
    handleUpdateBagProcess: (id: string, updateData: any) => Promise<BagProcess>;
    handleDeleteBagProcess: (id: string) => Promise<void>;
    handleBatchDelete: (ids: string[]) => Promise<void>;
    handleEditBagProcess: (bagProcess: BagProcess) => Promise<boolean>;
    handleBagProcessFormSubmit: (data: any) => Promise<boolean>;
    handlePageChange: (pageIndex: number, pageSize: number) => void;
    resetFilters: () => void;
    filterByActiveStatus: (active: boolean | undefined) => void;
    searchByNameOrCode: (search: string) => void;
    safeRefetch: () => void;
}

// Create context
const BagProcessContext = createContext<BagProcessContextType | undefined>(undefined);

// Max operations to prevent infinite loops
const MAX_OPERATIONS = 200;

export const BagProcessProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Dialog context
    const { updateDialogData, showDialog, hideDialog } = useDialog();

    // Get queries and mutations
    const {
        listBagProcesses,
        getBagProcessById,
        invalidateBagProcessCache,
        invalidateBagProcessesCache
    } = useBagProcessQueries();

    const {
        createBagProcessMutation,
        updateBagProcessMutation,
        deleteBagProcessMutation,
        onBagProcessMutationSuccess
    } = useBagProcessMutations();

    // State management
    const [selectedBagProcess, setSelectedBagProcess] = useState<BagProcess | null>(null);
    const [loading, setLoading] = useState(false);
    const [isMounted, setIsMounted] = useState(true);

    // Stats for dashboard cards
    const [stats, setStats] = useState({
        totalProcesses: 0,
        activeProcesses: 0,
        inactiveProcesses: 0,
        uniqueCategories: 0,
    });

    // Initial active filters
    const [activeFilters, setActiveFilters] = useState<BagProcessCondDTO & BasePaginationParams>({
        page: 1,
        limit: 10,
        search: '',
        active: undefined,
        code: undefined,
        name: undefined,
    });

    // Filter trackers
    const [filterTrackers, setFilterTrackers] = useState({
        page: activeFilters.page || 1,
        limit: activeFilters.limit || 10,
        search: activeFilters.search || '',
        active: activeFilters.active,
        code: activeFilters.code,
        name: activeFilters.name
    });

    // Refs for preventing loops and handling state updates safely
    const prevActiveFiltersRef = useRef({ ...activeFilters });
    const isUpdatingTrackersRef = useRef(false);
    const refetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const isSubmittingRef = useRef(false);
    const pendingRequestsRef = useRef(new Set<string>());
    const isUpdatingPaginationRef = useRef(false);
    const shouldRefetchRef = useRef(false);
    const dialogUpdateInProgressRef = useRef(false);
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
            dialogUpdateInProgressRef.current = false;
            isUpdatingTrackersRef.current = false;
            operationCountRef.current = 0;
            syncingRef.current = false;
            setSelectedBagProcess(null);
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
            console.warn(`Exceeded maximum operations (${MAX_OPERATIONS}) in BagProcessContext [${operationType}]`);
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
            console.warn("Max effect executions reached in activeFilters sync");
            return;
        }

        // Skip if we're already updating or in the middle of a sync
        if (isUpdatingTrackersRef.current || syncingRef.current) return;

        // Perform a deep comparison to avoid unnecessary updates
        const hasChanged =
            prevActiveFiltersRef.current.page !== (activeFilters.page || 1) ||
            prevActiveFiltersRef.current.limit !== (activeFilters.limit || 10) ||
            prevActiveFiltersRef.current.search !== (activeFilters.search || '') ||
            prevActiveFiltersRef.current.active !== activeFilters.active ||
            prevActiveFiltersRef.current.code !== activeFilters.code ||
            prevActiveFiltersRef.current.name !== activeFilters.name;

        if (hasChanged) {
            // Set syncing flag to prevent loops
            syncingRef.current = true;

            // Update reference
            prevActiveFiltersRef.current = { ...activeFilters };

            // Update state
            setFilterTrackers({
                page: activeFilters.page || 1,
                limit: activeFilters.limit || 10,
                search: activeFilters.search || '',
                active: activeFilters.active,
                code: activeFilters.code,
                name: activeFilters.name
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
    const stableFilters = useMemo(() => ({
        page: filterTrackers.page,
        limit: filterTrackers.limit,
        search: filterTrackers.search,
        active: filterTrackers.active,
        code: filterTrackers.code,
        name: filterTrackers.name
    }), [filterTrackers]);

    // Fetch bagProcess list with query options
    const {
        data: bagProcessList,
        isLoading: isLoadingBagProcesses,
        refetch: refetchBagProcesses,
        isRefetching
    } = listBagProcesses(stableFilters, {
        refetchOnWindowFocus: false,
        refetchOnMount: true,
        refetchOnReconnect: false,
        staleTime: 30000,
        cacheTime: 300000,
    });

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
                refetchBagProcesses().finally(() => {
                    if (isMounted) {
                        pendingRequestsRef.current.delete(requestId);
                        refetchTimeoutRef.current = null;
                    }
                });
            }
        }, 300);
    }, [refetchBagProcesses, isMounted, incrementOperationCount]);

    // Update pagination
    const updatePagination = useCallback((page: number, limit?: number) => {
        // Skip if already updating
        if (isUpdatingPaginationRef.current) return;

        // Skip if we've exceeded operation count for pagination operations
        if (!incrementOperationCount('pagination')) {
            console.warn("Too many pagination updates, skipping");
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
                limit: limit || prev.limit
            }));

            // Clear flag after a safe delay
            setTimeout(() => {
                if (isMounted) {
                    isUpdatingPaginationRef.current = false;
                }
            }, 50);
        } catch (error) {
            // Ensure flag is cleared even if error occurs
            console.error("Error updating pagination:", error);
            isUpdatingPaginationRef.current = false;
        }
    }, [activeFilters.page, activeFilters.limit, isMounted, incrementOperationCount]);

    // Handle page changes
    const handlePageChange = useCallback((pageIndex: number, pageSize: number) => {
        if (isUpdatingPaginationRef.current || !incrementOperationCount('page_change')) return;

        isUpdatingPaginationRef.current = true;
        isUpdatingTrackersRef.current = true;

        const apiPage = pageIndex + 1;

        try {
            // Set local tracker first
            setFilterTrackers(prev => ({
                ...prev,
                page: apiPage,
                limit: pageSize
            }));

            // Debounce the context update to prevent racing conditions
            const timeoutId = setTimeout(() => {
                updatePagination(apiPage, pageSize);

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
            console.error("Error during pagination update:", error);
            isUpdatingPaginationRef.current = false;
            isUpdatingTrackersRef.current = false;
        }
    }, [updatePagination, safeRefetch, isMounted, incrementOperationCount]);

    // Helper function to fetch latest bagProcess by ID
    const fetchLatestBagProcess = useCallback(async (id: string): Promise<BagProcess | null> => {
        try {
            const result = await getBagProcessById(id).refetch();
            return result.data as BagProcess;
        } catch (error) {
            console.error("Error fetching latest bag process:", error);
            return null;
        }
    }, [getBagProcessById]);

    // Handle delete operations
    const handleDeleteBagProcess = useCallback(async (id: string): Promise<void> => {
        if (isSubmittingRef.current || !incrementOperationCount()) return;

        const requestId = `delete-${Date.now()}`;
        try {
            isSubmittingRef.current = true;
            pendingRequestsRef.current.add(requestId);

            await deleteBagProcessMutation.mutateAsync(id);

            if (selectedBagProcess?.id === id) {
                setSelectedBagProcess(null);
            }

            setTimeout(() => {
                if (isMounted) {
                    safeRefetch();
                }
            }, 50);
        } catch (error) {
            console.error("Error deleting bag process:", error);
        } finally {
            isSubmittingRef.current = false;
            pendingRequestsRef.current.delete(requestId);
        }
    }, [
        deleteBagProcessMutation,
        safeRefetch,
        selectedBagProcess?.id,
        setSelectedBagProcess,
        isMounted,
        incrementOperationCount
    ]);

    // Handle edit operations
    const handleEditBagProcess = useCallback(async (bagProcess: BagProcess): Promise<boolean> => {
        if (dialogUpdateInProgressRef.current || !incrementOperationCount()) return false;

        dialogUpdateInProgressRef.current = true;

        try {
            // Update context first
            setSelectedBagProcess(bagProcess);

            // Schedule dialog show to break potential update cycle
            const timeoutId = setTimeout(() => {
                if (isMounted) {
                    showDialog({
                        type: DialogType.EDIT,
                        data: bagProcess,
                    });
                    dialogUpdateInProgressRef.current = false;
                }
            }, 50);

            return true;
        } catch (error) {
            dialogUpdateInProgressRef.current = false;
            console.error("Error showing edit dialog:", error);
            return false;
        }
    }, [setSelectedBagProcess, showDialog, isMounted, incrementOperationCount]);

    // Handle batch delete operations
    const handleBatchDelete = useCallback(async (ids: string[]): Promise<void> => {
        if (isSubmittingRef.current || !incrementOperationCount()) return;

        const requestId = `batch-delete-${Date.now()}`;
        try {
            isSubmittingRef.current = true;
            pendingRequestsRef.current.add(requestId);

            // Delete each bag process one by one
            await Promise.all(ids.map(id => deleteBagProcessMutation.mutateAsync(id)));

            if (selectedBagProcess && ids.includes(selectedBagProcess.id)) {
                setSelectedBagProcess(null);
            }

            // Invalidate cache
            await Promise.all(ids.map(id => invalidateBagProcessCache(id)));
            await invalidateBagProcessesCache(true);

            setTimeout(() => {
                if (isMounted) {
                    safeRefetch();
                }
            }, 50);
        } catch (error) {
            console.error("Error during batch delete:", error);
        } finally {
            isSubmittingRef.current = false;
            pendingRequestsRef.current.delete(requestId);
        }
    }, [
        deleteBagProcessMutation,
        invalidateBagProcessCache,
        invalidateBagProcessesCache,
        setSelectedBagProcess,
        selectedBagProcess,
        safeRefetch,
        isMounted,
        incrementOperationCount
    ]);

    // Memoized create handler with proper operation tracking
    const handleCreateBagProcess = useCallback(async (data: any): Promise<BagProcess> => {
        // Skip if we've exceeded operation count for create operations
        if (!incrementOperationCount('create')) {
            throw new Error("Too many create operations, try again later");
        }

        // Create a unique request ID
        const requestId = `create-${Date.now()}`;

        // Check if operation is already in progress
        if (pendingRequestsRef.current.has(requestId)) {
            throw new Error("Operation already in progress");
        }

        pendingRequestsRef.current.add(requestId);
        setLoading(true);

        try {
            // Perform mutation
            const result = await createBagProcessMutation.mutateAsync(data);

            // Get ID from result
            const createdId = result?.id;

            if (!createdId) {
                console.error("API response missing ID:", result);
                throw new Error("Could not create bag process - No ID returned from API");
            }

            // Invalidate cache
            await onBagProcessMutationSuccess(createdId);

            // Fetch complete BagProcess object
            let createdBagProcess: BagProcess;

            try {
                const fetchedProcess = await fetchLatestBagProcess(createdId);
                if (fetchedProcess) {
                    createdBagProcess = fetchedProcess;
                } else {
                    // Fallback
                    createdBagProcess = {
                        id: createdId,
                        ...data,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                        active: true
                    } as BagProcess;
                }
            } catch (fetchError) {
                console.warn("Failed to fetch created bag process, using fallback:", fetchError);
                // Fallback
                createdBagProcess = {
                    id: createdId,
                    ...data,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    active: true
                } as BagProcess;
            }

            return createdBagProcess;
        } catch (error) {
            // Handle error already done in mutation
            throw error;
        } finally {
            // Clean up
            if (isMounted) {
                pendingRequestsRef.current.delete(requestId);
                setLoading(false);
            }
        }
    }, [createBagProcessMutation, onBagProcessMutationSuccess, fetchLatestBagProcess, incrementOperationCount]);

    // Memoized update handler with proper operation tracking
    const handleUpdateBagProcess = useCallback(async (id: string, updateData: any): Promise<BagProcess> => {
        // Skip if we've exceeded operation count for update operations
        if (!incrementOperationCount('update')) {
            throw new Error("Too many update operations, try again later");
        }

        // Create a unique request ID
        const requestId = `update-${id}-${Date.now()}`;

        // Check if operation is already in progress
        if (pendingRequestsRef.current.has(requestId)) {
            throw new Error("Operation already in progress");
        }

        pendingRequestsRef.current.add(requestId);
        setLoading(true);

        try {
            // Perform mutation
            await updateBagProcessMutation.mutateAsync({
                id,
                data: updateData
            });

            // Invalidate cache
            await onBagProcessMutationSuccess(id);

            // Fetch updated BagProcess
            const updatedBagProcess = await fetchLatestBagProcess(id);

            if (!updatedBagProcess) {
                throw new Error('Không thể lấy thông tin công đoạn sau khi cập nhật');
            }

            return updatedBagProcess;
        } catch (error) {
            // Handle error via mutation
            throw error;
        } finally {
            // Clean up
            if (isMounted) {
                pendingRequestsRef.current.delete(requestId);
                setLoading(false);
                hideDialog();
            }
        }
    }, [updateBagProcessMutation, onBagProcessMutationSuccess, fetchLatestBagProcess, hideDialog, incrementOperationCount]);

    // Handle form submission
    const handleBagProcessFormSubmit = useCallback(async (data: any): Promise<boolean> => {
        if (isSubmittingRef.current || !isMounted || !incrementOperationCount()) return false;

        const requestId = `submit-${Date.now()}`;
        try {
            isSubmittingRef.current = true;
            pendingRequestsRef.current.add(requestId);

            if (data.id) {
                const { id, createdAt, updatedAt, ...updateData } = data;
                await handleUpdateBagProcess(id, updateData);
            } else {
                const { id, createdAt, updatedAt, ...createData } = data;
                await handleCreateBagProcess(createData);
            }

            // Clear selection first
            setSelectedBagProcess(null);

            // Wait for context updates to complete
            setTimeout(() => {
                if (isMounted) {
                    safeRefetch();
                }
            }, 50);

            return true;
        } catch (error) {
            console.error("Error saving bag process data:", error);
            return false;
        } finally {
            if (isMounted) {
                isSubmittingRef.current = false;
                pendingRequestsRef.current.delete(requestId);
            }
        }
    }, [
        handleCreateBagProcess,
        handleUpdateBagProcess,
        safeRefetch,
        isMounted,
        incrementOperationCount
    ]);

    // Effect for updating dialog data - with better loop prevention
    useEffect(() => {
        if (!isMounted || !selectedBagProcess || dialogUpdateInProgressRef.current) return;

        // Track effect count to prevent excessive executions
        if (!incrementOperationCount('dialog_effect')) {
            console.warn("Max effect executions reached in dialog data sync");
            return;
        }

        // Prevent concurrent or recursive updates
        dialogUpdateInProgressRef.current = true;

        const timeoutId = setTimeout(() => {
            if (isMounted) {
                updateDialogData(selectedBagProcess);
                setTimeout(() => {
                    dialogUpdateInProgressRef.current = false;
                }, 50);
            }
        }, 50);

        return () => {
            clearTimeout(timeoutId);
        };
    }, [selectedBagProcess, updateDialogData, isMounted, incrementOperationCount]);

    // Calculate pagination metadata
    const calculatedPaginationMeta = useMemo(() => {
        if (!bagProcessList?.total) {
            return {
                totalItems: 0,
                totalPages: 0,
                currentPage: filterTrackers.page,
                pageSize: filterTrackers.limit
            };
        }

        return {
            totalItems: bagProcessList.total,
            totalPages: Math.ceil(bagProcessList.total / filterTrackers.limit),
            currentPage: filterTrackers.page,
            pageSize: filterTrackers.limit
        };
    }, [bagProcessList?.total, filterTrackers.page, filterTrackers.limit]);

    // Initial page index calculation
    const initialPageIndex = useMemo(() =>
        Math.max(0, (calculatedPaginationMeta.currentPage || 1) - 1),
        [calculatedPaginationMeta.currentPage]
    );

    // Memoized derived values
    const bagProcesses = useMemo(() => bagProcessList?.data || [], [bagProcessList?.data]);
    const isLoading = loading || isLoadingBagProcesses || isRefetching;

    // Update stats whenever bagProcessList changes
    useEffect(() => {
        if (bagProcessList?.data) {
            // Calculate stats
            const total = bagProcessList.total || 0;
            const active = bagProcessList.data.filter(process => process.active).length;
            const inactive = bagProcessList.data.filter(process => !process.active).length;

            // Count unique categories (based on first letter of code for example)
            const categories = new Set();
            bagProcessList.data.forEach(process => {
                if (process.code) {
                    const firstChar = process.code.charAt(0).toUpperCase();
                    categories.add(firstChar);
                }
            });

            setStats({
                totalProcesses: total,
                activeProcesses: active,
                inactiveProcesses: inactive,
                uniqueCategories: categories.size
            });
        }
    }, [bagProcessList]);

    // Reset filters function
    const resetFilters = useCallback(() => {
        setActiveFilters({
            page: 1,
            limit: 10,
            search: '',
            active: undefined,
            code: undefined,
            name: undefined,
        });
    }, []);

    // Filter by active status
    const filterByActiveStatus = useCallback((active: boolean | undefined) => {
        setActiveFilters(prev => ({
            ...prev,
            active,
            page: 1, // Reset to first page when filtering
        }));
    }, []);

    // Search by name or code
    const searchByNameOrCode = useCallback((search: string) => {
        setActiveFilters(prev => ({
            ...prev,
            search,
            page: 1, // Reset to first page when searching
        }));
    }, []);

    // Memoize context value to prevent unnecessary re-renders
    const contextValue = useMemo<BagProcessContextType>(() => ({
        // State
        selectedBagProcess,
        loading,
        activeFilters,
        stats,
        bagProcesses,
        isLoading,
        calculatedPaginationMeta,
        initialPageIndex,

        // Actions
        setSelectedBagProcess,
        handleCreateBagProcess,
        handleUpdateBagProcess,
        handleDeleteBagProcess,
        handleBatchDelete,
        handleEditBagProcess,
        handleBagProcessFormSubmit,
        handlePageChange,
        resetFilters,
        filterByActiveStatus,
        searchByNameOrCode,
        safeRefetch
    }), [
        selectedBagProcess,
        loading,
        activeFilters,
        stats,
        bagProcesses,
        isLoading,
        calculatedPaginationMeta,
        initialPageIndex,
        setSelectedBagProcess,
        handleCreateBagProcess,
        handleUpdateBagProcess,
        handleDeleteBagProcess,
        handleBatchDelete,
        handleEditBagProcess,
        handleBagProcessFormSubmit,
        handlePageChange,
        resetFilters,
        filterByActiveStatus,
        searchByNameOrCode,
        safeRefetch
    ]);

    return (
        <BagProcessContext.Provider value={contextValue}>
            {children}
        </BagProcessContext.Provider>
    );
};

// Custom hook to use context
export const useBagProcess = () => {
    const context = useContext(BagProcessContext);
    if (context === undefined) {
        throw new Error('useBagProcess must be used within a BagProcessProvider');
    }
    return context;
};